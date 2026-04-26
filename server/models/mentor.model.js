/**
 * Mentor Model
 *
 * Handles mentor profiles, skills, and match records.
 * All SQL is SQLite-compatible.
 */

const { pool } = require('../config/db');

const MentorModel = {
  // ----------- Mentor CRUD -----------

  async findAll({ approved = true, domain, search } = {}) {
    let query = 'SELECT m.*, u.name, u.email, u.avatar_url FROM mentors m JOIN users u ON m.user_id = u.id WHERE 1=1';
    const params = [];

    if (approved !== undefined) {
      query += ' AND m.is_approved = ?';
      params.push(approved ? 1 : 0);
    }
    if (domain) {
      query += ' AND m.domain = ?';
      params.push(domain);
    }
    if (search) {
      query += ' AND (u.name LIKE ? OR m.domain LIKE ? OR m.bio LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY m.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT m.*, u.name, u.email, u.avatar_url FROM mentors m JOIN users u ON m.user_id = u.id WHERE m.id = ?',
      [id]
    );
    return rows[0] || null;
  },

  async findByUserId(userId) {
    const [rows] = await pool.query('SELECT * FROM mentors WHERE user_id = ?', [userId]);
    return rows[0] || null;
  },

  async register(userId, { domain, experience_years, max_mentees, bio }) {
    const [result] = await pool.query(
      'INSERT INTO mentors (user_id, domain, experience_years, max_mentees, bio) VALUES (?, ?, ?, ?, ?)',
      [userId, domain, experience_years || 0, max_mentees || 3, bio || '']
    );
    return result.insertId;
  },

  async approve(id) {
    await pool.query('UPDATE mentors SET is_approved = 1 WHERE id = ?', [id]);
  },

  async reject(id) {
    await pool.query('UPDATE mentors SET is_approved = 0 WHERE id = ?', [id]);
  },

  // ----------- Mentor Skills -----------

  async getSkills(mentorId) {
    const [rows] = await pool.query(
      `SELECT us.*, s.name, s.category
       FROM user_skills us 
       JOIN skills s ON us.skill_id = s.id
       JOIN mentors m ON us.user_id = m.user_id
       WHERE m.id = ?`,
      [mentorId]
    );
    return rows;
  },

  async addSkill(mentorId, skillId, proficiency = 3) {
    // SQLite-compatible UPSERT
    await pool.query(
      `INSERT INTO mentor_skills (mentor_id, skill_id, proficiency) VALUES (?, ?, ?)
       ON CONFLICT(mentor_id, skill_id) DO UPDATE SET proficiency = excluded.proficiency`,
      [mentorId, skillId, proficiency]
    );
  },

  // ----------- Mentor Matches -----------

  async saveMatches(userId, matches) {
    // Remove old suggestions (keep accepted/requested ones)
    await pool.query("DELETE FROM mentor_matches WHERE user_id = ? AND status = 'suggested'", [userId]);

    if (!matches || matches.length === 0) return;

    // Insert one at a time (SQLite doesn't support bulk VALUES ? syntax)
    for (const m of matches) {
      await pool.query(
        `INSERT INTO mentor_matches (user_id, mentor_id, compatibility_score, skill_match_score, domain_match_score, experience_score, availability_score, explanation, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'suggested')`,
        [
          userId, m.mentor_id, m.compatibility_score,
          m.skill_match_score || 0, m.domain_match_score || 0,
          m.experience_score || 0, m.availability_score || 0,
          m.explanation || ''
        ]
      );
    }
  },

  async getMatches(userId) {
    const [rows] = await pool.query(
      `SELECT mm.*, u.name as mentor_name, u.avatar_url as mentor_avatar, m.domain, m.experience_years
       FROM mentor_matches mm
       JOIN mentors m ON mm.mentor_id = m.id
       JOIN users u ON m.user_id = u.id
       WHERE mm.user_id = ?
       ORDER BY mm.compatibility_score DESC`,
      [userId]
    );
    return rows;
  },

  async requestMentor(userId, mentorId) {
    // SQLite: use datetime('now') instead of NOW()
    await pool.query(
      "UPDATE mentor_matches SET status = 'requested', requested_at = datetime('now') WHERE user_id = ? AND mentor_id = ?",
      [userId, mentorId]
    );
  },

  async respondToRequest(matchId, status) {
    await pool.query('UPDATE mentor_matches SET status = ? WHERE id = ?', [status, matchId]);

    // If accepted, increment current_mentees count
    if (status === 'accepted') {
      await pool.query(
        'UPDATE mentors SET current_mentees = current_mentees + 1 WHERE id = (SELECT mentor_id FROM mentor_matches WHERE id = ?)',
        [matchId]
      );
    }
  },

  /**
   * Check if mentor has capacity for another mentee.
   */
  async hasCapacity(mentorId) {
    const [rows] = await pool.query(
      'SELECT (max_mentees - current_mentees) as available FROM mentors WHERE id = ?',
      [mentorId]
    );
    return rows[0]?.available > 0;
  },
};

module.exports = MentorModel;
