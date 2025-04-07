const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('./notifications');
const { validationResult } = require('express-validator');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { title, description, status, priority, dueDate, assignedTo } = req.body;

    // Create task with user as creator
    const task = await Task.create({
      title,
      description,
      status: status || 'To Do',
      priority: priority || 'Medium',
      dueDate,
      createdBy: req.user.id,
      assignedTo: assignedTo || []
    });

    // Send notifications to assigned users
    if (assignedTo && assignedTo.length > 0) {
      for (const userId of assignedTo) {
        await createNotification(
          userId,
          task._id,
          `You have been assigned to a new task: ${title}`
        );
      }
    }

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const { buildFilterQuery } = require('../utils/filterUtils');
    
    // Build filter query
    const filterQuery = buildFilterQuery(req);
    
    let query;

    // Copy req.query for pagination, sorting, etc.
    const reqQuery = { ...req.query };

    // Fields to exclude from the main query
    const removeFields = ['select', 'sort', 'page', 'limit', 'status', 'priority', 'dueDateBefore', 'dueDateAfter'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string for additional filters
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);
    
    // Combine additional filters with our specific filters
    const combinedFilters = {
      ...JSON.parse(queryStr),
      ...filterQuery
    };

    // Finding resource
    if (req.user.role === 'admin') {
      // Admins can see all tasks
      query = Task.find(combinedFilters);
    } else {
      // Regular users can only see tasks they created or are assigned to
      query = Task.find({
        $or: [
          { createdBy: req.user.id },
          { assignedTo: req.user.id }
        ],
        ...combinedFilters
      });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Sort
    const { buildSortQuery } = require('../utils/sortUtils');
    const sortQuery = buildSortQuery(req);
    
    // Handle custom function-based sorting for priority
    if (typeof sortQuery === 'object' && sortQuery.$function) {
      // For custom sorting, we need to execute the query first and then sort in memory
      const unsortedTasks = await query.exec();
      
      // Sort based on priority using the custom function
      if (sortQuery.$function.body.includes('priority')) {
        unsortedTasks.sort((a, b) => {
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          if (sortQuery.$function.body.includes('a.priority') && sortQuery.$function.body.includes('b.priority')) {
            return priorityOrder[a.priority] - priorityOrder[b.priority];
          } else {
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          }
        });
      }
      
      // Skip the regular sorting and pagination since we've already executed the query
      const startIndex = (page - 1) * limit;
      const endIndex = Math.min(startIndex + limit, unsortedTasks.length);
      const paginatedTasks = unsortedTasks.slice(startIndex, endIndex);
      
      return res.status(200).json({
        success: true,
        count: paginatedTasks.length,
        pagination: {
          total: unsortedTasks.length,
          page,
          limit
        },
        data: paginatedTasks
      });
    } else {
      // For regular sorting, use the MongoDB sort method
      query = query.sort(sortQuery);
    }
    // Skip if we already handled pagination in custom sorting
    if (typeof sortQuery !== 'object' || !sortQuery.$function) {
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      
      // Get total count for pagination
      const total = await Task.countDocuments(query);

      query = query.skip(startIndex).limit(limit);

      // Populate with user info
      query = query.populate({
        path: 'createdBy',
        select: 'username email'
      }).populate({
        path: 'assignedTo',
        select: 'username email'
      });

      // Executing query
      const tasks = await query;

      // Pagination result
      const pagination = {};

      if (endIndex < total) {
        pagination.next = {
          page: page + 1,
          limit
        };
      }

      if (startIndex > 0) {
        pagination.prev = {
          page: page - 1,
          limit
        };
      }

      res.status(200).json({
        success: true,
        count: tasks.length,
        pagination,
        data: tasks
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'username email'
      })
      .populate({
        path: 'assignedTo',
        select: 'username email'
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Make sure user is task creator or admin or assigned to the task
    if (
      task.createdBy._id.toString() !== req.user.id && 
      req.user.role !== 'admin' &&
      !task.assignedTo.some(user => user._id.toString() === req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this task'
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);

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
        message: 'Not authorized to update this task'
      });
    }

    // Check if assignedTo field is being updated
    const newAssignees = req.body.assignedTo;
    const currentAssignees = task.assignedTo.map(id => id.toString());
    
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    // If there are new assignees, send notifications
    if (newAssignees && Array.isArray(newAssignees)) {
      for (const userId of newAssignees) {
        // Only send notification to newly assigned users
        if (!currentAssignees.includes(userId.toString())) {
          await createNotification(
            userId,
            task._id,
            `You have been assigned to task: ${task.title}`
          );
        }
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

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
        message: 'Not authorized to delete this task'
      });
    }

    await task.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a status'
      });
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Make sure user is task creator or admin or assigned to the task
    if (
      task.createdBy.toString() !== req.user.id && 
      req.user.role !== 'admin' &&
      !task.assignedTo.includes(req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this task status'
      });
    }

    const oldStatus = task.status;
    
    task = await Task.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      {
        new: true,
        runValidators: true
      }
    );

    // If status changed to completed, notify task creator
    if (status === 'Completed' && oldStatus !== 'Completed') {
      // Don't notify if the user completing the task is the creator
      if (task.createdBy.toString() !== req.user.id) {
        await createNotification(
          task.createdBy,
          task._id,
          `Task "${task.title}" has been marked as completed`
        );
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Assign task to users
// @route   POST /api/tasks/:id/assign
// @access  Private
exports.assignTask = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs to assign'
      });
    }

    let task = await Task.findById(req.params.id);

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
        message: 'Not authorized to assign this task'
      });
    }

    // Verify all users exist
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: `User with ID ${userId} not found`
        });
      }
    }

    // Get current assignees
    const currentAssignees = task.assignedTo.map(id => id.toString());
    
    // Update task with new assignees
    task = await Task.findByIdAndUpdate(
      req.params.id,
      { assignedTo: userIds },
      {
        new: true,
        runValidators: true
      }
    ).populate({
      path: 'assignedTo',
      select: 'username email'
    });

    // Send notifications to newly assigned users
    for (const userId of userIds) {
      // Only send notification to newly assigned users
      if (!currentAssignees.includes(userId.toString())) {
        await createNotification(
          userId,
          task._id,
          `You have been assigned to task: ${task.title}`
        );
      }
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
