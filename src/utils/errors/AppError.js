class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message || 'Bad Request', 400);
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message || 'Not authorized to access this route', 401);
  }
}

class ForbiddenError extends AppError {
  constructor(message) {
    super(message || 'Forbidden', 403);
  }
}

class NotFoundError extends AppError {
  constructor(message) {
    super(message || 'Resource not found', 404);
  }
}

module.exports = {
  AppError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
};