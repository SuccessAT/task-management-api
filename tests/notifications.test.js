const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const User = require('../src/models/User');
const Notification = require('../src/models/Notification');
const { setupTestUser } = require('./utils/testUtils');

let token;
let userId;
let notificationId;

// Connect to test database before running tests
beforeAll(async () => {
  // Setup test user and get token
  const userData = await setupTestUser();
  token = userData.token;
  userId = userData.userId;
  
  // Clear notifications collection
  await Notification.deleteMany({});
  
  // Create a test notification
  const notification = await Notification.create({
    userId,
    taskId: new mongoose.Types.ObjectId(),
    message: 'Test notification',
    read: false
  });
  
  notificationId = notification._id;
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Notification Routes', () => {
  // Test get all notifications
  describe('GET /api/notifications', () => {
    it('should get all notifications for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should not get notifications without authentication', async () => {
      const res = await request(app)
        .get('/api/notifications');
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test mark notification as read
  describe('PUT /api/notifications/:id', () => {
    it('should mark a notification as read', async () => {
      const res = await request(app)
        .put(`/api/notifications/${notificationId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('read', true);
    });

    it('should not mark a non-existent notification as read', async () => {
      const res = await request(app)
        .put('/api/notifications/60f1a5c5e6d8f32a94f00000')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/Notification not found/i);
    });
  });

  // Test mark all notifications as read
  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications as read', async () => {
      // Create another unread notification
      await Notification.create({
        userId,
        taskId: new mongoose.Types.ObjectId(),
        message: 'Another test notification',
        read: false
      });
      
      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.message).toMatch(/All notifications marked as read/i);
      
      // Verify all notifications are marked as read
      const checkRes = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);
      
      const unreadNotifications = checkRes.body.data.filter(notification => !notification.read);
      expect(unreadNotifications.length).toEqual(0);
    });
  });
});
