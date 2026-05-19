'use client';

// Admin socket connects directly to the Railway backend.
// Next.js cannot proxy WebSocket connections through its rewrite rules.
import { SOCKET_URL } from '../../lib/env';

let socket = null;

export function getAdminSocket() {
  return socket;
}

export async function connectAdminSocket() {
  if (typeof window === 'undefined') return null;

  // Guard on existence, not on connected state.
  // socket.connected is false while the handshake is in flight — checking it
  // would create a duplicate instance if called before the first connect fires.
  if (socket) return socket;

  const token = localStorage.getItem('adminToken');
  if (!token) return null;

  // Dynamic import keeps socket.io-client out of the SSR bundle
  const { io } = await import('socket.io-client');

  socket = io(SOCKET_URL, {
    auth:                 { token },
    reconnection:         true,
    reconnectionAttempts: 10,
    reconnectionDelay:    1000,
    reconnectionDelayMax: 5000,
    transports:           ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log(`[admin socket] connected  id=${socket.id}`);
  });

  socket.on('connect_error', (err) => {
    console.warn('[admin socket] connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[admin socket] disconnected  reason=${reason}`);
  });

  return socket;
}

export function disconnectAdminSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
