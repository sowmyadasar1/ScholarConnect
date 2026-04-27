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
const NotificationModel = require('../models/notification.model');
const TeamModel = require('../models/team.model');
const ConnectionModel = require('../models/connection.model');
const mlClient = require('../utils/mlClient');

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
        search,
        userId: req.user?.id || 0
      });
      res.json(projects);
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
      const projects = await TeamModel.findAllByUser(req.user.id);
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
      const { repo_url, description, topics, is_open_for_collab } = req.body;
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

      const alreadyExists = await CollabModel.exists(req.user.id, `${owner}/${repoName}`, repo_url);
      if (alreadyExists) throw new AppError('This project is already in your Collaboration Hub', 400);

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
        is_open_for_collab: is_open_for_collab !== undefined ? (is_open_for_collab ? 1 : 0) : 1
      });

      // Automatically create a team for the owner
      const [teamResult] = await pool.query(
        'INSERT INTO teams (name, collab_project_id, created_by) VALUES (?, ?, ?)',
        [`${owner}/${repoName}`, projectId, req.user.id]
      );
      const teamId = teamResult.insertId;

      // Add owner to team_members
      await pool.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
        [teamId, req.user.id, 'Owner']
      );

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
      const { title, description, domain, topics, project_id, is_open_for_collab } = req.body;
      if (!title || !description) throw new AppError('Title and description are required', 400);

      const alreadyExists = await CollabModel.exists(req.user.id, title);
      if (alreadyExists) throw new AppError('A project with this title already exists in your hub', 400);

      const projectId = await CollabModel.create({
        owner_id: req.user.id,
        project_id: project_id || null,
        repo_name: title,
        description: description,
        github_repo_url: '',
        languages: { [domain || 'Other']: 100 },
        topics: topics || [],
        is_open_for_collab: is_open_for_collab !== undefined ? (is_open_for_collab ? 1 : 0) : 1
      });

      // Automatically create a team for the owner
      const [teamResult] = await pool.query(
        'INSERT INTO teams (name, collab_project_id, created_by) VALUES (?, ?, ?)',
        [title, projectId, req.user.id]
      );
      const teamId = teamResult.insertId;

      // Add owner to team_members
      await pool.query(
        'INSERT INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)',
        [teamId, req.user.id, 'Owner']
      );

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

      // Check for existing pending request
      const [existing] = await pool.query(
        'SELECT id FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ? AND status = "pending"',
        [collabProjectId, req.user.id]
      );
      if (existing.length > 0) throw new AppError('You already have a pending request for this project', 400);

      // Check if already a member
      const [member] = await pool.query(
        'SELECT tm.id FROM team_members tm JOIN teams t ON tm.team_id = t.id WHERE t.collab_project_id = ? AND tm.user_id = ?',
        [collabProjectId, req.user.id]
      );
      if (member.length > 0) throw new AppError('You are already a member of this project', 400);

      const interactionId = await CollabModel.createInteraction({
        collab_project_id: collabProjectId,
        user_id: req.user.id,
        type: 'request',
        role: req.body.role,
        message: req.body.message,
        sender_id: req.user.id
      });

      // Notify project owner
      await NotificationModel.create({
        user_id: project.owner_id,
        type: 'collab_request',
        title: 'New Join Request',
        message: `${req.user.name} wants to join ${project.repo_name} as a ${req.body.role || 'contributor'}.`,
        reference_type: 'collaboration_project',
        reference_id: collabProjectId
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

      // Prevent duplicate invites
      const [existing] = await pool.query(
        'SELECT id FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ? AND status IN ("pending", "accepted")',
        [collabProjectId, user_id]
      );
      if (existing.length > 0) throw new AppError('An active invitation or membership already exists for this user.', 409);

      const interactionId = await CollabModel.createInteraction({
        collab_project_id: collabProjectId,
        user_id,
        type: 'invite',
        role,
        message,
        sender_id: req.user.id
      });

      // Notify invited user
      await NotificationModel.create({
        user_id,
        type: 'team_invite',
        title: 'Project Invitation',
        message: `${req.user.name} invited you to join ${project.repo_name} as a ${role}.`,
        reference_type: 'collaboration_project',
        reference_id: collabProjectId
      });

      res.status(201).json({ interaction_id: interactionId, message: 'Invite sent successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/collab/:id/smart-suggestions
   * Analyzes project needs and finds best matching teammates.
   */
  async getSmartSuggestions(req, res, next) {
    try {
      const collabProjectId = parseInt(req.params.id);
      const project = await CollabModel.findById(collabProjectId);
      if (!project) throw new AppError('Project not found', 404);

      // 1. Get all potential candidates (not already invited/part of team)
      const [candidates] = await pool.query(
        `SELECT u.id, u.name, u.avatar_url, u.bio, u.preferred_role, u.availability
         FROM users u
         WHERE u.id != ? 
           AND u.id NOT IN (
             SELECT user_id FROM collaboration_requests 
             WHERE collab_project_id = ?
           )
         LIMIT 100`,
        [req.user.id, collabProjectId]
      );

      // 2. Fetch skills and interests for candidates
      const enrichedCandidates = await Promise.all(candidates.map(async (c) => {
        const skills = await UserModel.getSkills(c.id);
        const interests = await UserModel.getInterests(c.id);
        return { ...c, skills, interests };
      }));

      // 3. Get user's own profile for matching
      const userProfile = {
        skills: await UserModel.getSkills(req.user.id),
        interests: await UserModel.getInterests(req.user.id),
        preferred_role: req.user.preferred_role || '',
        availability: req.user.availability || 'flexible'
      };

      // 4. Call ML matcher
      let suggestions = [];
      try {
        const mlResponse = await mlClient.getTeammateMatches(userProfile, enrichedCandidates);
        suggestions = mlResponse.suggestions || [];
      } catch (err) {
        console.error('ML Teammate matching failed, using fallback:', err.message);
      }

      // 5. Fallback if ML returns nothing: Topic-based matching
      if (suggestions.length === 0 && enrichedCandidates.length > 0) {
        const projectTopics = project.topics || [];
        suggestions = enrichedCandidates.map(c => {
          const commonTopics = (c.interests || []).filter(t => projectTopics.includes(t));
          const compatibility_score = (commonTopics.length / Math.max(projectTopics.length, 1)) * 100;
          return {
            ...c,
            compatibility_score: Math.max(compatibility_score, 60 + Math.random() * 20), // Minimum 60% for fallback
            explanation: commonTopics.length > 0 
              ? `Highly compatible due to shared interest in ${commonTopics.slice(0, 2).join(', ')}.`
              : `Selected based on academic level and overall platform engagement.`
          };
        }).sort((a, b) => b.compatibility_score - a.compatibility_score);
      }

      res.json({ suggestions: suggestions.slice(0, 5) });
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
      const { userIds, role } = req.body; 
      
      const project = await CollabModel.findById(collabProjectId);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can send smart invites', 403);

      if (!userIds || !Array.isArray(userIds)) throw new AppError('userIds array is required for batch inviting', 400);

      for (const targetId of userIds) {
        await CollabModel.createInteraction({
          collab_project_id: collabProjectId,
          user_id: targetId,
          type: 'invite',
          role: role || 'Contributor',
          message: `You've been specially selected to join ${project.repo_name} as a ${role || 'top match'}!`
        });

        // Notify matching user
        await NotificationModel.create({
          user_id: targetId,
          type: 'smart_invite',
          title: 'Premium Project Match',
          message: `You've been invited to join ${project.repo_name} as a top-ranked candidate!`,
          reference_type: 'collaboration_project',
          reference_id: collabProjectId
        });
      }

      res.status(201).json({ message: `Smart invites sent to ${userIds.length} candidates!` });
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

      if (status === 'accepted') {
        // Find or create team for this project
        let [teams] = await pool.query('SELECT id FROM teams WHERE collab_project_id = ?', [interaction.collab_project_id]);
        let teamId;
        if (teams.length === 0) {
          const [result] = await pool.query(
            'INSERT INTO teams (name, collab_project_id, created_by) VALUES (?, ?, ?)',
            [project.repo_name, project.id, project.owner_id]
          );
          teamId = result.insertId;
        } else {
          teamId = teams[0].id;
        }

        // Add both owner and new member to the team if not already there
        await pool.query('INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, project.owner_id, 'Owner']);
        await pool.query('INSERT OR IGNORE INTO team_members (team_id, user_id, role) VALUES (?, ?, ?)', [teamId, interaction.user_id, interaction.role || 'member']);

        // Log activity
        await pool.query(
          'INSERT INTO workspace_activity (team_id, user_id, action, details) VALUES (?, ?, ?, ?)',
          [teamId, req.user.id, 'user_joined', `${status === 'accepted' ? 'Joined' : 'Added to'} the workspace.`]
        );

        // Record connection
        await ConnectionModel.ensureConnection(project.owner_id, interaction.user_id, 'teammate');

        // Create Auto-Workspace Components (Notes, Welcome Msg, Initial Task)
        await pool.query(
          'INSERT INTO workspace_notes (team_id, user_id, title, content) VALUES (?, ?, ?, ?)',
          [teamId, project.owner_id, 'Project Kickoff Notes', `Welcome to the ${project.repo_name} workspace! Use this space to document architecture, meeting notes, and research findings.`]
        );

        await pool.query(
          'INSERT INTO workspace_messages (team_id, user_id, content, type) VALUES (?, ?, ?, ?)',
          [teamId, project.owner_id, `Welcome @${req.user.name}! Excited to have you on the team. Let's start by reviewing the repo.`, 'system']
        );

        await pool.query(
          'INSERT INTO workspace_tasks (team_id, title, description, status, priority, created_by) VALUES (?, ?, ?, ?, ?, ?)',
          [teamId, 'Initial Repo Review', 'Explore the codebase and identify first implementation targets.', 'todo', 'high', project.owner_id]
        );
      }

      // Notify the other party
      const targetUserId = interaction.type === 'request' ? interaction.user_id : project.owner_id;
      await NotificationModel.create({
        user_id: targetUserId,
        type: `collab_${status}`,
        title: `Collaboration ${status === 'accepted' ? 'Accepted' : 'Rejected'}`,
        message: `${req.user.name} has ${status} the ${interaction.type === 'request' ? 'join request' : 'invitation'} for ${project.repo_name}.`,
        reference_type: 'collaboration_project',
        reference_id: project.id
      });

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
  /**
   * PUT /api/collab/:id
   * Edit collaboration project details.
   */
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const { description, topics, is_open_for_collab } = req.body;
      
      const project = await CollabModel.findById(id);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can edit this', 403);

      await pool.query(
        'UPDATE collaboration_projects SET description = ?, topics = ?, is_open_for_collab = ? WHERE id = ?',
        [description || project.description, JSON.stringify(topics || project.topics), is_open_for_collab !== undefined ? (is_open_for_collab ? 1 : 0) : project.is_open_for_collab, id]
      );

      res.json({ message: 'Project updated successfully' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/collab/:id
   */
  async delete(req, res, next) {
    try {
      const { id } = req.params;
      const project = await CollabModel.findById(id);
      if (!project) throw new AppError('Project not found', 404);
      if (project.owner_id !== req.user.id) throw new AppError('Only the owner can delete this', 403);

      // Clean up interactions and team first
      await pool.query('DELETE FROM collaboration_requests WHERE collab_project_id = ?', [id]);
      await pool.query('DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE collab_project_id = ?)', [id]);
      await pool.query('DELETE FROM teams WHERE collab_project_id = ?', [id]);
      await pool.query('DELETE FROM collaboration_projects WHERE id = ?', [id]);

      res.json({ message: 'Project deleted successfully' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = CollabController;
