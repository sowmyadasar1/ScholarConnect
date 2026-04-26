/**
 * Team Routes
 *
 * POST   /api/teams                    — Create team
 * GET    /api/teams/my                 — My teams
 * GET    /api/teams/suggestions/me     — Teammate suggestions
 * GET    /api/teams/invites/me         — My pending invites
 * GET    /api/teams/:id                — Team detail + members
 * POST   /api/teams/:id/members        — Add member
 * POST   /api/teams/:id/assign-roles   — Auto-assign roles
 * POST   /api/teams/invite             — Send invite
 * PUT    /api/teams/invites/:id/respond — Accept/decline invite
 */

const router = require('express').Router();
const TeamController = require('../controllers/team.controller');
const { authenticate } = require('../middleware/auth');

// All team routes require auth
router.use(authenticate);

router.post('/', TeamController.create);
router.get('/my', TeamController.myTeams);
router.get('/suggestions/me', TeamController.getSuggestions);
router.get('/invites/me', TeamController.myInvites);
router.get('/:id', TeamController.getById);
router.post('/:id/members', TeamController.addMember);
router.post('/:id/assign-roles', TeamController.assignRoles);
router.post('/invite', TeamController.sendInvite);
router.put('/invites/:id/respond', TeamController.respondToInvite);

module.exports = router;
