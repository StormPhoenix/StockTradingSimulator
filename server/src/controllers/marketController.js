/**
 * 市场环境控制器
 * 处理市场环境相关的HTTP请求
 */

import MarketService from '../services/marketService.js'

/**
 * 市场控制器类
 */
class MarketController {
  constructor() {
    this.marketService = new MarketService()
  }

  /**
   * 创建市场环境
   * POST /api/market
   */
  async createMarketEnvironment(req, res, next) {
    try {
      const config = {
        ...req.body,
        createdBy: req.user?.id || 'anonymous'
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
   * 获取市场环境列表
   * GET /api/market
   */
  async getMarketEnvironments(req, res, next) {
    try {
      const { page, limit, sort, order, populate, search } = req.query
      
      // 构建查询条件
      const query = {}
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      }

      // 构建查询选项
      const options = {
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        sort: { [sort || 'createdAt']: order === 'asc' ? 1 : -1 },
        populate: populate === 'true'
      }

      const result = await this.marketService.getMarketEnvironments(query, options)
      
      res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 获取指定市场环境详情
   * GET /api/market/:id
   */
  async getMarketEnvironmentById(req, res, next) {
    try {
      const result = await this.marketService.getMarketEnvironmentById(req.params.id)
      
      res.json({
        success: true,
        data: result.data
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 更新市场环境
   * PUT /api/market/:id
   */
  async updateMarketEnvironment(req, res, next) {
    try {
      const updateData = {
        ...req.body,
        updatedBy: req.user?.id || 'anonymous'
      }

      const result = await this.marketService.updateMarketEnvironment(req.params.id, updateData)
      
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
   * DELETE /api/market/:id
   */
  async deleteMarketEnvironment(req, res, next) {
    try {
      const result = await this.marketService.deleteMarketEnvironment(req.params.id)
      
      res.json({
        success: true,
        message: result.message
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 导出市场环境
   * GET /api/market/:id/export
   */
  async exportMarketEnvironment(req, res, next) {
    try {
      const result = await this.marketService.exportMarketEnvironment(req.params.id)
      
      // 设置下载响应头
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`)
      res.setHeader('Cache-Control', 'no-cache')
      
      res.json(result.data)
    } catch (error) {
      next(error)
    }
  }

  /**
   * 导入市场环境
   * POST /api/market/import
   */
  async importMarketEnvironment(req, res, next) {
    try {
      const result = await this.marketService.importMarketEnvironment(req.body)
      
      res.status(201).json({
        success: true,
        data: result.data,
        message: result.message,
        warnings: result.warnings
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 验证市场环境
   * POST /api/market/:id/validate
   */
  async validateMarketEnvironment(req, res, next) {
    try {
      const marketResult = await this.marketService.getMarketEnvironmentById(req.params.id)
      const validation = this.marketService.validateMarketEnvironment(marketResult.data)
      
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
   * 获取市场统计摘要
   * GET /api/market/stats/summary
   */
  async getMarketStatsSummary(req, res, next) {
    try {
      const result = await this.marketService.getMarketEnvironments({}, { limit: 1000 })
      
      const summary = {
        totalMarkets: result.data.length,
        totalTraders: 0,
        totalStocks: 0,
        totalCapital: 0,
        totalMarketValue: 0,
        averageTraders: 0,
        averageStocks: 0,
        averageCapital: 0,
        allocationAlgorithms: {},
        riskProfileDistribution: {},
        categoryDistribution: {},
        createdThisMonth: 0,
        createdThisWeek: 0
      }

      if (result.data.length > 0) {
        const now = new Date()
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        result.data.forEach(market => {
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
              summary.riskProfileDistribution[risk] = (summary.riskProfileDistribution[risk] || 0) + count
            })
          }

          // 股票类别分布
          if (market.statistics?.stockDistribution) {
            Object.entries(market.statistics.stockDistribution).forEach(([category, count]) => {
              summary.categoryDistribution[category] = (summary.categoryDistribution[category] || 0) + count
            })
          }
        })

        // 计算平均值
        summary.averageTraders = Math.round(summary.totalTraders / result.data.length * 100) / 100
        summary.averageStocks = Math.round(summary.totalStocks / result.data.length * 100) / 100
        summary.averageCapital = Math.round(summary.totalCapital / result.data.length * 100) / 100
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
   * GET /api/market/stats/trends
   */
  async getMarketTrends(req, res, next) {
    try {
      const { period = '30d' } = req.query
      
      // 计算时间范围
      const now = new Date()
      let startDate
      
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

      const result = await this.marketService.getMarketEnvironments(query, { limit: 1000 })
      
      // 按日期分组统计
      const trends = {}
      result.data.forEach(market => {
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

      const trendData = Object.values(trends).sort((a, b) => a.date.localeCompare(b.date))

      res.json({
        success: true,
        data: {
          period,
          trends: trendData,
          summary: {
            totalMarkets: result.data.length,
            totalDays: trendData.length,
            averageMarketsPerDay: trendData.length > 0 ? result.data.length / trendData.length : 0
          }
        }
      })
    } catch (error) {
      next(error)
    }
  }

  /**
   * 批量删除市场环境
   * DELETE /api/market/batch
   */
  async batchDeleteMarketEnvironments(req, res, next) {
    try {
      const { ids } = req.body
      
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: '请提供要删除的市场环境ID列表'
        })
      }

      const results = []
      let successCount = 0
      let failureCount = 0

      for (const id of ids) {
        try {
          await this.marketService.deleteMarketEnvironment(id)
          results.push({ id, success: true })
          successCount++
        } catch (error) {
          results.push({ id, success: false, error: error.message })
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
}

// 创建控制器实例
const marketController = new MarketController()

// 导出控制器方法
export default {
  createMarketEnvironment: marketController.createMarketEnvironment.bind(marketController),
  getMarketEnvironments: marketController.getMarketEnvironments.bind(marketController),
  getMarketEnvironmentById: marketController.getMarketEnvironmentById.bind(marketController),
  updateMarketEnvironment: marketController.updateMarketEnvironment.bind(marketController),
  deleteMarketEnvironment: marketController.deleteMarketEnvironment.bind(marketController),
  exportMarketEnvironment: marketController.exportMarketEnvironment.bind(marketController),
  importMarketEnvironment: marketController.importMarketEnvironment.bind(marketController),
  validateMarketEnvironment: marketController.validateMarketEnvironment.bind(marketController),
  getMarketStatsSummary: marketController.getMarketStatsSummary.bind(marketController),
  getMarketTrends: marketController.getMarketTrends.bind(marketController),
  batchDeleteMarketEnvironments: marketController.batchDeleteMarketEnvironments.bind(marketController)
}