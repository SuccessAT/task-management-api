const request = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');
const User = require('../src/models/User');
const Task = require('../src/models/Task');

let token;
let userId;
let taskId;

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
  
  // Create a test task
  const task = await Task.create({
    title: 'Test Task for Image Upload',
    description: 'This is a test task for image upload',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdBy: userId
  });
  
  taskId = task._id;
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Image Upload Routes', () => {
  // Test image upload
  describe('POST /api/upload/:taskId', () => {
    // Create a test image file
    const testImagePath = path.join(__dirname, 'test-image.jpg');
    
    beforeAll(() => {
      // Create a simple test image if it doesn't exist
      if (!fs.existsSync(testImagePath)) {
        const buffer = Buffer.alloc(100);
        fs.writeFileSync(testImagePath, buffer);
      }
    });
    
    afterAll(() => {
      // Clean up test image
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    });
    
    it('should upload an image for a task', async () => {
      const res = await request(app)
        .post(`/api/upload/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .attach('image', testImagePath);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('imageUrl');
      expect(res.body.data.imageUrl).toMatch(/^\/uploads\//);
      
      // Verify task has been updated with image URL
      const task = await Task.findById(taskId);
      expect(task.imageUrl).toEqual(res.body.data.imageUrl);
    });
    
    it('should not upload an image without authentication', async () => {
      const res = await request(app)
        .post(`/api/upload/${taskId}`)
        .attach('image', testImagePath);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
    
    it('should not upload an image for a non-existent task', async () => {
      const res = await request(app)
        .post('/api/upload/60f1a5c5e6d8f32a94f00000')
        .set('Authorization', `Bearer ${token}`)
        .attach('image', testImagePath);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message', 'Task not found');
    });
  });
});
