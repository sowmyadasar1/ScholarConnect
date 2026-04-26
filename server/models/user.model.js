/**
 * User Model
 *
 * All database queries related to the users table.
 * Each method is a thin wrapper around a SQL query — no business logic here.
 */

const { pool } = require('../config/db');
const { encrypt, decrypt } = require('../utils/encryption');

const UserModel = {
  // ----------- Find Methods -----------

  async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, email, name, avatar_url, bio, github_id, google_id, github_access_token, academic_level, preferred_role, availability, is_admin, created_at FROM users WHERE id = ?',
      [id]
    );
    const user = rows[0] || null;
    if (user && user.github_access_token) {
      user.github_access_token = decrypt(user.github_access_token);
    }
    return user;
  },

  async findByEmail(email) {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const user = rows[0] || null;
    if (user && user.github_access_token) {
      user.github_access_token = decrypt(user.github_access_token);
    }
    return user;
  },

  async findByGithubId(githubId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE github_id = ?', [githubId]);
    const user = rows[0] || null;
    if (user && user.github_access_token) {
      user.github_access_token = decrypt(user.github_access_token);
    }
    return user;
  },

  async findByGoogleId(googleId) {
    const [rows] = await pool.query('SELECT * FROM users WHERE google_id = ?', [googleId]);
    return rows[0] || null;
  },

  // ----------- Create / Update -----------

  async create({ email, password_hash, name, avatar_url, github_id, google_id, github_access_token }) {
    const encryptedToken = github_access_token ? encrypt(github_access_token) : null;
    const [result] = await pool.query(
      `INSERT INTO users (email, password_hash, name, avatar_url, github_id, google_id, github_access_token)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, password_hash || null, name, avatar_url || null, github_id || null, google_id || null, encryptedToken]
    );
    return result.insertId;
  },

  async updateProfile(id, { name, bio, academic_level, preferred_role, availability }) {
    await pool.query(
      `UPDATE users SET name = COALESCE(?, name), bio = COALESCE(?, bio),
       academic_level = COALESCE(?, academic_level), preferred_role = COALESCE(?, preferred_role),
       availability = COALESCE(?, availability) WHERE id = ?`,
      [name, bio, academic_level, preferred_role, availability, id]
    );
  },

  async linkGithub(id, githubId, token) {
    const encryptedToken = token ? encrypt(token) : null;
    await pool.query('UPDATE users SET github_id = ?, github_access_token = ? WHERE id = ?', [githubId, encryptedToken, id]);
  },

  async linkGoogle(id, googleId) {
    await pool.query('UPDATE users SET google_id = ? WHERE id = ?', [googleId, id]);
  },

  async updateGithubToken(id, token) {
    const encryptedToken = token ? encrypt(token) : null;
    await pool.query('UPDATE users SET github_access_token = ? WHERE id = ?', [encryptedToken, id]);
  },

  // ----------- Skills (convenience joins) -----------

  async getSkills(userId) {
    const [rows] = await pool.query(
      `SELECT us.id, us.skill_id, s.name, s.category, us.proficiency, us.source
       FROM user_skills us JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = ?`,
      [userId]
    );
    return rows;
  },

  async getInterests(userId) {
    const [rows] = await pool.query(
      `SELECT ui.id, i.name, i.category
       FROM user_interests ui JOIN interests i ON ui.interest_id = i.id
       WHERE ui.user_id = ?`,
      [userId]
    );
    return rows;
  },

  // ----------- Admin Queries -----------

  async findAll({ page = 1, limit = 20 }) {
    const offset = (page - 1) * limit;
    const [rows] = await pool.query(
      'SELECT id, email, name, academic_level, preferred_role, is_admin, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM users');
    return { users: rows, total, page, limit };
  },

  async search(query, limit = 10) {
    const pattern = `%${query}%`;
    const [rows] = await pool.query(
      `SELECT id, name, avatar_url, bio, academic_level, preferred_role
       FROM users
       WHERE name LIKE ? OR bio LIKE ? OR preferred_role LIKE ? OR academic_level LIKE ?
       LIMIT ?`,
      [pattern, pattern, pattern, pattern, limit]
    );
    return rows;
  },

  async delete(id) {
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
  },
};

module.exports = UserModel;
