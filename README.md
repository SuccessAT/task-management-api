# Task Management API

A comprehensive RESTful API for task management with authentication, CRUD operations, task assignment, notifications, filtering, sorting, leaderboard, and image upload functionality.

## Overview

This Task Management API allows users to create, update, delete, and track tasks. The system supports multiple users, authentication, task assignment, status updates, priority levels, and image uploads. It includes a leaderboard system that ranks users based on their task completion rates.

## Features

### User Authentication & Role-Based Access

- JWT-based authentication
- User registration and login
- Two types of users:
  - Regular Users: Can create and manage their own tasks
  - Admins: Can view and manage all tasks

### Task Management

- Create, update, and delete tasks
- Each task includes:
  - Title
  - Description
  - Status (To Do, In Progress, Completed)
  - Priority (Low, Medium, High)
  - Due Date
  - Image Upload (Users can attach an image to a task)
- Update task status
- Admin access to all tasks

### Task Assignment

- Assign tasks to other users
- Notifications for task assignments

### Filtering & Sorting

- Filter tasks by status, priority, and due date
- Sort tasks by due date and priority

### Leaderboard System

- Ranks users based on task completion rates
- Users with higher completion rates rank higher

### Notifications

- Receive notifications for task assignments
- Mark notifications as read
- View all notifications

## Technology Stack

- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **File Upload**: Multer
- **API Documentation**: Swagger
- **Testing**: Jest and Supertest

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/task-management-api.git
   cd task-management-api
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/task-management-api
   JWT_SECRET=your_jwt_secret_key
   JWT_EXPIRE=30d
   NODE_ENV=development
   ```

4. Start the server:
   ```
   npm start
   ```

## API Documentation

API documentation is available at `/api-docs` when the server is running. It provides detailed information about all endpoints, request/response formats, and authentication requirements.

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `GET /api/auth/me` - Get current user profile

### Tasks

- `POST /api/tasks` - Create a new task
- `GET /api/tasks` - Get all tasks (with filtering and sorting)
- `GET /api/tasks/:id` - Get a single task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/status` - Update task status
- `POST /api/tasks/:id/assign` - Assign task to users

### Notifications

- `GET /api/notifications` - Get all notifications for current user
- `PUT /api/notifications/:id` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all notifications as read

### Leaderboard

- `GET /api/leaderboard` - Get leaderboard of users ranked by task completion rate

### Image Upload

- `POST /api/upload/:taskId` - Upload image for a task

### Unit Tests

To run the unit tests for the application:

```bash
npm test
```

This will run all the test suites in the `tests` directory.

### Integration Tests

Integration tests verify that different components of the application work together correctly. These tests simulate real-world usage scenarios and test the entire API from end to end.

To run the integration tests:

```bash
npm test -- tests/integration/api.test.js
```

The integration tests cover:

- Complete task lifecycle (create, update, assign, complete, delete)
- Notification system functionality
- Leaderboard features
- Filtering and sorting capabilities
- Admin-specific functionality
- Error handling and edge cases
- Authentication validation

#### Setting Up for Integration Tests

Before running integration tests, ensure:

1. MongoDB is running locally
2. The environment variables are properly set up (see `.env.example`)
3. The uploads directory exists:

```bash
mkdir -p uploads
```


## Design Decisions

### Database Design

The database schema is designed with the following collections:

1. **Users Collection**
   - Stores user information including username, email, password (hashed), and role
   - Includes timestamps for creation and updates

2. **Tasks Collection**
   - Stores task information including title, description, status, priority, due date
   - References to creator and assigned users
   - Includes image URL for task attachments
   - Includes timestamps for creation and updates

3. **Notifications Collection**
   - Stores notifications for users
   - References to user and related task
   - Includes read status and creation timestamp

4. **TaskHistory Collection**
   - Tracks changes to tasks for auditing purposes
   - Stores field changes, old and new values, and who made the change

### Authentication

- JWT-based authentication for secure and stateless API access
- Tokens expire after 30 days (configurable)
- Passwords are hashed using bcrypt for security
- Role-based access control for regular users and admins

### Task Management

- Comprehensive CRUD operations for tasks
- Status tracking (To Do, In Progress, Completed)
- Priority levels (Low, Medium, High)
- Due date tracking for deadlines
- Image attachment capability

### Filtering and Sorting

- Flexible filtering system for status, priority, and due dates
- Custom sorting implementation for priority levels
- MongoDB query optimization for efficient filtering and sorting

### Leaderboard System

- Calculates completion rates based on both created and assigned tasks
- Ranks users by completion percentage rather than absolute numbers
- Provides detailed statistics for each user

### Notifications

- Real-time notifications for task assignments
- Read status tracking
- Bulk operations for marking all notifications as read

### Image Upload

- Secure file upload with type validation
- Size limits to prevent abuse
- Static file serving for uploaded images

## Future Enhancements

1. Real-time updates using WebSockets
2. Email notifications for task assignments and updates
3. Task categories and tags
4. Recurring tasks
5. Team management and group assignments
6. Advanced reporting and analytics
7. Mobile application integration

## License

This project is licensed under the MIT License - see the LICENSE file for details.
