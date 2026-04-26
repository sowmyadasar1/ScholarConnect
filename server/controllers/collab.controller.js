/**
 * Collaboration Controller
 *
 * Import GitHub repos, manage collaboration status, and handle join requests.
 */

const CollabModel = require('../models/collab.model');
const UserModel = require('../models/user.model');
const { fetchUserRepos, fetchRepoLanguages } = require('../utils/github');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const CollabController = {
  /**
   * GET /api/collab
   * List all projects open for collaboration.
   */
  async list(req, res, next) {
    try {
      const { page, limit, search } = req.query;
      const projects = await CollabModel.findAll({
        openOnly: true,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        search
      });
      res.json({ projects });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/collab/my
   * Get current user's imported projects.
   */
  async myProjects(req, res, next) {
    try {
      const projects = await CollabModel.findByOwner(req.user.id);
      res.json({ projects });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/collab/:id
   * Get a collaboration project with its join requests.
   */
  async getById(req, res, next) {
    try {
      const project = await CollabModel.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      const interactions = await CollabModel.getInteractions(project.id);
      res.json({ project, interactions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/collab/import
   * Import a GitHub repo as a collaboration project.
   */
  async importRepo(req, res, next) {
    try {
      const { repo_url, description, topics } = req.body;
      if (!repo_url) throw new AppError('Repository URL is required', 400);

      let owner, repoName;
      if (repo_url.includes('github.com')) {
        const cleanUrl = repo_url.replace(/\.git$/, '');
        const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) throw new AppError('Invalid GitHub URL', 400);
        owner = match[1];
        repoName = match[2];
      } else if (repo_url.includes('/')) {
        [owner, repoName] = repo_url.split('/');
      } else {
        throw new AppError('Invalid GitHub Repository format (expected owner/repo)', 400);
      }

      const user = await UserModel.findByEmail(req.user.email);
      let languages = {};
      if (user?.github_access_token) {
        languages = await fetchRepoLanguages(user.github_access_token, owner, repoName);
      }

      const projectId = await CollabModel.create({
        owner_id: req.user.id,
        github_repo_url: repo_url,
        repo_name: `${owner}/${repoName}`,
        description: description || '',
        languages,
        topics: topics || [],
      });

      const project = await CollabModel.findById(projectId);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/collab/manual
   * Create a collaboration project manually (for AI-generated ideas).
   */
  async createManual(req, res, next) {
    try {
      const { title, description, domain, topics, project_id } = req.body;
      if (!title || !description) throw new AppError('Title and description are required', 400);

      const projectId = await CollabModel.create({
        owner_id: req.user.id,
        project_id: project_id || null,
        repo_name: title,
        description: description,
        github_repo_url: '',
        languages: { [domain || 'Other']: 100 },
        topics: topics || [],
      });

      const project = await CollabModel.findById(projectId);
      res.status(201).json({ project, message: 'Project added to collaboration!' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/collab/:id/request
   * Request to join a collaboration project.
   */
  async requestToJoin(req, res, next) {
    try {
      const collabProjectId = parseInt(req.params.id);
      const project = await CollabModel.findById(collabProjectId);
      if (!project) throw new AppError('Project not found', 404);
      if (!project.is_open_for_collab) throw new AppError('This project is not open for collaboration', 400);
      if (project.owner_id === req.user.id) throw new AppError('You own this project', 400);

      const interactionId = await CollabModel.createInteraction({
        collab_project_id: collabProjectId,
        user_id: req.user.id,
        type: 'request',
        role: req.body.role,
        message: req.body.message
      });
      res.status(201).json({ interaction_id: interactionId, message: 'Join request sent' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/collab/:id/invite
   * Owner invites a user to join.
   */
  async inviteUser(req, res, next) {
    try {
      const collabProjectId = parseInt(req.params.id);
      const { user_id, role, message } = req.body;
      
      const project = await CollabModel.findById(collabProjectId);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can invite users', 403);

      const interactionId = await CollabModel.createInteraction({
        collab_project_id: collabProjectId,
        user_id,
        type: 'invite',
        role,
        message
      });
      res.status(201).json({ interaction_id: interactionId, message: 'Invite sent successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/collab/:id/auto-invite
   * Smart open invites based on suggested roles.
   */
  async autoInviteRole(req, res, next) {
    try {
      const collabProjectId = parseInt(req.params.id);
      const { role } = req.body;
      
      const project = await CollabModel.findById(collabProjectId);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can send smart invites', 403);

      // Find 5 users whose skills or preferred roles match this.
      const [candidates] = await pool.query(
        `SELECT DISTINCT u.id, u.name 
         FROM users u
         LEFT JOIN user_skills us ON u.id = us.user_id
         LEFT JOIN skills s ON us.skill_id = s.id
         WHERE u.id != ? 
           AND (
             u.preferred_role LIKE ? 
             OR s.name LIKE ?
             OR ? LIKE CONCAT('%', u.preferred_role, '%')
           )
           AND u.id NOT IN (
             SELECT user_id FROM collaboration_requests 
             WHERE collab_project_id = ?
           )
         ORDER BY RAND() LIMIT 5`,
        [req.user.id, `%${role}%`, `%${role}%`, role, collabProjectId]
      );

      if (candidates.length === 0) {
        return res.status(200).json({ message: 'No exact matches found right now, but the role is open.' });
      }

      for (const candidate of candidates) {
        await CollabModel.createInteraction({
          collab_project_id: collabProjectId,
          user_id: candidate.id,
          type: 'invite',
          role: role,
          message: `You've been invited to join ${project.repo_name} as a ${role} based on your skills!`
        });
      }

      res.status(201).json({ message: `Smart invites sent to ${candidates.length} matching users!` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/collab/interactions/:interactionId/respond
   */
  async respondToInteraction(req, res, next) {
    try {
      const { interactionId } = req.params;
      const { status } = req.body;

      if (!['accepted', 'rejected'].includes(status)) {
        throw new AppError('Status must be "accepted" or "rejected"', 400);
      }

      const interaction = await CollabModel.getInteractionById(interactionId);
      if (!interaction) throw new AppError('Interaction not found', 404);

      // Verify authorization
      const project = await CollabModel.findById(interaction.collab_project_id);
      if (interaction.type === 'request') {
        // Only owner can respond to requests
        if (project.owner_id !== req.user.id) throw new AppError('Only the owner can respond to requests', 403);
      } else {
        // Only the invited user can respond to invites
        if (interaction.user_id !== req.user.id) throw new AppError('Only the invited user can respond', 403);
      }

      await CollabModel.respondToInteraction(interactionId, status);
      res.json({ message: `Interaction ${status}` });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/collab/invites/me
   */
  async getMyInvites(req, res, next) {
    try {
      const received = await CollabModel.getMyInteractions(req.user.id, 'invite', 'received');
      const sent = await CollabModel.getMyInteractions(req.user.id, 'invite', 'sent');
      res.json({ received, sent });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/collab/github/repos
   */
  async listGithubRepos(req, res, next) {
    try {
      const user = await UserModel.findByEmail(req.user.email);
      if (!user?.github_access_token) {
        throw new AppError('No GitHub account linked', 400);
      }

      const repos = await fetchUserRepos(user.github_access_token);
      res.json({ repos });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/collab/:id/toggle
   */
  async toggleCollab(req, res, next) {
    try {
      const project = await CollabModel.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can change this', 403);

      const newStatus = !project.is_open_for_collab;
      await CollabModel.toggleCollab(project.id, newStatus);
      res.json({ is_open_for_collab: newStatus });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CollabController;
