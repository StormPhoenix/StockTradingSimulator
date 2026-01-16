import mongoose, { Schema, Model, Document, SchemaOptions, SchemaDefinition } from 'mongoose'

// 基础模型配置
const baseSchemaOptions: SchemaOptions = {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  versionKey: false, // 禁用 __v 字段
  toJSON: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id
      delete ret._id
      return ret
    },
  },
  toObject: {
    transform: (doc: any, ret: any) => {
      ret.id = ret._id
      delete ret._id
      return ret
    },
  },
}

// 创建基础Schema类
export class BaseSchema<T = any> extends Schema<T> {
  constructor(definition: SchemaDefinition, options: SchemaOptions = {}) {
    const mergedOptions = {
      ...baseSchemaOptions,
      ...options,
    }
    super(definition, mergedOptions as any)
    
    // 添加通用的索引
    this.index({ createdAt: -1 })
    this.index({ updatedAt: -1 })
  }
}

// 验证器接口
interface ValidatorConfig {
  validator: (value: any) => boolean
  message: string
}

// 通用验证器
export const validators: Record<string, ValidatorConfig> = {
  // 股票代码验证
  stockSymbol: {
    validator: (value: string) => /^[A-Z0-9]{1,10}$/.test(value),
    message: '股票代码必须是1-10位大写字母和数字组合',
  },
  
  // 价格验证
  price: {
    validator: (value: number) => value > 0 && value <= 999999.99,
    message: '价格必须在0.01-999999.99之间',
  },
  
  // 股数验证
  shares: {
    validator: (value: number) => Number.isInteger(value) && value > 0 && value <= 1000000000,
    message: '股数必须是1-1000000000之间的整数',
  },
  
  // 资金验证
  capital: {
    validator: (value: number) => value >= 1000 && value <= 100000000,
    message: '资金必须在1000-100000000之间',
  },
  
  // 名称验证
  name: {
    validator: (value: string) => Boolean(value && value.trim().length >= 1 && value.trim().length <= 100),
    message: '名称长度必须在1-100字符之间',
  },
}

// 通用字段定义
export const commonFields = {
  // 状态字段
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active',
    required: true,
  },
  
  // 创建者字段
  createdBy: {
    type: String,
    maxlength: 100,
  },
  
  // 描述字段
  description: {
    type: String,
    maxlength: 500,
    trim: true,
  },
}

// 连接状态接口
interface ConnectionStatus {
  state: string
  isConnected: boolean
}

// 数据库连接状态检查
export const checkConnection = (): ConnectionStatus => {
  const state = mongoose.connection.readyState
  const states: Record<number, string> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  }
  
  return {
    state: states[state],
    isConnected: state === 1,
  }
}

// 模型注册表
const models = new Map<string, Model<any>>()

// 注册模型
export const registerModel = <T extends Document>(name: string, schema: Schema<T>): Model<T> => {
  if (models.has(name)) {
    return models.get(name) as Model<T>
  }
  
  const model = mongoose.model<T>(name, schema)
  models.set(name, model)
  return model
}

// 获取模型
export const getModel = <T extends Document>(name: string): Model<T> => {
  return models.get(name) as Model<T> || mongoose.model<T>(name)
}

// 清理所有模型（测试用）
export const clearModels = (): void => {
  models.clear()
  // 清理mongoose模型缓存
  Object.keys(mongoose.models).forEach(key => {
    delete mongoose.models[key]
  })
}

export default {
  BaseSchema,
  validators,
  commonFields,
  checkConnection,
  registerModel,
  getModel,
  clearModels,
}