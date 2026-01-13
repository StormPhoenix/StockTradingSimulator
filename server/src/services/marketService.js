/**
 * 市场初始化服务
 * 负责基于模板创建市场环境，包括交易员生成、股票分配等核心业务逻辑
 */

import StockTemplate from '../models/StockTemplate.js'
import AITraderTemplate from '../models/TraderTemplate.js'
import MarketEnvironment from '../models/MarketEnvironment.js'
import AllocationService from './allocationService.js'
import MarketUtils from '../utils/marketUtils.js'

/**
 * 市场服务类
 */
class MarketService {
  constructor() {
    this.allocationService = new AllocationService()
  }

  /**
   * 创建市场环境
   * @param {Object} config - 市场配置
   * @returns {Promise<Object>} 创建的市场环境
   */
  async createMarketEnvironment(config) {
    try {
      // 验证配置
      const validation = MarketUtils.validateMarketConfig(config)
      if (!validation.valid) {
        throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
      }

      // 获取模板数据
      const { traderTemplates, stockTemplates } = await this.loadTemplates(config)

      // 生成交易员
      const traders = await this.generateTraders(config.traderConfigs, traderTemplates)

      // 生成股票
      const stocks = await this.generateStocks(config.stockTemplateIds, stockTemplates)

      // 执行股票分配
      const allocationResult = this.allocationService.allocateStocks(
        traders,
        stocks,
        config.allocationAlgorithm || 'weighted_random',
        config.seed
      )

      // 创建市场环境对象
      const marketEnvironment = await this.createMarketEnvironmentObject({
        ...config,
        traders: allocationResult.traders,
        stocks: allocationResult.stocks,
        allocationResult
      })

      return {
        success: true,
        data: marketEnvironment,
        statistics: marketEnvironment.statistics,
        warnings: validation.warnings
      }
    } catch (error) {
      throw new Error(`市场环境创建失败: ${error.message}`)
    }
  }

  /**
   * 加载模板数据
   * @param {Object} config - 配置对象
   * @returns {Promise<Object>} 模板数据
   */
  async loadTemplates(config) {
    // 获取交易员模板ID列表
    const traderTemplateIds = config.traderConfigs.map(tc => tc.templateId)
    
    // 并行加载模板
    const [traderTemplates, stockTemplates] = await Promise.all([
      AITraderTemplate.find({
        _id: { $in: traderTemplateIds },
        status: 'active'
      }),
      StockTemplate.find({
        _id: { $in: config.stockTemplateIds },
        status: 'active'
      })
    ])

    // 验证模板存在性
    if (traderTemplates.length !== traderTemplateIds.length) {
      const foundIds = traderTemplates.map(t => t._id.toString())
      const missingIds = traderTemplateIds.filter(id => !foundIds.includes(id))
      throw new Error(`未找到交易员模板: ${missingIds.join(', ')}`)
    }

    if (stockTemplates.length !== config.stockTemplateIds.length) {
      const foundIds = stockTemplates.map(t => t._id.toString())
      const missingIds = config.stockTemplateIds.filter(id => !foundIds.includes(id))
      throw new Error(`未找到股票模板: ${missingIds.join(', ')}`)
    }

    return { traderTemplates, stockTemplates }
  }

  /**
   * 生成交易员列表
   * @param {Array} traderConfigs - 交易员配置列表
   * @param {Array} traderTemplates - 交易员模板列表
   * @returns {Array} 生成的交易员列表
   */
  async generateTraders(traderConfigs, traderTemplates) {
    const traders = []

    for (const config of traderConfigs) {
      const template = traderTemplates.find(t => t._id.toString() === config.templateId)
      if (!template) {
        throw new Error(`未找到交易员模板: ${config.templateId}`)
      }

      // 为每个配置生成指定数量的交易员
      for (let i = 0; i < config.count; i++) {
        const trader = this.createTraderFromTemplate(template, i + 1, config)
        traders.push(trader)
      }
    }

    return traders
  }

  /**
   * 从模板创建交易员
   * @param {Object} template - 交易员模板
   * @param {Number} index - 序号
   * @param {Object} config - 配置
   * @returns {Object} 交易员对象
   */
  createTraderFromTemplate(template, index, config) {
    const traderId = MarketUtils.generateTraderId()
    const traderName = MarketUtils.generateTraderName(template.name, index)

    // 应用资金变化（如果配置了）
    let initialCapital = template.initialCapital
    if (config.capitalMultiplier) {
      initialCapital *= config.capitalMultiplier
    }
    if (config.capitalVariation) {
      const variation = initialCapital * config.capitalVariation * (Math.random() - 0.5) * 2
      initialCapital += variation
    }

    return {
      id: traderId,
      templateId: template._id,
      name: traderName,
      initialCapital: Math.round(initialCapital * 100) / 100,
      currentCapital: Math.round(initialCapital * 100) / 100,
      riskProfile: template.riskProfile,
      tradingStyle: template.tradingStyle,
      maxPositions: template.maxPositions,
      holdings: [],
      parameters: { ...template.parameters },
      createdAt: new Date()
    }
  }

