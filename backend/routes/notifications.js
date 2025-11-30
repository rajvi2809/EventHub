const express = require('express');
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.use(auth);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);

module.exports = router;
