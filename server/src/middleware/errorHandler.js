import mongoose from 'mongoose'

// 自定义错误类
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(message, details = []) {
    super(message, 400, 'VALIDATION_ERROR')
    this.details = details
  }
}

// 业务逻辑错误类
export class BusinessError extends AppError {
  constructor(message, code = 'BUSINESS_ERROR') {
    super(message, 400, code)
  }
}

// 资源未找到错误类
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND')
  }
}

// 冲突错误类
export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT')
  }
}

// 处理Mongoose验证错误
const handleValidationError = (error) => {
  const details = Object.values(error.errors).map(err => ({
    field: err.path,
    message: err.message,
    value: err.value,
  }))
  
  return new ValidationError('Validation failed', details)
}

// 处理Mongoose重复键错误
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyValue)[0]
  const value = error.keyValue[field]
  
  return new ConflictError(`${field} '${value}' already exists`)
}

// 处理Mongoose转换错误
const handleCastError = (error) => {
  return new ValidationError(`Invalid ${error.path}: ${error.value}`)
}

// 处理JWT错误
const handleJWTError = () => {
  return new AppError('Invalid token', 401, 'INVALID_TOKEN')
}

// 处理JWT过期错误
const handleJWTExpiredError = () => {
  return new AppError('Token expired', 401, 'TOKEN_EXPIRED')
}

// 发送错误响应
const sendErrorResponse = (err, res) => {
  const response = {
    success: false,
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message,
    },
    timestamp: new Date().toISOString(),
  }
  
  // 在开发环境中包含详细信息
  if (process.env.NODE_ENV === 'development') {
    response.error.stack = err.stack
    
    if (err.details) {
      response.error.details = err.details
    }
  }
  
  // 在生产环境中隐藏敏感信息
  if (process.env.NODE_ENV === 'production' && !err.isOperational) {
    response.error.message = 'Something went wrong'
  }
  
  res.status(err.statusCode || 500).json(response)
}

// 主要错误处理中间件
const errorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message
  
  // 记录错误
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  })
  
  // 处理不同类型的错误
  if (err.name === 'ValidationError') {
    error = handleValidationError(err)
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err)
  } else if (err.name === 'CastError') {
    error = handleCastError(err)
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError()
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError()
  } else if (!err.isOperational) {
    // 未知错误，转换为通用错误
    error = new AppError('Internal server error', 500, 'INTERNAL_ERROR')
  }
  
  sendErrorResponse(error, res)
}

// 异步错误捕获包装器
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

// 404处理器
export const notFound = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl}`)
  next(error)
}

// 错误类已经通过 export class 导出，这里不需要重复导出

export default errorHandler