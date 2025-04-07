const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');

let token;
let userId;

// Connect to test database before running tests
beforeAll(async () => {
  // Login to get token
  const user = await User.findOne({ email: 'test@example.com' });
  if (user) {
    userId = user._id;
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = res.body.token;
  } else {
    // Create a test user if it doesn't exist
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    
    token = registerRes.body.token;
    userId = registerRes.body.user.id;
  }
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Leaderboard Routes', () => {
  // Test get leaderboard
  describe('GET /api/leaderboard', () => {
    it('should get the leaderboard', async () => {
      const res = await request(app)
        .get('/api/leaderboard')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // Check if leaderboard entries have required properties
      if (res.body.data.length > 0) {
        expect(res.body.data[0]).toHaveProperty('rank');
        expect(res.body.data[0]).toHaveProperty('user');
        expect(res.body.data[0]).toHaveProperty('stats');
        expect(res.body.data[0].stats).toHaveProperty('completionRate');
      }
    });

    it('should not get the leaderboard without authentication', async () => {
      const res = await request(app)
        .get('/api/leaderboard');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});
