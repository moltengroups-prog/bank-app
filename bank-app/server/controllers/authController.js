import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import { createError } from '../middleware/error.js';
import { createNotification } from '../utils/notify.js';
import { getIO } from '../socket/index.js';

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

// ── Helper: attach token + user to response ───────────────────────
function sendTokenResponse(user, statusCode, res) {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
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
    // Mongoose duplicate key (race condition safety)
    if (err.code === 11000) {
      return next(createError('An account with this email already exists', 400));
    }
    next(err);
  }
}

// ── POST /api/auth/login ──────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(createError('Email and password are required', 400));
    }

    // Explicitly select password — field is select:false on the schema
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return next(createError('Invalid credentials', 401));
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(createError('Invalid credentials', 401));
    }

    sendTokenResponse(user, 200, res);

    // Fire-and-forget — response already sent
    createNotification({
      userId:   user._id,
      title:    'New login detected',
      message:  'You signed in to your account successfully.',
      type:     'security',
      category: 'security',
    }).catch(() => {});
  } catch (err) {
    next(err);
  }
}

// ── GET /api/auth/me  (protected) ────────────────────────────────
export async function getMe(req, res, next) {
  try {
    // req.user is attached by the protect middleware
    const user = await User.findById(req.user.id);
    if (!user) {
      return next(createError('User not found', 404));
    }

    res.json({ success: true, user: sanitizeUser(user) });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/auth/logout  (protected) ───────────────────────────
export async function logout(req, res) {
  // Stateless JWT — client discards token; server acknowledges
  res.json({ success: true, message: 'Logged out successfully' });
}
