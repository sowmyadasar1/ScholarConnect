/**
 * Project Routes
 *
 * GET    /api/projects                      — List projects (filterable)
 * GET    /api/projects/cold-start           — Trending + beginner projects
 * GET    /api/projects/recommendations/me   — Personalized recommendations
 * GET    /api/projects/:id                  — Single project detail
 * GET    /api/projects/:id/skill-gaps       — Skill gap analysis
 * GET    /api/projects/:id/roadmap          — Week-by-week roadmap
 */

const router = require('express').Router();
const ProjectController = require('../controllers/project.controller');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/cold-start', ProjectController.coldStart);
router.get('/', ProjectController.list);
router.get('/:id', ProjectController.getById);

// Protected
router.post('/generate', authenticate, ProjectController.generate);
router.get('/recommendations/me', authenticate, ProjectController.getRecommendations);
router.post('/:id/apply', authenticate, ProjectController.apply);
router.get('/:id/skill-gaps', authenticate, ProjectController.getSkillGaps);
router.get('/:id/roadmap', authenticate, ProjectController.getRoadmap);
router.post('/:id/invite', authenticate, ProjectController.sendInvite);

module.exports = router;
