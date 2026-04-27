/**
 * Network Controller
 * 
 * Manages the persistent network of collaborators and mentors.
 * Handles smart ranking for project invites.
 */

const ConnectionModel = require('../models/connection.model');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const NetworkController = {
  /**
   * GET /api/network/collaborators
   */
  async getCollaborators(req, res, next) {
    try {
      const collaborators = await ConnectionModel.getCollaborators(req.user.id);
      res.json({ collaborators });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/network/mentors
   */
  async getMentors(req, res, next) {
    try {
      const mentors = await ConnectionModel.getMentors(req.user.id);
      res.json({ mentors });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/network/suggestions/:projectId
   * Smart ranking for project invites.
   * score = 0.40 skills + 0.25 role + 0.20 quality + 0.10 availability + 0.05 reputation
   */
  async getInviteSuggestions(req, res, next) {
    try {
      const { projectId } = req.params;
      const userId = req.user.id;

      // 1. Get project requirements
      const [projectRows] = await pool.query(
        'SELECT * FROM collaboration_projects WHERE id = ?',
        [projectId]
      );
      const project = projectRows[0];
      if (!project) throw new AppError('Project not found', 404);

      // Parse project topics as required skills
      const projectSkills = JSON.parse(project.topics || '[]');

      // 2. Get user's network
      const collaborators = await ConnectionModel.getCollaborators(userId);

      // 3. Rank each collaborator
      const ranked = await Promise.all(collaborators.map(async (collab) => {
        const collabId = collab.collaborator_id;

        // Fetch collab skills
        const [skillRows] = await pool.query(
          'SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = ?',
          [collabId]
        );
        const collabSkills = skillRows.map(s => s.name);

        // --- Calculation ---
        
        // Skill Complementarity (40%)
        const matchedSkills = projectSkills.filter(s => collabSkills.includes(s));
        const skillScore = projectSkills.length > 0 ? (matchedSkills.length / projectSkills.length) : 0.5;

        // Role Fit (25%)
        // Simple heuristic: if they have a preferred role, assume good fit for now
        const roleScore = collab.preferred_role ? 0.8 : 0.5;

        // Past Collaboration Quality (20%)
        // Based on collaboration_count or history table (mocking it as high for now)
        const qualityScore = collab.collaboration_count > 1 ? 0.9 : 0.7;

        // Availability (10%)
        const availabilityScore = 0.8; // Mocked

        // Reputation (5%)
        const reputationScore = collab.reputation_score || 0.8;

        const totalScore = (skillScore * 0.40) + (roleScore * 0.25) + (qualityScore * 0.20) + (availabilityScore * 0.10) + (reputationScore * 0.05);

        return {
          ...collab,
          match_score: totalScore,
          matched_skills: matchedSkills,
          explanation: `Matches ${matchedSkills.length} required skills (${matchedSkills.join(', ')}). Has worked with you on ${collab.collaboration_count} project(s).`
        };
      }));

      // Sort by score
      ranked.sort((a, b) => b.match_score - a.match_score);

      res.json({ suggestions: ranked.slice(0, 5) });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/network/invite-collaborator
   */
  async inviteCollaborator(req, res, next) {
    try {
      const { projectId, collaboratorId, role, message, expectedContribution, timeline } = req.body;
      const senderId = req.user.id;

      // Check if already on team or invited
      const [existing] = await pool.query(
        'SELECT id FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ? AND status = "pending"',
        [projectId, collaboratorId]
      );
      if (existing.length > 0) throw new AppError('Invitation already pending', 400);

      const [member] = await pool.query(
        'SELECT tm.id FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.collab_project_id = ? AND tm.user_id = ?',
        [projectId, collaboratorId]
      );
      if (member.length > 0) throw new AppError('User is already a project member', 400);

      await pool.query(
        `INSERT INTO collaboration_requests 
         (collab_project_id, user_id, sender_id, type, role, message, expected_contribution, timeline)
         VALUES (?, ?, ?, 'invite', ?, ?, ?, ?)`,
        [projectId, collaboratorId, senderId, role, message, expectedContribution, timeline]
      );

      res.json({ message: 'Invitation sent successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/network/invite-mentor
   */
  async inviteMentor(req, res, next) {
    try {
      const { projectId, mentorId, mentorRole, message, timeline } = req.body;
      const senderId = req.user.id;

      // In this system, mentorId is the user_id of the mentor
      await pool.query(
        `INSERT INTO collaboration_requests 
         (collab_project_id, user_id, sender_id, type, role, message, timeline, mentor_role)
         VALUES (?, ?, ?, 'mentor_invite', 'mentor', ?, ?, ?)`,
        [projectId, mentorId, senderId, message, timeline, mentorRole]
      );

      res.json({ message: 'Mentor invitation sent successfully' });
    } catch (err) {
      next(err);
    }
  }
};

module.exports = NetworkController;
