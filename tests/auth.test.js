const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const { setupTestUser } = require('./utils/testUtils');

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'password123'
};

let token;
let userId;

// Connect to test database before running tests
beforeAll(async () => {
  // Clean up any existing test user
  await User.deleteOne({ email: testUser.email });
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Routes', () => {
  // Test user registration
  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('role', 'regular');
      
      // Save token and userId for later tests
      token = res.body.token;
      userId = res.body.user.id;
    });

    it('should not register a user with existing email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/User already exists/i);
    });

    it('should not register a user without required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'incomplete',
          email: 'incomplete@example.com'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test user login
  describe('POST /api/auth/login', () => {
    it('should login an existing user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('username', testUser.username);
      expect(res.body.user).toHaveProperty('email', testUser.email);
      
      // Update token for later tests
      token = res.body.token;
    });

    it('should not login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });

    it('should not login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/Invalid credentials/i);
    });
  });

  // Test get current user
  describe('GET /api/auth/me', () => {
    it('should get current user profile with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('username', testUser.username);
      expect(res.body.data).toHaveProperty('email', testUser.email);
    });

    it('should not get profile without token', async () => {
      const res = await request(app)
        .get('/api/auth/me');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not get profile with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });
});