/**
 * Connection Model
 * 
 * Handles persistent relationships between users (teammates, mentors).
 */

const { pool } = require('../config/db');

const ConnectionModel = {
  /**
   * Create or update a connection between two users.
   */
  async ensureConnection(userId1, userId2, type) {
    const [u1, u2] = userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
    
    try {
      await pool.query(
        `INSERT INTO connections (user_id_1, user_id_2, type, collaboration_count)
         VALUES (?, ?, ?, 1)
         ON CONFLICT(user_id_1, user_id_2, type) DO UPDATE SET
         collaboration_count = collaboration_count + 1,
         last_interacted_at = CURRENT_TIMESTAMP`,
        [u1, u2, type]
      );
    } catch (err) {
      console.error('Failed to ensure connection:', err);
    }
  },

  /**
   * Get all collaborators for a user.
   */
  async getCollaborators(userId) {
    const [rows] = await pool.query(
      `SELECT c.*, 
              CASE WHEN c.user_id_1 = ? THEN u2.id ELSE u1.id END as collaborator_id,
              CASE WHEN c.user_id_1 = ? THEN u2.name ELSE u1.name END as name,
              CASE WHEN c.user_id_1 = ? THEN u2.avatar_url ELSE u1.avatar_url END as avatar_url,
              CASE WHEN c.user_id_1 = ? THEN u2.reputation_score ELSE u1.reputation_score END as reputation_score,
              CASE WHEN c.user_id_1 = ? THEN u2.preferred_role ELSE u1.preferred_role END as preferred_role
       FROM connections c
       JOIN users u1 ON c.user_id_1 = u1.id
       JOIN users u2 ON c.user_id_2 = u2.id
       WHERE (c.user_id_1 = ? OR c.user_id_2 = ?) AND c.type = 'teammate' AND c.status = 'active'
       ORDER BY c.last_interacted_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );
    return rows;
  },

  /**
   * Get all mentors for a user.
   */
  async getMentors(userId) {
    const [rows] = await pool.query(
      `SELECT c.*, 
              CASE WHEN c.user_id_1 = ? THEN u2.id ELSE u1.id END as mentor_id,
              CASE WHEN c.user_id_1 = ? THEN u2.name ELSE u1.name END as name,
              CASE WHEN c.user_id_1 = ? THEN u2.avatar_url ELSE u1.avatar_url END as avatar_url,
              CASE WHEN c.user_id_1 = ? THEN u2.reputation_score ELSE u1.reputation_score END as reputation_score
       FROM connections c
       JOIN users u1 ON c.user_id_1 = u1.id
       JOIN users u2 ON c.user_id_2 = u2.id
       WHERE (c.user_id_1 = ? OR c.user_id_2 = ?) AND c.type = 'mentor' AND c.status = 'active'
       ORDER BY c.last_interacted_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );
    return rows;
  }
};

module.exports = ConnectionModel;
