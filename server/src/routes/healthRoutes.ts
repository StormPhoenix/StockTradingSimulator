/**
 * Health Check Routes
 * 
 * @description Health check endpoints for monitoring server status,
 * database connectivity, and system health.
 */

import express, { Request, Response } from 'express'
import os from 'os'
import { asyncHandler } from '../middleware/errorHandler'
import { isDatabaseConnected, getDatabaseInfo } from '../config/database'

const router = express.Router()

/**
 * Basic health check endpoint
 * 
 * @route GET /health
 * @access Public
 */
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime()
  
  // Check database connectivity
  const dbConnected = isDatabaseConnected()
  const dbInfo = getDatabaseInfo()
  
  // Calculate response time
  const [seconds, nanoseconds] = process.hrtime(startTime)
  const responseTime = seconds * 1000 + nanoseconds / 1000000 // Convert to milliseconds
  
  // Determine overall health status
  const isHealthy = dbConnected
  const status = isHealthy ? 'OK' : 'ERROR'
  const httpStatus = isHealthy ? 200 : 503
  
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: `${responseTime.toFixed(2)}ms`,
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    services: {
      database: {
        connectionStatus: dbConnected ? 'connected' : 'disconnected',
        ...dbInfo
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        external: Math.round(process.memoryUsage().external / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        usage: process.cpuUsage(),
        loadAverage: (process.platform !== 'win32' && typeof os.loadavg === 'function') 
          ? os.loadavg() 
          : 'not available'
      }
    }
  })
}))

/**
 * Detailed health check endpoint
 * 
 * @route GET /health/detailed
 * @access Public
 */
router.get('/detailed', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const startTime = process.hrtime()
  
  // Collect system information
  const dbConnected = isDatabaseConnected()
  const dbInfo = getDatabaseInfo()
  
  // Calculate response time
  const [seconds, nanoseconds] = process.hrtime(startTime)
  const responseTime = seconds * 1000 + nanoseconds / 1000000
  
  // Get process information
  const memoryUsage = process.memoryUsage()
  const cpuUsage = process.cpuUsage()
  
  // Determine health status
  const isHealthy = dbConnected
  const status = isHealthy ? 'OK' : 'ERROR'
  const httpStatus = isHealthy ? 200 : 503
  
  res.status(httpStatus).json({
    status,
    timestamp: new Date().toISOString(),
    responseTime: `${responseTime.toFixed(2)}ms`,
    system: {
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      pid: process.pid,
      version: '1.0.0'
    },
    services: {
      database: {
        connectionStatus: dbConnected ? 'connected' : 'disconnected',
        ...dbInfo
      }
    },
    resources: {
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
        loadAverage: (process.platform !== 'win32' && typeof os.loadavg === 'function') 
          ? os.loadavg() 
          : 'not available'
      }
    },
    checks: {
      database: dbConnected,
      memory: memoryUsage.heapUsed < memoryUsage.heapTotal * 0.9, // Less than 90% heap usage
      uptime: process.uptime() > 0
    }
  })
}))

/**
 * Readiness probe endpoint (for Kubernetes/container orchestration)
 * 
 * @route GET /health/ready
 * @access Public
 */
router.get('/ready', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const dbConnected = isDatabaseConnected()
  
  if (dbConnected) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    })
  } else {
    res.status(503).json({
      status: 'not ready',
      reason: 'Database not connected',
      timestamp: new Date().toISOString()
    })
  }
}))

/**
 * Liveness probe endpoint (for Kubernetes/container orchestration)
 * 
 * @route GET /health/live
 * @access Public
 */
router.get('/live', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Simple liveness check - if we can respond, we're alive
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
}))

export default router