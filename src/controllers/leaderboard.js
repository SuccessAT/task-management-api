const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get leaderboard of users ranked by task completion rate
// @route   GET /api/leaderboard
// @access  Private
exports.getLeaderboard = async (req, res) => {
  try {
    // Get all users
    const users = await User.find().select('username email role');
    
    // Initialize leaderboard data
    const leaderboardData = [];
    
    // Calculate stats for each user
    for (const user of users) {
      // Get tasks created by user
      const createdTasks = await Task.find({ createdBy: user._id });
      const createdTasksCount = createdTasks.length;
      const completedCreatedTasksCount = createdTasks.filter(
        task => task.status === 'Completed'
      ).length;
      
      // Get tasks assigned to user
      const assignedTasks = await Task.find({ assignedTo: user._id });
      const assignedTasksCount = assignedTasks.length;
      const completedAssignedTasksCount = assignedTasks.filter(
        task => task.status === 'Completed'
      ).length;
      
      // Calculate total tasks and completed tasks
      const totalTasks = createdTasksCount + assignedTasksCount;
      const completedTasks = completedCreatedTasksCount + completedAssignedTasksCount;
      
      // Calculate completion rate (avoid division by zero)
      const completionRate = totalTasks > 0 
        ? (completedTasks / totalTasks) * 100 
        : 0;
      
      // Add user to leaderboard
      leaderboardData.push({
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        stats: {
          createdTasks: createdTasksCount,
          completedCreatedTasks: completedCreatedTasksCount,
          assignedTasks: assignedTasksCount,
          completedAssignedTasks: completedAssignedTasksCount,
          totalTasks,
          completedTasks,
          completionRate: parseFloat(completionRate.toFixed(2))
        }
      });
    }
    
    // Sort leaderboard by completion rate (highest first)
    leaderboardData.sort((a, b) => b.stats.completionRate - a.stats.completionRate);
    
    // Add rank to each entry
    leaderboardData.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    res.status(200).json({
      success: true,
      count: leaderboardData.length,
      data: leaderboardData
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
