import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export const useNotificationStore = create((set, get) => ({
  notifications:  [],
  unreadCount:    0,
  loading:        false,
  error:          null,

  // Called once after the user socket connects — subscribes to real-time pushes
  subscribeToSocket: (socket) => {
    if (!socket) return;

    const handler = (notification) => {
      set((state) => {
        // Deduplicate — ignore if we already have this notification
        if (state.notifications.some((n) => String(n.id) === String(notification.id))) {
          return { unreadCount: state.unreadCount };
        }
        return {
          notifications: [notification, ...state.notifications],
          unreadCount:   state.unreadCount + 1,
        };
      });
    };

    socket.on('notification:new', handler);
    return () => socket.off('notification:new', handler);
  },

  fetchNotifications: async () => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      set({ notifications: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationService.getUnreadCount();
      set({ unreadCount: res.data.count });
    } catch {
      // Silently fail — stale badge is acceptable
    }
  },

  markRead: async (id) => {
    const notification = get().notifications.find((n) => n.id === id);
    const wasUnread = notification && !notification.isRead;
    try {
      await notificationService.markRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      }));
    } catch {}
  },

  markAllRead: async () => {
    try {
      await notificationService.markAllRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {}
  },

  clearError: () => set({ error: null }),
}));
