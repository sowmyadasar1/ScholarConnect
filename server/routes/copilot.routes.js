/**
 * Copilot Routes
 *
 * POST /api/copilot/:projectId — Generate AI analysis
 * Body: { action: 'architecture' | 'tech_stack' | 'readme' | 'milestones' | 'risks' | 'roles' }
 */

const router = require('express').Router();
const CopilotController = require('../controllers/copilot.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/:projectId', CopilotController.generate);

module.exports = router;
