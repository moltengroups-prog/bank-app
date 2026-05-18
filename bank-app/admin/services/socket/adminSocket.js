'use client';

import { getAdminSocket } from './socket.js';

// Subscribe to admin-room events — each returns a cleanup function

export function onNewUser(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('admin:newUser', handler);
  return () => s.off('admin:newUser', handler);
}

export function onNewTransfer(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('admin:newTransfer', handler);
  return () => s.off('admin:newTransfer', handler);
}

export function onNewSupportConversation(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('admin:newSupportConversation', handler);
  return () => s.off('admin:newSupportConversation', handler);
}

export function onSecurityAlert(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('admin:securityAlert', handler);
  return () => s.off('admin:securityAlert', handler);
}
