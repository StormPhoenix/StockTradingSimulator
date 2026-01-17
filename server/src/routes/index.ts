import express, { Request, Response } from 'express'
import templateRoutes from './templates'
import marketRoutes from './market'

const router = express.Router()

// 注册路由
router.use('/templates', templateRoutes)
router.use('/market', marketRoutes)

// API信息
router.get('/', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      name: 'Stock Trading Simulator API',
      version: '1.0.0',
      description: '股票交易模拟器 - 市场配置与环境初始化API',
      endpoints: {
        health: '/health',
        templates: '/templates',
        market: '/market',
      },
      documentation: 'https://api-docs.stocksimulator.com',
    },
    timestamp: new Date().toISOString(),
  })
})

// 测试路由
router.get('/test', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'API is working correctly',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

export default router