import express, { Request, Response } from 'express'
import templateRoutes from './templates'
import marketRoutes from './market'
import { createDebugRoutes } from './debugRoutes'
import { GameObjectManager } from '../lifecycle/core/GameObjectManager'

const router = express.Router()

// 创建 GameObjectManager 实例用于调试路由
const gameObjectManager = new GameObjectManager()

// 注册路由
router.use('/templates', templateRoutes)
router.use('/market', marketRoutes)
router.use('/debug', createDebugRoutes(gameObjectManager))

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
        debug: '/debug',
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