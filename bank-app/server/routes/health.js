import { Router }   from 'express';
import mongoose      from 'mongoose';
import { getIO }     from '../socket/index.js';
import { mongoStateLabel } from '../config/db.js';

const router = Router();

const STATE_EMOJI = {
  connected:     '✓',
  connecting:    '…',
  disconnected:  '✗',
  disconnecting: '↓',
};

router.get('/', (req, res) => {
  const mongoState = mongoStateLabel();
  const io         = getIO();
  const mem        = process.memoryUsage();

  const socketStats = io
    ? { status: 'running', connectedClients: io.engine?.clientsCount ?? 0 }
    : { status: 'not initialized' };

  const mongoStats = {
    state:  mongoState,
    icon:   STATE_EMOJI[mongoState] ?? '?',
    ready:  mongoose.connection.readyState === 1,
    host:   mongoose.connection.readyState === 1
              ? `${mongoose.connection.host}:${mongoose.connection.port}`
              : null,
    db:     mongoose.connection.readyState === 1
              ? mongoose.connection.name
              : null,
  };

  const healthy = mongoStats.ready;

  res.status(healthy ? 200 : 503).json({
    success:     healthy,
    status:      healthy ? 'ok' : 'degraded',
    timestamp:   new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      seconds: Math.floor(process.uptime()),
      human:   formatUptime(process.uptime()),
    },
    mongo:  mongoStats,
    socket: socketStats,
    memory: {
      heapUsedMB:  toMB(mem.heapUsed),
      heapTotalMB: toMB(mem.heapTotal),
      rssMB:       toMB(mem.rss),
    },
    node: process.version,
  });
});

function toMB(bytes) {
  return Math.round(bytes / 1024 / 1024);
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export default router;
