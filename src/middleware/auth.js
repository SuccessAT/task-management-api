const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UnauthorizedError, ForbiddenError } = require('../utils/errors/AppError');

// Protect routes
exports.protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_dev_key');

      // Get user from the token
      req.user = await User.findById(decoded.id);

      next();
    } catch (err) {
      throw new UnauthorizedError('Invalid token');
    }
  } catch (err) {
    next(err);
  }
};

// Grant access to specific roles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`User role ${req.user.role} is not authorized to access this route`));
    }
    next();
  };
};
