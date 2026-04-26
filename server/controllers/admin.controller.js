/**
 * Admin Controller
 *
 * Admin-only operations: manage projects, approve mentors,
 * view users, feedback, and system stats.
 */

const ProjectModel = require('../models/project.model');
const MentorModel = require('../models/mentor.model');
const UserModel = require('../models/user.model');
const SkillModel = require('../models/skill.model');
const FeedbackModel = require('../models/feedback.model');
const { pool } = require('../config/db');
const { AppError } = require('../middleware/errorHandler');

const AdminController = {
  /**
   * GET /api/admin/stats
   * Dashboard statistics.
   */
  async getStats(req, res, next) {
    try {
      const [[{ userCount }]] = await pool.query('SELECT COUNT(*) as userCount FROM users');
      const [[{ projectCount }]] = await pool.query('SELECT COUNT(*) as projectCount FROM projects WHERE is_active = 1');
      const [[{ mentorCount }]] = await pool.query('SELECT COUNT(*) as mentorCount FROM mentors WHERE is_approved = 1');
      const [[{ pendingMentors }]] = await pool.query('SELECT COUNT(*) as pendingMentors FROM mentors WHERE is_approved = 0');
      const [[{ teamCount }]] = await pool.query('SELECT COUNT(*) as teamCount FROM teams');
      const [[{ feedbackCount }]] = await pool.query('SELECT COUNT(*) as feedbackCount FROM feedback');

      res.json({
        stats: { userCount, projectCount, mentorCount, pendingMentors, teamCount, feedbackCount },
      });
    } catch (err) {
      next(err);
    }
  },

  // ----------- Project Management -----------

  /**
   * POST /api/admin/projects
   * Create a new project in the catalog.
   */
  async createProject(req, res, next) {
    try {
      const projectId = await ProjectModel.create({ ...req.body, created_by: req.user.id });

      // Add skills if provided
      if (req.body.skills) {
        for (const s of req.body.skills) {
          const skill = await SkillModel.findOrCreate(s.name, s.category || 'language');
          await ProjectModel.addSkill(projectId, skill.id, s.importance || 'required');
        }
      }

      // Add tech stack if provided
      if (req.body.tech_stack) {
        for (const t of req.body.tech_stack) {
          await ProjectModel.addTechStack(projectId, t.technology, t.role || 'other');
        }
      }

      // Add roadmap if provided
      if (req.body.roadmap) {
        await ProjectModel.saveRoadmap(projectId, req.body.roadmap);
      }

      const project = await ProjectModel.findById(projectId);
      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/projects/:id
   * Update a project.
   */
  async updateProject(req, res, next) {
    try {
      const { id } = req.params;
      const project = await ProjectModel.findById(id);
      if (!project) throw new AppError('Project not found', 404);

      await ProjectModel.update(id, req.body);
      const updated = await ProjectModel.findById(id);
      res.json({ project: updated });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/projects/:id
   * Soft-delete (deactivate) a project.
   */
  async deleteProject(req, res, next) {
    try {
      await ProjectModel.deactivate(req.params.id);
      res.json({ message: 'Project deactivated' });
    } catch (err) {
      next(err);
    }
  },

  // ----------- Mentor Management -----------

  /**
   * GET /api/admin/mentors/pending
   * List mentors awaiting approval.
   */
  async pendingMentors(req, res, next) {
    try {
      const mentors = await MentorModel.findAll({ approved: false });
      res.json({ mentors });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/mentors/:id/approve
   */
  async approveMentor(req, res, next) {
    try {
      await MentorModel.approve(req.params.id);
      res.json({ message: 'Mentor approved' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PUT /api/admin/mentors/:id/reject
   */
  async rejectMentor(req, res, next) {
    try {
      await MentorModel.reject(req.params.id);
      res.json({ message: 'Mentor rejected' });
    } catch (err) {
      next(err);
    }
  },

  // ----------- User Management -----------

  /**
   * GET /api/admin/users
   * List all users (paginated).
   */
  async listUsers(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await UserModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/admin/users/:id
   * Hard-delete a user.
   */
  async deleteUser(req, res, next) {
    try {
      const { id } = req.params;
      const user = await UserModel.findById(id);
      if (!user) throw new AppError('User not found', 404);
      if (user.is_admin) throw new AppError('Cannot delete an admin', 403);

      await pool.query('DELETE FROM users WHERE id = ?', [id]);
      res.json({ message: 'User deleted successfully' });
    } catch (err) {
      next(err);
    }
  },

  // ----------- Feedback Management -----------

  /**
   * GET /api/admin/feedback
   * View all feedback (paginated).
   */
  async listFeedback(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await FeedbackModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // ----------- Skill Management -----------

  /**
   * GET /api/admin/skills
   * List all skills in the master table.
   */
  async listSkills(req, res, next) {
    try {
      const skills = await SkillModel.findAll();
      res.json({ skills });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/admin/skills
   * Add a new skill to the master table.
   */
  async createSkill(req, res, next) {
    try {
      const { name, category } = req.body;
      const existing = await SkillModel.findByName(name);
      if (existing) throw new AppError('Skill already exists', 409);

      const id = await SkillModel.create({ name, category });
      res.status(201).json({ skill: { id, name, category } });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = AdminController;
