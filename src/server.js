require('dotenv').config();
const { validateEnv } = require('./config/env');
validateEnv();


const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Define routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/upload', require('./routes/upload'));

// Serve uploaded files
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Swagger Documentation
require('./config/swagger')(app);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Task Management API' });
});

// Handle 404 errors for undefined routes
app.use((req, res, next) => {
  const { NotFoundError } = require('./utils/errors/AppError');
  next(new NotFoundError('Route not found'));
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes
