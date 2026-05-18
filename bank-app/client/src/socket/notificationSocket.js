import { getSocket } from './socket.js';

// Subscribe to real-time notifications — returns cleanup function
export function onNewNotification(handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('notification:new', handler);
  return () => s.off('notification:new', handler);
}
