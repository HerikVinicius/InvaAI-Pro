const express = require('express');
const { protect } = require('../middlewares/auth');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification } = require('../controllers/notificationsController');

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.post('/:id/read', markAsRead);
router.post('/read-all', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
