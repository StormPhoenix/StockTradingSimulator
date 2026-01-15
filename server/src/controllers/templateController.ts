/**
 * 模板管理控制器
 * 处理股票模板和AI交易员模板的CRUD操作
 */

import { Request, Response, NextFunction } from 'express'
import templateServiceModule from '../services/templateService'
import { validators } from '../utils/validationUtils'
import type { ID } from '@shared/common'

const { stockTemplateService, aiTraderTemplateService } = templateServiceModule
const { validateStockTemplate, validateTraderTemplate } = validators

// 股票模板查询参数
interface StockTemplateQueryParams {
  page?: string
  limit?: string
  status?: string
  category?: string
  search?: string
}

// 交易员模板查询参数
interface TraderTemplateQueryParams {
  page?: string
  limit?: string
  status?: string
  riskProfile?: string
  search?: string
}

// 批量操作请求体
interface BatchDeleteRequest {
  type: 'stock' | 'trader'
  ids: string[]
}

interface BatchUpdateStatusRequest {
  type: 'stock' | 'trader'
  ids: string[]
  status: 'active' | 'inactive'
}

// 股票模板创建/更新请求体
interface StockTemplateRequest {
  name: string
  symbol: string
  issuePrice: number
  totalShares: number
  category: string
  description?: string
  status?: 'active' | 'inactive'
  [key: string]: any
}

// 交易员模板创建/更新请求体
interface TraderTemplateRequest {
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle: string
  maxPositions: number
  parameters?: Record<string, any>
  description?: string
  status?: 'active' | 'inactive'
  [key: string]: any
}

class TemplateController {
  // ==================== 股票模板管理 ====================
  
  /**
   * 获取所有股票模板
   */
  async getStockTemplates(req: Request<{}, {}, {}, StockTemplateQueryParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10', status, category, search } = req.query
      
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status: status as 'active' | 'inactive' | undefined,
        category,
        search
      }
      
      const result = await stockTemplateService.getAll(options)
      
      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 根据ID获取股票模板
   */
  async getStockTemplateById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const template = await stockTemplateService.getById(id)
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
        return
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
  async createStockTemplate(req: Request<{}, {}, StockTemplateRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // 数据验证
      const validation = validateStockTemplate(req.body)
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
        return
      }
      
      const template = await stockTemplateService.create(req.body)
      
      res.status(201).json({
        success: true,
        data: template,
        message: '股票模板创建成功'
      })
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: '股票代码已存在'
        })
        return
      }
      next(error)
    }
  }
  
  /**
   * 更新股票模板
   */
  async updateStockTemplate(req: Request<{ id: string }, {}, Partial<StockTemplateRequest>>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      
      // 数据验证
      const validation = validateStockTemplate(req.body)
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
        return
      }
      
      const template = await stockTemplateService.update(id, req.body)
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
        return
      }
      
      res.json({
        success: true,
        data: template,
        message: '股票模板更新成功'
      })
    } catch (error: any) {
      if (error.code === 11000) {
        res.status(409).json({
          success: false,
          message: '股票代码已存在'
        })
        return
      }
      next(error)
    }
  }
  
  /**
   * 删除股票模板
   */
  async deleteStockTemplate(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const result = await stockTemplateService.delete(id)
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '股票模板不存在'
        })
        return
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
  async getTraderTemplates(req: Request<{}, {}, {}, TraderTemplateQueryParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10', status, riskProfile, search } = req.query
      
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        status: status as 'active' | 'inactive' | undefined,
        riskProfile: riskProfile as any,
        search
      }
      
      const result = await aiTraderTemplateService.getAll(options)
      
      res.json({
        success: true,
        data: result.templates,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 根据ID获取AI交易员模板
   */
  async getTraderTemplateById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const template = await aiTraderTemplateService.getById(id)
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
        return
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
  async createTraderTemplate(req: Request<{}, {}, TraderTemplateRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      // 数据验证
      const validation = validateTraderTemplate(req.body)
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
        return
      }
      
      const template = await aiTraderTemplateService.create(req.body as any)
      
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
  async updateTraderTemplate(req: Request<{ id: string }, {}, Partial<TraderTemplateRequest>>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      
      // 数据验证
      const validation = validateTraderTemplate(req.body)
      if (!validation.isValid) {
        res.status(400).json({
          success: false,
          message: '数据验证失败',
          errors: validation.errors
        })
        return
      }
      
      const template = await aiTraderTemplateService.update(id, req.body as any)
      
      if (!template) {
        res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
        return
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
  async deleteTraderTemplate(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const result = await aiTraderTemplateService.delete(id)
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: 'AI交易员模板不存在'
        })
        return
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
  async batchDeleteTemplates(req: Request<{}, {}, BatchDeleteRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, ids } = req.body
      
      if (!type || !Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的模板类型和ID列表'
        })
        return
      }
      
      let result: any
      if (type === 'stock') {
        // Use individual delete calls since batchDelete doesn't exist
        const deletePromises = ids.map(id => stockTemplateService.delete(id))
        const results = await Promise.allSettled(deletePromises)
        result = { deletedCount: results.filter(r => r.status === 'fulfilled').length }
      } else if (type === 'trader') {
        // Use individual delete calls since batchDelete doesn't exist  
        const deletePromises = ids.map(id => aiTraderTemplateService.delete(id))
        const results = await Promise.allSettled(deletePromises)
        result = { deletedCount: results.filter(r => r.status === 'fulfilled').length }
      } else {
        res.status(400).json({
          success: false,
          message: '无效的模板类型'
        })
        return
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
  async batchUpdateTemplateStatus(req: Request<{}, {}, BatchUpdateStatusRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { type, ids, status } = req.body
      
      if (!type || !Array.isArray(ids) || ids.length === 0 || !status) {
        res.status(400).json({
          success: false,
          message: '请提供有效的参数'
        })
        return
      }
      
      if (!['active', 'inactive'].includes(status)) {
        res.status(400).json({
          success: false,
          message: '无效的状态值'
        })
        return
      }
      
      let result: any
      if (type === 'stock') {
        // Use individual update calls since batchUpdateStatus doesn't exist
        const updatePromises = ids.map(id => stockTemplateService.update(id, { status }))
        const results = await Promise.allSettled(updatePromises)
        result = { modifiedCount: results.filter(r => r.status === 'fulfilled').length }
      } else if (type === 'trader') {
        // Use individual update calls since batchUpdateStatus doesn't exist
        const updatePromises = ids.map(id => aiTraderTemplateService.update(id, { status }))
        const results = await Promise.allSettled(updatePromises)
        result = { modifiedCount: results.filter(r => r.status === 'fulfilled').length }
      } else {
        res.status(400).json({
          success: false,
          message: '无效的模板类型'
        })
        return
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
  async getTemplateStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simple stats implementation since getStats doesn't exist
      const stockTemplates = await stockTemplateService.getAll({ page: 1, limit: 1000 })
      const traderTemplates = await aiTraderTemplateService.getAll({ page: 1, limit: 1000 })
      
      const stockStats = {
        total: stockTemplates.pagination.total,
        active: stockTemplates.templates.filter((t: any) => t.status === 'active').length,
        inactive: stockTemplates.templates.filter((t: any) => t.status === 'inactive').length
      }
      
      const traderStats = {
        total: traderTemplates.pagination.total,
        active: traderTemplates.templates.filter((t: any) => t.status === 'active').length,
        inactive: traderTemplates.templates.filter((t: any) => t.status === 'inactive').length
      }
      
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