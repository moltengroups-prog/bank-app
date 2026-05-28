import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { createError } from '../middleware/error.js';
import * as audit from '../services/auditService.js';

const PIN_MAX_ATTEMPTS = 5;
const PIN_LOCKOUT_MS   = 15 * 60 * 1000; // 15 minutes
const ADMIN_ROLES      = ['admin', 'support-agent'];

function sanitizeAdmin(user) {
  return {
    id:          user._id,
    firstName:   user.firstName,
    lastName:    user.lastName,
    email:       user.email,
    role:        user.role,
    isVerified:  user.isVerified,
    createdAt:   user.createdAt,
  };
}

// ── POST /api/admin-auth/login ────────────────────────────────────
// Step 1: validate credentials → issue short-lived PIN session token
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required', 400));
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      audit.logAdminLoginFailed({ email, req }).catch(() => {});
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      audit.logAdminLoginFailed({ email, req }).catch(() => {});
      return next(createError('Invalid credentials', 401));
    }

    if (!user.pin2FASet) {
      return next(createError('Account setup incomplete. Please contact a system administrator.', 403));
    }

    const pinToken = jwt.sign(
      { sub: user._id.toString(), email: user.email, type: 'admin-pin-session' },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );

    res.json({ success: true, requiresPin: true, pinToken });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin-auth/verify-pin ──────────────────────────────
// Step 2: validate 6-digit PIN → issue full JWT
export async function adminVerifyPin(req, res, next) {
  try {
    const { pinToken, pin } = req.body;

    if (!pinToken || !pin) {
      return next(createError('pinToken and pin are required', 400));
    }

    let decoded;
    try {
      decoded = jwt.verify(pinToken, process.env.JWT_SECRET);
    } catch {
      return next(createError('Session expired. Please sign in again.', 401));
    }

    if (decoded.type !== 'admin-pin-session') {
      return next(createError('Invalid session token.', 401));
    }

    const user = await User.findById(decoded.sub)
      .select('+pin2FA +pin2FAAttempts +pin2FALockedUntil');

    if (!user || !ADMIN_ROLES.includes(user.role)) {
      return next(createError('User not found.', 404));
    }

    // Check active lockout
    if (user.pin2FALockedUntil && new Date() < user.pin2FALockedUntil) {
      const remainingMin = Math.ceil((user.pin2FALockedUntil.getTime() - Date.now()) / 60000);
      return next(createError(
        `Account temporarily locked. Try again in ${remainingMin} minute${remainingMin !== 1 ? 's' : ''}.`,
        429
      ));
    }

    // Lockout expired — reset counter
    if (user.pin2FALockedUntil && new Date() >= user.pin2FALockedUntil) {
      user.pin2FAAttempts    = 0;
      user.pin2FALockedUntil = null;
    }

    const isMatch = await user.comparePin(pin.trim());

    if (!isMatch) {
      user.pin2FAAttempts += 1;

      if (user.pin2FAAttempts >= PIN_MAX_ATTEMPTS) {
        user.pin2FALockedUntil = new Date(Date.now() + PIN_LOCKOUT_MS);
        await user.save();
        audit.logAdmin2FAFailed({ email: decoded.email, userId: decoded.sub, attemptsLeft: 0, req }).catch(() => {});
        return next(createError('Too many incorrect attempts. Account locked for 15 minutes.', 429));
      }

      await user.save();
      const left = PIN_MAX_ATTEMPTS - user.pin2FAAttempts;
      audit.logAdmin2FAFailed({ email: decoded.email, userId: decoded.sub, attemptsLeft: left, req }).catch(() => {});
      return next(createError(
        `Incorrect PIN. ${left} attempt${left === 1 ? '' : 's'} remaining.`,
        400
      ));
    }

    // Success — reset lockout state
    user.pin2FAAttempts    = 0;
    user.pin2FALockedUntil = null;
    await user.save();

    const token = generateToken(user._id);

    audit.logAdmin2FAVerified({ admin: user, req }).catch(() => {});
    audit.logAdminLogin({ admin: user, req }).catch(() => {});

    res.json({ success: true, token, user: sanitizeAdmin(user) });
  } catch (err) {
    next(err);
  }
}
