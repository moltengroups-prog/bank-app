export function registerNotificationHandlers(io, socket) {
  // Each user has a personal room for private notifications
  socket.join(`user:${socket.user._id}`);
}

// Call this anywhere in the backend to push a real-time notification
export function emitNotification(io, userId, notification) {
  io.to(`user:${userId}`).emit('notification:new', notification);
}
