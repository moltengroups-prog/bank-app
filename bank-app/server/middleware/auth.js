import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { createError } from './error.js';

// ── protect ───────────────────────────────────────────────────────
// Reads Bearer token → verifies JWT → attaches req.user
export async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError('Not authorized — no token provided', 401));
    }

    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(createError('Not authorized — token has expired', 401));
      }
      return next(createError('Not authorized — invalid token', 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(createError('Not authorized — account no longer exists', 401));
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

// ── authorize ─────────────────────────────────────────────────────
// Must come after protect(). Restricts to specific roles.
// Usage: router.delete('/admin', protect, authorize('admin'), handler)
export function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        createError(
          `Role '${req.user.role}' is not authorized to access this resource`,
          403
        )
      );
    }
    next();
  };
}
