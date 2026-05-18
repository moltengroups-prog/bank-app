import Notification from '../models/Notification.js';
import { getIO } from '../socket/index.js';

export async function createNotification({
  userId,
  title,
  message,
  type     = 'info',
  category = 'system',
  metadata = {},
}) {
  const notification = await Notification.create({ user: userId, title, message, type, category, metadata });

  // Push real-time notification to the user's personal room
  try {
    const io = getIO();
    if (io) {
      io.to(`user:${userId}`).emit('notification:new', {
        id:        notification._id,
        title,
        message,
        type,
        category,
        isRead:    false,
        createdAt: notification.createdAt,
      });
    }
  } catch {
    // Socket not ready — notification already persisted, skip real-time
  }

  return notification;
}
