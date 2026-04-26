/**
 * Request Routes
 *
 * Unified request management across collab, mentor, and team requests.
 */

const router = require('express').Router();
const RequestController = require('../controllers/request.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/sent', RequestController.getSentRequests);
router.get('/received', RequestController.getReceivedRequests);
router.put('/:id/respond', RequestController.respondToRequest);

module.exports = router;
