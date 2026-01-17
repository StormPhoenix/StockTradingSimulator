/**
 * 市场初始化服务
 * 负责基于模板创建市场环境，包括交易员生成、股票分配等核心业务逻辑
 */

import { ValidationError } from '../middleware/errorHandler'
import MarketEnvironment from '../models/MarketEnvironment'
import StockTemplate from '../models/StockTemplate'
import AITraderTemplate from '../models/TraderTemplate'
import MarketUtils from '../utils/marketUtils'
import AllocationService from './allocationService'
import type { ID, ApiResponse, Timestamp } from '@shared/common'
import type { StockTemplateDocument, AITraderTemplateDocument } from '@shared/models'
import type { RiskProfile, TradingStyle } from '@shared/market'
import type { Document } from 'mongoose'

// 导入分配算法类型
type AllocationAlgorithm = 'weighted_random' | 'equal_distribution' | 'risk_based'

// 市场配置接口
export interface MarketConfig {
  name?: string
  description?: string
  traderConfigs: TraderConfig[]
  stockTemplateIds: string[]
  allocationAlgorithm?: string
  seed?: number
  createdBy?: string
}

// 交易员配置接口
export interface TraderConfig {
  templateId: string
  count: number
  capitalMultiplier?: number
  capitalVariation?: number
}

// 生成的交易员接口
export interface GeneratedTrader {
  id: ID
  templateId: string
  name: string
  initialCapital: number
  currentCapital: number
  riskProfile: RiskProfile
  tradingStyle: TradingStyle
  maxPositions: number
  holdings: any[]
  parameters: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// 生成的股票接口
export interface GeneratedStock {
  id: ID
  templateId: string
  symbol: string
  name: string
  sector: string
  issuePrice: number
  currentPrice: number
  previousClose: number
  volume: number
  totalShares: number
  availableShares: number
  allocatedShares: number
  category: string
  isActive: boolean
  holders: any[]
  createdAt: Date
  updatedAt: Date
}

// 市场环境对象接口
export interface MarketEnvironmentObject {
  id: ID
  name: string
  description: string
  traders: GeneratedTrader[]
  stocks: GeneratedStock[]
  totalCapital: number
  totalMarketValue: number
  allocationAlgorithm: string
  allocationSeed: string
  statistics: MarketStatistics
  metadata: MarketMetadata
  version: string
}

// 市场统计接口
export interface MarketStatistics {
  totalCapital: number
  totalMarketValue: number
  traderCount: number
  stockCount: number
  averageCapitalPerTrader: number
  averageSharesPerStock: number
}

// 市场元数据接口
export interface MarketMetadata {
  createdBy: string
  creationConfig: {
    traderConfigs: TraderConfig[]
    stockTemplateIds: string[]
    allocationAlgorithm?: string
  }
  allocationResult: {
    algorithm: string
    seed: string
    timestamp: Date
  }
}

// 分配结果接口
export interface AllocationResult {
  traders: GeneratedTrader[]
  stocks: GeneratedStock[]
  algorithm: string
  seed: string
  timestamp: Date
}

// 模板数据接口
export interface TemplateData {
  traderTemplates: AITraderTemplateDocument[]
  stockTemplates: StockTemplateDocument[]
}

// 市场环境验证结果接口
export interface MarketValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 保存结果接口
export interface SaveResult {
  success: boolean
  data: Document
  warnings: string[]
}

// 导出数据接口
export interface ExportData {
  id: ID
  name: string
  description: string
  version: string
  createdAt: Date
  traders: Partial<GeneratedTrader>[]
  stocks: Partial<GeneratedStock>[]
  statistics: MarketStatistics
  metadata: MarketMetadata
}

// 导入数据接口
export interface ImportData {
  id: ID
  name: string
  description?: string
  traders: GeneratedTrader[]
  stocks: GeneratedStock[]
  statistics?: MarketStatistics
  metadata?: MarketMetadata
  version?: string
}

// 查询选项接口
export interface QueryOptions {
  page?: number
  limit?: number
  sort?: Record<string, 1 | -1>
  populate?: boolean
}

/**
 * 市场服务类
 */
class MarketService {
  private allocationService: AllocationService

  constructor() {
    this.allocationService = new AllocationService()
  }

