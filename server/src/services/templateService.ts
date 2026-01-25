import type { ID, PaginationParams, ApiResponse, Timestamp } from '@shared/common'
import type { RiskProfile, TradingStyle } from '@shared/market'
import type { AITraderTemplateDocument, StockTemplateDocument } from '@shared/models'
import { ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler'
import StockTemplate from '../models/stockTemplate'
import AITraderTemplate from '../models/traderTemplate'
import MarketEnvironment from '../models/marketTemplate'
import MarketUtils from '../utils/marketUtils'
import AllocationService from './allocationService'
import { validators } from '../utils/validationUtils'
import type { Document } from 'mongoose'

// 分页查询参数接口
interface StockTemplateQueryParams extends PaginationParams {
  search?: string
  category?: string
  status?: 'active' | 'inactive'
  sort?: string
  order?: string
}

interface AITraderTemplateQueryParams extends PaginationParams {
  search?: string
  riskProfile?: RiskProfile
  tradingStyle?: TradingStyle
  status?: 'active' | 'inactive'
  sort?: string
  order?: string
}

// 分页结果接口
interface PaginationResult<T> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface StockTemplateListResult extends PaginationResult<StockTemplateDocument> {
  templates: Array<StockTemplateDocument & { id: string; issuePrice: number }>
}

interface AITraderTemplateListResult extends PaginationResult<AITraderTemplateDocument> {
  templates: Array<AITraderTemplateDocument & { id: string; initialCapital: number }>
}

// 创建数据接口
interface CreateStockTemplateData {
  name: string
  symbol: string
  issuePrice: number
  totalShares: number
  category: string
  description?: string
  status?: 'active' | 'inactive'
}

interface CreateAITraderTemplateData {
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  parameters: Record<string, any>
  description?: string
  status?: 'active' | 'inactive'
}

// 资金统计接口
interface CapitalStatistics {
  minCapital: number
  maxCapital: number
  avgCapital: number
  totalTemplates: number
}

// ==================== 市场环境模板相关接口 ====================

// 分配算法类型
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

// 股票模板服务
export class StockTemplateService {
  // 获取股票模板列表
  async getAll(params: StockTemplateQueryParams = {}): Promise<StockTemplateListResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = '',
        category,
        status = 'active',
      } = params as StockTemplateQueryParams

      // 构建查询条件
      const query: Record<string, any> = { status }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { symbol: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      }

      if (category) {
        query.category = category
      }

      // 构建排序
      const sortObj: Record<string, 1 | -1> = {}
      sortObj[sort] = order === 'desc' ? -1 : 1

      // 执行查询
      const skip = (page - 1) * limit
      const [templates, total] = await Promise.all([
        StockTemplate.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
        StockTemplate.countDocuments(query),
      ])

      return {
        templates: templates.map((template: any) => ({
          ...template,
          id: template._id.toString(),
          issuePrice: parseFloat(template.issuePrice.toString()),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      console.error('Error getting stock templates:', error)
      throw error
    }
  }

  // 根据ID获取股票模板
  async getById(id: ID): Promise<StockTemplateDocument & { id: string; issuePrice: number }> {
    try {
      const template = await StockTemplate.findById(id).lean()
      if (!template) {
        throw new NotFoundError('股票模板')
      }

      return {
        ...template,
        id: template._id.toString(),
        issuePrice: parseFloat(template.issuePrice.toString()),
      } as unknown as StockTemplateDocument & { id: string; issuePrice: number }
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('股票模板')
      }
      throw error
    }
  }

  // 创建股票模板
  async create(data: CreateStockTemplateData, createdBy: ID | null = null): Promise<any> {
    try {
      // 验证数据
      const validation = validators.validateStockTemplate(data)
      if (!validation.isValid) {
        const errorDetails = validation.getAllErrors().map(err => ({
          field: err.field,
          message: err.message,
          value: (data as any)[err.field],
        }))
        throw new ValidationError('股票模板数据验证失败', errorDetails)
      }

      // 检查股票代码是否已存在
      const existingTemplate = await StockTemplate.findBySymbol(data.symbol)
      if (existingTemplate) {
        throw new ConflictError(`股票代码 '${data.symbol}' 已存在`)
      }

      // 创建模板
      const templateData = {
        ...data,
        symbol: data.symbol.toUpperCase(),
        createdBy,
      }

      const template = new StockTemplate(templateData)
      await template.save()

      return template.toSafeObject()
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictError(`股票代码 '${data.symbol}' 已存在`)
      }
      throw error
    }
  }

  // 更新股票模板
  async update(
    id: ID,
    data: Partial<CreateStockTemplateData>,
    updatedBy: ID | null = null
  ): Promise<any> {
    try {
      // 验证数据
      const validation = validators.validateStockTemplate(data)
      if (!validation.isValid) {
        const errorDetails = validation.getAllErrors().map(err => ({
          field: err.field,
          message: err.message,
          value: (data as any)[err.field],
        }))
        throw new ValidationError('股票模板数据验证失败', errorDetails)
      }

      // 检查模板是否存在
      const existingTemplate = await StockTemplate.findById(id)
      if (!existingTemplate) {
        throw new NotFoundError('股票模板')
      }

      // 如果更新股票代码，检查是否冲突
      if (data.symbol && data.symbol.toUpperCase() !== existingTemplate.symbol) {
        const conflictTemplate = await StockTemplate.findBySymbol(data.symbol)
        if (conflictTemplate) {
          throw new ConflictError(`股票代码 '${data.symbol}' 已存在`)
        }
      }

      // 更新数据
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date(),
      }

      if (data.symbol) {
        updateData.symbol = data.symbol.toUpperCase()
      }

      const template = await StockTemplate.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })

      return template?.toSafeObject()
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('股票模板')
      }
      if (error.code === 11000) {
        throw new ConflictError(`股票代码 '${data.symbol}' 已存在`)
      }
      throw error
    }
  }

  // 删除股票模板
  async delete(id: ID): Promise<boolean> {
    try {
      const template = await StockTemplate.findById(id)
      if (!template) {
        throw new NotFoundError('股票模板')
      }

      await template.deleteOne()
      return true
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('股票模板')
      }
      throw error
    }
  }

  // 根据分类获取模板
  async getByCategory(category: string, options: Record<string, any> = {}): Promise<any[]> {
    const templates = await StockTemplate.findByCategory(category, options)
    return templates.map((template: any) => template.toSafeObject())
  }

  // 搜索模板
  async search(searchTerm: string, options: Record<string, any> = {}): Promise<any[]> {
    const templates = await StockTemplate.searchByName(searchTerm, options)
    return templates.map((template: any) => template.toSafeObject())
  }
}

