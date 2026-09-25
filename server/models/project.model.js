/**
 * Project Model
 *
 * Covers the projects catalog, project_skills, project_tech_stack,
 * recommendations, skill_gaps, and roadmaps.
 */

const { pool } = require('../config/db');

const ProjectModel = {
  // ----------- Project CRUD -----------

  async findAll({ page = 1, limit = 20, domain, difficulty, search }) {
    let query = 'SELECT * FROM projects WHERE is_active = 1';
    const params = [];

    if (domain) {
      query += ' AND domain = ?';
      params.push(domain);
    }
    if (difficulty) {
      query += ' AND difficulty_level = ?';
      params.push(difficulty);
    }
    if (search) {
      query += ' AND (title LIKE ? OR description LIKE ? OR domain LIKE ?)';
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const [rows] = await pool.query(query, params);
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM projects WHERE is_active = 1');
    
    const projects = await Promise.all(rows.map(async (r) => {
      if (typeof r.tech_stack === 'string') {
        try { r.tech_stack = JSON.parse(r.tech_stack); }
        catch (e) { r.tech_stack = r.tech_stack.split(',').map(s => s.trim()); }
      }
      
      // If tech_stack is null, populate it from project_skills table
      if (!r.tech_stack || r.tech_stack.length === 0) {
        const [skillsRows] = await pool.query(
          'SELECT s.name FROM skills s JOIN project_skills ps ON s.id = ps.skill_id WHERE ps.project_id = ?',
          [r.id]
        );
        r.tech_stack = skillsRows.map(s => s.name);
      }
      return r;
    }));

    return { projects, total, page, limit };
  },

  async findById(id) {
    const [rows] = await pool.query('SELECT * FROM projects WHERE id = ?', [id]);
    const r = rows[0];
    if (r && typeof r.tech_stack === 'string') {
      try { r.tech_stack = JSON.parse(r.tech_stack); }
      catch (e) { r.tech_stack = r.tech_stack.split(',').map(s => s.trim()); }
    }
    return r || null;
  },

  async create(data) {
    const { title, description, difficulty_level, academic_level_min, domain, estimated_weeks, is_trending, is_beginner_friendly, created_by } = data;
    const [result] = await pool.query(
      `INSERT INTO projects (title, description, difficulty_level, academic_level_min, domain, estimated_weeks, is_trending, is_beginner_friendly, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, difficulty_level || 1, academic_level_min || 'freshman', domain, estimated_weeks || 6, is_trending || 0, is_beginner_friendly || 0, created_by]
    );
    return result.insertId;
  },

  async update(id, data) {
    const fields = [];
    const params = [];

    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        params.push(value);
      }
    }

    if (fields.length === 0) return;
    params.push(id);
    await pool.query(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`, params);
  },

  async deactivate(id) {
    await pool.query('UPDATE projects SET is_active = 0 WHERE id = ?', [id]);
  },

  // ----------- Project Skills & Tech Stack -----------

  async getSkills(projectId) {
    const [rows] = await pool.query(
      `SELECT ps.id, ps.skill_id, s.name, s.category, ps.importance
       FROM project_skills ps JOIN skills s ON ps.skill_id = s.id
       WHERE ps.project_id = ?`,
      [projectId]
    );
    return rows;
  },

  async addSkill(projectId, skillId, importance = 'required') {
    await pool.query(
      `INSERT INTO project_skills (project_id, skill_id, importance) VALUES (?, ?, ?)
       ON CONFLICT(project_id, skill_id) DO UPDATE SET importance = excluded.importance`,
      [projectId, skillId, importance]
    );
  },

  async getTechStack(projectId) {
    const [rows] = await pool.query('SELECT * FROM project_tech_stack WHERE project_id = ?', [projectId]);
    return rows;
  },

  async addTechStack(projectId, technology, role = 'other') {
    await pool.query('INSERT INTO project_tech_stack (project_id, technology, role) VALUES (?, ?, ?)', [projectId, technology, role]);
  },

  // ----------- Recommendations -----------

  async saveRecommendations(userId, recommendations) {
    await pool.query('DELETE FROM project_recommendations WHERE user_id = ?', [userId]);
    if (recommendations.length === 0) return;

    for (const r of recommendations) {
      await pool.query(
        `INSERT INTO project_recommendations (user_id, project_id, match_score, difficulty_match, skill_match, interest_match, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, r.project_id, r.match_score, r.difficulty_match || 0, r.skill_match || 0, r.interest_match || 0, r.explanation || '']
      );
      
      // Save roadmap and gaps if they exist in the recommendation
      if (r.roadmap) {
        await this.saveRoadmap(r.project_id, r.roadmap);
      }
      if (r.gap_info) {
        const gaps = r.gap_info.missing_skills.map(s => ({ skill_name: s }));
        await this.saveSkillGaps(userId, r.project_id, gaps);
      }
    }
  },

  async saveRoadmap(projectId, roadmap) {
    await pool.query('DELETE FROM project_roadmaps WHERE project_id = ?', [projectId]);
    for (const step of roadmap) {
      await pool.query(
        'INSERT INTO project_roadmaps (project_id, phase, task) VALUES (?, ?, ?)',
        [projectId, step.phase, step.task]
      );
    }
  },

  async getRoadmap(projectId) {
    const [rows] = await pool.query('SELECT * FROM project_roadmaps WHERE project_id = ? ORDER BY id ASC', [projectId]);
    return rows;
  },

  async getRecommendations(userId) {
    const [rows] = await pool.query(
      `SELECT pr.*, p.title, p.description, p.difficulty_level, p.domain, p.estimated_weeks, p.tech_stack
       FROM project_recommendations pr
       JOIN projects p ON pr.project_id = p.id
       WHERE pr.user_id = ?
       ORDER BY pr.match_score DESC`,
      [userId]
    );
    return rows.map(r => {
      if (typeof r.tech_stack === 'string') {
        try { r.tech_stack = JSON.parse(r.tech_stack); }
        catch (e) { r.tech_stack = r.tech_stack.split(',').map(s => s.trim()); }
      }
      return r;
    });
  },

  // ----------- Skill Gaps -----------

  async saveSkillGaps(userId, projectId, gaps) {
    await pool.query('DELETE FROM skill_gaps WHERE user_id = ? AND project_id = ?', [userId, projectId]);
    if (gaps.length === 0) return;

    for (const g of gaps) {
      await pool.query(
        'INSERT INTO skill_gaps (user_id, project_id, skill_id, suggested_path) VALUES (?, ?, ?, ?)',
        [userId, projectId, g.skill_id, g.suggested_path || '']
      );
    }
  },

  async getSkillGaps(userId, projectId) {
    const [rows] = await pool.query(
      `SELECT sg.*, s.name as skill_name, s.category
       FROM skill_gaps sg JOIN skills s ON sg.skill_id = s.id
       WHERE sg.user_id = ? AND sg.project_id = ?`,
      [userId, projectId]
    );
    return rows;
  },

  // ----------- Roadmaps -----------

  async getRoadmap(projectId) {
    const [rows] = await pool.query(
      'SELECT * FROM project_roadmaps WHERE project_id = ? ORDER BY week_number',
      [projectId]
    );
    return rows;
  },

  async saveRoadmap(projectId, weeks) {
    await pool.query('DELETE FROM project_roadmaps WHERE project_id = ?', [projectId]);
    if (weeks.length === 0) return;

    for (const w of weeks) {
      await pool.query(
        'INSERT INTO project_roadmaps (project_id, week_number, title, description, deliverables) VALUES (?, ?, ?, ?, ?)',
        [projectId, w.week_number, w.title, w.description, w.deliverables || '']
      );
    }
  },

  // ----------- Cold Start -----------

  async getTrending(limit = 10) {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE is_active = 1 AND is_trending = 1 ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  },

  async getBeginnerFriendly(limit = 10) {
    const [rows] = await pool.query(
      'SELECT * FROM projects WHERE is_active = 1 AND is_beginner_friendly = 1 ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rows;
  },

  async checkApplication(projectId, userId) {
    const [rows] = await pool.query(
      'SELECT * FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ?',
      [projectId, userId]
    );
    return rows[0] || null;
  },
};

module.exports = ProjectModel;
