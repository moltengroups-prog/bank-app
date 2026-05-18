export function registerAdminHandlers(io, socket) {
  if (!['admin', 'support-agent'].includes(socket.user.role)) return;

  socket.join('admins');

  if (socket.user.role === 'support-agent') {
    socket.join('support-agents');
  }
}

// Broadcast an event to all connected admins and agents
export function emitToAdmins(io, event, data) {
  io.to('admins').emit(event, data);
}
