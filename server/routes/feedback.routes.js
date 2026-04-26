/**
 * Feedback Routes
 *
 * POST   /api/feedback     — Submit rating
 * GET    /api/feedback/my  — My feedback history
 */

const router = require('express').Router();
const FeedbackController = require('../controllers/feedback.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', FeedbackController.submit);
router.get('/my', FeedbackController.myFeedback);

module.exports = router;
