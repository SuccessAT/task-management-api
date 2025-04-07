const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/server');
const Task = require('../src/models/Task');
const User = require('../src/models/User');
const { setupTestUser } = require('./utils/testUtils');

let token;
let userId;
let taskId;

// Test task data
const testTask = {
  title: 'Test Task',
  description: 'This is a test task',
  status: 'To Do',
  priority: 'Medium',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
};

// Connect to test database before running tests
beforeAll(async () => {
  // Setup test user and get token
  const userData = await setupTestUser();
  token = userData.token;
  userId = userData.userId;
  
  // Create a test task if none exists
  const task = await Task.create({
    title: 'Test Task for Tests',
    description: 'This is a test task created for testing',
    status: 'To Do',
    priority: 'Medium',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    createdBy: userId
  });
});

// Close database connection after tests
afterAll(async () => {
  await mongoose.connection.close();
});

describe('Task Routes', () => {
  // Test task creation
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send(testTask);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('title', testTask.title);
      expect(res.body.data).toHaveProperty('description', testTask.description);
      expect(res.body.data).toHaveProperty('status', testTask.status);
      expect(res.body.data).toHaveProperty('priority', testTask.priority);
      expect(res.body.data).toHaveProperty('createdBy');
      
      // Save task ID for later tests
      taskId = res.body.data._id;
    });

    it('should not create a task without required fields', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Incomplete Task'
        });
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not create a task without authentication', async () => {
      const res = await request(app)
        .post('/api/tasks')
        .send(testTask);
      
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test get all tasks
  describe('GET /api/tasks', () => {
    it('should get all tasks for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(0);
    });

    it('should filter tasks by status', async () => {
      const res = await request(app)
        .get('/api/tasks?status=To Do')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // All returned tasks should have status 'To Do'
      res.body.data.forEach(task => {
        expect(task.status).toEqual('To Do');
      });
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get('/api/tasks?priority=Medium')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // All returned tasks should have priority 'Medium'
      res.body.data.forEach(task => {
        expect(task.priority).toEqual('Medium');
      });
    });

    it('should sort tasks by due date', async () => {
      const res = await request(app)
        .get('/api/tasks?sort=dueDate')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
      
      // Check if tasks are sorted by due date (ascending)
      if (res.body.data.length > 1) {
        for (let i = 0; i < res.body.data.length - 1; i++) {
          const currentDate = new Date(res.body.data[i].dueDate);
          const nextDate = new Date(res.body.data[i + 1].dueDate);
          expect(currentDate.getTime()).toBeLessThanOrEqual(nextDate.getTime());
        }
      }
    });
  });

  // Test get single task
  describe('GET /api/tasks/:id', () => {
    it('should get a single task by ID', async () => {
      const res = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('_id', taskId);
      expect(res.body.data).toHaveProperty('title', testTask.title);
      expect(res.body.data).toHaveProperty('description', testTask.description);
    });

    it('should not get a task with invalid ID', async () => {
      const res = await request(app)
        .get('/api/tasks/invalidid')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });

    it('should not get a non-existent task', async () => {
      const res = await request(app)
        .get('/api/tasks/60f1a5c5e6d8f32a94f00000')
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body).toHaveProperty('success', false);
      expect(res.body.message).toMatch(/Task not found/i);
    });
  });

  // Test update task
  describe('PUT /api/tasks/:id', () => {
    it('should update a task', async () => {
      const updatedTask = {
        title: 'Updated Test Task',
        priority: 'High'
      };

      const res = await request(app)
        .put(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updatedTask);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('title', updatedTask.title);
      expect(res.body.data).toHaveProperty('priority', updatedTask.priority);
      // Original fields should remain unchanged
      expect(res.body.data).toHaveProperty('description', testTask.description);
    });
  });

  // Test update task status
  describe('PATCH /api/tasks/:id/status', () => {
    it('should update a task status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'In Progress' });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('status', 'In Progress');
    });

    it('should not update a task status with invalid status', async () => {
      const res = await request(app)
        .patch(`/api/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'Invalid Status' });
      
        expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('success', false);
    });
  });

  // Test task assignment
  describe('POST /api/tasks/:id/assign', () => {
    it('should assign a task to users', async () => {
      const res = await request(app)
        .post(`/api/tasks/${taskId}/assign`)
        .set('Authorization', `Bearer ${token}`)
        .send({ userIds: [userId] });
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data).toHaveProperty('assignedTo');
      expect(Array.isArray(res.body.data.assignedTo)).toBe(true);
      expect(res.body.data.assignedTo.length).toBeGreaterThan(0);
      
      // Check if the user is in the assignedTo array
      const assignedUserIds = res.body.data.assignedTo.map(user => 
        typeof user === 'object' ? user._id : user
      );
      expect(assignedUserIds).toContain(userId.toString());
    });
  });

  // Test delete task
  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const res = await request(app)
        .delete(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('success', true);
      
      // Verify task is deleted
      const checkRes = await request(app)
        .get(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(checkRes.statusCode).toEqual(404);
    });
  });
});