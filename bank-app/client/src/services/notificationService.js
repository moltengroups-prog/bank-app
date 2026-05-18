import { api } from './api';

export const notificationService = {
  getNotifications: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v != null));
    const qs = new URLSearchParams(clean).toString();
    return api.get(`/notifications${qs ? `?${qs}` : ''}`);
  },

  getUnreadCount: () => api.get('/notifications/unread-count'),

  markRead:    (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: ()   => api.patch('/notifications/read-all'),
};
