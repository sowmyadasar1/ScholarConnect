/**
 * Team Model
 *
 * Handles teams, team members, teammate suggestions, and invites.
 */

const { pool } = require('../config/db');

const TeamModel = {
  // ----------- Teams -----------

  async create(name, projectId, createdBy, maxMembers = 4) {
    const [result] = await pool.query(
      'INSERT INTO teams (name, project_id, max_members, created_by) VALUES (?, ?, ?, ?)',
      [name, projectId, maxMembers, createdBy]
    );
    // Auto-add the creator as first member
    await pool.query(
      'INSERT INTO team_members (team_id, user_id) VALUES (?, ?)',
      [result.insertId, createdBy]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.query(
      `SELECT t.*, u.name as creator_name
       FROM teams t JOIN users u ON t.created_by = u.id WHERE t.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  async findByUser(userId) {
    const [rows] = await pool.query(
      `SELECT t.*, tm.assigned_role
       FROM team_members tm JOIN teams t ON tm.team_id = t.id
       WHERE tm.user_id = ?`,
      [userId]
    );
    return rows;
  },

  async getMembers(teamId) {
    const [rows] = await pool.query(
      `SELECT tm.*, u.name, u.email, u.avatar_url, u.preferred_role
       FROM team_members tm JOIN users u ON tm.user_id = u.id
       WHERE tm.team_id = ?`,
      [teamId]
    );
    return rows;
  },

  async addMember(teamId, userId, assignedRole = null) {
    await pool.query(
      'INSERT INTO team_members (team_id, user_id, assigned_role) VALUES (?, ?, ?)',
      [teamId, userId, assignedRole]
    );
  },

  async removeMember(teamId, userId) {
    await pool.query('DELETE FROM team_members WHERE team_id = ? AND user_id = ?', [teamId, userId]);
  },

  async assignRole(teamId, userId, role) {
    await pool.query('UPDATE team_members SET assigned_role = ? WHERE team_id = ? AND user_id = ?', [role, teamId, userId]);
  },

  async isFull(teamId) {
    const [[{ count }]] = await pool.query('SELECT COUNT(*) as count FROM team_members WHERE team_id = ?', [teamId]);
    const team = await TeamModel.findById(teamId);
    return count >= team.max_members;
  },

  // ----------- Teammate Suggestions -----------

  async saveSuggestions(userId, suggestions) {
    await pool.query('DELETE FROM teammate_suggestions WHERE user_id = ?', [userId]);
    if (suggestions.length === 0) return;

    for (const s of suggestions) {
      await pool.query(
        `INSERT INTO teammate_suggestions (user_id, suggested_user_id, compatibility_score, skill_complementarity, role_fit_score, availability_score, explanation)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, s.suggested_user_id, s.compatibility_score || 0, s.skill_complementarity || 0, s.role_fit_score || 0, s.availability_score || 0, s.explanation || '']
      );
    }
  },

  async getSuggestions(userId) {
    const [rows] = await pool.query(
      `SELECT ts.*, u.name, u.avatar_url, u.preferred_role, u.academic_level
       FROM teammate_suggestions ts JOIN users u ON ts.suggested_user_id = u.id
       WHERE ts.user_id = ?
       ORDER BY ts.compatibility_score DESC`,
      [userId]
    );
    return rows;
  },

  // ----------- Invites -----------

  async createInvite(senderId, receiverId, teamId, collabProjectId, message) {
    const [result] = await pool.query(
      'INSERT INTO collaboration_requests (collab_project_id, user_id, type, message) VALUES (?, ?, ?, ?)',
      [collabProjectId, receiverId, 'invite', message || '']
    );
    return result.insertId;
  },

  async getInvitesForUser(userId) {
    const [rows] = await pool.query(
      `SELECT cr.*, u.name as sender_name, u.avatar_url as sender_avatar,
              cp.repo_name as team_name
       FROM collaboration_requests cr
       JOIN collaboration_projects cp ON cr.collab_project_id = cp.id
       JOIN users u ON cp.owner_id = u.id
       WHERE cr.user_id = ? AND cr.status = 'pending' AND cr.type = 'invite'
       ORDER BY cr.created_at DESC`,
      [userId]
    );
    return rows;
  },

  async respondToInvite(inviteId, status) {
    await pool.query('UPDATE collaboration_requests SET status = ? WHERE id = ?', [status, inviteId]);
  },
};

module.exports = TeamModel;
