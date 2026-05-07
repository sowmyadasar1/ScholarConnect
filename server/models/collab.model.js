/**
 * Collaboration Model
 *
 * Handles imported GitHub projects and join requests.
 */

const { pool } = require('../config/db');

const CollabModel = {
  // ----------- Collaboration Projects -----------

  async create({ owner_id, project_id, github_repo_url, repo_name, description, languages, topics, is_open_for_collab }) {
    const [result] = await pool.query(
      `INSERT INTO collaboration_projects (owner_id, project_id, github_repo_url, repo_name, description, languages, topics, is_open_for_collab)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [owner_id, project_id || null, github_repo_url || null, repo_name, description || '', JSON.stringify(languages || {}), JSON.stringify(topics || []), is_open_for_collab !== undefined ? is_open_for_collab : 1]
    );
    return result.insertId;
  },

  async findAll({ openOnly = true, page = 1, limit = 20, search, userId } = {}) {
    const params = [];
    // Use DISTINCT to avoid duplicates from the LEFT JOIN on teams
    let query = `SELECT DISTINCT cp.*, u.name as owner_name, u.avatar_url as owner_avatar, p.title as catalog_title,
                 (SELECT 1 FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.collab_project_id = cp.id AND tm.user_id = ? LIMIT 1) as is_member,
                 (SELECT id FROM teams WHERE collab_project_id = cp.id LIMIT 1) as team_id
                 FROM collaboration_projects cp 
                 JOIN users u ON cp.owner_id = u.id
                 LEFT JOIN projects p ON cp.project_id = p.id
                 WHERE 1=1`;
    params.push(userId || 0);

    if (openOnly) query += ' AND cp.is_open_for_collab = 1';
    
    const searchTerm = search ? search.trim() : '';
    if (searchTerm) {
      query += ' AND (cp.repo_name LIKE ? OR cp.description LIKE ?)';
      params.push(`%${searchTerm}%`, `%${searchTerm}%`);
    }
    
    query += ' ORDER BY cp.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);
    
    const [rows] = await pool.query(query, params);
    
    // Total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM collaboration_projects WHERE 1=1';
    if (openOnly) countQuery += ' AND is_open_for_collab = 1';
    if (searchTerm) countQuery += ' AND (repo_name LIKE ? OR description LIKE ?)';
    
    const countParams = searchTerm ? [`%${searchTerm}%`, `%${searchTerm}%`] : [];
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;

    return {
      projects: rows.map(r => {
        let languages = {};
        let topics = [];
        try {
          languages = typeof r.languages === 'string' ? JSON.parse(r.languages) : (r.languages || {});
        } catch (e) {
          if (typeof r.languages === 'string') {
            r.languages.split(',').forEach(l => languages[l.trim()] = 1);
          }
        }
        try {
          topics = typeof r.topics === 'string' ? JSON.parse(r.topics) : (r.topics || []);
        } catch (e) {
          if (typeof r.topics === 'string') {
            topics = r.topics.split(',').map(t => t.trim());
          }
        }
        return { ...r, languages, topics };
      }),
      total,
      page,
      limit
    };
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
      try {
        r.languages = typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages;
      } catch (e) {
        const langMap = {};
        if (typeof r.languages === 'string') r.languages.split(',').forEach(l => langMap[l.trim()] = 1);
        r.languages = langMap;
      }
      try {
        r.topics = typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics;
      } catch (e) {
        if (typeof r.topics === 'string') r.topics = r.topics.split(',').map(t => t.trim());
        else r.topics = [];
      }
    }
    return r || null;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT DISTINCT cp.*, p.title as catalog_title, t.id as team_id
       FROM collaboration_projects cp 
       LEFT JOIN projects p ON cp.project_id = p.id 
       LEFT JOIN teams t ON cp.id = t.collab_project_id
       LEFT JOIN team_members tm ON t.id = tm.team_id
       WHERE cp.owner_id = ? OR tm.user_id = ?`, 
      [userId, userId]
    );
    return {
      projects: rows.map(r => {
        let languages = {};
        let topics = [];
        try {
          languages = typeof r.languages === 'string' ? JSON.parse(r.languages) : r.languages;
        } catch (e) {
          if (typeof r.languages === 'string') r.languages.split(',').forEach(l => languages[l.trim()] = 1);
        }
        try {
          topics = typeof r.topics === 'string' ? JSON.parse(r.topics) : r.topics;
        } catch (e) {
          if (typeof r.topics === 'string') topics = r.topics.split(',').map(t => t.trim());
        }
        return { ...r, languages, topics };
      })
    };
  },

  async toggleCollab(id, isOpen) {
    await pool.query('UPDATE collaboration_projects SET is_open_for_collab = ? WHERE id = ?', [isOpen ? 1 : 0, id]);
  },

  // ----------- Collaboration Interactions (Requests & Invites) -----------

  async createInteraction({ collab_project_id, user_id, type, role, message, sender_id }) {
    const [result] = await pool.query(
      'INSERT INTO collaboration_requests (collab_project_id, user_id, type, role, message, sender_id) VALUES (?, ?, ?, ?, ?, ?)',
      [collab_project_id, user_id, type || 'request', role || null, message || '', sender_id || null]
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

  async exists(ownerId, repoName, githubRepoUrl = null) {
    const params = [ownerId, repoName];
    let query = 'SELECT id FROM collaboration_projects WHERE owner_id = ? AND (repo_name = ?';
    if (githubRepoUrl) {
      query += ' OR github_repo_url = ?';
      params.push(githubRepoUrl);
    }
    query += ')';
    const [rows] = await pool.query(query, params);
    return rows.length > 0;
  },

  async findByCatalogId(catalogId) {
    const [rows] = await pool.query('SELECT * FROM collaboration_projects WHERE project_id = ?', [catalogId]);
    return rows[0] || null;
  },
};

module.exports = CollabModel;
