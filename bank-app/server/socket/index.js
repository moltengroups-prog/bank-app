import { Server } from 'socket.io';
import { socketAuth } from './middleware/socketAuth.js';
import { registerSupportHandlers } from './handlers/supportHandlers.js';
import { registerNotificationHandlers } from './handlers/notificationHandlers.js';
import { registerAdminHandlers } from './handlers/adminHandlers.js';
import { ALLOWED_ORIGINS } from '../config/origins.js';

let io = null;

export function initSocket(httpServer) {
  if (io) {
    console.warn('  [socket] initSocket called more than once — skipping duplicate init');
    return io;
  }

  io = new Server(httpServer, {
    cors: {
      origin:      ALLOWED_ORIGINS,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.use(socketAuth);

  io.on('connection', (socket) => {
    console.log(`  [socket] ${socket.user.email} (${socket.user.role}) connected`);

    registerNotificationHandlers(io, socket);
    registerAdminHandlers(io, socket);
    registerSupportHandlers(io, socket);

    socket.on('disconnect', (reason) => {
      console.log(`  [socket] ${socket.user.email} disconnected (${reason})`);
    });

    socket.on('error', (err) => {
      console.error(`  [socket] error for ${socket.user.email}:`, err.message);
    });
  });

  return io;
}

// Returns null if socket layer not yet initialized — callers must guard
export function getIO() {
  return io;
}
