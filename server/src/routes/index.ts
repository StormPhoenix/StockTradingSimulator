import express, { Request, Response } from 'express'
import templateRoutes from './templates'
import gameInstanceRoutes from './gameInstanceRoutes'
import { createDebugRoutes } from './debugRoutes'
import timeSeriesRoutes from './timeSeriesRoutes'
import { LifecycleManagerService } from '../services/lifecycleManagerService'

/**
 * 创建主路由
 * @param lifecycleService 生命周期管理服务实例
 * @returns Express Router 实例
 */
export function createRoutes(lifecycleService: LifecycleManagerService) {
  const router = express.Router()

  // 注册业务路由
  router.use('/templates', templateRoutes)
  router.use('/market-instances', gameInstanceRoutes)
  router.use('/time-series', timeSeriesRoutes)
  
  // 注册调试路由（从生命周期服务获取管理器实例）
  router.use('/debug', createDebugRoutes(lifecycleService.getManager()))

  // API信息
  router.get('/', (_req: Request, res: Response): void => {
    res.json({
      success: true,
      data: {
        name: 'Stock Trading Simulator API',
        version: '1.0.0',
        description: '股票交易模拟器 - 市场配置与环境初始化API',
        endpoints: {
          health: '/health',
          templates: '/templates',
          'market-instances': '/market-instances',
          'time-series': '/time-series',
          debug: '/debug',
        },
        documentation: 'https://api-docs.stocksimulator.com',
      },
      timestamp: new Date().toISOString(),
    })
  })

  // 测试路由
  router.get('/test', (_req: Request, res: Response): void => {
    res.json({
      success: true,
      message: 'API is working correctly',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    })
  })

  return router
}

// 为了向后兼容，保留默认导出（但这个将在 app.ts 中被新的 createRoutes 替代）
const router = express.Router()
export default router