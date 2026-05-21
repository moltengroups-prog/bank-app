import rateLimit from 'express-rate-limit';

const json429 = (message) => (_req, res) =>
  res.status(429).json({ success: false, message });

const skipInTest = () => process.env.NODE_ENV === 'test';

// ── Auth routes: 15 attempts per 15 min ──────────────────────────
export const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             15,
  handler:         json429('Too many login attempts. Please try again in 15 minutes.'),
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipInTest,
});

// ── Transfer routes: 30 per minute ───────────────────────────────
export const transferLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             30,
  handler:         json429('Too many transfer requests. Please wait a moment and try again.'),
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipInTest,
});

// ── Wire transfer submission: 10 per hour ─────────────────────────
export const wireLimiter = rateLimit({
  windowMs:        60 * 60 * 1000,
  max:             10,
  handler:         json429('Too many wire transfer requests. Please contact support if this is unexpected.'),
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            skipInTest,
});

// ── General API: 300 per minute ──────────────────────────────────
export const apiLimiter = rateLimit({
  windowMs:        60 * 1000,
  max:             300,
  handler:         json429('Too many requests. Please try again shortly.'),
  standardHeaders: true,
  legacyHeaders:   false,
  skip:            (req) => process.env.NODE_ENV === 'test' || req.path === '/health',
});
