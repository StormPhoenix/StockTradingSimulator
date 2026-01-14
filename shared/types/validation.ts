// 运行时类型验证工具

// ========== 基础验证函数 ==========
export function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value)
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime())
}

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidId(id: unknown): id is string {
  return isString(id) && id.length > 0
}

// ========== 验证结果类型 ==========
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

// ========== 通用验证器 ==========
export class Validator {
  private errors: ValidationError[] = []

  validate<T>(value: unknown, validators: ValidatorFunction<T>[]): ValidationResult {
    this.errors = []
    
    for (const validator of validators) {
      const result = validator(value)
      if (!result.isValid) {
        this.errors.push(...result.errors)
      }
    }

    return {
      isValid: this.errors.length === 0,
      errors: this.errors
    }
  }

  static required(field: string) {
    return (value: unknown): ValidationResult => {
      if (value === null || value === undefined || value === '') {
        return {
          isValid: false,
          errors: [{ field, message: `${field} is required`, code: 'REQUIRED' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static string(field: string) {
    return (value: unknown): ValidationResult => {
      if (!isString(value)) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be a string`, code: 'INVALID_TYPE' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static number(field: string) {
    return (value: unknown): ValidationResult => {
      if (!isNumber(value)) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be a number`, code: 'INVALID_TYPE' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static email(field: string) {
    return (value: unknown): ValidationResult => {
      if (!isString(value) || !isValidEmail(value)) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be a valid email`, code: 'INVALID_EMAIL' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static minLength(field: string, min: number) {
    return (value: unknown): ValidationResult => {
      if (!isString(value) || value.length < min) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be at least ${min} characters`, code: 'MIN_LENGTH' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static maxLength(field: string, max: number) {
    return (value: unknown): ValidationResult => {
      if (!isString(value) || value.length > max) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be at most ${max} characters`, code: 'MAX_LENGTH' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static min(field: string, min: number) {
    return (value: unknown): ValidationResult => {
      if (!isNumber(value) || value < min) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be at least ${min}`, code: 'MIN_VALUE' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static max(field: string, max: number) {
    return (value: unknown): ValidationResult => {
      if (!isNumber(value) || value > max) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be at most ${max}`, code: 'MAX_VALUE' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static oneOf<T>(field: string, values: T[]) {
    return (value: unknown): ValidationResult => {
      if (!values.includes(value as T)) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} must be one of: ${values.join(', ')}`, code: 'INVALID_VALUE' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }
}

export type ValidatorFunction<T> = (value: unknown) => ValidationResult

// ========== 业务实体验证器 ==========
export function validateUser(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      isValid: false,
      errors: [{ field: 'user', message: 'User data must be an object', code: 'INVALID_TYPE' }]
    }
  }

  const validator = new Validator()
  return validator.validate(data, [
    Validator.required('email'),
    Validator.email('email'),
    Validator.required('username'),
    Validator.string('username'),
    Validator.minLength('username', 3),
    Validator.maxLength('username', 50),
    Validator.required('role'),
    Validator.oneOf('role', ['admin', 'user', 'guest'])
  ])
}

export function validatePortfolio(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      isValid: false,
      errors: [{ field: 'portfolio', message: 'Portfolio data must be an object', code: 'INVALID_TYPE' }]
    }
  }

  const validator = new Validator()
  return validator.validate(data, [
    Validator.required('name'),
    Validator.string('name'),
    Validator.minLength('name', 1),
    Validator.maxLength('name', 100),
    Validator.required('initialBalance'),
    Validator.number('initialBalance'),
    Validator.min('initialBalance', 0)
  ])
}

export function validateTrade(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      isValid: false,
      errors: [{ field: 'trade', message: 'Trade data must be an object', code: 'INVALID_TYPE' }]
    }
  }

  const validator = new Validator()
  return validator.validate(data, [
    Validator.required('stockSymbol'),
    Validator.string('stockSymbol'),
    Validator.required('action'),
    Validator.oneOf('action', ['buy', 'sell']),
    Validator.required('quantity'),
    Validator.number('quantity'),
    Validator.min('quantity', 1),
    Validator.required('price'),
    Validator.number('price'),
    Validator.min('price', 0)
  ])
}

export function validateStock(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      isValid: false,
      errors: [{ field: 'stock', message: 'Stock data must be an object', code: 'INVALID_TYPE' }]
    }
  }

  const validator = new Validator()
  return validator.validate(data, [
    Validator.required('symbol'),
    Validator.string('symbol'),
    Validator.minLength('symbol', 1),
    Validator.maxLength('symbol', 10),
    Validator.required('name'),
    Validator.string('name'),
    Validator.minLength('name', 1),
    Validator.maxLength('name', 100),
    Validator.required('currentPrice'),
    Validator.number('currentPrice'),
    Validator.min('currentPrice', 0)
  ])
}

export function validateMarketEnvironment(data: unknown): ValidationResult {
  if (!isObject(data)) {
    return {
      isValid: false,
      errors: [{ field: 'marketEnvironment', message: 'Market environment data must be an object', code: 'INVALID_TYPE' }]
    }
  }

  const validator = new Validator()
  return validator.validate(data, [
    Validator.required('name'),
    Validator.string('name'),
    Validator.minLength('name', 1),
    Validator.maxLength('name', 100),
    Validator.required('difficulty'),
    Validator.oneOf('difficulty', ['easy', 'medium', 'hard']),
    Validator.required('maxParticipants'),
    Validator.number('maxParticipants'),
    Validator.min('maxParticipants', 1),
    Validator.max('maxParticipants', 1000),
    Validator.required('duration'),
    Validator.number('duration'),
    Validator.min('duration', 1)
  ])
}

// ========== 类型守卫函数 ==========
export function isValidUser(data: unknown): data is { email: string; username: string; role: string } {
  const result = validateUser(data)
  return result.isValid
}

export function isValidPortfolio(data: unknown): data is { name: string; initialBalance: number } {
  const result = validatePortfolio(data)
  return result.isValid
}

export function isValidTrade(data: unknown): data is { stockSymbol: string; action: string; quantity: number; price: number } {
  const result = validateTrade(data)
  return result.isValid
}

export function isValidStock(data: unknown): data is { symbol: string; name: string; currentPrice: number } {
  const result = validateStock(data)
  return result.isValid
}

export function isValidMarketEnvironment(data: unknown): data is { name: string; difficulty: string; maxParticipants: number; duration: number } {
  const result = validateMarketEnvironment(data)
  return result.isValid
}

// ========== 验证工具函数 ==========
export function createValidationError(field: string, message: string, code: string): ValidationError {
  return { field, message, code }
}

export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(result => result.errors)
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  }
}

export function formatValidationErrors(errors: ValidationError[]): string {
  return errors.map(error => `${error.field}: ${error.message}`).join('; ')
}

// ========== 异步验证支持 ==========
export type AsyncValidatorFunction<T> = (value: unknown) => Promise<ValidationResult>

export class AsyncValidator {
  async validate<T>(value: unknown, validators: AsyncValidatorFunction<T>[]): Promise<ValidationResult> {
    const results = await Promise.all(validators.map(validator => validator(value)))
    return combineValidationResults(...results)
  }

  static async uniqueEmail(field: string, checkFunction: (email: string) => Promise<boolean>) {
    return async (value: unknown): Promise<ValidationResult> => {
      if (!isString(value)) {
        return { isValid: true, errors: [] } // 类型验证由其他验证器处理
      }

      const isUnique = await checkFunction(value)
      if (!isUnique) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} already exists`, code: 'DUPLICATE_EMAIL' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }

  static async uniqueUsername(field: string, checkFunction: (username: string) => Promise<boolean>) {
    return async (value: unknown): Promise<ValidationResult> => {
      if (!isString(value)) {
        return { isValid: true, errors: [] }
      }

      const isUnique = await checkFunction(value)
      if (!isUnique) {
        return {
          isValid: false,
          errors: [{ field, message: `${field} already exists`, code: 'DUPLICATE_USERNAME' }]
        }
      }
      return { isValid: true, errors: [] }
    }
  }
}