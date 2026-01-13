/**
 * Error Handling Middleware
 * 
 * @description Centralized error handling for Express application
 * with proper logging, error transformation, and response formatting.
 */

import mongoose from 'mongoose';

/**
 * Global error handler middleware
 * 
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const errorHandler = (err, req, res, next) => {
  // Log error details
  logError(err, req);
  
  // Transform error to consistent format
  const errorResponse = transformError(err);
  
  // Send error response
  res.status(errorResponse.status).json({
    success: false,
    message: errorResponse.message,
    ...(errorResponse.errors && { errors: errorResponse.errors }),
    ...(process.env.NODE_ENV === 'development' && { 
      stack: err.stack,
      details: errorResponse.details 
    }),
    timestamp: new Date().toISOString()
  });
};

/**
 * Log error with context information
 * 
 * @param {Error} err - Error object
 * @param {express.Request} req - Express request object
 */
const logError = (err, req) => {
  const errorInfo = {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };
  
  // Log based on error severity
  if (err.status >= 500 || !err.status) {
    console.error('🚨 Server Error:', errorInfo);
  } else {
    console.warn('⚠️ Client Error:', errorInfo);
  }
};

/**
 * Transform various error types to consistent format
 * 
 * @param {Error} err - Error object
 * @returns {object} Transformed error response
 */
const transformError = (err) => {
  // Default error response
  let errorResponse = {
    status: err.status || 500,
    message: err.message || 'Internal server error',
    details: {}
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse = handleValidationError(err);
  } else if (err.name === 'CastError') {
    errorResponse = handleCastError(err);
  } else if (err.code === 11000) {
    errorResponse = handleDuplicateKeyError(err);
  } else if (err.name === 'JsonWebTokenError') {
    errorResponse = handleJWTError(err);
  } else if (err.name === 'TokenExpiredError') {
    errorResponse = handleTokenExpiredError(err);
  } else if (err.name === 'MongooseError') {
    errorResponse = handleMongooseError(err);
  } else if (err.type === 'entity.parse.failed') {
    errorResponse = handleJSONParseError(err);
  } else if (err.status) {
    // HTTP errors with status codes
    errorResponse = {
      status: err.status,
      message: err.message,
      details: { type: 'HTTP_ERROR' }
    };
  }
  
  return errorResponse;
};

/**
 * Handle Mongoose validation errors
 * 
 * @param {Error} err - Validation error
 * @returns {object} Formatted error response
 */
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(error => ({
    field: error.path,
    message: error.message,
    value: error.value
  }));
  
  return {
    status: 400,
    message: 'Validation failed',
    errors,
    details: { type: 'VALIDATION_ERROR' }
  };
};

/**
 * Handle Mongoose cast errors (invalid ObjectId, etc.)
 * 
 * @param {Error} err - Cast error
 * @returns {object} Formatted error response
 */
const handleCastError = (err) => {
  return {
    status: 400,
    message: `Invalid ${err.path}: ${err.value}`,
    details: { 
      type: 'CAST_ERROR',
      field: err.path,
      value: err.value
    }
  };
};

/**
 * Handle MongoDB duplicate key errors
 * 
 * @param {Error} err - Duplicate key error
 * @returns {object} Formatted error response
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  
  return {
    status: 409,
    message: `${field} '${value}' already exists`,
    details: { 
      type: 'DUPLICATE_KEY_ERROR',
      field,
      value
    }
  };
};

/**
 * Handle JWT authentication errors
 * 
 * @param {Error} err - JWT error
 * @returns {object} Formatted error response
 */
const handleJWTError = (err) => {
  return {
    status: 401,
    message: 'Invalid authentication token',
    details: { type: 'JWT_ERROR' }
  };
};

/**
 * Handle JWT token expiration errors
 * 
 * @param {Error} err - Token expired error
 * @returns {object} Formatted error response
 */
const handleTokenExpiredError = (err) => {
  return {
    status: 401,
    message: 'Authentication token has expired',
    details: { type: 'TOKEN_EXPIRED_ERROR' }
  };
};

/**
 * Handle general Mongoose errors
 * 
 * @param {Error} err - Mongoose error
 * @returns {object} Formatted error response
 */
const handleMongooseError = (err) => {
  return {
    status: 500,
    message: 'Database operation failed',
    details: { 
      type: 'MONGOOSE_ERROR',
      originalMessage: err.message
    }
  };
};

/**
 * Handle JSON parsing errors
 * 
 * @param {Error} err - JSON parse error
 * @returns {object} Formatted error response
 */
const handleJSONParseError = (err) => {
  return {
    status: 400,
    message: 'Invalid JSON format in request body',
    details: { type: 'JSON_PARSE_ERROR' }
  };
};

/**
 * Async error wrapper for route handlers
 * 
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Create custom error with status code
 * 
 * @param {string} message - Error message
 * @param {number} status - HTTP status code
 * @returns {Error} Custom error object
 */
export const createError = (message, status = 500) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Not found middleware for undefined routes
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const notFound = (req, res, next) => {
  const error = createError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

export default {
  errorHandler,
  asyncHandler,
  createError,
  notFound
};