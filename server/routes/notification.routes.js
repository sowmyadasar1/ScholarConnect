/**
 * Notification Routes
 *
 * All routes are protected (require JWT).
 */

const router = require('express').Router();
const NotificationController = require('../controllers/notification.controller');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/me', NotificationController.getMyNotifications);
router.get('/unread-count', NotificationController.getUnreadCount);
router.put('/read-all', NotificationController.markAllAsRead);
router.put('/:id/read', NotificationController.markAsRead);

module.exports = router;