// AI交易员模板服务
export class AITraderTemplateService {
  // 获取AI交易员模板列表
  async getAll(params: AITraderTemplateQueryParams = {}): Promise<AITraderTemplateListResult> {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = '',
        riskProfile,
        tradingStyle,
        status = 'active',
      } = params as AITraderTemplateQueryParams

      // 构建查询条件
      const query: Record<string, any> = { status }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ]
      }

      if (riskProfile) {
        query.riskProfile = riskProfile
      }

      if (tradingStyle) {
        query.tradingStyle = tradingStyle
      }

      // 构建排序
      const sortObj: Record<string, 1 | -1> = {}
      sortObj[sort] = order === 'desc' ? -1 : 1

      // 执行查询
      const skip = (page - 1) * limit
      const [templates, total] = await Promise.all([
        AITraderTemplate.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
        AITraderTemplate.countDocuments(query),
      ])

      return {
        templates: templates.map((template: any) => ({
          ...template,
          id: template._id.toString(),
          initialCapital: parseFloat(template.initialCapital.toString()),
        })),
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      }
    } catch (error) {
      console.error('Error getting AI trader templates:', error)
      throw error
    }
  }

  // 根据ID获取AI交易员模板
  async getById(
    id: ID
  ): Promise<AITraderTemplateDocument & { id: string; initialCapital: number }> {
    try {
      const template = await AITraderTemplate.findById(id).lean()
      if (!template) {
        throw new NotFoundError('AI交易员模板')
      }

      return {
        ...template,
        id: template._id.toString(),
        initialCapital: parseFloat(template.initialCapital.toString()),
      } as unknown as AITraderTemplateDocument & { id: string; initialCapital: number }
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }

  // 创建AI交易员模板
  async create(data: CreateAITraderTemplateData, createdBy: ID | null = null): Promise<any> {
    // 验证数据
    const validation = validators.validateTraderTemplate(data)
    if (!validation.isValid) {
      const errorDetails = validation.getAllErrors().map(err => ({
        field: err.field,
        message: err.message,
        value: (data as any)[err.field],
      }))
      throw new ValidationError('AI交易员模板数据验证失败', errorDetails)
    }

    // 创建模板
    const templateData = {
      ...data,
      createdBy,
    }

    const template = new AITraderTemplate(templateData)
    await template.save()

    return template.toSafeObject()
  }

  // 更新AI交易员模板
  async update(
    id: ID,
    data: Partial<CreateAITraderTemplateData>,
    updatedBy: ID | null = null
  ): Promise<any> {
    try {
      // 验证数据
      const validation = validators.validateTraderTemplate(data)
      if (!validation.isValid) {
        const errorDetails = validation.getAllErrors().map(err => ({
          field: err.field,
          message: err.message,
          value: (data as any)[err.field],
        }))
        throw new ValidationError('AI交易员模板数据验证失败', errorDetails)
      }

      // 检查模板是否存在
      const existingTemplate = await AITraderTemplate.findById(id)
      if (!existingTemplate) {
        throw new NotFoundError('AI交易员模板')
      }

      // 更新数据
      const updateData: Record<string, any> = {
        ...data,
        updatedAt: new Date(),
      }

      const template = await AITraderTemplate.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })

      return template?.toSafeObject()
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }

  // 删除AI交易员模板
  async delete(id: ID): Promise<boolean> {
    try {
      const template = await AITraderTemplate.findById(id)
      if (!template) {
        throw new NotFoundError('AI交易员模板')
      }

      await template.deleteOne()
      return true
    } catch (error: any) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }

  // 根据风险偏好获取模板
  async getByRiskProfile(
    riskProfile: 'conservative' | 'moderate' | 'aggressive',
    options: Record<string, any> = {}
  ): Promise<any[]> {
    const templates = await AITraderTemplate.findByRiskProfile(riskProfile, options)
    return templates.map((template: any) => template.toSafeObject())
  }

  // 根据交易风格获取模板
  async getByTradingStyle(
    tradingStyle: 'day_trading' | 'swing_trading' | 'position_trading',
    options: Record<string, any> = {}
  ): Promise<any[]> {
    const templates = await AITraderTemplate.findByTradingStyle(tradingStyle, options)
    return templates.map((template: any) => template.toSafeObject())
  }

  // 获取资金范围统计
  async getCapitalStatistics(): Promise<CapitalStatistics> {
    const stats = await AITraderTemplate.getCapitalRange()
    return (
      stats[0] || {
        minCapital: 0,
        maxCapital: 0,
        avgCapital: 0,
        totalTemplates: 0,
      }
    )
  }
}

