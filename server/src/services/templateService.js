import StockTemplate from '../models/StockTemplate.js'
import AITraderTemplate from '../models/TraderTemplate.js'
import { NotFoundError, ConflictError, ValidationError } from '../middleware/errorHandler.js'
import { validators, sanitizationUtils } from '../utils/validationUtils.ts'

// 股票模板服务
export class StockTemplateService {
  // 获取股票模板列表
  async getAll(params = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        search = '',
        category,
        status = 'active',
      } = sanitizationUtils.sanitizePagination(params)
      
      // 构建查询条件
      const query = { status }
      
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
      const sortObj = {}
      sortObj[sort] = order === 'desc' ? -1 : 1
      
      // 执行查询
      const skip = (page - 1) * limit
      const [templates, total] = await Promise.all([
        StockTemplate.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        StockTemplate.countDocuments(query),
      ])
      
      return {
        templates: templates.map(template => ({
          ...template,
          id: template._id,
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
  async getById(id) {
    try {
      const template = await StockTemplate.findById(id).lean()
      if (!template) {
        throw new NotFoundError('股票模板')
      }
      
      return {
        ...template,
        id: template._id,
        issuePrice: parseFloat(template.issuePrice.toString()),
      }
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('股票模板')
      }
      throw error
    }
  }
  
  // 创建股票模板
  async create(data, createdBy = null) {
    try {
      // 验证数据
      const validation = validators.validateStockTemplate(data)
      if (!validation.isValid) {
        throw new ValidationError('股票模板数据验证失败', validation.getAllErrors())
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
    } catch (error) {
      if (error.code === 11000) {
        throw new ConflictError(`股票代码 '${data.symbol}' 已存在`)
      }
      throw error
    }
  }
  
  // 更新股票模板
  async update(id, data, updatedBy = null) {
    try {
      // 验证数据
      const validation = validators.validateStockTemplate(data)
      if (!validation.isValid) {
        throw new ValidationError('股票模板数据验证失败', validation.getAllErrors())
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
      const updateData = {
        ...data,
        updatedAt: new Date(),
      }
      
      if (data.symbol) {
        updateData.symbol = data.symbol.toUpperCase()
      }
      
      const template = await StockTemplate.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      
      return template.toSafeObject()
    } catch (error) {
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
  async delete(id) {
    try {
      const template = await StockTemplate.findById(id)
      if (!template) {
        throw new NotFoundError('股票模板')
      }
      
      await template.deleteOne()
      return true
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('股票模板')
      }
      throw error
    }
  }
  
  // 根据分类获取模板
  async getByCategory(category, options = {}) {
    const templates = await StockTemplate.findByCategory(category, options)
    return templates.map(template => template.toSafeObject())
  }
  
  // 搜索模板
  async search(searchTerm, options = {}) {
    const templates = await StockTemplate.searchByName(searchTerm, options)
    return templates.map(template => template.toSafeObject())
  }
}

// AI交易员模板服务
export class AITraderTemplateService {
  // 获取AI交易员模板列表
  async getAll(params = {}) {
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
      } = sanitizationUtils.sanitizePagination(params)
      
      // 构建查询条件
      const query = { status }
      
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
      const sortObj = {}
      sortObj[sort] = order === 'desc' ? -1 : 1
      
      // 执行查询
      const skip = (page - 1) * limit
      const [templates, total] = await Promise.all([
        AITraderTemplate.find(query)
          .sort(sortObj)
          .skip(skip)
          .limit(limit)
          .lean(),
        AITraderTemplate.countDocuments(query),
      ])
      
      return {
        templates: templates.map(template => ({
          ...template,
          id: template._id,
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
  async getById(id) {
    try {
      const template = await AITraderTemplate.findById(id).lean()
      if (!template) {
        throw new NotFoundError('AI交易员模板')
      }
      
      return {
        ...template,
        id: template._id,
        initialCapital: parseFloat(template.initialCapital.toString()),
      }
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }
  
  // 创建AI交易员模板
  async create(data, createdBy = null) {
    // 验证数据
    const validation = validators.validateTraderTemplate(data)
    if (!validation.isValid) {
      throw new ValidationError('AI交易员模板数据验证失败', validation.getAllErrors())
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
  async update(id, data, updatedBy = null) {
    try {
      // 验证数据
      const validation = validators.validateTraderTemplate(data)
      if (!validation.isValid) {
        throw new ValidationError('AI交易员模板数据验证失败', validation.getAllErrors())
      }
      
      // 检查模板是否存在
      const existingTemplate = await AITraderTemplate.findById(id)
      if (!existingTemplate) {
        throw new NotFoundError('AI交易员模板')
      }
      
      // 更新数据
      const updateData = {
        ...data,
        updatedAt: new Date(),
      }
      
      const template = await AITraderTemplate.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      )
      
      return template.toSafeObject()
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }
  
  // 删除AI交易员模板
  async delete(id) {
    try {
      const template = await AITraderTemplate.findById(id)
      if (!template) {
        throw new NotFoundError('AI交易员模板')
      }
      
      await template.deleteOne()
      return true
    } catch (error) {
      if (error.name === 'CastError') {
        throw new NotFoundError('AI交易员模板')
      }
      throw error
    }
  }
  
  // 根据风险偏好获取模板
  async getByRiskProfile(riskProfile, options = {}) {
    const templates = await AITraderTemplate.findByRiskProfile(riskProfile, options)
    return templates.map(template => template.toSafeObject())
  }
  
  // 根据交易风格获取模板
  async getByTradingStyle(tradingStyle, options = {}) {
    const templates = await AITraderTemplate.findByTradingStyle(tradingStyle, options)
    return templates.map(template => template.toSafeObject())
  }
  
  // 获取资金范围统计
  async getCapitalStatistics() {
    const stats = await AITraderTemplate.getCapitalRange()
    return stats[0] || {
      minCapital: 0,
      maxCapital: 0,
      avgCapital: 0,
      totalTemplates: 0,
    }
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