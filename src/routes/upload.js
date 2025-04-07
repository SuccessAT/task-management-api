const express = require('express');
const path = require('path');
const upload = require('../middleware/upload');
const Task = require('../models/Task');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// @desc    Upload image for a task
// @route   POST /api/upload/:taskId
// @access  Private
router.post('/:taskId', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload an image file'
      });
    }

    const task = await Task.findById(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Make sure user is task creator or admin
    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to upload image for this task'
      });
    }

    // Update task with image URL
    const imageUrl = `/uploads/${req.file.filename}`;
    
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.taskId,
      { imageUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        imageUrl,
        task: updatedTask
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
