import { isMongoReady } from '../config/db.js';

// Fast-fail when MongoDB is not connected.
// Applied to all /api routes except /api/health, which must remain
// reachable even when the database is down.
export function requireDB(req, res, next) {
  if (isMongoReady()) return next();

  res.status(503).json({
    success: false,
    message: 'Database temporarily unavailable. Please try again in a moment.',
    retryAfter: 5,
  });
}