// ==================== 市场环境模板服务 ====================

/**
 * 市场环境模板服务类
 * 负责基于模板创建市场环境，包括交易员生成、股票分配等核心业务逻辑
 */
export class MarketEnvironmentTemplateService {
  private allocationService: AllocationService

  constructor() {
    this.allocationService = new AllocationService()
  }

  /**
   * 创建市场环境模板
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
        message: '市场模板创建成功',
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
    // 计算统计信息
    const statistics = MarketUtils.calculateMarketStatistics(params.traders, params.stocks)

    // 创建市场环境对象
    const marketEnvironment: MarketEnvironmentObject = {
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
   * 获取市场环境列表 (简化版本，只包含核心方法)
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
   */
  async getMarketEnvironmentById(id: string): Promise<ApiResponse<Document>> {
    try {
      const market = await MarketEnvironment.findById(id)
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
   */
  async deleteMarketEnvironment(id: string): Promise<ApiResponse<null>> {
    try {
      const marketTemplate = await MarketEnvironment.findById(id)
      if (!marketTemplate) {
        throw new Error(`未找到市场环境: ${id}`)
      }

      await marketTemplate.deleteOne()

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
   * 更新市场环境
   */
  async updateMarketEnvironment(id: string, updateData: Partial<MarketConfig>): Promise<ApiResponse<Document>> {
    try {
      // 获取现有市场环境
      const existingMarket = await MarketEnvironment.findById(id)
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
   * 导出市场环境为JSON
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
}

// 创建服务实例
export const stockTemplateService = new StockTemplateService()
export const aiTraderTemplateService = new AITraderTemplateService()
export const marketEnvironmentTemplateService = new MarketEnvironmentTemplateService()

export default {
  stockTemplateService,
  aiTraderTemplateService,
  marketEnvironmentTemplateService,
}
