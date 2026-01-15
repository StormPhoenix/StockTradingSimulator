/**
 * 市场环境路由
 * 提供市场环境初始化、管理和导出导入的RESTful API
 */

import express from 'express'
import marketController from '../controllers/marketController'
import { validateRequest } from '../middleware/validation'
import Joi from 'joi'

const router = express.Router()

// 验证规则
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

const querySchema = Joi.object({
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
  sort: Joi.string().optional().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').optional().default('desc'),
  populate: Joi.boolean().optional().default(false),
  search: Joi.string().optional()
})

const batchDeleteSchema = Joi.object({
  ids: Joi.array().items(Joi.string()).min(1).required()
})

// 路由定义
router.post('/', validateRequest(createMarketSchema), marketController.createMarketEnvironment)
router.get('/', validateRequest({ query: querySchema }), marketController.getMarketEnvironments)
router.get('/stats/summary', marketController.getMarketStatsSummary)
router.get('/stats/trends', marketController.getMarketTrends)
router.post('/import', marketController.importMarketEnvironment)
router.delete('/batch', validateRequest(batchDeleteSchema), marketController.batchDeleteMarketEnvironments)
router.get('/:id', marketController.getMarketEnvironmentById)
router.put('/:id', validateRequest(updateMarketSchema), marketController.updateMarketEnvironment)
router.delete('/:id', marketController.deleteMarketEnvironment)
router.get('/:id/export', marketController.exportMarketEnvironment)
router.post('/:id/validate', marketController.validateMarketEnvironment)

export default router