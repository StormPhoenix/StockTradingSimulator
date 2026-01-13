/**
 * 模板管理路由
 * 提供股票模板和AI交易员模板的RESTful API
 */

import express from 'express';
import templateController from '../controllers/templateController.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// ==================== 股票模板路由 ====================

/**
 * @route GET /api/templates/stocks
 * @desc 获取股票模板列表
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 10)
 * @query {string} status - 状态筛选 (active/inactive)
 * @query {string} category - 分类筛选
 * @query {string} search - 搜索关键词
 */
router.get('/stocks', templateController.getStockTemplates);

/**
 * @route GET /api/templates/stocks/:id
 * @desc 根据ID获取股票模板详情
 * @param {string} id - 模板ID
 */
router.get('/stocks/:id', templateController.getStockTemplateById);

/**
 * @route POST /api/templates/stocks
 * @desc 创建新的股票模板
 * @body {object} stockTemplate - 股票模板数据
 */
router.post('/stocks', 
  validateRequest('stockTemplate'),
  templateController.createStockTemplate
);

/**
 * @route PUT /api/templates/stocks/:id
 * @desc 更新股票模板
 * @param {string} id - 模板ID
 * @body {object} stockTemplate - 更新的股票模板数据
 */
router.put('/stocks/:id',
  validateRequest('stockTemplateUpdate'),
  templateController.updateStockTemplate
);

/**
 * @route DELETE /api/templates/stocks/:id
 * @desc 删除股票模板
 * @param {string} id - 模板ID
 */
router.delete('/stocks/:id', templateController.deleteStockTemplate);

// ==================== AI交易员模板路由 ====================

/**
 * @route GET /api/templates/traders
 * @desc 获取AI交易员模板列表
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 10)
 * @query {string} status - 状态筛选 (active/inactive)
 * @query {string} riskProfile - 风险偏好筛选
 * @query {string} search - 搜索关键词
 */
router.get('/traders', templateController.getTraderTemplates);

/**
 * @route GET /api/templates/traders/:id
 * @desc 根据ID获取AI交易员模板详情
 * @param {string} id - 模板ID
 */
router.get('/traders/:id', templateController.getTraderTemplateById);

/**
 * @route POST /api/templates/traders
 * @desc 创建新的AI交易员模板
 * @body {object} traderTemplate - AI交易员模板数据
 */
router.post('/traders',
  validateRequest('traderTemplate'),
  templateController.createTraderTemplate
);

/**
 * @route PUT /api/templates/traders/:id
 * @desc 更新AI交易员模板
 * @param {string} id - 模板ID
 * @body {object} traderTemplate - 更新的AI交易员模板数据
 */
router.put('/traders/:id',
  validateRequest('traderTemplateUpdate'),
  templateController.updateTraderTemplate
);

/**
 * @route DELETE /api/templates/traders/:id
 * @desc 删除AI交易员模板
 * @param {string} id - 模板ID
 */
router.delete('/traders/:id', templateController.deleteTraderTemplate);

// ==================== 批量操作路由 ====================

/**
 * @route POST /api/templates/batch/delete
 * @desc 批量删除模板
 * @body {object} batchDelete - 批量删除参数
 * @body {string} batchDelete.type - 模板类型 (stock/trader)
 * @body {string[]} batchDelete.ids - 模板ID数组
 */
router.post('/batch/delete',
  validateRequest('batchDelete'),
  templateController.batchDeleteTemplates
);

/**
 * @route POST /api/templates/batch/status
 * @desc 批量更新模板状态
 * @body {object} batchStatus - 批量状态更新参数
 * @body {string} batchStatus.type - 模板类型 (stock/trader)
 * @body {string[]} batchStatus.ids - 模板ID数组
 * @body {string} batchStatus.status - 新状态 (active/inactive)
 */
router.post('/batch/status',
  validateRequest('batchStatus'),
  templateController.batchUpdateTemplateStatus
);

// ==================== 统计信息路由 ====================

/**
 * @route GET /api/templates/stats
 * @desc 获取模板统计信息
 */
router.get('/stats', templateController.getTemplateStats);

// ==================== 参数验证中间件 ====================

/**
 * 验证模板ID参数
 */
router.param('id', (req, res, next, id) => {
  // 验证MongoDB ObjectId格式
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      success: false,
      message: '无效的模板ID格式'
    });
  }
  next();
});

// ==================== 错误处理 ====================

/**
 * 模板路由错误处理中间件
 */
router.use((error, req, res, next) => {
  console.error('Template Route Error:', error);
  
  // 数据库连接错误
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return res.status(503).json({
      success: false,
      message: '数据库服务暂时不可用',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
  
  // 验证错误
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: Object.values(error.errors).map(err => err.message)
    });
  }
  
  // 转换错误
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '无效的数据格式'
    });
  }
  
  // 默认错误处理
  next(error);
});

export default router;