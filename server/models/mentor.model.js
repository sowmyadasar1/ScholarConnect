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
      `SELECT s.name, s.category, IFNULL(ms.proficiency, us.proficiency) as proficiency
       FROM mentors m
       JOIN users u ON m.user_id = u.id
       LEFT JOIN mentor_skills ms ON m.id = ms.mentor_id
       LEFT JOIN user_skills us ON u.id = us.user_id
       JOIN skills s ON (s.id = ms.skill_id OR s.id = us.skill_id)
       WHERE m.id = ?
       GROUP BY s.id`,
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

    // Get mentors already in requested/accepted state to avoid duplicates
    const [existingRows] = await pool.query(
      "SELECT mentor_id FROM mentor_matches WHERE user_id = ? AND status IN ('requested', 'accepted')",
      [userId]
    );
    const excludeIds = new Set(existingRows.map(r => r.mentor_id));

    // Insert one at a time (SQLite doesn't support bulk VALUES ? syntax)
    for (const m of matches) {
      // Skip mentors the user has already requested or been matched with
      if (excludeIds.has(m.mentor_id)) continue;

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
    // SQLite-compatible UPSERT for mentor_matches
    // This allows users to request mentors even if they weren't in the initial suggestion list
    await pool.query(
      `INSERT INTO mentor_matches (user_id, mentor_id, status, requested_at, compatibility_score)
       VALUES (?, ?, 'requested', datetime('now'), 0.5)
       ON CONFLICT(user_id, mentor_id) DO UPDATE SET
       status = 'requested',
       requested_at = datetime('now')`,
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
