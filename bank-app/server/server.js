import 'dotenv/config';
import { createServer } from 'http';
import morgan from 'morgan';

import connectDB, { disconnectDB } from './config/db.js';
import { ALLOWED_ORIGINS } from './config/origins.js';
import { initSocket } from './socket/index.js';
import { startScheduler } from './services/schedulerService.js';
import { createApp } from './app.js';

const app  = createApp();
const PORT = Number(process.env.PORT) || 8000;

// ── HTTP logging (must be added before createServer) ──────────────
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// ── Database ──────────────────────────────────────────────────────
// connectDB() is async but we intentionally don't await here — the
// server starts accepting HTTP immediately, and requireDB middleware
// returns 503 until the connection is established. This avoids
// blocking the HTTP bind on a slow Atlas handshake.
connectDB()
  .then(() => startScheduler())
  .catch((err) => {
    console.error('  [boot] connectDB error:', err.message);
  });

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
