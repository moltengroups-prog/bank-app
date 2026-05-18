import SupportConversation from '../../models/SupportConversation.js';
import SupportMessage from '../../models/SupportMessage.js';

export function registerSupportHandlers(io, socket) {
  // Join a conversation room — both the customer and admins/agents can join
  socket.on('support:joinConversation', async (conversationId) => {
    try {
      const conversation = await SupportConversation.findById(conversationId);
      if (!conversation) return;

      const isOwner = String(conversation.user) === String(socket.user._id);
      const isStaff = ['admin', 'support-agent'].includes(socket.user.role);

      if (!isOwner && !isStaff) return;

      socket.join(`conversation:${conversationId}`);
    } catch {
      // Invalid ID or DB error — silently ignore
    }
  });

  // Leave a conversation room (cleanup)
  socket.on('support:leaveConversation', (conversationId) => {
    socket.leave(`conversation:${conversationId}`);
  });

  // Customer sends a message via socket
  socket.on('support:sendMessage', async ({ conversationId, message }, callback) => {
    try {
      if (!message?.trim()) return callback?.({ error: 'Message is required' });

      const conversation = await SupportConversation.findById(conversationId);
      if (!conversation) return callback?.({ error: 'Conversation not found' });
      if (conversation.status === 'closed') return callback?.({ error: 'Conversation is closed' });

      const isOwner = String(conversation.user) === String(socket.user._id);
      const isStaff = ['admin', 'support-agent'].includes(socket.user.role);

      if (!isOwner && !isStaff) return callback?.({ error: 'Not authorized' });

      const senderType = isStaff ? 'agent' : 'user';

      const msg = await SupportMessage.create({
        conversation: conversation._id,
        sender:       socket.user._id,
        senderType,
        message:      message.trim(),
      });

      const updates = { lastMessageAt: new Date() };
      if (senderType === 'agent' && conversation.status === 'waiting') {
        updates.status = 'active';
      }
      await SupportConversation.findByIdAndUpdate(conversation._id, updates);

      const msgData = {
        id:         msg._id,
        senderType: msg.senderType,
        message:    msg.message,
        createdAt:  msg.createdAt,
        sender: {
          id:        socket.user._id,
          firstName: socket.user.firstName,
          lastName:  socket.user.lastName,
          role:      socket.user.role,
        },
      };

      // Broadcast to all in the room (including sender for echo confirmation)
      io.to(`conversation:${conversationId}`).emit('support:newMessage', msgData);

      // Notify admins that this conversation has activity
      io.to('admins').emit('support:conversationActivity', {
        conversationId,
        lastMessageAt: updates.lastMessageAt,
      });

      callback?.({ success: true, data: msgData });
    } catch (err) {
      callback?.({ error: err.message });
    }
  });

  // Typing indicator — broadcast to everyone else in the room
  socket.on('support:typing', ({ conversationId, isTyping }) => {
    socket.to(`conversation:${conversationId}`).emit('support:userTyping', {
      userId:    socket.user._id,
      firstName: socket.user.firstName,
      role:      socket.user.role,
      isTyping,
    });
  });
}
