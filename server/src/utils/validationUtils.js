import mongoose from 'mongoose'

// 通用验证工具
export const validationUtils = {
  // 验证MongoDB ObjectId
  isValidObjectId: (id) => {
    return mongoose.Types.ObjectId.isValid(id)
  },
  
  // 验证股票代码格式
  isValidStockSymbol: (symbol) => {
    return /^[A-Z0-9]{1,10}$/.test(symbol)
  },
  
  // 验证价格格式
  isValidPrice: (price) => {
    const num = parseFloat(price)
    return !isNaN(num) && num > 0 && num <= 999999.99 && 
           (price.toString().split('.')[1] || '').length <= 2
  },
  
  // 验证股数
  isValidShares: (shares) => {
    const num = parseInt(shares)
    return Number.isInteger(num) && num > 0 && num <= 1000000000
  },
  
  // 验证资金
  isValidCapital: (capital) => {
    const num = parseFloat(capital)
    return !isNaN(num) && num >= 1000 && num <= 100000000 &&
           (capital.toString().split('.')[1] || '').length <= 2
  },
  
  // 验证名称
  isValidName: (name) => {
    return typeof name === 'string' && 
           name.trim().length >= 1 && 
           name.trim().length <= 100
  },
  
  // 验证描述
  isValidDescription: (description) => {
    return description === undefined || 
           description === null || 
           (typeof description === 'string' && description.length <= 500)
  },
  
  // 验证枚举值
  isValidEnum: (value, allowedValues) => {
    return allowedValues.includes(value)
  },
  
  // 验证分页参数
  isValidPagination: (page, limit) => {
    const pageNum = parseInt(page)
    const limitNum = parseInt(limit)
    return Number.isInteger(pageNum) && pageNum >= 1 &&
           Number.isInteger(limitNum) && limitNum >= 1 && limitNum <= 100
  },
  
  // 验证排序参数
  isValidSort: (sort, order, allowedFields) => {
    return allowedFields.includes(sort) && ['asc', 'desc'].includes(order)
  },
  
  // 验证JSON对象
  isValidJSON: (value) => {
    if (value === null || value === undefined) return true
    if (typeof value === 'object') {
      try {
        JSON.stringify(value)
        return true
      } catch {
        return false
      }
    }
    return false
  },
}

// 数据清理工具
export const sanitizationUtils = {
  // 清理字符串
  sanitizeString: (str) => {
    if (typeof str !== 'string') return str
    return str.trim().replace(/\s+/g, ' ')
  },
  
  // 清理股票代码
  sanitizeStockSymbol: (symbol) => {
    if (typeof symbol !== 'string') return symbol
    return symbol.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  },
  
  // 清理数字
  sanitizeNumber: (num, decimals = 2) => {
    const parsed = parseFloat(num)
    if (isNaN(parsed)) return null
    return parseFloat(parsed.toFixed(decimals))
  },
  
  // 清理整数
  sanitizeInteger: (num) => {
    const parsed = parseInt(num)
    if (isNaN(parsed)) return null
    return parsed
  },
  
  // 清理对象（移除空值）
  sanitizeObject: (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    
    const cleaned = {}
    Object.keys(obj).forEach(key => {
      const value = obj[key]
      if (value !== null && value !== undefined && value !== '') {
        cleaned[key] = value
      }
    })
    return cleaned
  },
  
  // 清理分页参数
  sanitizePagination: (params) => {
    return {
      page: Math.max(1, parseInt(params.page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(params.limit) || 10)),
      sort: params.sort || 'createdAt',
      order: ['asc', 'desc'].includes(params.order) ? params.order : 'desc',
    }
  },
}

// 错误消息生成器
export const errorMessages = {
  required: (field) => `${field}是必填项`,
  invalid: (field) => `${field}格式无效`,
  tooShort: (field, min) => `${field}至少${min}个字符`,
  tooLong: (field, max) => `${field}最多${max}个字符`,
  tooSmall: (field, min) => `${field}不能小于${min}`,
  tooLarge: (field, max) => `${field}不能大于${max}`,
  notUnique: (field, value) => `${field} '${value}' 已存在`,
  notFound: (resource) => `${resource}不存在`,
  inUse: (resource) => `${resource}正在使用中，无法删除`,
  invalidEnum: (field, values) => `${field}必须是以下值之一: ${values.join(', ')}`,
}

// 验证结果构建器
export class ValidationResult {
  constructor() {
    this.errors = []
    this.warnings = []
    this.isValid = true
  }
  
