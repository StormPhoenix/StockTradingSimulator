import type { ID, PaginationParams } from '@shared/common'
import type { RiskProfile, TradingStyle } from '@shared/market'
import type { AITraderTemplateDocument, StockTemplateDocument } from '@shared/models'
import { ConflictError, NotFoundError, ValidationError } from '../middleware/errorHandler'
import StockTemplate from '../models/stockTemplate'
import AITraderTemplate from '../models/traderTemplate'
import { validators } from '../utils/validationUtils'

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

// 创建服务实例
export const stockTemplateService = new StockTemplateService()
export const aiTraderTemplateService = new AITraderTemplateService()

export default {
  StockTemplateService,
  AITraderTemplateService,
  stockTemplateService,
  aiTraderTemplateService,
}
