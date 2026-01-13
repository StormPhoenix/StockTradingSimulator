import mongoose from 'mongoose'
import { BaseSchema, validators, commonFields, registerModel } from './index.js'

// AI交易员模板Schema
const traderTemplateSchema = new BaseSchema({
  // 模板名称
  name: {
    type: String,
    required: [true, '模板名称是必填项'],
    trim: true,
    minlength: [1, '模板名称至少1个字符'],
    maxlength: [100, '模板名称最多100个字符'],
    validate: validators.name,
  },
  
  // 初始资金
  initialCapital: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, '初始资金是必填项'],
    min: [1000, '初始资金至少1000元'],
    max: [100000000, '初始资金不能超过1亿元'],
    validate: validators.capital,
    get: (value) => value ? parseFloat(value.toString()) : value,
    set: (value) => value ? mongoose.Types.Decimal128.fromString(value.toString()) : value,
  },
  
  // 风险偏好
  riskProfile: {
    type: String,
    required: [true, '风险偏好是必填项'],
    enum: {
      values: ['conservative', 'moderate', 'aggressive'],
      message: '风险偏好必须是保守型、稳健型或激进型之一',
    },
  },
  
  // 交易风格
  tradingStyle: {
    type: String,
    enum: {
      values: ['day_trading', 'swing_trading', 'position_trading'],
      message: '交易风格必须是日内交易、波段交易或长期持有之一',
    },
  },
  
  // 最大持仓数量
  maxPositions: {
    type: Number,
    min: [1, '最大持仓数量至少为1'],
    max: [100, '最大持仓数量不能超过100'],
    default: 10,
  },
  
  // 交易参数
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
    validate: {
      validator: function(value) {
        // 验证是否为有效的JSON对象
        return value === null || typeof value === 'object'
      },
      message: '交易参数必须是有效的JSON对象',
    },
  },
  
  // 通用字段
  ...commonFields,
})

// 索引
traderTemplateSchema.index({ status: 1, riskProfile: 1, createdAt: -1 })
traderTemplateSchema.index({ tradingStyle: 1, status: 1 })
traderTemplateSchema.index({ name: 'text', description: 'text' })

// 虚拟字段
traderTemplateSchema.virtual('riskProfileLabel').get(function() {
  const labels = {
    conservative: '保守型',
    moderate: '稳健型',
    aggressive: '激进型',
  }
  return labels[this.riskProfile] || this.riskProfile
})

traderTemplateSchema.virtual('tradingStyleLabel').get(function() {
  const labels = {
    day_trading: '日内交易',
    swing_trading: '波段交易',
    position_trading: '长期持有',
  }
  return labels[this.tradingStyle] || this.tradingStyle
})

// 实例方法
traderTemplateSchema.methods.toSafeObject = function() {
  const obj = this.toObject()
  return {
    id: obj.id,
    name: obj.name,
    initialCapital: obj.initialCapital,
    riskProfile: obj.riskProfile,
    riskProfileLabel: this.riskProfileLabel,
    tradingStyle: obj.tradingStyle,
    tradingStyleLabel: this.tradingStyleLabel,
    maxPositions: obj.maxPositions,
    parameters: obj.parameters,
    description: obj.description,
    status: obj.status,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
  }
}

traderTemplateSchema.methods.generateTrader = function(sequence = 1) {
  return {
    templateId: this._id,
    name: `${this.name}_${String(sequence).padStart(3, '0')}`,
    initialCapital: this.initialCapital,
    currentCapital: this.initialCapital,
    riskProfile: this.riskProfile,
    tradingStyle: this.tradingStyle,
    maxPositions: this.maxPositions,
    parameters: { ...this.parameters },
    holdings: [],
  }
}

// 静态方法
traderTemplateSchema.statics.findByRiskProfile = function(riskProfile, options = {}) {
  const query = { riskProfile, status: 'active' }
  return this.find(query, null, options)
}

traderTemplateSchema.statics.findByTradingStyle = function(tradingStyle, options = {}) {
  const query = { tradingStyle, status: 'active' }
  return this.find(query, null, options)
}

traderTemplateSchema.statics.searchByName = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
  }
  return this.find(query, null, options)
}

traderTemplateSchema.statics.getCapitalRange = function() {
  return this.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        minCapital: { $min: '$initialCapital' },
        maxCapital: { $max: '$initialCapital' },
        avgCapital: { $avg: '$initialCapital' },
        totalTemplates: { $sum: 1 },
      },
    },
  ])
}

// 查询助手
traderTemplateSchema.query.active = function() {
  return this.where({ status: 'active' })
}

traderTemplateSchema.query.byRiskProfile = function(riskProfile) {
  return this.where({ riskProfile })
}

traderTemplateSchema.query.byTradingStyle = function(tradingStyle) {
  return this.where({ tradingStyle })
}

traderTemplateSchema.query.withCapitalRange = function(min, max) {
  const query = {}
  if (min !== undefined) query.$gte = min
  if (max !== undefined) query.$lte = max
  return this.where({ initialCapital: query })
}

// 中间件
traderTemplateSchema.pre('save', function(next) {
  // 验证initialCapital精度
  if (this.initialCapital) {
    const capitalStr = this.initialCapital.toString()
    const decimalPlaces = capitalStr.includes('.') ? capitalStr.split('.')[1].length : 0
    if (decimalPlaces > 2) {
      return next(new Error('初始资金最多保留2位小数'))
    }
  }
  
  // 验证交易参数
  if (this.parameters && typeof this.parameters === 'object') {
    try {
      JSON.stringify(this.parameters)
    } catch (error) {
      return next(new Error('交易参数必须是有效的JSON对象'))
    }
  }
  
  next()
})

// 删除前检查是否被使用
traderTemplateSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // 这里可以检查是否有市场环境在使用这个模板
    // const marketCount = await MarketEnvironment.countDocuments({ 'traders.templateId': this._id })
    // if (marketCount > 0) {
    //   throw new Error('该AI交易员模板正在被使用，无法删除')
    // }
    next()
  } catch (error) {
    next(error)
  }
})

// 注册模型
const AITraderTemplate = registerModel('AITraderTemplate', traderTemplateSchema)

export default AITraderTemplate