  /**
   * 生成股票列表
   * @param {Array} stockTemplateIds - 股票模板ID列表
   * @param {Array} stockTemplates - 股票模板列表
   * @returns {Array} 生成的股票列表
   */
  async generateStocks(stockTemplateIds, stockTemplates) {
    const stocks = []

    for (const templateId of stockTemplateIds) {
      const template = stockTemplates.find(t => t._id.toString() === templateId)
      if (!template) {
        throw new Error(`未找到股票模板: ${templateId}`)
      }

      const stock = this.createStockFromTemplate(template)
      stocks.push(stock)
    }

    return stocks
  }

  /**
   * 从模板创建股票
   * @param {Object} template - 股票模板
   * @returns {Object} 股票对象
   */
  createStockFromTemplate(template) {
    const stockId = MarketUtils.generateStockId()

    return {
      id: stockId,
      templateId: template._id,
      symbol: template.symbol,
      name: template.name,
      issuePrice: template.issuePrice,
      currentPrice: template.issuePrice, // 初始价格等于发行价
      totalShares: template.totalShares,
      availableShares: template.totalShares,
      allocatedShares: 0,
      category: template.category,
      holders: [],
      createdAt: new Date()
    }
  }

  /**
   * 创建市场环境对象
   * @param {Object} params - 参数对象
   * @returns {Object} 市场环境对象
   */
  async createMarketEnvironmentObject(params) {
    const marketId = MarketUtils.generateMarketId()
    
    // 计算统计信息
    const statistics = MarketUtils.calculateMarketStatistics(params.traders, params.stocks)

    // 创建市场环境对象
    const marketEnvironment = {
      id: marketId,
      name: params.name || `Market_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '')}`,
      description: params.description || '',
      traders: params.traders,
      stocks: params.stocks,
      totalCapital: statistics.totalCapital,
      totalMarketValue: statistics.totalMarketValue,
      allocationAlgorithm: params.allocationAlgorithm || 'weighted_random',
      allocationSeed: params.allocationResult.seed,
      statistics,
      metadata: {
        createdBy: params.createdBy || 'system',
        creationConfig: {
          traderConfigs: params.traderConfigs,
          stockTemplateIds: params.stockTemplateIds,
          allocationAlgorithm: params.allocationAlgorithm
        },
        allocationResult: {
          algorithm: params.allocationResult.algorithm,
          seed: params.allocationResult.seed,
          timestamp: params.allocationResult.timestamp
        }
      },
      version: '1.0.0'
    }

    return marketEnvironment
  }

  /**
   * 验证市场环境
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  validateMarketEnvironment(marketEnvironment) {
    const errors = []
    const warnings = []

    // 基础验证
    if (!marketEnvironment.traders || marketEnvironment.traders.length === 0) {
      errors.push('市场环境必须包含至少一个交易员')
    }

    if (!marketEnvironment.stocks || marketEnvironment.stocks.length === 0) {
      errors.push('市场环境必须包含至少一只股票')
    }

    // 验证股票分配
    const stockValidation = MarketUtils.validateStockAllocation(marketEnvironment.stocks)
    errors.push(...stockValidation.errors)
    warnings.push(...stockValidation.warnings)

    // 验证交易员持仓
    const holdingValidation = MarketUtils.validateTraderHoldings(
      marketEnvironment.traders,
      marketEnvironment.stocks
    )
    errors.push(...holdingValidation.errors)
    warnings.push(...holdingValidation.warnings)

    // 验证统计信息一致性
    const expectedTotalCapital = marketEnvironment.traders.reduce(
      (sum, trader) => sum + trader.initialCapital, 0
    )
    if (Math.abs(expectedTotalCapital - marketEnvironment.totalCapital) > 0.01) {
      warnings.push('总资金统计可能不准确')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 保存市场环境到数据库
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Promise<Object>} 保存结果
   */
  async saveMarketEnvironment(marketEnvironment) {
    try {
      // 验证市场环境
      const validation = this.validateMarketEnvironment(marketEnvironment)
      if (!validation.valid) {
        throw new Error(`市场环境验证失败: ${validation.errors.join(', ')}`)
      }

      // 创建MongoDB文档
      const marketDoc = new MarketEnvironment(marketEnvironment)
      const savedMarket = await marketDoc.save()

      return {
        success: true,
        data: savedMarket,
        warnings: validation.warnings
      }
    } catch (error) {
      throw new Error(`保存市场环境失败: ${error.message}`)
    }
  }

  /**
   * 获取市场环境列表
   * @param {Object} query - 查询条件
   * @param {Object} options - 查询选项
   * @returns {Promise<Object>} 查询结果
   */
  async getMarketEnvironments(query = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sort = { createdAt: -1 },
        populate = false
      } = options

      const skip = (page - 1) * limit

