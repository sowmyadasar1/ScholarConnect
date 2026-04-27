/**
 * Feedback Model
 *
 * Stores user ratings for project recommendations, mentor matches,
 * and teammate suggestions. SQLite-compatible.
 */

const { pool } = require('../config/db');

const FeedbackModel = {
  async create({ user_id, target_type, target_id, rating, comment, tags }) {
    // SQLite-compatible UPSERT
    const [result] = await pool.query(
      `INSERT INTO feedback (user_id, target_type, target_id, rating, comment, tags)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, target_type, target_id) DO UPDATE SET 
       rating = excluded.rating, 
       comment = excluded.comment,
       tags = excluded.tags`,
      [user_id, target_type || 'general', target_id || 0, rating, comment || null, JSON.stringify(tags || [])]
    );
    return result.insertId;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      'SELECT * FROM feedback WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return rows;
  },

  async findByTarget(targetType, targetId) {
    const [rows] = await pool.query(
      'SELECT f.*, u.name as user_name FROM feedback f JOIN users u ON f.user_id = u.id WHERE f.target_type = ? AND f.target_id = ?',
      [targetType, targetId]
    );
    return rows;
  },

  async getAverageRating(targetType, targetId) {
    const [rows] = await pool.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as count FROM feedback WHERE target_type = ? AND target_id = ?',
      [targetType, targetId]
    );
    const row = rows[0] || {};
    return { avg_rating: row.avg_rating ? parseFloat(row.avg_rating).toFixed(1) : null, count: row.count || 0 };
  },

  // Admin: get all feedback, paginated
  async findAll({ page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      `SELECT f.*, u.name as user_name
       FROM feedback f JOIN users u ON f.user_id = u.id
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [countRows] = await pool.query('SELECT COUNT(*) as total FROM feedback');
    const total = countRows[0]?.total || 0;
    return { feedback: rows, total, page, limit };
  },
};

module.exports = FeedbackModel;
