const express = require('express');
const { getLeaderboard } = require('../controllers/leaderboard');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Get leaderboard
router.get('/', getLeaderboard);

module.exports = router;