      let queryBuilder = MarketEnvironment.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)

      if (populate) {
        queryBuilder = queryBuilder
          .populate('traders.templateId', 'name riskProfile')
          .populate('stocks.templateId', 'name symbol category')
      }

      const [markets, total] = await Promise.all([
        queryBuilder.exec(),
        MarketEnvironment.countDocuments(query)
      ])

      return {
        success: true,
        data: markets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    } catch (error) {
      throw new Error(`获取市场环境列表失败: ${error.message}`)
    }
  }

  /**
   * 根据ID获取市场环境
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 市场环境对象
   */
  async getMarketEnvironmentById(id) {
    try {
      const market = await MarketEnvironment.findOne({ id })
        .populate('traders.templateId', 'name riskProfile tradingStyle')
        .populate('stocks.templateId', 'name symbol category')

      if (!market) {
        throw new Error(`未找到市场环境: ${id}`)
      }

      return {
        success: true,
        data: market
      }
    } catch (error) {
      throw new Error(`获取市场环境失败: ${error.message}`)
    }
  }

  /**
   * 删除市场环境
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 删除结果
   */
  async deleteMarketEnvironment(id) {
    try {
      const result = await MarketEnvironment.deleteOne({ id })

      if (result.deletedCount === 0) {
        throw new Error(`未找到市场环境: ${id}`)
      }

      return {
        success: true,
        message: '市场环境删除成功'
      }
    } catch (error) {
      throw new Error(`删除市场环境失败: ${error.message}`)
    }
  }

  /**
   * 导出市场环境为JSON
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 导出数据
   */
  async exportMarketEnvironment(id) {
    try {
      const result = await this.getMarketEnvironmentById(id)
      const market = result.data

      // 创建导出格式的数据
      const exportData = {
        id: market.id,
        name: market.name,
        description: market.description,
        version: market.version,
        createdAt: market.createdAt,
        traders: market.traders.map(trader => ({
          id: trader.id,
          name: trader.name,
          initialCapital: trader.initialCapital,
          riskProfile: trader.riskProfile,
          tradingStyle: trader.tradingStyle,
          holdings: trader.holdings
        })),
        stocks: market.stocks.map(stock => ({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          totalShares: stock.totalShares,
          issuePrice: stock.issuePrice,
          category: stock.category,
          holders: stock.holders
        })),
        statistics: market.statistics,
        metadata: market.metadata
      }

      return {
        success: true,
        data: exportData,
        filename: `market_${market.id}_${new Date().toISOString().slice(0, 10)}.json`
      }
    } catch (error) {
      throw new Error(`导出市场环境失败: ${error.message}`)
    }
  }

  /**
   * 从JSON导入市场环境
   * @param {Object} importData - 导入数据
   * @returns {Promise<Object>} 导入结果
   */
  async importMarketEnvironment(importData) {
    try {
      // 验证导入数据格式
      this.validateImportData(importData)

      // 生成新的ID避免冲突
      const newId = MarketUtils.generateMarketId()
      const newName = `${importData.name}_imported_${Date.now()}`

      // 重构市场环境对象
      const marketEnvironment = {
        id: newId,
        name: newName,
        description: importData.description || '',
        traders: importData.traders.map(trader => ({
          ...trader,
          id: MarketUtils.generateTraderId() // 生成新的交易员ID
        })),
        stocks: importData.stocks.map(stock => ({
          ...stock,
          id: MarketUtils.generateStockId() // 生成新的股票ID
        })),
        totalCapital: importData.statistics?.totalCapital || 0,
        totalMarketValue: importData.statistics?.totalMarketValue || 0,
        allocationAlgorithm: 'imported',
        statistics: importData.statistics || {},
        metadata: {
          ...importData.metadata,
          importedAt: new Date(),
          originalId: importData.id
        },
        version: importData.version || '1.0.0'
      }

      // 保存到数据库
      const saveResult = await this.saveMarketEnvironment(marketEnvironment)

      return {
        success: true,
        data: saveResult.data,
        message: '市场环境导入成功',
        warnings: saveResult.warnings
      }
    } catch (error) {
      throw new Error(`导入市场环境失败: ${error.message}`)
    }
  }

  /**
   * 验证导入数据格式
   * @param {Object} data - 导入数据
   */
  validateImportData(data) {
    if (!data || typeof data !== 'object') {
      throw new Error('导入数据格式无效')
    }

    const requiredFields = ['id', 'traders', 'stocks']
    for (const field of requiredFields) {
      if (!data[field]) {
        throw new Error(`缺少必需字段: ${field}`)
      }
    }

    if (!Array.isArray(data.traders) || data.traders.length === 0) {
      throw new Error('交易员数据无效或为空')
    }

    if (!Array.isArray(data.stocks) || data.stocks.length === 0) {
      throw new Error('股票数据无效或为空')
    }

    // 验证数据完整性
    for (const trader of data.traders) {
      if (!trader.id || !trader.name || typeof trader.initialCapital !== 'number') {
        throw new Error('交易员数据格式无效')
      }
    }

    for (const stock of data.stocks) {
      if (!stock.id || !stock.symbol || !stock.name || typeof stock.totalShares !== 'number') {
        throw new Error('股票数据格式无效')
      }
    }
  }
}

export default MarketService