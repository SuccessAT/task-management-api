const Notification = require('../models/Notification');
const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort('-createdAt')
      .populate({
        path: 'taskId',
        select: 'title status priority dueDate'
      });

    res.status(200).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    let notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Make sure notification belongs to user
    if (notification.userId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Create notification (internal use only)
// @access  Private
exports.createNotification = async (userId, taskId, message) => {
  try {
    await Notification.create({
      userId,
      taskId,
      message
    });
    return true;
  } catch (err) {
    console.error('Error creating notification:', err);
    return false;
  }
};
