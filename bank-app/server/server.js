import 'dotenv/config';
import { createServer } from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';

import connectDB, { disconnectDB } from './config/db.js';
import { ALLOWED_ORIGINS } from './config/origins.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { initSocket } from './socket/index.js';

const app  = express();
const PORT = Number(process.env.PORT) || 8000;


// ── Database ──────────────────────────────────────────────────────
// connectDB() is async but we intentionally don't await here — the
// server starts accepting HTTP immediately, and requireDB middleware
// returns 503 until the connection is established. This avoids
// blocking the HTTP bind on a slow Atlas handshake.
connectDB().catch((err) => {
  console.error('  [boot] connectDB error:', err.message);
});

// ── Security middleware ───────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: (origin, cb) => {
    // Allow server-to-server requests (no Origin header) and whitelisted domains
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

// ── Request parsing ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// ── HTTP logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── API routes ────────────────────────────────────────────────────
app.use('/api', apiRouter);

// ── 404 catch-all — must come after all routes ────────────────────
// Returns JSON so the frontend never receives an HTML error page.
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ── Centralized error handler (must be last) ──────────────────────
app.use(errorHandler);

// ── HTTP server + Socket.IO ───────────────────────────────────────
const httpServer = createServer(app);
initSocket(httpServer);

// ── Start ─────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  const line    = '─'.repeat(50);
  const base    = process.env.NODE_ENV === 'production'
    ? `(Railway — port ${PORT})`
    : `http://localhost:${PORT}`;
  console.log(`\n  ${line}`);
  console.log(`  Server   → ${base}`);
  console.log(`  Health   → ${base}/api/health`.replace('(Railway — port', 'http://localhost:'));
  console.log(`  Mode     → ${process.env.NODE_ENV || 'development'}`);
  console.log(`  Origins  → ${ALLOWED_ORIGINS.join(', ')}`);
  console.log(`  PID      → ${process.pid}`);
  console.log(`  ${line}\n`);
});

httpServer.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n  [ERROR] Port ${PORT} is already in use.`);
    console.error(`  Kill the existing process and try again:`);
    console.error(`    lsof -ti:${PORT} | xargs kill -9\n`);
    process.exit(1);
  }
  console.error('[Server error]', err);
  process.exit(1);
});

// ── Graceful shutdown ─────────────────────────────────────────────
async function shutdown(signal) {
  console.log(`\n  [${signal}] Graceful shutdown…`);
  httpServer.close(async () => {
    console.log('  HTTP server closed.');
    await disconnectDB();
    process.exit(0);
  });
  // Force exit if shutdown takes too long
  setTimeout(() => {
    console.warn('  [shutdown] forced exit after timeout');
    process.exit(1);
  }, 8_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));
