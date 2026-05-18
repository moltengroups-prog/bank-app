import mongoose from 'mongoose';

// ── Readable state labels ──────────────────────────────────────────
const STATE_LABEL = ['disconnected', 'connected', 'connecting', 'disconnecting'];

// ── Duplicate-connect guard ───────────────────────────────────────
// Nodemon can reload modules while the previous connection is still
// in-flight. This flag prevents a second mongoose.connect() call
// from racing the first one.
let _initiated    = false;
// Tracks whether we ever reached a connected state. Used to suppress
// the misleading "disconnected" log that fires during initial
// connection failure (Mongoose emits disconnected before we catch).
let _wasConnected = false;

// ── Public connect ────────────────────────────────────────────────
export async function connectDB() {
  const state = mongoose.connection.readyState;

  if (state === 1) {
    console.log('  [mongo] already connected — skipping duplicate connect');
    return;
  }
  if (state === 2 || _initiated) {
    console.log('  [mongo] connection in progress — skipping duplicate connect');
    return;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('  [mongo] MONGODB_URI is not set — aborting');
    process.exit(1);
  }

  _initiated = true;

  // ── Mongoose global settings ─────────────────────────────────────
  // bufferCommands: false  → operations fail immediately when DB is
  // unreachable instead of queueing indefinitely (prevents 30s hangs)
  mongoose.set('bufferCommands', false);

  // ── Connection options ───────────────────────────────────────────
  const options = {
    // ── Timeouts ──────────────────────────────────────────────────
    // How long the driver waits to find an available server before
    // throwing — keeps requests from hanging 30 s.
    serverSelectionTimeoutMS: 5_000,

    // TCP connect timeout for individual sockets.
    connectTimeoutMS: 10_000,

    // How long a send/receive operation on an open socket may take.
    socketTimeoutMS: 45_000,

    // How long a connection can sit idle before the pool closes it.
    // Prevents stale sockets that trigger TLS close-notify errors.
    maxIdleTimeMS: 30_000,

    // Interval between server health checks.
    heartbeatFrequencyMS: 10_000,

    // ── Connection pool ───────────────────────────────────────────
    maxPoolSize: 10,
    minPoolSize: 2,

    // How long a request waits for a pool slot before failing.
    waitQueueTimeoutMS: 5_000,

    // ── TLS — Atlas always requires TLS ──────────────────────────
    // Explicitly set here so the driver does not need to infer it
    // from the URI ssl= param (which is deprecated in driver v6+).
    tls: true,
    tlsAllowInvalidCertificates: false,
    tlsAllowInvalidHostnames:    false,

    // ── Writes & reads ────────────────────────────────────────────
    retryWrites: true,
    retryReads:  true,

    // ── Atlas monitoring ──────────────────────────────────────────
    appName: process.env.APP_NAME || 'BankAppServer',
  };

  // ── Connection lifecycle events ──────────────────────────────────
  const conn = mongoose.connection;

  // Attach listeners only once — re-attaching on every connectDB()
  // call (e.g. hot reload) would stack duplicate handlers.
  if (conn.listenerCount('connected') === 0) {
    conn.on('connected', () => {
      _wasConnected = true;
      _initiated    = false; // reset so a future reconnect can succeed
      console.log(`  [mongo] ✓ connected  → ${conn.host}:${conn.port}/${conn.name}`);
    });

    conn.on('disconnected', () => {
      // Only log if we had a live connection — suppresses the misleading
      // "disconnected" event Mongoose fires during an initial connect failure.
      if (_wasConnected) console.warn('  [mongo] ✗ disconnected');
    });

    conn.on('reconnected', () => {
      console.log('  [mongo] ↺ reconnected');
    });

    conn.on('reconnectFailed', () => {
      console.error('  [mongo] reconnect failed — giving up');
    });

    conn.on('error', (err) => {
      // TLS alert 80 = internal_error — usually a stale connection
      // being rejected by Atlas. The driver will retry automatically.
      console.error(`  [mongo] error: ${err.message}`);
    });

    conn.on('close', () => {
      console.log('  [mongo] connection pool closed');
    });
  }

  // ── Initial connect ───────────────────────────────────────────────
  try {
    await mongoose.connect(uri, options);
  } catch (err) {
    console.error(`  [mongo] initial connection failed: ${err.message}`);
    _initiated = false;
    process.exit(1);
  }
}

// ── Graceful disconnect (called on SIGTERM / SIGINT) ──────────────
export async function disconnectDB() {
  const state = mongoose.connection.readyState;
  if (state === 0) return; // already disconnected
  try {
    await mongoose.disconnect();
    console.log('  [mongo] gracefully disconnected');
  } catch (err) {
    console.error(`  [mongo] error during disconnect: ${err.message}`);
  }
}

// ── Readiness helper (used by health check + middleware) ──────────
export function isMongoReady() {
  return mongoose.connection.readyState === 1;
}

export function mongoStateLabel() {
  return STATE_LABEL[mongoose.connection.readyState] ?? 'unknown';
}

export default connectDB;
