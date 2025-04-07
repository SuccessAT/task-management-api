const express = require('express');
const { check } = require('express-validator');
const { 
  createTask, 
  getTasks, 
  getTask, 
  updateTask, 
  deleteTask, 
  updateTaskStatus,
  assignTask
} = require('../controllers/tasks');
const { protect, authorize } = require('../middleware/auth');
const { handleValidationErrors } = require('../middleware/errorHandler');

const router = express.Router();

// Protect all routes
router.use(protect);

// Create task
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty(),
    handleValidationErrors
  ],
  createTask
);

// Get all tasks
router.get('/', getTasks);

// Get single task
router.get('/:id', getTask);

// Update task
router.put('/:id', updateTask);

// Delete task
router.delete('/:id', deleteTask);

// Update task status
router.patch(
  '/:id/status',
  [
    check('status', 'Status is required').isIn(['To Do', 'In Progress', 'Completed']),
    handleValidationErrors
  ],
  updateTaskStatus
);

// Assign task to users
router.post(
  '/:id/assign',
  [
    check('userIds', 'User IDs array is required').isArray(),
    check('userIds.*', 'Invalid user ID').isMongoId(),
    handleValidationErrors
  ],
  assignTask
);

module.exports = router;
