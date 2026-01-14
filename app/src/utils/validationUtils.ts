/**
 * 前端数据验证工具
 * 提供统一的数据验证功能
 */

// 验证函数类型
type ValidationRule = (value: any, fieldName?: string) => string | null

// 验证结果接口
interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

/**
 * 验证规则定义
 */
export const ValidationRules = {
  // 通用规则
  required: (value: any, fieldName: string = '字段'): string | null => {
    if (value === null || value === undefined || value === '') {
      return `${fieldName}不能为空`
    }
    return null
  },

  minLength: (min: number) => (value: any, fieldName: string = '字段'): string | null => {
    if (value && value.length < min) {
      return `${fieldName}长度不能少于${min}个字符`
    }
    return null
  },

  maxLength: (max: number) => (value: any, fieldName: string = '字段'): string | null => {
    if (value && value.length > max) {
      return `${fieldName}长度不能超过${max}个字符`
    }
    return null
  },

  pattern: (regex: RegExp, message?: string) => (value: any, fieldName: string = '字段'): string | null => {
    if (value && !regex.test(value)) {
      return message || `${fieldName}格式不正确`
    }
    return null
  },

  min: (minValue: number) => (value: any, fieldName: string = '字段'): string | null => {
    if (value !== null && value !== undefined && Number(value) < minValue) {
      return `${fieldName}不能小于${minValue}`
    }
    return null
  },

  max: (maxValue: number) => (value: any, fieldName: string = '字段'): string | null => {
    if (value !== null && value !== undefined && Number(value) > maxValue) {
      return `${fieldName}不能大于${maxValue}`
    }
    return null
  },

  integer: (value: any, fieldName: string = '字段'): string | null => {
    if (value !== null && value !== undefined && !Number.isInteger(Number(value))) {
      return `${fieldName}必须是整数`
    }
    return null
  },

  positive: (value: any, fieldName: string = '字段'): string | null => {
    if (value !== null && value !== undefined && Number(value) <= 0) {
      return `${fieldName}必须大于0`
    }
    return null
  },

  enum: <T>(allowedValues: T[]) => (value: any, fieldName: string = '字段'): string | null => {
    if (value && !allowedValues.includes(value)) {
      return `${fieldName}值无效`
    }
    return null
  }
}

/**
 * 字段验证器
 */
export class FieldValidator {
  private fieldName: string
  private rules: ValidationRule[] = []

  constructor(fieldName: string) {
    this.fieldName = fieldName
    this.rules = []
  }

  required(): FieldValidator {
    this.rules.push(ValidationRules.required)
    return this
  }

  minLength(min: number): FieldValidator {
    this.rules.push(ValidationRules.minLength(min))
    return this
  }

  maxLength(max: number): FieldValidator {
    this.rules.push(ValidationRules.maxLength(max))
    return this
  }

  pattern(regex: RegExp, message?: string): FieldValidator {
    this.rules.push(ValidationRules.pattern(regex, message))
    return this
  }

  min(minValue: number): FieldValidator {
    this.rules.push(ValidationRules.min(minValue))
    return this
  }

  max(maxValue: number): FieldValidator {
    this.rules.push(ValidationRules.max(maxValue))
    return this
  }

  integer(): FieldValidator {
    this.rules.push(ValidationRules.integer)
    return this
  }

  positive(): FieldValidator {
    this.rules.push(ValidationRules.positive)
    return this
  }

  enum<T>(allowedValues: T[]): FieldValidator {
    this.rules.push(ValidationRules.enum(allowedValues))
    return this
  }

  validate(value: any): string | null {
    for (const rule of this.rules) {
      const error = rule(value, this.fieldName)
      if (error) {
        return error
      }
    }
    return null
  }
}

/**
 * 表单验证器
 */
export class FormValidator {
  private fields: Map<string, FieldValidator> = new Map()

  constructor() {
    this.fields = new Map()
  }

  field(name: string, fieldName?: string): FieldValidator {
    const validator = new FieldValidator(fieldName || name)
    this.fields.set(name, validator)
    return validator
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}
    let isValid = true

    for (const [fieldName, validator] of this.fields) {
      const error = validator.validate(data[fieldName])
      if (error) {
        errors[fieldName] = error
        isValid = false
      }
    }

    return {
      isValid,
      errors
    }
  }
}

/**
 * 股票模板验证器
 */
export const createStockTemplateValidator = (): FormValidator => {
  const validator = new FormValidator()

  validator.field('name', '股票名称')
    .required()
    .minLength(1)
    .maxLength(100)

  validator.field('symbol', '股票代码')
    .required()
    .pattern(/^[A-Z0-9]{1,10}$/, '股票代码必须是1-10位大写字母或数字')

  validator.field('issuePrice', '发行价格')
    .required()
    .positive()
    .max(999999.99)

  validator.field('totalShares', '总股本')
    .required()
    .integer()
    .positive()
    .max(1000000000)

  validator.field('description', '描述信息')
    .maxLength(500)

  validator.field('category', '股票分类')
    .enum(['tech', 'finance', 'healthcare', 'energy', 'consumer'])

  return validator
}

/**
 * AI交易员模板验证器
 */
