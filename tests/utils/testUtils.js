const request = require('supertest');
const User = require('../../src/models/User');
const app = require('../../src/server');

/**
 * Sets up a test user and returns the token and userId
 * @returns {Promise<{token: string, userId: string}>}
 */
const setupTestUser = async () => {
  const testUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123'
  };

  // Check if the test user already exists
  let user = await User.findOne({ email: testUser.email });
  
  if (user) {
    // User exists, login to get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });
    
    return {
      token: res.body.token,
      userId: user._id.toString()
    };
  } else {
    // Create a new test user
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    return {
      token: res.body.token,
      userId: res.body.user.id
    };
  }
};

module.exports = {
  setupTestUser
};