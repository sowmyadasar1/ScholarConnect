/**
 * Project Controller
 *
 * Handles project browsing, recommendations, skill gaps, and roadmaps.
 * The heavy computation is delegated to the Python ML service;
 * this controller orchestrates the data flow.
 */

const ProjectModel = require('../models/project.model');
const UserModel = require('../models/user.model');
const { pool } = require('../config/db');
const mlClient = require('../utils/mlClient');
const { AppError } = require('../middleware/errorHandler');

const ProjectController = {
  /**
   * GET /api/projects
   * Browse all active projects with optional filters.
   */
  async list(req, res, next) {
    try {
      const { page, limit, domain, difficulty, search } = req.query;
      const result = await ProjectModel.findAll({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        domain,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
        search
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/:id
   * Get single project with skills, tech stack, and roadmap.
   */
  async getById(req, res, next) {
    try {
      const project = await ProjectModel.findById(req.params.id);
      if (!project) throw new AppError('Project not found', 404);

      const skills = await ProjectModel.getSkills(project.id);
      const techStack = await ProjectModel.getTechStack(project.id);
      const roadmap = await ProjectModel.getRoadmap(project.id);

      // Check if this project is already in the collaboration hub
      const { pool } = require('../config/db');
      const [collabRows] = await pool.query('SELECT id, owner_id FROM collaboration_projects WHERE project_id = ?', [project.id]);
      const collabProject = collabRows[0];

      res.json({ 
        project, 
        skills, 
        techStack, 
        roadmap,
        hub: collabProject ? { id: collabProject.id, owner_id: collabProject.owner_id } : null
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/recommendations/me
   * Get personalized project recommendations.
   *
   * Flow:
   * 1. Fetch user skills + interests + academic level
   * 2. Fetch all active projects with their required skills
   * 3. Send to ML service for scoring
   * 4. Save recommendations to DB
   * 5. Return ranked list with explanations
   */
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const user = await UserModel.findById(userId);
      const userSkills = await UserModel.getSkills(userId);
      const userInterests = await UserModel.getInterests(userId);

      // Cold start: if no skills or interests, return trending/beginner
      if (userSkills.length === 0 && userInterests.length === 0) {
        const trending = await ProjectModel.getTrending(5);
        const beginner = await ProjectModel.getBeginnerFriendly(5);
        return res.json({
          recommendations: [],
          cold_start: true,
          trending,
          beginner_friendly: beginner,
          message: 'Add skills or connect GitHub to get personalized recommendations.',
        });
      }

      // Fetch all active projects with their skills
      const { projects } = await ProjectModel.findAll({ limit: 100 });
      const projectsWithSkills = await Promise.all(
        projects.map(async (p) => {
          const skills = await ProjectModel.getSkills(p.id);
          return { ...p, required_skills: skills };
        })
      );

      // Call ML service
      const mlResult = await mlClient.getRecommendations({
        user_skills: userSkills.map((s) => ({ name: s.name, proficiency: s.proficiency })),
        user_interests: userInterests.map((i) => i.name),
        academic_level: user.academic_level,
        projects: projectsWithSkills,
      });

      // If ML service is down, fall back to trending
      if (mlResult.fallback) {
        const trending = await ProjectModel.getTrending(10);
        return res.json({
          recommendations: [],
          cold_start: false,
          trending,
          message: 'Recommendation engine temporarily unavailable. Showing trending projects.',
        });
      }

      // Save and return
      await ProjectModel.saveRecommendations(userId, mlResult.recommendations);
      const recommendations = await ProjectModel.getRecommendations(userId);
      res.json({ recommendations, cold_start: false });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/projects/generate
   * Generates AI project recommendations based on natural language query.
   */
  async generate(req, res, next) {
    try {
      const { query } = req.body;
      const userId = req.user.id;
      const userSkills = await UserModel.getSkills(userId);
      const projects = await ProjectModel.findAll({ limit: 100 }); // fetch top 100 projects
      
      const mlResult = await mlClient.generateAiProjects(
        query, 
        userSkills.map(s => ({ name: s.name, proficiency: s.proficiency })),
        projects.projects
      );
      
      if (mlResult.fallback) {
        return res.json({ recommendations: [], message: 'AI Generator unavailable.' });
      }

      res.json({ recommendations: mlResult.recommendations, cold_start: false });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/:id/skill-gaps
   * Identify skills the user lacks for a specific project.
   */
  async getSkillGaps(req, res, next) {
    try {
      const projectId = parseInt(req.params.id);
      const userId = req.user.id;

      const projectSkills = await ProjectModel.getSkills(projectId);
      const userSkills = await UserModel.getSkills(userId);
      const userSkillNames = new Set(userSkills.map((s) => s.name.toLowerCase()));

      // Simple gap detection: project needs it, user doesn't have it
      const gaps = projectSkills
        .filter((ps) => !userSkillNames.has(ps.name.toLowerCase()))
        .map((ps) => ({
          skill_id: ps.skill_id,
          skill_name: ps.name,
          importance: ps.importance,
          suggested_path: `Learn basics of ${ps.name} → Practice with small projects → Apply to this project`,
        }));

      // Save gaps for reference
      await ProjectModel.saveSkillGaps(userId, projectId, gaps);

      res.json({
        project_id: projectId,
        gaps,
        message: gaps.length === 0
          ? 'You have all required skills for this project!'
          : `You lack ${gaps.length} skill(s). See suggested learning paths below.`,
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/:id/roadmap
   * Get week-by-week plan for a project.
   */
  async getRoadmap(req, res, next) {
    try {
      const projectId = parseInt(req.params.id);
      const project = await ProjectModel.findById(projectId);
      if (!project) throw new AppError('Project not found', 404);

      let roadmap = await ProjectModel.getRoadmap(projectId);
      
      // If no roadmap exists, generate one based on project difficulty and domain
      if (!roadmap || roadmap.length === 0) {
        const difficulty = project.difficulty_level <= 2 ? 'Beginner' : project.difficulty_level <= 4 ? 'Intermediate' : 'Advanced';
        const weeks = project.estimated_weeks || (difficulty === 'Beginner' ? 4 : difficulty === 'Intermediate' ? 8 : 12);
        
        const generatedRoadmap = [];
        for (let i = 1; i <= weeks; i++) {
          generatedRoadmap.push({
            week_number: i,
            title: `Week ${i}: ${i === 1 ? 'Foundations & Setup' : i === weeks ? 'Final Polish & Deployment' : 'Implementation Phase'}`,
            description: `Core tasks for ${project.domain} project development at ${difficulty} level.`,
            deliverables: i % 2 === 0 ? 'Code Checkpoint' : 'Documentation'
          });
        }
        
        await ProjectModel.saveRoadmap(projectId, generatedRoadmap);
        roadmap = await ProjectModel.getRoadmap(projectId);
      }

      res.json({ 
        project_id: projectId, 
        title: project.title, 
        difficulty: project.difficulty_level,
        weeks: project.estimated_weeks, 
        roadmap 
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/projects/cold-start
   * Trending + beginner-friendly projects for users without data.
   */
  async coldStart(req, res, next) {
    try {
      const trending = await ProjectModel.getTrending(10);
      const beginner = await ProjectModel.getBeginnerFriendly(10);
      res.json({ trending, beginner_friendly: beginner });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/projects/:id/apply
   * Apply to a project. Creates a collaboration request.
   */
  async apply(req, res, next) {
    try {
      const projectId = parseInt(req.params.id);
      const requesterId = req.user.id;
      const { message, role } = req.body;

      const project = await ProjectModel.findById(projectId);
      if (!project) throw new AppError('Project not found', 404);

      // 1. Find the linked collaboration project
      const [collabRows] = await pool.query('SELECT id FROM collaboration_projects WHERE project_id = ?', [projectId]);
      const collabProject = collabRows[0];
      
      if (!collabProject) {
        throw new AppError('This project is not currently open for collaboration in the hub.', 400);
      }

      // 2. Prevent duplicate applications
      const [existing] = await pool.query(
        'SELECT id FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ?',
        [collabProject.id, requesterId]
      );
      if (existing.length > 0) throw new AppError('You have already applied to this project', 400);

      // 3. Insert correct fields
      await pool.query(
        'INSERT INTO collaboration_requests (collab_project_id, user_id, sender_id, type, role, message) VALUES (?, ?, ?, ?, ?, ?)',
        [collabProject.id, requesterId, requesterId, 'request', role || 'contributor', message || '']
      );

      res.status(201).json({ message: 'Application submitted successfully!' });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/projects/:id/invite
   * Invite a user to a project.
   */
  async sendInvite(req, res, next) {
    try {
      const projectId = parseInt(req.params.id);
      const inviterId = req.user.id;
      const { invitee_id, role, message } = req.body;

      if (!invitee_id) throw new AppError('Invitee ID is required', 400);

      // 1. Find the linked collaboration project
      const [collabRows] = await pool.query('SELECT id FROM collaboration_projects WHERE project_id = ?', [projectId]);
      const collabProject = collabRows[0];
      
      if (!collabProject) {
        throw new AppError('This project is not currently open for collaboration in the hub.', 400);
      }

      // 2. Prevent duplicate invites
      const [existing] = await pool.query(
        'SELECT id FROM collaboration_requests WHERE collab_project_id = ? AND user_id = ? AND type = "invite" AND status = "pending"',
        [collabProject.id, invitee_id]
      );
      if (existing.length > 0) throw new AppError('An invite is already pending for this user', 400);

      // 3. Insert into collaboration_requests
      await pool.query(
        'INSERT INTO collaboration_requests (collab_project_id, user_id, sender_id, type, role, message) VALUES (?, ?, ?, ?, ?, ?)',
        [collabProject.id, invitee_id, inviterId, 'invite', role || 'Member', message || '']
      );

      res.status(201).json({ message: 'Invite sent successfully!' });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = ProjectController;
