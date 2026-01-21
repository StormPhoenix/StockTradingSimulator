/**
 * 模板管理路由
 * 提供股票模板、AI交易员模板和市场环境模板的RESTful API
 */

import express, { Request, Response, NextFunction } from 'express'
import templateController from '../controllers/templateController'
import marketController from '../controllers/marketController'
import { validateRequest, commonSchemas } from '../middleware/validation'
import Joi from 'joi'

const router = express.Router()

// ==================== 验证规则 ====================

// 市场环境创建验证规则
const createMarketSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  traderConfigs: Joi.array().items(
    Joi.object({
      templateId: Joi.string().required(),
      count: Joi.number().integer().min(1).max(1000).required(),
      capitalMultiplier: Joi.number().min(0.1).max(10).optional().default(1),
      capitalVariation: Joi.number().min(0).max(1).optional().default(0)
    })
  ).min(1).required(),
  stockTemplateIds: Joi.array().items(Joi.string()).min(1).required(),
  allocationAlgorithm: Joi.string().valid('weighted_random', 'equal_distribution', 'risk_based').optional().default('weighted_random'),
  seed: Joi.number().integer().min(0).optional(),
  createdBy: Joi.string().optional()
})

// 市场环境更新验证规则
const updateMarketSchema = Joi.object({
  name: Joi.string().min(1).max(200).optional(),
  description: Joi.string().max(1000).optional(),
  traderConfigs: Joi.array().items(
    Joi.object({
      templateId: Joi.string().required(),
      count: Joi.number().integer().min(1).max(1000).required(),
      capitalMultiplier: Joi.number().min(0.1).max(10).optional().default(1),
      capitalVariation: Joi.number().min(0).max(1).optional().default(0)
    })
  ).min(1).optional(),
  stockTemplateIds: Joi.array().items(Joi.string()).min(1).optional(),
  allocationAlgorithm: Joi.string().valid('weighted_random', 'equal_distribution', 'risk_based').optional()
})

// 查询验证规则
const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  sort: Joi.string().optional().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').optional().default('desc'),
  populate: Joi.boolean().optional().default(false),
  search: Joi.string().optional()
})

// 批量删除验证规则
const batchDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required()
})

// ==================== 模板API根路径 ====================

/**
 * @route GET /api/v1/templates
 * @desc 获取模板API信息和可用端点
 */
router.get('/', (_req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      name: 'Templates API',
      description: '股票模板、AI交易员模板和市场环境模板管理API',
      version: '1.0.0',
      endpoints: {
        stocks: {
          list: 'GET /stocks',
          detail: 'GET /stocks/:id',
          create: 'POST /stocks',
          update: 'PUT /stocks/:id',
          delete: 'DELETE /stocks/:id'
        },
        traders: {
          list: 'GET /traders',
          detail: 'GET /traders/:id', 
          create: 'POST /traders',
          update: 'PUT /traders/:id',
          delete: 'DELETE /traders/:id'
        },
        markets: {
          list: 'GET /markets',
          detail: 'GET /markets/:id',
          create: 'POST /markets',
          update: 'PUT /markets/:id',
          delete: 'DELETE /markets/:id',
          export: 'GET /markets/:id/export',
          batchExport: 'POST /markets/batch/export'
        },
        batch: {
          delete: 'POST /batch/delete',
          updateStatus: 'POST /batch/status'
        },
        stats: 'GET /stats'
      },
      documentation: 'https://api-docs.stocksimulator.com/templates'
    },
    timestamp: new Date().toISOString()
  })
})

// ==================== 股票模板路由 ====================

/**
 * @route GET /api/templates/stocks
 * @desc 获取股票模板列表
 */
router.get('/stocks', templateController.getStockTemplates)

/**
 * @route GET /api/templates/stocks/:id
 * @desc 根据ID获取股票模板详情
 */
router.get('/stocks/:id', templateController.getStockTemplateById)

/**
 * @route POST /api/templates/stocks
 * @desc 创建新的股票模板
 */
router.post('/stocks', 
  validateRequest({ body: commonSchemas.stockTemplate }),
  templateController.createStockTemplate
)

/**
 * @route PUT /api/templates/stocks/:id
 * @desc 更新股票模板
 */
router.put('/stocks/:id',
  validateRequest({ body: commonSchemas.stockTemplate }),
  templateController.updateStockTemplate
)

/**
 * @route DELETE /api/templates/stocks/:id
 * @desc 删除股票模板
 */
router.delete('/stocks/:id', templateController.deleteStockTemplate)

// ==================== AI交易员模板路由 ====================

