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

const router = express.Router();

// Protect all routes
router.use(protect);

// Create task
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty()
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
router.patch('/:id/status', updateTaskStatus);

// Assign task to users
router.post('/:id/assign', assignTask);

module.exports = router;
