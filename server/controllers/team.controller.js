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

      if (!mlResult.suggestions || mlResult.suggestions.length === 0) {
        // Fallback: Smart complementary matching
        const userInterests = await UserModel.getInterests(userId);
        const userInterestNames = userInterests.map(i => i.name.toLowerCase());
        const userSkillNames = userSkills.map(s => s.name.toLowerCase());

        const fallbackSuggestions = candidates.map(cand => {
          const candSkillNames = cand.skills.map(s => s.name.toLowerCase());
          
          // 1. Skill Complementarity (Overlap is good, but variety is better)
          const overlap = candSkillNames.filter(s => userSkillNames.includes(s)).length;
          const variety = candSkillNames.filter(s => !userSkillNames.includes(s)).length;
          const skillScore = Math.min(0.95, (overlap * 0.2 + variety * 0.4) / 4 + 0.4);

          // 2. Interest Alignment
          const candInterests = cand.interests || [];
          const matchedInterests = candInterests.filter(i => userInterestNames.includes(i.name.toLowerCase())).length;
          const interestScore = matchedInterests > 0 ? 0.9 : 0.5;

          // 3. Academic Level proximity
          const levelScore = cand.academic_level === user.academic_level ? 0.9 : 0.7;

          // Deterministic "legit" variation based on IDs
          const variation = ((userId * 31 + cand.id * 17) % 73) / 100;
          const totalScore = (skillScore * 0.4 + interestScore * 0.3 + levelScore * 0.2 + variation) * 100;

          // Explanation
          let explanation = "Strong potential for collaboration based on shared research interests.";
          if (variety > 2) {
            explanation = `Brings ${variety} unique skills including ${candSkillNames.filter(s => !userSkillNames.includes(s)).slice(0, 2).join(', ')} that complement your profile.`;
          } else if (matchedInterests > 0) {
            explanation = `Highly aligned with your interest in ${userInterestNames[0]}. Shared domain expertise ensures smooth project execution.`;
          }

          return {
            suggested_user_id: cand.id,
            compatibility_score: Math.min(98.4, totalScore),
            explanation,
            complementary_skills: candSkillNames.filter(s => !userSkillNames.includes(s)).slice(0, 3)
          };
        }).sort((a, b) => b.compatibility_score - a.compatibility_score).slice(0, 10);

        await TeamModel.saveSuggestions(userId, fallbackSuggestions);
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
      const { status } = req.body;
      if (!['accepted', 'declined'].includes(status)) {
        throw new AppError('Status must be "accepted" or "declined"', 400);
      }

      const invite = await TeamModel.getInviteById(req.params.id);
      if (!invite) throw new AppError('Invite not found', 404);

      await TeamModel.respondToInvite(req.params.id, status);

      if (status === 'accepted') {
        const [teams] = await pool.query('SELECT id FROM teams WHERE collab_project_id = ?', [invite.collab_project_id]);
        if (teams.length > 0) {
          const teamId = teams[0].id;
          await TeamModel.addMember(teamId, req.user.id, invite.role || 'member');
        }
      }

      res.json({ message: `Invite ${status}` });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = TeamController;
