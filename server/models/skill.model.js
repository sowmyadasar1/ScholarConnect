/**
 * Skill Model
 *
 * Handles the master skills table and user_skills junction.
 */

const { pool } = require('../config/db');

const SkillModel = {
  async findAll() {
    const [rows] = await pool.query('SELECT * FROM skills ORDER BY category, name');
    return rows;
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM skills WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByName(name) {
    const [rows] = await pool.query('SELECT * FROM skills WHERE name = ?', [name]);
    return rows[0] || null;
  },

  async create({ name, category }) {
    const [result] = await pool.query('INSERT INTO skills (name, category) VALUES (?, ?)', [name, category]);
    return result.insertId;
  },

  /**
   * Find or create a skill by name.
   * Useful when importing from GitHub — we don't know if "python" exists yet.
   */
  async findOrCreate(name, category = 'language') {
    let skill = await SkillModel.findByName(name);
    if (!skill) {
      const id = await SkillModel.create({ name, category });
      skill = { id, name, category };
    }
    return skill;
  },

  // ----------- User Skills -----------

  async addUserSkill(userId, skillId, proficiency = 'Intermediate', source = 'manual') {
    // SQLite compatible UPSERT
    // Note: for strings, MAX() works alphabetically, so we just overwrite or handle logic in service
    await pool.query(
      `INSERT INTO user_skills (user_id, skill_id, proficiency, source)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(user_id, skill_id) DO UPDATE SET 
       proficiency = excluded.proficiency,
       source = excluded.source`,
      [userId, skillId, proficiency, source]
    );
  },

  async removeUserSkill(userId, skillId) {
    await pool.query('DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?', [userId, skillId]);
  },

  async updateUserSkillProficiency(userId, skillId, proficiency) {
    await pool.query('UPDATE user_skills SET proficiency = ? WHERE user_id = ? AND skill_id = ?', [proficiency, userId, skillId]);
  },
};

module.exports = SkillModel;