  /**
   * 创建市场环境
   * @param config - 市场配置
   * @returns 创建的市场环境
   */
  async createMarketEnvironment(config: MarketConfig): Promise<ApiResponse<Document> & { 
    statistics?: any; 
    warnings?: string[] 
  }> {
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
        config.allocationAlgorithm as AllocationAlgorithm || 'weighted_random',
        config.seed || null
      ) as any

      // 创建市场环境对象
      const marketEnvironment = await this.createMarketEnvironmentObject({
        ...config,
        traders: allocationResult.traders,
        stocks: allocationResult.stocks,
        allocationResult: {
          traders: allocationResult.traders,
          stocks: allocationResult.stocks,
          algorithm: allocationResult.algorithm || config.allocationAlgorithm || 'weighted_random',
          seed: allocationResult.seed || (config.seed || Math.random()).toString(),
          timestamp: new Date()
        }
      })

      // 保存到数据库
      const saveResult = await this.saveMarketEnvironment(marketEnvironment)

      return {
        success: true,
        data: saveResult.data,
        message: '市场环境创建成功',
        statistics: {
          tradersGenerated: traders.length,
          stocksGenerated: stocks.length,
          totalAllocations: allocationResult.traders.reduce((sum: number, trader: any) => sum + trader.holdings.length, 0)
        },
        warnings: allocationResult.warnings || []
      }
    } catch (error) {
      // 如果是验证错误，抛出ValidationError（400状态码）
      if (error instanceof Error && (error.message.includes('配置验证失败') || error.message.includes('未找到'))) {
        throw new ValidationError(error.message)
      }
      // 其他错误继续抛出为内部错误
      throw error
    }
  }

  /**
   * 加载模板数据
   * @param config - 配置对象
   * @returns 模板数据
   */
  async loadTemplates(config: MarketConfig): Promise<TemplateData> {
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
      const foundIds = traderTemplates.map((t: any) => t._id.toString())
      const missingIds = traderTemplateIds.filter(id => !foundIds.includes(id))
      throw new Error(`未找到交易员模板: ${missingIds.join(', ')}`)
    }

    if (stockTemplates.length !== config.stockTemplateIds.length) {
      const foundIds = stockTemplates.map((t: any) => t._id.toString())
      const missingIds = config.stockTemplateIds.filter(id => !foundIds.includes(id))
      throw new Error(`未找到股票模板: ${missingIds.join(', ')}`)
    }

    return { 
      traderTemplates: traderTemplates as AITraderTemplateDocument[], 
      stockTemplates: stockTemplates as StockTemplateDocument[] 
    }
  }

  /**
   * 生成交易员列表
   * @param traderConfigs - 交易员配置列表
   * @param traderTemplates - 交易员模板列表
   * @returns 生成的交易员列表
   */
  async generateTraders(traderConfigs: TraderConfig[], traderTemplates: AITraderTemplateDocument[]): Promise<GeneratedTrader[]> {
    const traders: GeneratedTrader[] = []

    for (const config of traderConfigs) {
      const template = traderTemplates.find((t: any) => t._id.toString() === config.templateId)
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
   * @param template - 交易员模板
   * @param index - 序号
   * @param config - 配置
   * @returns 交易员对象
   */
  createTraderFromTemplate(template: AITraderTemplateDocument, index: number, config: TraderConfig): GeneratedTrader {
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
      templateId: (template as any)._id.toString(),
      name: traderName,
      initialCapital: Math.round(initialCapital * 100) / 100,
      currentCapital: Math.round(initialCapital * 100) / 100,
      riskProfile: template.riskProfile,
      tradingStyle: template.tradingStyle,
      maxPositions: template.maxPositions,
      holdings: [],
      parameters: { ...template.parameters },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 生成股票列表
   * @param stockTemplateIds - 股票模板ID列表
   * @param stockTemplates - 股票模板列表
   * @returns 生成的股票列表
   */
  async generateStocks(stockTemplateIds: string[], stockTemplates: StockTemplateDocument[]): Promise<GeneratedStock[]> {
    const stocks: GeneratedStock[] = []

    for (const templateId of stockTemplateIds) {
      const template = stockTemplates.find((t: any) => t._id.toString() === templateId)
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
   * @param template - 股票模板
   * @returns 股票对象
   */
  createStockFromTemplate(template: StockTemplateDocument): GeneratedStock {
    const stockId = MarketUtils.generateStockId()

    return {
      id: stockId,
      templateId: (template as any)._id.toString(),
      symbol: template.symbol,
      name: template.name,
      issuePrice: template.issuePrice,
      currentPrice: template.issuePrice, // 初始价格等于发行价
      totalShares: template.totalShares,
      availableShares: template.totalShares,
      allocatedShares: 0,
      category: template.category,
      sector: template.category || 'Technology',
      previousClose: template.issuePrice,
      volume: 0,
      isActive: true,
      holders: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  /**
   * 创建市场环境对象
   * @param params - 参数对象
   * @returns 市场环境对象
   */
  async createMarketEnvironmentObject(params: MarketConfig & { 
    traders: GeneratedTrader[]
    stocks: GeneratedStock[]
    allocationResult: AllocationResult
  }): Promise<MarketEnvironmentObject> {
    const marketId = MarketUtils.generateMarketId()
    
    // 计算统计信息
    const statistics = MarketUtils.calculateMarketStatistics(params.traders, params.stocks)

    // 创建市场环境对象
    const marketEnvironment: MarketEnvironmentObject = {
      id: marketId,
      name: params.name || `Market_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '')}`,
      description: params.description || '',
      traders: params.traders,
      stocks: params.stocks,
      totalCapital: statistics.totalCapital,
      totalMarketValue: statistics.totalMarketValue,
      allocationAlgorithm: params.allocationAlgorithm || 'weighted_random',
      allocationSeed: params.allocationResult.seed,
      statistics: {
        totalCapital: statistics.totalCapital,
        totalMarketValue: statistics.totalMarketValue,
        traderCount: statistics.traderCount,
        stockCount: statistics.stockCount,
        averageCapitalPerTrader: statistics.averageCapitalPerTrader,
        averageSharesPerStock: params.stocks.reduce((sum, stock) => sum + stock.totalShares, 0) / params.stocks.length
      },
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
   * @param marketEnvironment - 市场环境对象
   * @returns 验证结果
   */
  validateMarketEnvironment(marketEnvironment: MarketEnvironmentObject): MarketValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

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
   * @param marketEnvironment - 市场环境对象
   * @returns 保存结果
   */
  async saveMarketEnvironment(marketEnvironment: MarketEnvironmentObject): Promise<SaveResult> {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`保存市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 更新市场环境
   * @param id - 市场环境ID
   * @param updateData - 更新数据
   * @returns 更新结果
   */
  async updateMarketEnvironment(id: string, updateData: Partial<MarketConfig>): Promise<ApiResponse<Document>> {
    try {
      // 获取现有市场环境
      const existingMarket = await MarketEnvironment.findOne({ id })
      if (!existingMarket) {
        throw new Error(`未找到市场环境: ${id}`)
      }

      // 如果更新了配置，需要重新生成市场环境
      if (updateData.traderConfigs || updateData.stockTemplateIds) {
        // 验证配置
        const config: MarketConfig = {
          ...existingMarket.toObject(),
          ...updateData
        } as MarketConfig
        
        const validation = MarketUtils.validateMarketConfig(config)
        if (!validation.valid) {
          throw new Error(`配置验证失败: ${validation.errors.join(', ')}`)
        }

        // 获取模板数据
        const { traderTemplates, stockTemplates } = await this.loadTemplates(config)

        // 重新生成交易员和股票
        const traders = await this.generateTraders(config.traderConfigs, traderTemplates)
        const stocks = await this.generateStocks(config.stockTemplateIds, stockTemplates)

        // 重新执行股票分配
        const allocationResult = this.allocationService.allocateStocks(
          traders,
          stocks,
          config.allocationAlgorithm as AllocationAlgorithm || 'weighted_random',
          config.seed || null
        ) as any

        // 更新市场环境对象
        Object.assign(existingMarket, {
          ...updateData,
          traders: allocationResult.traders,
          stocks: allocationResult.stocks,
          updatedAt: new Date()
        })
      } else {
        // 只更新基本信息
        Object.assign(existingMarket, {
          ...updateData,
          updatedAt: new Date()
        })
      }

      // 保存更新
      const updatedMarket = await existingMarket.save()

      return {
        success: true,
        data: updatedMarket,
        message: '市场环境更新成功'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`更新市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 获取市场环境列表
   * @param query - 查询条件
   * @param options - 查询选项
   * @returns 查询结果
   */
  async getMarketEnvironments(query: Record<string, any> = {}, options: QueryOptions = {}): Promise<ApiResponse<{
    data: Document[]
    pagination: {
      page: number
      limit: number
      total: number
      pages: number
    }
  }>> {
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
        data: {
          data: markets,
          pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`获取市场环境列表失败: ${errorMessage}`)
    }
  }

  /**
   * 根据ID获取市场环境
   * @param id - 市场环境ID
   * @returns 市场环境对象
   */
  async getMarketEnvironmentById(id: string): Promise<ApiResponse<Document>> {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`获取市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 删除市场环境
   * @param id - 市场环境ID
   * @returns 删除结果
   */
  async deleteMarketEnvironment(id: string): Promise<ApiResponse<null>> {
    try {
      const result = await MarketEnvironment.deleteOne({ id })

      if (result.deletedCount === 0) {
        throw new Error(`未找到市场环境: ${id}`)
      }

      return {
        success: true,
        data: null,
        message: '市场环境删除成功'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`删除市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 导出市场环境为JSON
   * @param id - 市场环境ID
   * @returns 导出数据
   */
  async exportMarketEnvironment(id: string): Promise<ApiResponse<{
    data: ExportData
    filename: string
  }>> {
    try {
      const result = await this.getMarketEnvironmentById(id)
      const market = result.data as any

      // 创建导出格式的数据
      const exportData: ExportData = {
        id: market.id,
        name: market.name,
        description: market.description,
        version: market.version || '1.0.0',
        createdAt: market.createdAt,
        traders: (market.traders || []).map((trader: any) => ({
          id: trader.id,
          name: trader.name,
          initialCapital: trader.initialCapital,
          riskProfile: trader.riskProfile,
          tradingStyle: trader.tradingStyle,
          holdings: trader.holdings
        })),
        stocks: (market.stocks || []).map((stock: any) => ({
          id: stock.id,
          symbol: stock.symbol,
          name: stock.name,
          totalShares: stock.totalShares,
          issuePrice: stock.issuePrice,
          category: stock.category,
          holders: stock.holders
        })),
        statistics: market.statistics || {
          totalCapital: 0,
          totalMarketValue: 0,
          traderCount: 0,
          stockCount: 0,
          averageCapitalPerTrader: 0,
          averageSharesPerStock: 0
        },
        metadata: market.metadata || {
          createdBy: 'system',
          creationConfig: { traderConfigs: [], stockTemplateIds: [] },
          allocationResult: { algorithm: 'unknown', seed: '0', timestamp: new Date() }
        }
      }

      return {
        success: true,
        data: {
          data: exportData,
          filename: `market_${market.id}_${new Date().toISOString().slice(0, 10)}.json`
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`导出市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 从JSON导入市场环境
   * @param importData - 导入数据
   * @returns 导入结果
   */
  async importMarketEnvironment(importData: ImportData): Promise<ApiResponse<Document>> {
    try {
      // 验证导入数据格式
      this.validateImportData(importData)

      // 生成新的ID避免冲突
      const newId = MarketUtils.generateMarketId()
      const newName = `${importData.name}_imported_${Date.now()}`

      // 重构市场环境对象
      const marketEnvironment: MarketEnvironmentObject = {
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
        allocationSeed: 'imported',
        statistics: importData.statistics || {
          totalCapital: 0,
          totalMarketValue: 0,
          traderCount: importData.traders.length,
          stockCount: importData.stocks.length,
          averageCapitalPerTrader: 0,
          averageSharesPerStock: 0
        },
        metadata: {
          createdBy: 'system',
          creationConfig: {
            traderConfigs: [],
            stockTemplateIds: []
          },
          allocationResult: {
            algorithm: 'imported',
            seed: 'imported',
            timestamp: new Date()
          }
        },
        version: importData.version || '1.0.0'
      }

      // 保存到数据库
      const saveResult = await this.saveMarketEnvironment(marketEnvironment)

      return {
        success: true,
        data: saveResult.data,
        message: '市场环境导入成功'
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`导入市场环境失败: ${errorMessage}`)
    }
  }

  /**
   * 验证导入数据格式
   * @param data - 导入数据
   */
  validateImportData(data: any): asserts data is ImportData {
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