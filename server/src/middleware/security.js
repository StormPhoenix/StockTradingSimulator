/**
 * Security Middleware Configuration
 * 
 * @description Security-related middleware setup including CORS,
 * helmet security headers, and other security best practices.
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

/**
 * Setup comprehensive security middleware
 * 
 * @param {express.Application} app - Express application instance
 */
export const setupSecurity = (app) => {
  // Helmet for security headers
  app.use(helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    
    // Cross-Origin Embedder Policy
    crossOriginEmbedderPolicy: false,
    
    // Cross-Origin Resource Policy
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    },
    
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false
    },
    
    // Frame Options
    frameguard: {
      action: 'deny'
    },
    
    // Hide Powered-By header
    hidePoweredBy: true,
    
    // HSTS (HTTP Strict Transport Security)
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // IE No Open
    ieNoOpen: true,
    
    // No Sniff
    noSniff: true,
    
    // Origin Agent Cluster
    originAgentCluster: true,
    
    // Permitted Cross-Domain Policies
    permittedCrossDomainPolicies: false,
    
    // Referrer Policy
    referrerPolicy: {
      policy: "no-referrer"
    },
    
    // X-XSS-Protection
    xssFilter: true
  }));
  
  // Additional security headers
  app.use((req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-API-Version', '1.0.0');
    res.setHeader('X-Response-Time', Date.now());
    
    // Prevent caching of sensitive endpoints
    if (req.path.includes('/api/')) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
    }
    
    next();
  });
};

/**
 * Create rate limiter with custom configuration
 * 
 * @param {object} options - Rate limiting options
 * @returns {Function} Rate limiting middleware
 */
export const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: Math.round(options.windowMs / 1000) || 900,
        timestamp: new Date().toISOString()
      });
    }
  };
  
  return rateLimit({ ...defaultOptions, ...options });
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests to sensitive endpoint, please try again later.',
    timestamp: new Date().toISOString()
  }
});

/**
 * Lenient rate limiter for public endpoints
 */
export const lenientRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Rate limit exceeded for public endpoint.',
    timestamp: new Date().toISOString()
  }
});

/**
 * Input sanitization middleware
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const sanitizeInput = (req, res, next) => {
  // Sanitize request body
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObject(req.query);
  }
  
  // Sanitize URL parameters
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObject(req.params);
  }
  
  next();
};

/**
 * Recursively sanitize object properties
 * 
 * @param {object} obj - Object to sanitize
 * @returns {object} Sanitized object
 */
const sanitizeObject = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return sanitizeValue(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    const sanitizedKey = sanitizeValue(key);
    sanitized[sanitizedKey] = sanitizeObject(value);
  }
  
  return sanitized;
};

/**
 * Sanitize individual values
 * 
 * @param {*} value - Value to sanitize
 * @returns {*} Sanitized value
 */
const sanitizeValue = (value) => {
  if (typeof value !== 'string') {
    return value;
  }
  
  // Remove potentially dangerous characters
  return value
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim(); // Trim whitespace
};

/**
 * Request logging middleware for security monitoring
 * 
 * @param {express.Request} req - Express request object
 * @param {express.Response} res - Express response object
 * @param {express.NextFunction} next - Express next function
 */
export const securityLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request details
  const requestInfo = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    headers: {
      'content-type': req.get('Content-Type'),
      'content-length': req.get('Content-Length'),
      'origin': req.get('Origin'),
      'referer': req.get('Referer')
    }
  };
  
  // Log suspicious patterns
  const suspiciousPatterns = [
    /\.\.\//g, // Directory traversal
    /<script/gi, // XSS attempts
    /union.*select/gi, // SQL injection
    /javascript:/gi, // JavaScript protocol
    /eval\(/gi, // Code injection
    /exec\(/gi // Command injection
  ];
  
  const requestString = JSON.stringify(requestInfo);
  const hasSuspiciousContent = suspiciousPatterns.some(pattern => 
    pattern.test(requestString)
  );
  
  if (hasSuspiciousContent) {
    console.warn('🚨 Suspicious request detected:', requestInfo);
  }
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const responseInfo = {
      ...requestInfo,
      statusCode: res.statusCode,
      duration: `${duration}ms`
    };
    
    if (res.statusCode >= 400) {
      console.warn('⚠️ Error response:', responseInfo);
    } else if (process.env.NODE_ENV === 'development') {
      console.log('📝 Request completed:', responseInfo);
    }
  });
  
  next();
};

export default {
  setupSecurity,
  createRateLimiter,
  strictRateLimiter,
  lenientRateLimiter,
  sanitizeInput,
  securityLogger
};