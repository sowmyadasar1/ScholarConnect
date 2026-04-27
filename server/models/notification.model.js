/**
 * Notification Model
 *
 * Handles persistent notifications for user events:
 * mentor requests, team invites, collab requests, responses, etc.
 */

const { pool } = require('../config/db');

const NotificationModel = {
  /**
   * Create a notification.
   */
  async create({ user_id, type, title, message, reference_type, reference_id }) {
    const [result] = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, reference_type, reference_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [user_id, type, title, message || null, reference_type || null, reference_id || null]
    );
    return result.insertId;
  },

  /**
   * Get all notifications for a user (most recent first).
   */
  async findByUser(userId, { limit = 30 } = {}) {
    const [rows] = await pool.query(
      `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows;
  },

  /**
   * Get unread count for a user (safe destructuring).
   */
  async getUnreadCount(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    return rows[0]?.count || 0;
  },

  /**
   * Mark a single notification as read.
   */
  async markAsRead(notificationId, userId) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
  },

  /**
   * Mark all notifications as read for a user.
   */
  async markAllAsRead(userId) {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId]
    );
  },
};

module.exports = NotificationModel;
