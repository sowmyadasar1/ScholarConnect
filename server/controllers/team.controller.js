/**
 * Team Controller
 *
 * Handles team creation, teammate matching, role assignment, and invites.
 */

const TeamModel = require('../models/team.model');
const UserModel = require('../models/user.model');
const mlClient = require('../utils/mlClient');
const { AppError } = require('../middleware/errorHandler');

// Map academic level to a numeric value for role assignment tie-breaking
const ROLE_PRIORITY = { frontend: 1, backend: 2, fullstack: 3, ml: 4, devops: 5, design: 6 };

const TeamController = {
  /**
   * POST /api/teams
   * Create a new team. Creator is auto-added as first member.
   */
  async create(req, res, next) {
    try {
      const { name, project_id, max_members } = req.body;
      const teamId = await TeamModel.create(name, project_id || null, req.user.id, max_members || 4);
      const team = await TeamModel.findById(teamId);
      res.status(201).json({ team });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teams/my
   * Get all teams the current user belongs to.
   */
  async myTeams(req, res, next) {
    try {
      const teams = await TeamModel.findByUser(req.user.id);
      res.json({ teams });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teams/:id
   * Get team details with members.
   */
  async getById(req, res, next) {
    try {
      const team = await TeamModel.findById(req.params.id);
      if (!team) throw new AppError('Team not found', 404);

      const members = await TeamModel.getMembers(team.id);
      res.json({ team, members });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teams/suggestions/me
   * Get teammate suggestions based on complementary skills.
   */
  async getSuggestions(req, res, next) {
    try {
      const userId = req.user.id;
      const userSkills = await UserModel.getSkills(userId);
      const user = await UserModel.findById(userId);

      // Get all other users with their skills (candidates)
      const { users: allUsers } = await UserModel.findAll({ page: 1, limit: 100 });
      const candidates = [];

      for (const u of allUsers) {
        if (u.id === userId) continue;
        const skills = await UserModel.getSkills(u.id);
        candidates.push({ ...u, skills });
      }

      // Call ML service for complementary matching
      const mlResult = await mlClient.getTeammateMatches(
        { ...user, skills: userSkills },
        candidates
      );

      if (mlResult.suggestions && mlResult.suggestions.length > 0) {
        await TeamModel.saveSuggestions(userId, mlResult.suggestions);
      }

      const suggestions = await TeamModel.getSuggestions(userId);
      res.json({ suggestions });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/teams/:id/members
   * Add a member to a team.
   */
  async addMember(req, res, next) {
    try {
      const teamId = parseInt(req.params.id);
      const { user_id } = req.body;

      const full = await TeamModel.isFull(teamId);
      if (full) throw new AppError('Team is full', 409);

      await TeamModel.addMember(teamId, user_id);
      const members = await TeamModel.getMembers(teamId);
      res.json({ message: 'Member added', members });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/teams/:id/assign-roles
   * Auto-assign roles based on each member's strongest skills.
   *
   * Logic: for each member, look at their preferred_role and skills,
   * then assign the best-fit role that hasn't been taken yet.
   */
  async assignRoles(req, res, next) {
    try {
      const teamId = parseInt(req.params.id);
      const members = await TeamModel.getMembers(teamId);

      // Enrich members with their skills
      const enriched = await Promise.all(
        members.map(async (m) => {
          const skills = await UserModel.getSkills(m.user_id);
          return { ...m, skills };
        })
      );

      // Simple role assignment: preferred_role first, then greedy by skill count
      const availableRoles = new Set(['frontend', 'backend', 'ml', 'devops', 'design']);
      const assignments = [];

      // First pass: assign preferred roles where possible
      for (const member of enriched) {
        if (member.preferred_role && availableRoles.has(member.preferred_role)) {
          assignments.push({ user_id: member.user_id, role: member.preferred_role });
          availableRoles.delete(member.preferred_role);
        }
      }

      // Second pass: assign remaining members to remaining roles
      const unassigned = enriched.filter((m) => !assignments.find((a) => a.user_id === m.user_id));
      for (const member of unassigned) {
        const role = availableRoles.values().next().value || 'fullstack';
        assignments.push({ user_id: member.user_id, role });
        availableRoles.delete(role);
      }

      // Save assignments
      for (const a of assignments) {
        await TeamModel.assignRole(teamId, a.user_id, a.role);
      }

      const updatedMembers = await TeamModel.getMembers(teamId);
      res.json({ message: 'Roles assigned', members: updatedMembers });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/teams/invite
   * Send an invite to a teammate.
   */
  async sendInvite(req, res, next) {
    try {
      const { receiver_id, team_id, collab_project_id, message } = req.body;
      const inviteId = await TeamModel.createInvite(req.user.id, receiver_id, team_id, collab_project_id, message);
      res.status(201).json({ invite_id: inviteId, message: 'Invite sent' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/teams/invites/me
   * Get pending invites for the current user.
   */
  async myInvites(req, res, next) {
    try {
      const invites = await TeamModel.getInvitesForUser(req.user.id);
      res.json({ invites });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/teams/invites/:id/respond
   * Accept or decline an invite.
   */
  async respondToInvite(req, res, next) {
    try {
      const { status } = req.body; // 'accepted' or 'declined'
      if (!['accepted', 'declined'].includes(status)) {
        throw new AppError('Status must be "accepted" or "declined"', 400);
      }

      await TeamModel.respondToInvite(req.params.id, status);

      // If accepted and there's a team_id, add user to team
      if (status === 'accepted') {
        // TODO: fetch invite, get team_id, add member
      }

      res.json({ message: `Invite ${status}` });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TeamController;
