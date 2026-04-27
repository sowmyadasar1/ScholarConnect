/**
 * Network Routes
 */

const router = require('express').Router();
const NetworkController = require('../controllers/network.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/collaborators', NetworkController.getCollaborators);
router.get('/mentors', NetworkController.getMentors);
router.get('/suggestions/:projectId', NetworkController.getInviteSuggestions);

router.post('/invite-collaborator', NetworkController.inviteCollaborator);
router.post('/invite-mentor', NetworkController.inviteMentor);

module.exports = router;
