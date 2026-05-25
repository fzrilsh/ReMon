const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

router.get('/unread', requireAuth, notificationController.getUnread);
router.patch('/:id/read', requireAuth, notificationController.markAsRead);
router.patch('/read-all', requireAuth, notificationController.markAllAsRead);

module.exports = router;
