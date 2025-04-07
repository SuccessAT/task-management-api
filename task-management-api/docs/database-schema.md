# Database Schema Design

## Overview
This document outlines the database schema for the Task Management API. We'll be using MongoDB as our database, which is a NoSQL document database that provides flexibility for our data model.

## Collections

### Users Collection
```json
{
  "_id": "ObjectId",
  "username": "String (unique)",
  "email": "String (unique)",
  "password": "String (hashed)",
  "role": "String (enum: 'regular', 'admin')",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Tasks Collection
```json
{
  "_id": "ObjectId",
  "title": "String",
  "description": "String",
  "status": "String (enum: 'To Do', 'In Progress', 'Completed')",
  "priority": "String (enum: 'Low', 'Medium', 'High')",
  "dueDate": "Date",
  "createdBy": "ObjectId (ref: Users)",
  "assignedTo": ["ObjectId (ref: Users)"],
  "imageUrl": "String (optional)",
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### Notifications Collection
```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: Users)",
  "taskId": "ObjectId (ref: Tasks)",
  "message": "String",
  "read": "Boolean (default: false)",
  "createdAt": "Date"
}
```

### TaskHistory Collection (for tracking changes)
```json
{
  "_id": "ObjectId",
  "taskId": "ObjectId (ref: Tasks)",
  "field": "String",
  "oldValue": "Mixed",
  "newValue": "Mixed",
  "changedBy": "ObjectId (ref: Users)",
  "changedAt": "Date"
}
```

## Indexes

### Users Collection
- `username`: Unique index
- `email`: Unique index

### Tasks Collection
- `createdBy`: Index for faster queries
- `assignedTo`: Index for faster queries
- `status`: Index for filtering
- `priority`: Index for filtering
- `dueDate`: Index for filtering and sorting

### Notifications Collection
- `userId`: Index for faster queries
- `read`: Index for filtering unread notifications

## Relationships

1. **User to Tasks (One-to-Many)**
   - A user can create multiple tasks
   - A task is created by exactly one user

2. **User to Assigned Tasks (Many-to-Many)**
   - A user can be assigned to multiple tasks
   - A task can be assigned to multiple users

3. **Task to Notifications (One-to-Many)**
   - A task can generate multiple notifications
   - A notification is associated with exactly one task

## Leaderboard Calculation

For the leaderboard system, we'll calculate user rankings based on task completion rates:

1. For each user, we'll count:
   - Total tasks created
   - Total tasks assigned
   - Total tasks completed (both created and assigned)

2. The completion rate will be calculated as:
   ```
   completionRate = completedTasks / (createdTasks + assignedTasks)
   ```

3. Users will be ranked based on this completion rate, with higher rates ranking higher.

This schema design supports all the required functionality including user authentication, task management, task assignment, notifications, image uploads, and the leaderboard system.