export const createTraderTemplateValidator = (): FormValidator => {
  const validator = new FormValidator()

  validator.field('name', '模板名称')
    .required()
    .minLength(1)
    .maxLength(100)

  validator.field('initialCapital', '初始资金')
    .required()
    .min(1000)
    .max(100000000)

  validator.field('riskProfile', '风险偏好')
    .required()
    .enum(['conservative', 'moderate', 'aggressive'])

  validator.field('tradingStyle', '交易风格')
    .enum(['day_trading', 'swing_trading', 'position_trading'])

  validator.field('maxPositions', '最大持仓数量')
    .integer()
    .min(1)
    .max(100)

  validator.field('description', '描述信息')
    .maxLength(500)

  return validator
}

/**
 * 通用验证函数
 */
export const validateStockTemplate = (data: Record<string, any>, isUpdate: boolean = false): ValidationResult => {
  const validator = createStockTemplateValidator()
  
  // 更新时某些字段可以为空
  if (isUpdate) {
    // 移除必填验证，只保留格式验证
    const updateValidator = new FormValidator()
    
    if (data.name !== undefined) {
      updateValidator.field('name', '股票名称').minLength(1).maxLength(100)
    }
    if (data.symbol !== undefined) {
      updateValidator.field('symbol', '股票代码')
        .pattern(/^[A-Z0-9]{1,10}$/, '股票代码必须是1-10位大写字母或数字')
    }
    if (data.issuePrice !== undefined) {
      updateValidator.field('issuePrice', '发行价格').positive().max(999999.99)
    }
    if (data.totalShares !== undefined) {
      updateValidator.field('totalShares', '总股本').integer().positive().max(1000000000)
    }
    if (data.description !== undefined) {
      updateValidator.field('description', '描述信息').maxLength(500)
    }
    if (data.category !== undefined) {
      updateValidator.field('category', '股票分类')
        .enum(['tech', 'finance', 'healthcare', 'energy', 'consumer'])
    }
    
    return updateValidator.validate(data)
  }
  
  return validator.validate(data)
}

export const validateTraderTemplate = (data: Record<string, any>, isUpdate: boolean = false): ValidationResult => {
  const validator = createTraderTemplateValidator()
  
  // 更新时某些字段可以为空
  if (isUpdate) {
    const updateValidator = new FormValidator()
    
    if (data.name !== undefined) {
      updateValidator.field('name', '模板名称').minLength(1).maxLength(100)
    }
    if (data.initialCapital !== undefined) {
      updateValidator.field('initialCapital', '初始资金').min(1000).max(100000000)
    }
    if (data.riskProfile !== undefined) {
      updateValidator.field('riskProfile', '风险偏好')
        .enum(['conservative', 'moderate', 'aggressive'])
    }
    if (data.tradingStyle !== undefined) {
      updateValidator.field('tradingStyle', '交易风格')
        .enum(['day_trading', 'swing_trading', 'position_trading'])
    }
    if (data.maxPositions !== undefined) {
      updateValidator.field('maxPositions', '最大持仓数量').integer().min(1).max(100)
    }
    if (data.description !== undefined) {
      updateValidator.field('description', '描述信息').maxLength(500)
    }
    
    return updateValidator.validate(data)
  }
  
  return validator.validate(data)
}

/**
 * 实时验证函数
 */
export const validateField = (fieldName: string, value: any, rules: ValidationRule[]): string | null => {
  for (const rule of rules) {
    const error = rule(value, fieldName)
    if (error) {
      return error
    }
  }
  return null
}

/**
 * 常用验证规则组合
 */
export const CommonValidations = {
  stockName: [
    ValidationRules.required,
    ValidationRules.minLength(1),
    ValidationRules.maxLength(100)
  ],
  
  stockSymbol: [
    ValidationRules.required,
    ValidationRules.pattern(/^[A-Z0-9]{1,10}$/, '股票代码必须是1-10位大写字母或数字')
  ],
  
  price: [
    ValidationRules.required,
    ValidationRules.positive,
    ValidationRules.max(999999.99)
  ],
  
  shares: [
    ValidationRules.required,
    ValidationRules.integer,
    ValidationRules.positive,
    ValidationRules.max(1000000000)
  ],
  
  traderName: [
    ValidationRules.required,
    ValidationRules.minLength(1),
    ValidationRules.maxLength(100)
  ],
  
  capital: [
    ValidationRules.required,
    ValidationRules.min(1000),
    ValidationRules.max(100000000)
  ],
  
  description: [
    ValidationRules.maxLength(500)
  ]
}

/**
 * 数据格式化工具
 */
export const formatters = {
  /**
   * 格式化金额
   */
  formatCurrency: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    return Number(value).toLocaleString('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  },

  /**
   * 格式化数字
   */
  formatNumber: (value: number | null | undefined): string => {
    if (value === null || value === undefined) return ''
    return Number(value).toLocaleString('zh-CN')
  },

  /**
   * 格式化百分比
   */
  formatPercentage: (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return ''
    return `${(Number(value) * 100).toFixed(decimals)}%`
  },

  /**
   * 格式化日期
   */
  formatDate: (date: Date | string | null | undefined): string => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('zh-CN')
  },

  /**
   * 格式化日期时间
   */
  formatDateTime: (date: Date | string | null | undefined): string => {
    if (!date) return ''
    return new Date(date).toLocaleString('zh-CN')
  }
}

export default {
  ValidationRules,
  FieldValidator,
  FormValidator,
  validateStockTemplate,
  validateTraderTemplate,
  validateField,
  CommonValidations,
  formatters
}