  addError(field, message, code = 'VALIDATION_ERROR') {
    this.errors.push({ field, message, code })
    this.isValid = false
    return this
  }
  
  addWarning(field, message, code = 'VALIDATION_WARNING') {
    this.warnings.push({ field, message, code })
    return this
  }
  
  hasErrors() {
    return this.errors.length > 0
  }
  
  hasWarnings() {
    return this.warnings.length > 0
  }
  
  getFirstError() {
    return this.errors[0] || null
  }
  
  getAllErrors() {
    return this.errors
  }
  
  getAllWarnings() {
    return this.warnings
  }
  
  toJSON() {
    return {
      isValid: this.isValid,
      errors: this.errors,
      warnings: this.warnings,
    }
  }
}

// 复合验证器
export const validators = {
  // 验证股票模板
  validateStockTemplate: (data) => {
    const result = new ValidationResult()
    
    // 验证必填字段
    if (!data.name) {
      result.addError('name', errorMessages.required('股票名称'))
    } else if (!validationUtils.isValidName(data.name)) {
      result.addError('name', errorMessages.invalid('股票名称'))
    }
    
    if (!data.symbol) {
      result.addError('symbol', errorMessages.required('股票代码'))
    } else if (!validationUtils.isValidStockSymbol(data.symbol)) {
      result.addError('symbol', errorMessages.invalid('股票代码'))
    }
    
    if (data.issuePrice === undefined || data.issuePrice === null) {
      result.addError('issuePrice', errorMessages.required('发行价格'))
    } else if (!validationUtils.isValidPrice(data.issuePrice)) {
      result.addError('issuePrice', errorMessages.invalid('发行价格'))
    }
    
    if (data.totalShares === undefined || data.totalShares === null) {
      result.addError('totalShares', errorMessages.required('总股本'))
    } else if (!validationUtils.isValidShares(data.totalShares)) {
      result.addError('totalShares', errorMessages.invalid('总股本'))
    }
    
    // 验证可选字段
    if (data.description && !validationUtils.isValidDescription(data.description)) {
      result.addError('description', errorMessages.tooLong('描述', 500))
    }
    
    if (data.category && !validationUtils.isValidEnum(data.category, 
        ['tech', 'finance', 'healthcare', 'energy', 'consumer'])) {
      result.addError('category', errorMessages.invalidEnum('股票分类', 
        ['tech', 'finance', 'healthcare', 'energy', 'consumer']))
    }
    
    return result
  },
  
  // 验证AI交易员模板
  validateTraderTemplate: (data) => {
    const result = new ValidationResult()
    
    // 验证必填字段
    if (!data.name) {
      result.addError('name', errorMessages.required('模板名称'))
    } else if (!validationUtils.isValidName(data.name)) {
      result.addError('name', errorMessages.invalid('模板名称'))
    }
    
    if (data.initialCapital === undefined || data.initialCapital === null) {
      result.addError('initialCapital', errorMessages.required('初始资金'))
    } else if (!validationUtils.isValidCapital(data.initialCapital)) {
      result.addError('initialCapital', errorMessages.invalid('初始资金'))
    }
    
    if (!data.riskProfile) {
      result.addError('riskProfile', errorMessages.required('风险偏好'))
    } else if (!validationUtils.isValidEnum(data.riskProfile, 
        ['conservative', 'moderate', 'aggressive'])) {
      result.addError('riskProfile', errorMessages.invalidEnum('风险偏好', 
        ['conservative', 'moderate', 'aggressive']))
    }
    
    // 验证可选字段
    if (data.tradingStyle && !validationUtils.isValidEnum(data.tradingStyle, 
        ['day_trading', 'swing_trading', 'position_trading'])) {
      result.addError('tradingStyle', errorMessages.invalidEnum('交易风格', 
        ['day_trading', 'swing_trading', 'position_trading']))
    }
    
    if (data.maxPositions !== undefined && 
        (!Number.isInteger(data.maxPositions) || data.maxPositions < 1 || data.maxPositions > 100)) {
      result.addError('maxPositions', '最大持仓数量必须是1-100之间的整数')
    }
    
    if (data.description && !validationUtils.isValidDescription(data.description)) {
      result.addError('description', errorMessages.tooLong('描述', 500))
    }
    
    if (data.parameters && !validationUtils.isValidJSON(data.parameters)) {
      result.addError('parameters', errorMessages.invalid('交易参数'))
    }
    
    return result
  },
}

export default {
  validationUtils,
  sanitizationUtils,
  errorMessages,
  ValidationResult,
  validators,
}