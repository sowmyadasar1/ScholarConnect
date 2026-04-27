/**
 * Reputation Routes
 *
 * GET  /api/reputation/leaderboard   — Top users
 * GET  /api/reputation/:userId       — User reputation + badges
 * POST /api/reputation/award         — Award points (internal)
 */

const router = require('express').Router();
const ReputationController = require('../controllers/reputation.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/leaderboard', ReputationController.leaderboard);
router.get('/:userId', ReputationController.getReputation);
router.post('/award', ReputationController.award);

module.exports = router;
