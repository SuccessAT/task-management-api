/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - username
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         username:
 *           type: string
 *           description: The username of the user
 *         email:
 *           type: string
 *           description: The email of the user
 *         password:
 *           type: string
 *           description: The password of the user (hashed)
 *         role:
 *           type: string
 *           description: The role of the user (regular or admin)
 *           enum: [regular, admin]
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the user was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the user was last updated
 *       example:
 *         _id: 60f1a5c5e6d8f32a94f12345
 *         username: johndoe
 *         email: john@example.com
 *         role: regular
 *         createdAt: 2023-01-01T00:00:00.000Z
 *         updatedAt: 2023-01-01T00:00:00.000Z
 *     
 *     Task:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - dueDate
 *         - createdBy
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the task
 *         title:
 *           type: string
 *           description: The title of the task
 *         description:
 *           type: string
 *           description: The description of the task
 *         status:
 *           type: string
 *           description: The status of the task
 *           enum: [To Do, In Progress, Completed]
 *         priority:
 *           type: string
 *           description: The priority of the task
 *           enum: [Low, Medium, High]
 *         dueDate:
 *           type: string
 *           format: date
 *           description: The due date of the task
 *         imageUrl:
 *           type: string
 *           description: The URL of the task image
 *         createdBy:
 *           type: string
 *           description: The ID of the user who created the task
 *         assignedTo:
 *           type: array
 *           items:
 *             type: string
 *           description: The IDs of users assigned to the task
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the task was created
 *         updatedAt:
 *           type: string
 *           format: date
 *           description: The date the task was last updated
 *       example:
 *         _id: 60f1a5c5e6d8f32a94f67890
 *         title: Complete project documentation
 *         description: Write comprehensive documentation for the project
 *         status: In Progress
 *         priority: High
 *         dueDate: 2023-02-01T00:00:00.000Z
 *         imageUrl: /uploads/1612345678-image.jpg
 *         createdBy: 60f1a5c5e6d8f32a94f12345
 *         assignedTo: [60f1a5c5e6d8f32a94f12345]
 *         createdAt: 2023-01-15T00:00:00.000Z
 *         updatedAt: 2023-01-20T00:00:00.000Z
 *     
 *     Notification:
 *       type: object
 *       required:
 *         - userId
 *         - taskId
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the notification
 *         userId:
 *           type: string
 *           description: The ID of the user the notification is for
 *         taskId:
 *           type: string
 *           description: The ID of the task related to the notification
 *         message:
 *           type: string
 *           description: The notification message
 *         read:
 *           type: boolean
 *           description: Whether the notification has been read
 *         createdAt:
 *           type: string
 *           format: date
 *           description: The date the notification was created
 *       example:
 *         _id: 60f1a5c5e6d8f32a94f24680
 *         userId: 60f1a5c5e6d8f32a94f12345
 *         taskId: 60f1a5c5e6d8f32a94f67890
 *         message: You have been assigned to a new task
 *         read: false
 *         createdAt: 2023-01-20T00:00:00.000Z
 *     
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         rank:
 *           type: integer
 *           description: The rank of the user on the leaderboard
 *         user:
 *           type: object
 *           properties:
 *             id:
 *               type: string
 *               description: The ID of the user
 *             username:
 *               type: string
 *               description: The username of the user
 *             email:
 *               type: string
 *               description: The email of the user
 *             role:
 *               type: string
 *               description: The role of the user
 *         stats:
 *           type: object
 *           properties:
 *             createdTasks:
 *               type: integer
 *               description: Number of tasks created by the user
 *             completedCreatedTasks:
 *               type: integer
 *               description: Number of completed tasks created by the user
 *             assignedTasks:
 *               type: integer
 *               description: Number of tasks assigned to the user
 *             completedAssignedTasks:
 *               type: integer
 *               description: Number of completed tasks assigned to the user
 *             totalTasks:
 *               type: integer
 *               description: Total number of tasks (created + assigned)
 *             completedTasks:
 *               type: integer
 *               description: Total number of completed tasks
 *             completionRate:
 *               type: number
 *               description: Percentage of completed tasks
 *       example:
 *         rank: 1
 *         user:
 *           id: 60f1a5c5e6d8f32a94f12345
 *           username: johndoe
 *           email: john@example.com
 *           role: regular
 *         stats:
 *           createdTasks: 10
 *           completedCreatedTasks: 8
 *           assignedTasks: 5
 *           completedAssignedTasks: 4
 *           totalTasks: 15
 *           completedTasks: 12
 *           completionRate: 80
 *   
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Not authorized to access this route
 *     
 *     NotFoundError:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: Resource not found
 *     
 *     BadRequestError:
 *       description: Invalid request parameters
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               errors:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     msg:
 *                       type: string
 *                     param:
 *                       type: string
 *                     location:
 *                       type: string
 *                 example:
 *                   - msg: Please include a valid email
 *                     param: email
 *                     location: body
 *   
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */
