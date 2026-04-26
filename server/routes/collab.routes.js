/**
 * Collaboration Routes
 *
 * GET    /api/collab                         — List open projects
 * GET    /api/collab/my                      — My imported projects
 * GET    /api/collab/github/repos            — List GitHub repos (for import UI)
 * GET    /api/collab/:id                     — Project detail + requests
 * POST   /api/collab/import                  — Import a GitHub repo
 * PUT    /api/collab/:id/toggle              — Toggle collaboration status
 * POST   /api/collab/:id/request             — Request to join
 * PUT    /api/collab/requests/:requestId/respond — Accept/reject request
 */

const router = require('express').Router();
const CollabController = require('../controllers/collab.controller');
const { authenticate } = require('../middleware/auth');

// Public
router.get('/', CollabController.list);

// Protected
router.use(authenticate);
router.get('/my', CollabController.myProjects);
router.get('/invites/me', CollabController.getMyInvites);
router.get('/github/repos', CollabController.listGithubRepos);
router.get('/:id', CollabController.getById);
router.post('/import', CollabController.importRepo);
router.post('/manual', CollabController.createManual);
router.put('/:id/toggle', CollabController.toggleCollab);
router.post('/:id/request', CollabController.requestToJoin);
router.post('/:id/invite', CollabController.inviteUser);
router.post('/:id/auto-invite', CollabController.autoInviteRole);
router.put('/interactions/:interactionId/respond', CollabController.respondToInteraction);

module.exports = router;
