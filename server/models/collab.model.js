/**
 * Collaboration Model
 *
 * Handles imported GitHub projects and join requests.
 */

const { pool } = require('../config/db');

const CollabModel = {
  // ----------- Collaboration Projects -----------

  async create({ owner_id, project_id, github_repo_url, repo_name, description, languages, topics }) {
    const [result] = await pool.query(
      `INSERT INTO collaboration_projects (owner_id, project_id, github_repo_url, repo_name, description, languages, topics, is_open_for_collab)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
      [owner_id, project_id || null, github_repo_url || null, repo_name, description || '', JSON.stringify(languages || {}), JSON.stringify(topics || [])]
    );
    return result.insertId;
  },

  async findAll({ openOnly = true, page = 1, limit = 20, search } = {}) {
    const params = [];
    let query = `SELECT cp.*, u.name as owner_name, u.avatar_url as owner_avatar, p.title as catalog_title
                 FROM collaboration_projects cp 
                 JOIN users u ON cp.owner_id = u.id
                 LEFT JOIN projects p ON cp.project_id = p.id
                 WHERE 1=1`;

    if (openOnly) query += ' AND cp.is_open_for_collab = 1';
    if (search) {
      query += ' AND (cp.repo_name LIKE ? OR cp.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY cp.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const [rows] = await pool.query(query, params);
    return rows.map(r => ({
      ...r,
      languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages,
      topics: typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics
    }));
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT cp.*, u.name as owner_name, u.avatar_url as owner_avatar, p.title as catalog_title
       FROM collaboration_projects cp 
       JOIN users u ON cp.owner_id = u.id 
       LEFT JOIN projects p ON cp.project_id = p.id
       WHERE cp.id = ?`,
      [id]
    );
    const r = rows[0];
    if (r) {
      r.languages = typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages;
      r.topics = typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics;
    }
    return r || null;
  },

  async findByOwner(ownerId) {
    const [rows] = await pool.query(
      `SELECT cp.*, p.title as catalog_title 
       FROM collaboration_projects cp 
       LEFT JOIN projects p ON cp.project_id = p.id 
       WHERE cp.owner_id = ?`, 
      [ownerId]
    );
    return rows.map(r => ({
      ...r,
      languages: typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages,
      topics: typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics
    }));
  },

  async toggleCollab(id, isOpen) {
    await pool.query('UPDATE collaboration_projects SET is_open_for_collab = ? WHERE id = ?', [isOpen ? 1 : 0, id]);
  },

  // ----------- Collaboration Interactions (Requests & Invites) -----------

  async createInteraction({ collab_project_id, user_id, type, role, message }) {
    const [result] = await pool.query(
      'INSERT INTO collaboration_requests (collab_project_id, user_id, type, role, message) VALUES (?, ?, ?, ?, ?)',
      [collab_project_id, user_id, type || 'request', role || null, message || '']
    );
    return result.insertId;
  },

  async getInteractions(collabProjectId) {
    const [rows] = await pool.query(
      `SELECT cr.*, u.name as user_name, u.email as user_email, u.avatar_url
       FROM collaboration_requests cr 
       JOIN users u ON cr.user_id = u.id
       WHERE cr.collab_project_id = ?
       ORDER BY cr.created_at DESC`,
      [collabProjectId]
    );
    return rows;
  },

  async getMyInteractions(userId, type = 'invite', direction = 'received') {
    let query = '';
    let params = [];

    if (direction === 'received') {
      query = `SELECT cr.*, cp.repo_name, u.name as partner_name, u.avatar_url as partner_avatar
               FROM collaboration_requests cr
               JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
               JOIN users u ON cp.owner_id = u.id
               WHERE cr.user_id = ? AND cr.type = ?`;
      params = [userId, type];
    } else {
      // Sent interactions (owner inviting others, or user requesting to join)
      query = `SELECT cr.*, cp.repo_name, u.name as partner_name, u.avatar_url as partner_avatar
               FROM collaboration_requests cr
               JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
               JOIN users u ON cr.user_id = u.id
               WHERE cp.owner_id = ? AND cr.type = ?`;
      params = [userId, type];
    }

    query += ' ORDER BY cr.created_at DESC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  async respondToInteraction(requestId, status) {
    await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [status, requestId]);
  },

  async getInteractionById(requestId) {
    const [rows] = await pool.query('SELECT * FROM collaboration_requests WHERE id = ?', [requestId]);
    return rows[0] || null;
  },
};

module.exports = CollabModel;
