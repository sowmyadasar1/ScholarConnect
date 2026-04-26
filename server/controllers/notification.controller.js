/**
 * Notification Controller
 *
 * GET  /api/notifications/me           — Get user's notifications
 * GET  /api/notifications/unread-count — Get unread badge count
 * PUT  /api/notifications/:id/read     — Mark one as read
 * PUT  /api/notifications/read-all     — Mark all as read
 */

const NotificationModel = require('../models/notification.model');

const NotificationController = {
  async getMyNotifications(req, res, next) {
    try {
      const notifications = await NotificationModel.findByUser(req.user.id);
      res.json({ notifications });
    } catch (err) {
      next(err);
    }
  },

  async getUnreadCount(req, res, next) {
    try {
      const count = await NotificationModel.getUnreadCount(req.user.id);
      res.json({ count });
    } catch (err) {
      next(err);
    }
  },

  async markAsRead(req, res, next) {
    try {
      await NotificationModel.markAsRead(req.params.id, req.user.id);
      res.json({ message: 'Notification marked as read' });
    } catch (err) {
      next(err);
    }
  },

  async markAllAsRead(req, res, next) {
    try {
      await NotificationModel.markAllAsRead(req.user.id);
      res.json({ message: 'All notifications marked as read' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = NotificationController;
