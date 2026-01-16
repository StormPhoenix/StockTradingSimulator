import { Request, Response, NextFunction } from 'express';

// 类型定义
interface CorsConfig {
  origin: string;
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: {
    success: boolean;
    error: {
      code: string;
      message: string;
    };
  };
  standardHeaders: boolean;
  legacyHeaders: boolean;
}

interface BodyLimitConfig {
  json: string;
  urlencoded: string;
}

interface TimeoutConfig {
  server: number;
  database: number;
}

interface PaginationConfig {
  defaultPage: number;
  defaultLimit: number;
  maxLimit: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationParams {
  page: number;
  limit: number;
  total: number;
}

interface SuccessResponse<T = any> {
  success: true;
  data: T;
  message: string;
  timestamp: string;
}

interface PaginatedResponse<T = any> {
  success: true;
  data: {
    items: T[];
    pagination: PaginationInfo;
  };
  message: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

interface ResponseConfig {
  success: <T>(data: T, message?: string) => SuccessResponse<T>;
  paginated: <T>(data: T[], pagination: PaginationParams, message?: string) => PaginatedResponse<T>;
  error: (code: string, message: string, details?: any) => ErrorResponse;
}

interface LoggingConfig {
  level: string;
  format: string;
  enableRequestLogging: boolean;
}

interface SecurityConfig {
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: string[];
        styleSrc: string[];
        scriptSrc: string[];
        imgSrc: string[];
      };
    };
    crossOriginEmbedderPolicy: boolean;
  };
}

interface EnvironmentConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
}

interface ApiConfig {
  version: string;
  name: string;
  description: string;
  cors: CorsConfig;
  rateLimit: RateLimitConfig;
  bodyLimit: BodyLimitConfig;
  timeout: TimeoutConfig;
  pagination: PaginationConfig;
  response: ResponseConfig;
  logging: LoggingConfig;
  security: SecurityConfig;
  environment: EnvironmentConfig;
}

// API配置
export const apiConfig: ApiConfig = {
  // 版本信息
  version: '1.0.0',
  name: 'Stock Trading Simulator API',
  description: '股票交易模拟器 - 市场配置与环境初始化API',
  
  // CORS配置
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: process.env.CORS_CREDENTIALS === 'true' || true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'Cache-Control',
    ],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    maxAge: 86400, // 24小时
  },
  
  // 速率限制配置
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // 每个IP最多1000个请求
    message: {
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later.',
      },
    },
    standardHeaders: true, // 返回速率限制信息在 `RateLimit-*` headers
    legacyHeaders: false, // 禁用 `X-RateLimit-*` headers
  },
  
  // 请求体大小限制
  bodyLimit: {
    json: '10mb',
    urlencoded: '10mb',
  },
  
  // 超时配置
  timeout: {
    server: 30000, // 30秒
    database: 10000, // 10秒
  },
  
  // 分页默认配置
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
    maxLimit: 100,
  },
  
  // 响应格式配置
  response: {
    // 成功响应格式
    success: <T>(data: T, message: string = 'Success'): SuccessResponse<T> => ({
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
    }),
    
    // 分页响应格式
    paginated: <T>(data: T[], pagination: PaginationParams, message: string = 'Success'): PaginatedResponse<T> => ({
      success: true,
      data: {
        items: data,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: Math.ceil(pagination.total / pagination.limit),
          hasNext: pagination.page < Math.ceil(pagination.total / pagination.limit),
          hasPrev: pagination.page > 1,
        },
      },
      message,
      timestamp: new Date().toISOString(),
    }),
    
    // 错误响应格式
    error: (code: string, message: string, details: any = null): ErrorResponse => ({
      success: false,
      error: {
        code,
        message,
        ...(details && { details }),
      },
      timestamp: new Date().toISOString(),
    }),
  },
  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === 'true' || true,
  },
  
  // 安全配置
  security: {
    helmet: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    },
  },
  
  // 环境配置
  environment: {
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    isTest: process.env.NODE_ENV === 'test',
  },
}

// 响应助手函数
export const responseHelpers = {
  // 发送成功响应
  sendSuccess: <T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200): void => {
    res.status(statusCode).json(apiConfig.response.success(data, message));
  },
  
  // 发送分页响应
  sendPaginated: <T>(res: Response, data: T[], pagination: PaginationParams, message: string = 'Success'): void => {
    res.json(apiConfig.response.paginated(data, pagination, message));
  },
  
  // 发送创建成功响应
  sendCreated: <T>(res: Response, data: T, message: string = 'Created successfully'): void => {
    res.status(201).json(apiConfig.response.success(data, message));
  },
  
  // 发送无内容响应
  sendNoContent: (res: Response): void => {
    res.status(204).send();
  },
  
  // 发送错误响应
  sendError: (res: Response, code: string, message: string, statusCode: number = 400, details: any = null): void => {
    res.status(statusCode).json(apiConfig.response.error(code, message, details));
  },
};

// 扩展Response接口
declare global {
  namespace Express {
    interface Response {
      sendSuccess: <T>(data: T, message?: string, statusCode?: number) => void;
      sendPaginated: <T>(data: T[], pagination: PaginationParams, message?: string) => void;
      sendCreated: <T>(data: T, message?: string) => void;
      sendNoContent: () => void;
      sendError: (code: string, message: string, statusCode?: number, details?: any) => void;
    }
  }
}

// 中间件：添加响应助手到res对象
export const addResponseHelpers = (req: Request, res: Response, next: NextFunction): void => {
  res.sendSuccess = <T>(data: T, message?: string, statusCode?: number) => 
    responseHelpers.sendSuccess(res, data, message, statusCode);
  
  res.sendPaginated = <T>(data: T[], pagination: PaginationParams, message?: string) => 
    responseHelpers.sendPaginated(res, data, pagination, message);
  
  res.sendCreated = <T>(data: T, message?: string) => 
    responseHelpers.sendCreated(res, data, message);
  
  res.sendNoContent = () => 
    responseHelpers.sendNoContent(res);
  
  res.sendError = (code: string, message: string, statusCode?: number, details?: any) => 
    responseHelpers.sendError(res, code, message, statusCode, details);
  
  next();
};

export default apiConfig;