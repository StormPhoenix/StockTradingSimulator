/**
 * Express.js Application Setup
 * 
 * @description Main Express application configuration with middleware,
 * routes, and error handling setup.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { setupSecurity } from './middleware/security.js';

// Import routes
import healthRoutes from './routes/healthRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

// Load environment variables
dotenv.config();

/**
 * Create and configure Express application
 * 
 * @returns {express.Application} Configured Express app
 */
const createApp = () => {
  const app = express();
  
  // Trust proxy (for rate limiting behind reverse proxy)
  app.set('trust proxy', 1);
  
  // Security middleware
  setupSecurity(app);
  
  // Logging middleware
  if (process.env.NODE_ENV !== 'test') {
    const logFormat = process.env.LOG_FORMAT || 'combined';
    app.use(morgan(logFormat));
  }
  
  // CORS configuration
  const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
  };
  app.use(cors(corsOptions));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      timestamp: new Date().toISOString()
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
  
  // Apply rate limiting to API routes only
  app.use('/api/', limiter);
  
  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // API routes
  const apiVersion = process.env.API_VERSION || 'v1';
  const apiPrefix = process.env.API_PREFIX || '/api';
  
  // Health check route (no rate limiting)
  app.use('/health', healthRoutes);
  
  // API routes with versioning
  app.use(`${apiPrefix}/${apiVersion}/projects`, projectRoutes);
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      success: true,
      message: 'Stock Trading Simulator API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        health: '/health',
        projects: `${apiPrefix}/${apiVersion}/projects`
      }
    });
  });
  
  // 404 handler for undefined routes
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
      path: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
  
  // Global error handler (must be last)
  app.use(errorHandler);
  
  return app;
};

export default createApp;