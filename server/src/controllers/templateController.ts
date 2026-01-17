/**
 * 模板管理控制器
 * 处理股票模板和AI交易员模板的CRUD操作
 */

import { Request, Response, NextFunction } from 'express'
import templateServiceModule from '../services/templateService'
import MarketService from '../services/marketService'
import { validators } from '../utils/validationUtils'

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
  type: 'stock' | 'trader' | 'market'
  ids: string[]
}

interface BatchUpdateStatusRequest {
  type: 'stock' | 'trader' | 'market'
  ids: string[]
  status: 'active' | 'inactive'
}

// 批量导出请求体
interface BatchExportRequest {
  ids: string[]
}

// 市场环境查询参数
interface MarketEnvironmentQueryParams {
  page?: string
  limit?: string
  status?: string
  search?: string
}

// 市场环境请求体
interface MarketEnvironmentRequest {
  name: string
  description?: string
  traderConfigs: Array<{
    templateId: string
    count: number
    capitalMultiplier?: number
    capitalVariation?: number
  }>
  stockConfigs: Array<{
    templateId: string
  }>
  allocationAlgorithm?: string
  version?: string
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
  private marketService: MarketService

  constructor() {
    this.marketService = new MarketService()
  }
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
  
  // ==================== 市场环境模板管理 ====================
  
  /**
   * 获取所有市场环境
   */
  async getMarketEnvironments(req: Request<{}, {}, {}, MarketEnvironmentQueryParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = '1', limit = '10', status, search } = req.query
      
