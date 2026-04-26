import api from './api';

export const notificationService = {
  /**
   * Get notifications for the current user.
   * Route: GET /api/notifications/me
   */
  getMyNotifications: async () => {
    const response = await api.get('/notifications/me');
    return response.data.notifications || [];
  },

  /**
   * Get unread count.
   * Route: GET /api/notifications/unread-count
   */
  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data.count || 0;
  },

  /**
   * Mark a notification as read.
   * Route: PUT /api/notifications/:id/read
   */
  markAsRead: async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read.
   * Route: PUT /api/notifications/read-all
   */
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },
};
