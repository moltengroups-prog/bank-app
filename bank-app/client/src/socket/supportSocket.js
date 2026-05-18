import { getSocket } from './socket.js';

export function joinConversation(conversationId) {
  getSocket()?.emit('support:joinConversation', conversationId);
}

export function leaveConversation(conversationId) {
  getSocket()?.emit('support:leaveConversation', conversationId);
}

export function sendTyping(conversationId, isTyping) {
  getSocket()?.emit('support:typing', { conversationId, isTyping });
}

// Subscribe to incoming messages — returns cleanup function
export function onNewMessage(handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('support:newMessage', handler);
  return () => s.off('support:newMessage', handler);
}

// Subscribe to typing events — returns cleanup function
export function onTyping(handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('support:userTyping', handler);
  return () => s.off('support:userTyping', handler);
}

// Subscribe to assignment/close events — returns cleanup function
export function onConversationAssigned(handler) {
  const s = getSocket();
  if (!s) return () => {};
  s.on('support:conversationAssigned', handler);
  return () => s.off('support:conversationAssigned', handler);
}

// Send a message via socket; returns a Promise that resolves with the server ack
export function sendMessage(conversationId, message) {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s?.connected) {
      reject(new Error('Socket not connected'));
      return;
    }
    s.emit('support:sendMessage', { conversationId, message }, (ack) => {
      if (ack?.error) reject(new Error(ack.error));
      else resolve(ack?.data);
    });
  });
}
