/**
 * 模板管理控制器
 * 处理股票模板和AI交易员模板的CRUD操作
 */

import templateServiceModule from '../services/templateService.js'
import { validators } from '../utils/validationUtils.js'

const { stockTemplateService, aiTraderTemplateService } = templateServiceModule
const { validateStockTemplate, validateTraderTemplate } = validators

class TemplateController {
  // ==================== 股票模板管理 ====================
  
  /**
   * 获取所有股票模板
   */
  async getStockTemplates(req, res, next) {
    try {
      const { page = 1, limit = 10, status, category, search } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        category,
        search
      }
      
      const result = await stockTemplateService.getAll(options)
      
      res.json({
        success: true,
        data: result.templates,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 根据ID获取股票模板
   */
  async getStockTemplateById(req, res, next) {
    try {
      const { id } = req.params
      const template = await stockTemplateService.getById(id)
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
      }
      
      res.json({
        success: true,
        data: template
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 创建股票模板
   */
  async createStockTemplate(req, res, next) {
    try {
      // 数据验证
      const validation = validateStockTemplate(req.body)
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
      }
      
      const template = await stockTemplateService.create(req.body)
      
      res.status(201).json({
        success: true,
        data: template,
        message: '股票模板创建成功'
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: '股票代码已存在'
        })
      }
      next(error)
    }
  }
  
  /**
   * 更新股票模板
   */
  async updateStockTemplate(req, res, next) {
    try {
      const { id } = req.params
      
      // 数据验证
      const validation = validateStockTemplate(req.body, true) // partial validation
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
      }
      
      const template = await stockTemplateService.update(id, req.body)
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
      }
      
      res.json({
        success: true,
        data: template,
        message: '股票模板更新成功'
      })
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: '股票代码已存在'
        })
      }
      next(error)
    }
  }
  
  /**
   * 删除股票模板
   */
  async deleteStockTemplate(req, res, next) {
    try {
      const { id } = req.params
      const result = await stockTemplateService.delete(id)
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
      }
      
      res.json({
        success: true,
        message: '股票模板删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // ==================== AI交易员模板管理 ====================
  
  /**
   * 获取所有AI交易员模板
   */
  async getTraderTemplates(req, res, next) {
    try {
      const { page = 1, limit = 10, status, riskProfile, search } = req.query
      
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        riskProfile,
        search
      }
      
      const result = await aiTraderTemplateService.getAll(options)
      
      res.json({
        success: true,
        data: result.templates,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          pages: result.pages
        }
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 根据ID获取AI交易员模板
   */
  async getTraderTemplateById(req, res, next) {
    try {
      const { id } = req.params
      const template = await aiTraderTemplateService.getById(id)
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
      }
      
      res.json({
        success: true,
        data: template
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 创建AI交易员模板
   */
  async createTraderTemplate(req, res, next) {
    try {
      // 数据验证
      const validation = validateTraderTemplate(req.body)
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
      }
      
      const template = await aiTraderTemplateService.create(req.body)
      
      res.status(201).json({
        success: true,
        data: template,
        message: 'AI交易员模板创建成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 更新AI交易员模板
   */
  async updateTraderTemplate(req, res, next) {
    try {
      const { id } = req.params
      
      // 数据验证
      const validation = validateTraderTemplate(req.body, true) // partial validation
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
      }
      
      const template = await aiTraderTemplateService.update(id, req.body)
      
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
      }
      
      res.json({
        success: true,
        data: template,
        message: 'AI交易员模板更新成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 删除AI交易员模板
   */
  async deleteTraderTemplate(req, res, next) {
    try {
      const { id } = req.params
      const result = await aiTraderTemplateService.delete(id)
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
      }
      
      res.json({
        success: true,
        message: 'AI交易员模板删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  // ==================== 批量操作 ====================
  
  /**
   * 批量删除模板
   */
  async batchDeleteTemplates(req, res, next) {
    try {
      const { type, ids } = req.body
      
      if (!type || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的模板类型和ID列表'
        })
      }
      
      let result
      if (type === 'stock') {
        result = await stockTemplateService.batchDelete(ids)
      } else if (type === 'trader') {
        result = await aiTraderTemplateService.batchDelete(ids)
      } else {
        return res.status(400).json({
          success: false,
          message: '无效的模板类型'
        })
      }
      
      res.json({
        success: true,
        data: result,
        message: `成功删除 ${result.deletedCount} 个模板`
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 批量更新模板状态
   */
  async batchUpdateTemplateStatus(req, res, next) {
    try {
      const { type, ids, status } = req.body
      
      if (!type || !Array.isArray(ids) || ids.length === 0 || !status) {
        return res.status(400).json({
          success: false,
          message: '请提供有效的参数'
        })
      }
      
      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: '无效的状态值'
        })
      }
      
      let result
      if (type === 'stock') {
        result = await stockTemplateService.batchUpdateStatus(ids, status)
      } else if (type === 'trader') {
        result = await aiTraderTemplateService.batchUpdateStatus(ids, status)
      } else {
        return res.status(400).json({
          success: false,
          message: '无效的模板类型'
        })
      }
      
      res.json({
        success: true,
        data: result,
        message: `成功更新 ${result.modifiedCount} 个模板状态`
      })
    } catch (error) {
      next(error)
    }
  }
  
  // ==================== 统计信息 ====================
  
  /**
   * 获取模板统计信息
   */
  async getTemplateStats(req, res, next) {
    try {
      const stockStats = await stockTemplateService.getStats()
      const traderStats = await aiTraderTemplateService.getStats()
      
      const stats = {
        stock: stockStats,
        trader: traderStats,
        total: {
          templates: stockStats.total + traderStats.total,
          active: stockStats.active + traderStats.active,
          inactive: stockStats.inactive + traderStats.inactive
        }
      }
      
      res.json({
        success: true,
        data: stats
      })
    } catch (error) {
      next(error)
    }
  }
}

export default new TemplateController()