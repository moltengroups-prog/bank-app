import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTPModel, { hashOTP } from '../models/OTP.js';
import { generateToken } from '../utils/generateToken.js';
import { createError } from '../middleware/error.js';
import { createNotification } from '../utils/notify.js';
import { getIO } from '../socket/index.js';
import { sendOTPEmail } from '../services/emailService.js';
import * as audit from '../services/auditService.js';

const OTP_EXPIRY_MS   = 5 * 60 * 1000;  // 5 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_MS   = 60 * 1000;       // 60-second cooldown

// ── Helper: build sanitized user payload ──────────────────────────
function sanitizeUser(user) {
  return {
    id:           user._id,
    firstName:    user.firstName,
    lastName:     user.lastName,
    email:        user.email,
    phoneNumber:  user.phoneNumber,
    profileImage: user.profileImage,
    isVerified:   user.isVerified,
    role:         user.role,
    createdAt:    user.createdAt,
  };
}

// ── Helper: attach full JWT + user to response ────────────────────
function sendTokenResponse(user, statusCode, res) {
  const token = generateToken(user._id);
  res.status(statusCode).json({ success: true, token, user: sanitizeUser(user) });
}

// ── Helper: generate + store + deliver OTP ────────────────────────
async function generateAndStoreOTP(user, deliveryMethod = 'email') {
  const code      = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

  await OTPModel.deleteMany({ user: user._id });

  const result = await sendOTPEmail({
    to:           user.email,
    firstName:    user.firstName,
    code,
    expiryMinutes: Math.round(OTP_EXPIRY_MS / 60000),
  });

  await OTPModel.create({
    user:           user._id,
    email:          user.email,
    codeHash:       hashOTP(code),
    expiresAt,
    lastSentAt:     new Date(),
    deliveryMethod: result.method === 'terminal' ? 'terminal' : deliveryMethod,
  });

  return { code, deliveryMethod: result.method };
}

// ── POST /api/auth/register ───────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return next(createError('firstName, lastName, email and password are required', 400));
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return next(createError('An account with this email already exists', 400));
    }

    const user = await User.create({ firstName, lastName, email, password, phoneNumber });

    // Notify admins of the new registration
    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:newUser', {
        id:        user._id,
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        createdAt: user.createdAt,
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (err) {
    if (err.code === 11000) {
      return next(createError('An account with this email already exists', 400));
    }
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────
// Step 1 of OTP flow: validate credentials → issue short-lived OTP session token
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    const { deliveryMethod } = await generateAndStoreOTP(user);

    // OTP session token — NOT a full access token; only valid for /auth/otp/* routes
    const otpToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, type: 'otp-session' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    audit.logOTPSent({ user, deliveryMethod, req }).catch(() => {});

    res.json({ success: true, requiresOTP: true, otpToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/otp/verify ─────────────────────────────────────
// Step 2 of OTP flow: verify code → issue full JWT
export async function verifyOTP(req, res, next) {
  try {
    const { otpToken, code } = req.body;

    if (!otpToken || !code) {
      return next(createError('otpToken and code are required', 400));
    }

    // Validate OTP session token
    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch {
      return next(createError('Session expired. Please sign in again.', 401));
    }

    if (decoded.type !== 'otp-session') {
      return next(createError('Invalid session token.', 401));
    }

    const otp = await OTPModel.findOne({ user: decoded.sub, used: false })
      .sort({ createdAt: -1 });

    if (!otp)                        return next(createError('No pending verification. Please sign in again.', 400));
    if (new Date() > otp.expiresAt)  return next(createError('Code has expired. Please sign in again.', 400));
    if (otp.attempts >= OTP_MAX_ATTEMPTS) {
      return next(createError('Too many incorrect attempts. Please sign in again.', 429));
    }

    otp.attempts += 1;

    if (otp.codeHash !== hashOTP(code.trim())) {
      await otp.save();
      const left = OTP_MAX_ATTEMPTS - otp.attempts;

      audit.logOTPFailed({
        userId:      decoded.sub,
        email:       decoded.email,
        attemptsLeft: left,
        req,
      }).catch(() => {});

      // Warn user if only 1 attempt remains via in-app notification (fire-and-forget)
      if (left === 1) {
        createNotification({
          userId:   decoded.sub,
          title:    'Verification warning',
          message:  'One more incorrect code will lock your current sign-in session.',
          type:     'security',
          category: 'security',
        }).catch(() => {});
      }

      return next(createError(
        left > 0
          ? `Incorrect code. ${left} attempt${left === 1 ? '' : 's'} remaining.`
          : 'Too many incorrect attempts. Please sign in again.',
        400
      ));
    }

    otp.used = true;
    await otp.save();

    const user = await User.findById(decoded.sub);
    if (!user) return next(createError('User not found.', 404));

    sendTokenResponse(user, 200, res);

    // Fire-and-forget: audit log + in-app security notification
    audit.logOTPVerified({ user, req }).catch(() => {});
    createNotification({
      userId:   user._id,
      title:    'New sign-in detected',
      message:  `Successful sign-in to your account${req?.headers?.['user-agent'] ? '' : ''}.`,
      type:     'security',
      category: 'security',
    }).catch(() => {});
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/otp/resend ─────────────────────────────────────
export async function resendOTP(req, res, next) {
  try {
    const { otpToken } = req.body;

    if (!otpToken) return next(createError('otpToken is required', 400));

    let decoded;
    try {
      decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
    } catch {
      return next(createError('Session expired. Please sign in again.', 401));
    }

    if (decoded.type !== 'otp-session') {
      return next(createError('Invalid session token.', 401));
    }

    // Enforce resend cooldown
    const existing = await OTPModel.findOne({ user: decoded.sub, used: false })
      .sort({ createdAt: -1 });

    if (existing) {
      const elapsed = Date.now() - existing.lastSentAt.getTime();
      if (elapsed < OTP_RESEND_MS) {
        const wait = Math.ceil((OTP_RESEND_MS - elapsed) / 1000);
        return next(createError(`Please wait ${wait}s before requesting a new code.`, 429));
      }
    }

    const user = await User.findById(decoded.sub);
    if (!user) return next(createError('User not found.', 404));

    const { deliveryMethod } = await generateAndStoreOTP(user);

    audit.logOTPResent({ user, req }).catch(() => {});

    res.json({ success: true, message: 'A new verification code has been sent.', deliveryMethod });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me  (protected) ────────────────────────────────
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return next(createError('User not found', 404));
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout  (protected) ───────────────────────────
export async function logout(req, res) {
  res.json({ success: true, message: 'Logged out successfully' });
}
