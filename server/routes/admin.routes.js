/**
 * Admin Routes
 *
 * All routes use AdminController. Protected by authenticate + requireAdmin.
 *
 * GET    /api/admin/stats                — Platform statistics
 * GET    /api/admin/users                — List all users
 * GET    /api/admin/mentors/pending      — List pending mentor approvals
 * PUT    /api/admin/mentors/:id/approve  — Approve a mentor
 * PUT    /api/admin/mentors/:id/reject   — Reject a mentor
 * POST   /api/admin/projects             — Create a project
 * PUT    /api/admin/projects/:id         — Update a project
 * DELETE /api/admin/projects/:id         — Deactivate a project
 * GET    /api/admin/feedback             — View all feedback
 * GET    /api/admin/skills               — List all skills
 * POST   /api/admin/skills               — Add a skill
 */

const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');
const AdminController = require('../controllers/admin.controller');

// All admin routes require auth + admin role
router.use(authenticate);
router.use(requireAdmin);

// Stats
router.get('/stats', AdminController.getStats);

// User management
router.get('/users', AdminController.listUsers);
router.put('/users/:id/role', AdminController.updateUserRole);
router.delete('/users/:id', AdminController.deleteUser);

// Mentor management
router.get('/mentors/pending', AdminController.pendingMentors);
router.put('/mentors/:id/approve', AdminController.approveMentor);
router.put('/mentors/:id/reject', AdminController.rejectMentor);

// Project management
router.post('/projects', AdminController.createProject);
router.put('/projects/:id', AdminController.updateProject);
router.delete('/projects/:id', AdminController.deleteProject);

// Feedback
router.get('/feedback', AdminController.listFeedback);

// Skills
router.get('/skills', AdminController.listSkills);
router.post('/skills', AdminController.createSkill);

module.exports = router;
