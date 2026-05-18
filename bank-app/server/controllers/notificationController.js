import Notification from '../models/Notification.js';
import { createError } from '../middleware/error.js';

// ── GET /api/notifications ────────────────────────────────────────
export async function getNotifications(req, res, next) {
  try {
    const { page = 1, limit = 50 } = req.query;
    const parsedPage  = Math.max(parseInt(page)  || 1,  1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 50, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const [notifications, total] = await Promise.all([
      Notification.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Notification.countDocuments({ user: req.user.id }),
    ]);

    const data = notifications.map((n) => ({
      id:        n._id,
      title:     n.title,
      message:   n.message,
      type:      n.type,
      category:  n.category,
      isRead:    n.isRead,
      metadata:  n.metadata,
      createdAt: n.createdAt,
    }));

    res.json({
      success: true,
      data,
      pagination: {
        page:  parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/notifications/unread-count ──────────────────────────
export async function getUnreadCount(req, res, next) {
  try {
    const count = await Notification.countDocuments({
      user:   req.user.id,
      isRead: false,
    });
    res.json({ success: true, data: { count } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/notifications/read-all ────────────────────────────
export async function markAllRead(req, res, next) {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, data: { modifiedCount: result.modifiedCount } });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/notifications/:id/read ────────────────────────────
export async function markRead(req, res, next) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(createError('Notification not found', 404));
    }

    res.json({ success: true, data: { id: notification._id, isRead: notification.isRead } });
  } catch (err) {
    next(err);
  }
}
