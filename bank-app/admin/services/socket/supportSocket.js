'use client';

import { getAdminSocket } from './socket.js';

export function joinConversation(conversationId) {
  getAdminSocket()?.emit('support:joinConversation', conversationId);
}

export function leaveConversation(conversationId) {
  getAdminSocket()?.emit('support:leaveConversation', conversationId);
}

export function sendTyping(conversationId, isTyping) {
  getAdminSocket()?.emit('support:typing', { conversationId, isTyping });
}

export function onNewMessage(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('support:newMessage', handler);
  return () => s.off('support:newMessage', handler);
}

export function onTyping(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('support:userTyping', handler);
  return () => s.off('support:userTyping', handler);
}

export function onConversationAssigned(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('support:conversationAssigned', handler);
  return () => s.off('support:conversationAssigned', handler);
}

export function onConversationActivity(handler) {
  const s = getAdminSocket();
  if (!s) return () => {};
  s.on('support:conversationActivity', handler);
  return () => s.off('support:conversationActivity', handler);
}
