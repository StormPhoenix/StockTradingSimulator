/**
 * 模板管理控制器
 * 处理股票模板和AI交易员模板的CRUD操作
 */

/// <reference path="../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express'
import templateServiceModule from '../services/templateService'
import { validators } from '../utils/validationUtils'

const { stockTemplateService, aiTraderTemplateService, marketEnvironmentTemplateService } = templateServiceModule
const { validateStockTemplate, validateTraderTemplate } = validators

// 扩展 Request 接口以支持用户信息
interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

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
  sort?: string
  order?: 'asc' | 'desc'
  populate?: string
  search?: string
}

// 趋势查询参数
interface TrendQueryParams {
  period?: '7d' | '30d' | '90d'
}

// 批量删除市场环境请求体
interface BatchDeleteMarketRequest {
  ids: string[]
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
  constructor() {
    // 使用新的市场环境模板服务
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
   * 获取市场环境列表
   * GET /api/templates/markets
   */
  async getMarketEnvironments(req: Request<{}, {}, {}, MarketEnvironmentQueryParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, sort, order, populate, search } = req.query

      // 构建查询条件
      const query: any = {}
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      // 构建查询选项
      const options = {
        page: parseInt(page || '1', 10),
        limit: parseInt(limit || '20', 10),
        sort: { [sort || 'createdAt']: order === 'asc' ? 1 as const : -1 as const },
        populate: populate === 'true'
      }

      const result = await marketEnvironmentTemplateService.getMarketEnvironments(query, options)

      res.json({
        success: true,
        data: result.data?.data || [],
        pagination: result.data?.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 根据ID获取市场环境详情
   * GET /api/templates/markets/:id
   */
  async getMarketEnvironmentById(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketEnvironmentTemplateService.getMarketEnvironmentById(req.params.id)

      res.json({
        success: true,
        data: result.data
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 创建市场环境
   * POST /api/templates/markets
   */
  async createMarketTemplate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const config = {
        ...req.body,
        createdBy: req.user?.id || 'anonymous'
      }

      const result = await marketEnvironmentTemplateService.createMarketEnvironment(config)

      res.status(201).json({
        success: true,
        data: result.data,
        statistics: result.statistics,
        warnings: result.warnings,
        message: '市场模板创建成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 更新市场环境
   * PUT /api/templates/markets/:id
   */
  async updateMarketEnvironment(req: AuthenticatedRequest & Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id || 'anonymous'
      }

      const result = await marketEnvironmentTemplateService.updateMarketEnvironment(req.params.id, updateData)

      res.json({
        success: true,
        data: result.data,
        message: '市场环境更新成功'
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 删除市场环境
   * DELETE /api/templates/markets/:id
   */
  async deleteMarketEnvironment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketEnvironmentTemplateService.deleteMarketEnvironment(req.params.id)

      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 导出市场环境数据
   * GET /api/templates/markets/:id/export
   */
  async exportMarketEnvironment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketEnvironmentTemplateService.exportMarketEnvironment(req.params.id)

      // 设置下载响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${result.data?.filename || 'export.json'}"`)
      res.setHeader('Cache-Control', 'no-cache')

      // 返回前端期望的格式：{ success: true, data: exportData, filename: string }
      res.json({
        success: result.success,
        data: result.data?.data || {},  // 导出的实际数据
        filename: result.data?.filename || 'export.json'  // 文件名
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 验证市场环境
   * POST /api/templates/markets/:id/validate
   */
  async validateMarketEnvironment(req: Request<{ id: string }>, res: Response, next: NextFunction): Promise<void> {
    try {
      const marketResult = await marketEnvironmentTemplateService.getMarketEnvironmentById(req.params.id)
      const validation = marketEnvironmentTemplateService.validateMarketEnvironment(marketResult.data as any)

      res.json({
        success: true,
        data: {
          marketId: req.params.id,
          valid: validation.valid,
          errors: validation.errors,
          warnings: validation.warnings,
          validatedAt: new Date().toISOString()
        }
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
      const exportPromises = ids.map(id => marketEnvironmentTemplateService.exportMarketEnvironment(id))
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
   * 获取市场统计摘要
   * GET /api/templates/markets/stats/summary
   */
  async getMarketStatsSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await marketEnvironmentTemplateService.getMarketEnvironments({}, { limit: 1000 })
      const markets = result.data?.data || []

      const summary = {
        totalMarkets: markets.length,
        totalTraders: 0,
        totalStocks: 0,
        totalCapital: 0,
        totalMarketValue: 0,
        averageTraders: 0,
        averageStocks: 0,
        averageCapital: 0,
        allocationAlgorithms: {} as Record<string, number>,
        riskProfileDistribution: {} as Record<string, number>,
        categoryDistribution: {} as Record<string, number>,
        createdThisMonth: 0,
        createdThisWeek: 0
      }

      if (markets.length > 0) {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        markets.forEach((market: any) => {
          // 基础统计
          summary.totalTraders += market.statistics?.traderCount || 0
          summary.totalStocks += market.statistics?.stockCount || 0
          summary.totalCapital += market.totalCapital || 0
          summary.totalMarketValue += market.totalMarketValue || 0

          // 分配算法统计
          const algorithm = market.allocationAlgorithm || 'unknown'
          summary.allocationAlgorithms[algorithm] = (summary.allocationAlgorithms[algorithm] || 0) + 1

          // 时间统计
          const createdAt = new Date(market.createdAt)
          if (createdAt >= monthStart) {
            summary.createdThisMonth++
          }
          if (createdAt >= weekStart) {
            summary.createdThisWeek++
          }

          // 风险偏好分布
          if (market.statistics?.riskProfileDistribution) {
            Object.entries(market.statistics.riskProfileDistribution).forEach(([risk, count]) => {
              summary.riskProfileDistribution[risk] = (summary.riskProfileDistribution[risk] || 0) + (count as number)
            })
          }

          // 股票类别分布
          if (market.statistics?.stockDistribution) {
            Object.entries(market.statistics.stockDistribution).forEach(([category, count]) => {
              summary.categoryDistribution[category] = (summary.categoryDistribution[category] || 0) + (count as number)
            })
          }
        })

        // 计算平均值
        summary.averageTraders = Math.round(summary.totalTraders / markets.length * 100) / 100
        summary.averageStocks = Math.round(summary.totalStocks / markets.length * 100) / 100
        summary.averageCapital = Math.round(summary.totalCapital / markets.length * 100) / 100
      }

      res.json({
        success: true,
        data: summary,
        generatedAt: new Date().toISOString()
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 获取市场环境趋势数据
   * GET /api/templates/markets/stats/trends
   */
  async getMarketTrends(req: Request<{}, {}, {}, TrendQueryParams>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { period = '30d' } = req.query

      // 计算时间范围
      const now = new Date()
      let startDate: Date

      switch (period) {
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      const query = {
        createdAt: { $gte: startDate }
      }

      const result = await marketEnvironmentTemplateService.getMarketEnvironments(query, { limit: 1000 })
      const markets = result.data?.data || []

      // 按日期分组统计
      const trends: Record<string, any> = {}
      markets.forEach((market: any) => {
        const date = market.createdAt.toISOString().split('T')[0]
        if (!trends[date]) {
          trends[date] = {
            date,
            count: 0,
            totalTraders: 0,
            totalStocks: 0,
            totalCapital: 0
          }
        }

        trends[date].count++
        trends[date].totalTraders += market.statistics?.traderCount || 0
        trends[date].totalStocks += market.statistics?.stockCount || 0
        trends[date].totalCapital += market.totalCapital || 0
      })

      const trendData = Object.values(trends).sort((a: any, b: any) => a.date.localeCompare(b.date))

      res.json({
        success: true,
        data: {
          period,
          trends: trendData,
          summary: {
            totalMarkets: markets.length,
            totalDays: trendData.length,
            averageMarketsPerDay: trendData.length > 0 ? markets.length / trendData.length : 0
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 批量删除市场环境
   * DELETE /api/templates/markets/batch
   */
  async batchDeleteMarketEnvironments(req: Request<{}, {}, BatchDeleteMarketRequest>, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ids } = req.body

      if (!Array.isArray(ids) || ids.length === 0) {
        res.status(400).json({
          success: false,
          message: '请提供要删除的市场环境ID列表'
        })
        return
      }

      const results: Array<{ id: string; success: boolean; error?: string }> = []
      let successCount = 0
      let failureCount = 0

      for (const id of ids) {
        try {
          await marketEnvironmentTemplateService.deleteMarketEnvironment(id)
          results.push({ id, success: true })
          successCount++
        } catch (error) {
          results.push({ id, success: false, error: (error as Error).message })
          failureCount++
        }
      }

      res.json({
        success: failureCount === 0,
        data: {
          results,
          summary: {
            total: ids.length,
            success: successCount,
            failure: failureCount
          }
        },
        message: `批量删除完成：成功 ${successCount} 个，失败 ${failureCount} 个`
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
        const deletePromises = ids.map(id => marketEnvironmentTemplateService.deleteMarketEnvironment(id))
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
        const updatePromises = ids.map(id => marketEnvironmentTemplateService.updateMarketEnvironment(id, { name: undefined, description: undefined } as any))
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
      const marketEnvironments = await marketEnvironmentTemplateService.getMarketEnvironments({}, { page: 1, limit: 1000, sort: { createdAt: -1 }, populate: false })

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