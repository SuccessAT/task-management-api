// Jest setup file
// This runs before each test file

// Set test environment variables if needed
process.env.NODE_ENV = 'test';

// Add any global setup code here
// For example, setting up global test utilities or mocks

// If you're using MongoDB, you might want to add connection handling
const mongoose = require('mongoose');

beforeAll(async () => {
  // Use a test-specific database
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/task-management-api-test';
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.connection.close();
});

console.log('Jest setup complete');
