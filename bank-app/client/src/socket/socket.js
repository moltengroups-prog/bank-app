import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config/env';

let socket = null;

export function getSocket() {
  return socket;
}

export function connectSocket() {
  // Guard on existence, not on connected state.
  // socket.connected is false while the handshake is in flight — guarding on that
  // creates a second instance when connectSocket() is called before the first
  // connection completes (React StrictMode double-invoke hits this window).
  if (socket) return socket;

  const token = localStorage.getItem('token');
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth:                 { token },
    reconnection:         true,
    reconnectionAttempts: 10,
    reconnectionDelay:    1000,
    reconnectionDelayMax: 5000,
    transports:           ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log(`[socket] connected  id=${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    console.warn('[socket] connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected  reason=${reason}`);
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
