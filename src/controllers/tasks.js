const Task = require('../models/Task');
const User = require('../models/User');
const { createNotification } = require('./notifications');
const { handleValidationErrors } = require('../middleware/errorHandler');
const { 
  BadRequestError, 
  NotFoundError, 
  ForbiddenError 
} = require('../utils/errors/AppError');

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
exports.createTask = async (req, res, next) => {
  try {
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
    next(err);
  }
};

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
  try {
    const { buildFilterQuery } = require('../utils/filterUtils');
    const { buildSortQuery } = require('../utils/sortUtils');
    
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filterQuery = buildFilterQuery(req);
    const reqQuery = { ...req.query };
    const removeFields = ['select', 'sort', 'page', 'limit', 'status', 'priority', 'dueDateBefore', 'dueDateAfter'];
    removeFields.forEach(param => delete reqQuery[param]);

    const combinedFilters = {
      ...JSON.parse(JSON.stringify(reqQuery)),
      ...filterQuery
    };

    // Base access filter
    const accessFilter = req.user.role === 'admin' 
      ? {} 
      : {
          $or: [
            { createdBy: req.user.id },
            { assignedTo: req.user.id }
          ]
        };

    // Build aggregation pipeline
    const pipeline = [
      { $match: { ...combinedFilters, ...accessFilter } },
    ];

    // Add sort stage
    const sortQuery = buildSortQuery(req);
    if (typeof sortQuery === 'object' && sortQuery.$sort) {
      pipeline.push(sortQuery);
    } else {
      // Convert string sort query to object for aggregation
      const sortObject = {};
      if (sortQuery.startsWith('-')) {
        sortObject[sortQuery.substring(1)] = -1;
      } else {
        sortObject[sortQuery] = 1;
      }
      pipeline.push({ $sort: sortObject });
    }

    // Add field selection if specified
    if (req.query.select) {
      const fields = req.query.select.split(',').reduce((acc, field) => {
        acc[field.trim()] = 1;
        return acc;
      }, {});
      pipeline.push({ $project: fields });
    }

    // Add pagination
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: limit });

    // Add population stages
    pipeline.push(
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          pipeline: [{ $project: { username: 1, email: 1 } }],
          as: 'createdBy'
        }
      },
      { $unwind: '$createdBy' },
      {
        $lookup: {
          from: 'users',
          localField: 'assignedTo',
          foreignField: '_id',
          pipeline: [{ $project: { username: 1, email: 1 } }],
          as: 'assignedTo'
        }
      }
    );

    // Execute aggregation pipeline
    const tasks = await Task.aggregate(pipeline);

    // Get total count for pagination
    const total = await Task.countDocuments({ ...combinedFilters, ...accessFilter });

    // Build pagination info
    const pagination = {};
    if (skip + limit < total) {
      pagination.next = { page: page + 1, limit };
    }
    if (skip > 0) {
      pagination.prev = { page: page - 1, limit };
    }

    res.status(200).json({
      success: true,
      count: tasks.length,
      pagination,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
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
      throw new NotFoundError('Task not found');
    }

    if (
      task.createdBy._id.toString() !== req.user.id && 
      req.user.role !== 'admin' &&
      !task.assignedTo.some(user => user._id.toString() === req.user.id)
    ) {
      throw new ForbiddenError('Not authorized to access this task');
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to update this task');
    }

    const newAssignees = req.body.assignedTo;
    const currentAssignees = task.assignedTo.map(id => id.toString());
    
    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (newAssignees && Array.isArray(newAssignees)) {
      for (const userId of newAssignees) {
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
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to delete this task');
    }

    await Task.deleteOne({ _id: task._id });

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id/status
// @access  Private
exports.updateTaskStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      throw new BadRequestError('Please provide a status');
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (
      task.createdBy.toString() !== req.user.id && 
      req.user.role !== 'admin' &&
      !task.assignedTo.includes(req.user.id)
    ) {
      throw new ForbiddenError('Not authorized to update this task status');
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

    if (status === 'Completed' && oldStatus !== 'Completed') {
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
    next(err);
  }
};

// @desc    Assign task to users
// @route   POST /api/tasks/:id/assign
// @access  Private
exports.assignTask = async (req, res, next) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new BadRequestError('Please provide an array of user IDs to assign');
    }

    let task = await Task.findById(req.params.id);

    if (!task) {
      throw new NotFoundError('Task not found');
    }

    if (task.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      throw new ForbiddenError('Not authorized to assign this task');
    }

    // Verify all users exist
    for (const userId of userIds) {
      const user = await User.findById(userId);
      if (!user) {
        throw new NotFoundError(`User with ID ${userId} not found`);
      }
    }

    const currentAssignees = task.assignedTo.map(id => id.toString());
    
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

    for (const userId of userIds) {
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
    next(err);
  }
};
