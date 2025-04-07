const express = require('express');
const { 
  getNotifications, 
  markAsRead, 
  markAllAsRead 
} = require('../controllers/notifications');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get all notifications for current user
router.get('/', getNotifications);

// Mark notification as read
router.put('/:id', markAsRead);

// Mark all notifications as read
router.put('/read-all', markAllAsRead);

module.exports = router;