/**
 * @route GET /api/templates/traders
 * @desc 获取AI交易员模板列表
 */
router.get('/traders', templateController.getTraderTemplates)

/**
 * @route GET /api/templates/traders/:id
 * @desc 根据ID获取AI交易员模板详情
 */
router.get('/traders/:id', templateController.getTraderTemplateById)

/**
 * @route POST /api/templates/traders
 * @desc 创建新的AI交易员模板
 */
router.post('/traders',
  validateRequest({ body: commonSchemas.traderTemplate }),
  templateController.createTraderTemplate
)

/**
 * @route PUT /api/templates/traders/:id
 * @desc 更新AI交易员模板
 */
router.put('/traders/:id',
  validateRequest({ body: commonSchemas.traderTemplate }),
  templateController.updateTraderTemplate
)

/**
 * @route DELETE /api/templates/traders/:id
 * @desc 删除AI交易员模板
 */
router.delete('/traders/:id', templateController.deleteTraderTemplate)

// ==================== 市场环境模板路由 ====================

/**
 * @route GET /api/templates/markets
 * @desc 获取市场环境列表
 */
router.get('/markets', validateRequest({ query: querySchema }), marketController.getMarketEnvironments)

/**
 * @route GET /api/templates/markets/stats/summary
 * @desc 获取市场环境统计摘要
 */
router.get('/markets/stats/summary', marketController.getMarketStatsSummary)

/**
 * @route GET /api/templates/markets/stats/trends
 * @desc 获取市场环境趋势数据
 */
router.get('/markets/stats/trends', marketController.getMarketTrends)

/**
 * @route DELETE /api/templates/markets/batch
 * @desc 批量删除市场环境
 */
router.delete('/markets/batch', validateRequest({ body: batchDeleteSchema }), marketController.batchDeleteMarketEnvironments)

/**
 * @route GET /api/templates/markets/:id
 * @desc 根据ID获取市场环境详情
 */
router.get('/markets/:id', marketController.getMarketEnvironmentById)

/**
 * @route POST /api/templates/markets
 * @desc 创建新的市场环境
 */
router.post('/markets',
  validateRequest({ body: createMarketSchema }),
  marketController.createMarketEnvironment
)

/**
 * @route PUT /api/templates/markets/:id
 * @desc 更新市场环境
 */
router.put('/markets/:id',
  validateRequest({ body: updateMarketSchema }),
  marketController.updateMarketEnvironment
)

/**
 * @route DELETE /api/templates/markets/:id
 * @desc 删除市场环境
 */
router.delete('/markets/:id', marketController.deleteMarketEnvironment)

/**
 * @route GET /api/templates/markets/:id/export
 * @desc 导出市场环境数据
 */
router.get('/markets/:id/export', marketController.exportMarketEnvironment)

/**
 * @route POST /api/templates/markets/:id/validate
 * @desc 验证市场环境
 */
router.post('/markets/:id/validate', marketController.validateMarketEnvironment)

// ==================== 批量操作路由 ====================

/**
 * @route POST /api/templates/batch/delete
 * @desc 批量删除模板
 */
router.post('/batch/delete',
  validateRequest({ body: commonSchemas.batchDelete }),
  templateController.batchDeleteTemplates
)

/**
 * @route POST /api/templates/batch/status
 * @desc 批量更新模板状态
 */
router.post('/batch/status',
  validateRequest({ body: commonSchemas.batchStatus }),
  templateController.batchUpdateTemplateStatus
)

// ==================== 统计信息路由 ====================

/**
 * @route GET /api/templates/stats
 * @desc 获取模板统计信息
 */
router.get('/stats', templateController.getTemplateStats)

// ==================== 参数验证中间件 ====================

/**
 * 验证模板ID参数
 */
router.param('id', (_req: Request, res: Response, next: NextFunction, id: string): void => {
  // 验证MongoDB ObjectId格式
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    res.status(400).json({
      success: false,
      message: '无效的模板ID格式'
    })
    return
  }
  next()
})

// ==================== 错误处理 ====================

/**
 * 模板路由错误处理中间件
 */
router.use((error: any, _req: Request, res: Response, next: NextFunction): void => {
  console.error('Template Route Error:', error)
  
  // 数据库连接错误
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    res.status(503).json({
      success: false,
      message: '数据库服务暂时不可用',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
    return
  }
  
  // 验证错误
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: Object.values(error.errors).map((err: any) => err.message)
    })
    return
  }
  
  // 转换错误
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: '无效的数据格式'
    })
    return
  }
  
  // 默认错误处理
  next(error)
})

export default router