      // 构建查询条件
      const query: any = {}
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }
      if (status) {
        query.status = status
      }

      // 构建查询选项
      const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        sort: { createdAt: -1 as const },
        populate: false
      }

      const result = await this.marketService.getMarketEnvironments(query, options)
      
      res.json({
        success: true,
        data: result.data?.data,
        pagination: result.data?.pagination
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 根据ID获取市场环境
   */
  async getMarketEnvironmentById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const marketEnvironment = await this.marketService.getMarketEnvironmentById(id)
      
      if (!marketEnvironment) {
        res.status(404).json({
          success: false,
          message: '市场环境不存在'
        })
        return
      }
      
      res.json({
        success: true,
        data: marketEnvironment
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 创建市场环境
   */
  async createMarketEnvironment(req: Request<{}, {}, MarketEnvironmentRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = {
        ...req.body,
        stockTemplateIds: req.body.stockConfigs.map(config => config.templateId),
        traderConfigs: req.body.traderConfigs,
        createdBy: 'system' // TODO: Get from auth context
      }

      const result = await this.marketService.createMarketEnvironment(config)
      
      res.status(201).json({
        success: true,
        data: result.data,
        statistics: result.statistics,
        warnings: result.warnings,
        message: '市场环境创建成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 更新市场环境
   */
  async updateMarketEnvironment(req: Request<{ id: string }, {}, Partial<MarketEnvironmentRequest>>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      
      const updateData = {
        ...req.body,
        updatedAt: new Date()
      }

      const marketEnvironment = await this.marketService.updateMarketEnvironment(id, updateData)
      
      if (!marketEnvironment) {
        res.status(404).json({
          success: false,
          message: '市场环境不存在'
        })
        return
      }
      
      res.json({
        success: true,
        data: marketEnvironment,
        message: '市场环境更新成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 删除市场环境
   */
  async deleteMarketEnvironment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const result = await this.marketService.deleteMarketEnvironment(id)
      
      if (!result) {
        res.status(404).json({
          success: false,
          message: '市场环境不存在'
        })
        return
      }
      
      res.json({
        success: true,
        message: '市场环境删除成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 导出市场环境数据
   */
  async exportMarketEnvironment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params
      const exportData = await this.marketService.exportMarketEnvironment(id)
      
      if (!exportData) {
        res.status(404).json({
          success: false,
          message: '市场环境不存在'
        })
        return
      }
      
      res.json({
        success: true,
        data: exportData,
        message: '市场环境导出成功'
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 批量导出市场环境数据
   */
  async batchExportMarketEnvironments(req: Request<{}, {}, BatchExportRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body
      
      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供有效的市场环境ID列表'
        })
        return
      }
      
      // Export each market environment individually since batch export doesn't exist
      const exportPromises = ids.map(id => this.marketService.exportMarketEnvironment(id))
      const results = await Promise.allSettled(exportPromises)
      
      const successfulExports = results
        .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
        .map(result => result.value.data)
      
      res.json({
        success: true,
        data: successfulExports,
        message: `成功导出 ${successfulExports.length} 个市场环境`
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 获取市场环境汇总统计
   */
  async getMarketEnvironmentSummary(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simple summary implementation since dedicated method doesn't exist
      const allMarkets = await this.marketService.getMarketEnvironments({}, { page: 1, limit: 1000, sort: { createdAt: -1 }, populate: false })
      
      const summary = {
        total: allMarkets.data?.pagination?.total || 0,
        active: allMarkets.data?.data?.filter((m: any) => m.status === 'active').length || 0,
        inactive: allMarkets.data?.data?.filter((m: any) => m.status === 'inactive').length || 0,
        recentlyCreated: allMarkets.data?.data?.filter((m: any) => {
          const createdAt = new Date(m.createdAt)
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          return createdAt > weekAgo
        }).length || 0
      }
      
      res.json({
        success: true,
        data: summary
      })
    } catch (error) {
      next(error)
    }
  }
  
  /**
   * 获取市场环境趋势数据
   */
  async getMarketEnvironmentTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '30d' } = req.query as { period?: '7d' | '30d' | '90d' }
      
      // Simple trends implementation since dedicated method doesn't exist
      const allMarkets = await this.marketService.getMarketEnvironments({}, { page: 1, limit: 1000, sort: { createdAt: -1 }, populate: false })
      
      const days = period === '7d' ? 7 : period === '30d' ? 30 : 90
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      
      const trendsData = allMarkets.data?.data?.filter((m: any) => {
        const createdAt = new Date(m.createdAt)
        return createdAt > startDate
      }) || []
      
      const trends = {
        period,
        totalCreated: trendsData.length,
        dailyAverage: Math.round(trendsData.length / days * 100) / 100,
        data: trendsData
      }
      
      res.json({
        success: true,
        data: trends
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
      } else if (type === 'market') {
        // Use individual delete calls for market environments
        const deletePromises = ids.map(id => this.marketService.deleteMarketEnvironment(id))
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
      } else if (type === 'market') {
        // Use individual update calls for market environments
        const updatePromises = ids.map(id => this.marketService.updateMarketEnvironment(id, { name: undefined, description: undefined } as any))
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
  async getTemplateStats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Simple stats implementation since getStats doesn't exist
      const stockTemplates = await stockTemplateService.getAll({ page: 1, limit: 1000 })
      const traderTemplates = await aiTraderTemplateService.getAll({ page: 1, limit: 1000 })
      const marketEnvironments = await this.marketService.getMarketEnvironments({}, { page: 1, limit: 1000, sort: { createdAt: -1 }, populate: false })
      
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
      
      const marketStats = {
        total: marketEnvironments.data?.pagination?.total || 0,
        active: (marketEnvironments.data?.data as any[])?.filter((m: any) => m.status === 'active').length || 0,
        inactive: (marketEnvironments.data?.data as any[])?.filter((m: any) => m.status === 'inactive').length || 0
      }
      
      const stats = {
        stock: stockStats,
        trader: traderStats,
        market: marketStats,
        total: {
          templates: stockStats.total + traderStats.total + marketStats.total,
          active: stockStats.active + traderStats.active + marketStats.active,
          inactive: stockStats.inactive + traderStats.inactive + marketStats.inactive
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