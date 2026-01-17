/**
 * AI交易员运行时模型
 * 用于市场环境初始化时生成的交易员实例
 */

import mongoose, { Document, Model, Schema, Types } from 'mongoose'

// 类型定义
export interface IStockHolding {
  stockSymbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentValue: number
}

export interface ITraderStatistics {
  totalTrades: number
  profitLoss: number
  winRate: number
  lastTradeTime?: Date
}

export interface IAITrader {
  id: string
  templateId: Types.ObjectId
  name: string
  initialCapital: number
  currentCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle?: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  holdings: IStockHolding[]
  parameters: Record<string, any>
  marketEnvironmentId: string
  statistics: ITraderStatistics
  status: 'active' | 'inactive' | 'suspended'
  createdAt: Date
  updatedAt: Date
}

// Document 接口
export interface IAITraderDocument extends Omit<IAITrader, 'id'>, Document {
  totalHoldingsValue: number
  totalAssets: number
  holdingsCount: number
  availableCapital: number
  
  addHolding(stockSymbol: string, stockName: string, quantity: number, price: number): Promise<IAITraderDocument>
  removeHolding(stockSymbol: string, quantity: number, price: number): Promise<IAITraderDocument>
  updateHoldingPrices(stockPrices: Record<string, number>): Promise<IAITraderDocument>
  calculateProfitLoss(): number
  canBuy(quantity: number, price: number): boolean
  canSell(stockSymbol: string, quantity: number): boolean
}

// Model 接口
export interface IAITraderModel extends Model<IAITraderDocument> {
  createFromTemplate(template: any, marketEnvironmentId: string, index?: number): IAITraderDocument
  findByMarketEnvironment(marketEnvironmentId: string, options?: any): Promise<IAITraderDocument[]>
  getMarketStatistics(marketEnvironmentId: string): Promise<any[]>
}

// 股票持仓子文档
const StockHoldingSchema = new Schema<IStockHolding>({
  stockSymbol: {
    type: String,
    required: true,
    trim: true
  },
  stockName: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '持有数量必须是整数'
    }
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  }
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true }
})

// AI交易员主模式
const AITraderSchema = new Schema<IAITraderDocument, IAITraderModel>({
  // 基本信息
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'AITraderTemplate',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 资金信息
  initialCapital: {
    type: Number,
    required: true,
    min: 1000,
    max: 100000000,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  currentCapital: {
    type: Number,
    required: true,
    min: 0,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  
  // 交易属性
  riskProfile: {
    type: String,
    required: true,
    enum: ['conservative', 'moderate', 'aggressive'],
    index: true
  },
  tradingStyle: {
    type: String,
    enum: ['day_trading', 'swing_trading', 'position_trading'],
    default: 'swing_trading'
  },
  maxPositions: {
    type: Number,
    required: true,
    min: 1,
    max: 100,
    default: 10
  },
  
  // 持仓信息
  holdings: [StockHoldingSchema],
  
  // 交易参数
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  
  // 关联信息
  marketEnvironmentId: {
    type: String,
    required: true,
    index: true
  },
  
  // 统计信息
  statistics: {
    totalTrades: {
      type: Number,
      default: 0,
      min: 0
    },
    profitLoss: {
      type: Schema.Types.Decimal128,
      default: 0,
      get: (value: any) => value ? parseFloat(value.toString()) : 0
    },
    winRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    lastTradeTime: {
      type: Date
    }
  },
  
  // 状态信息
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
    index: true
  },
  
  // 时间戳
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ai_traders',
  timestamps: { updatedAt: 'updatedAt' },
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      delete (ret as any)._id
      delete (ret as any).__v
      return ret
    }
  },
  toObject: { getters: true }
})

// 索引
AITraderSchema.index({ marketEnvironmentId: 1, status: 1 })
AITraderSchema.index({ templateId: 1, createdAt: -1 })
AITraderSchema.index({ riskProfile: 1, tradingStyle: 1 })
AITraderSchema.index({ 'statistics.profitLoss': -1 })

// 虚拟字段
AITraderSchema.virtual('totalHoldingsValue').get(function(this: IAITraderDocument) {
  return this.holdings.reduce((total, holding) => total + holding.currentValue, 0)
})

AITraderSchema.virtual('totalAssets').get(function(this: IAITraderDocument) {
  return this.currentCapital + this.totalHoldingsValue
})

AITraderSchema.virtual('holdingsCount').get(function(this: IAITraderDocument) {
  return this.holdings.length
})

AITraderSchema.virtual('availableCapital').get(function(this: IAITraderDocument) {
  return this.currentCapital
})

// 实例方法
AITraderSchema.methods.addHolding = function(
  this: IAITraderDocument,
  stockSymbol: string,
  stockName: string,
  quantity: number,
  price: number
): Promise<IAITraderDocument> {
  const existingHolding = this.holdings.find(h => h.stockSymbol === stockSymbol)
  
  if (existingHolding) {
    // 更新现有持仓
    const totalQuantity = existingHolding.quantity + quantity
    const totalValue = existingHolding.averagePrice * existingHolding.quantity + price * quantity
    existingHolding.averagePrice = totalValue / totalQuantity
    existingHolding.quantity = totalQuantity
    existingHolding.currentValue = totalQuantity * price
  } else {
    // 添加新持仓
    this.holdings.push({
      stockSymbol,
      stockName,
      quantity,
      averagePrice: price,
      currentValue: quantity * price
    })
  }
  
  // 更新资金
  this.currentCapital -= quantity * price
  return this.save()
}

AITraderSchema.methods.removeHolding = function(
  this: IAITraderDocument,
  stockSymbol: string,
  quantity: number,
  price: number
): Promise<IAITraderDocument> {
  const holding = this.holdings.find(h => h.stockSymbol === stockSymbol)
  
  if (!holding || holding.quantity < quantity) {
    throw new Error('持仓不足')
  }
  
  holding.quantity -= quantity
  holding.currentValue = holding.quantity * price
  
  if (holding.quantity === 0) {
    this.holdings = this.holdings.filter(h => h.stockSymbol !== stockSymbol)
  }
  
  // 更新资金
  this.currentCapital += quantity * price
  return this.save()
}

AITraderSchema.methods.updateHoldingPrices = function(
  this: IAITraderDocument,
  stockPrices: Record<string, number>
): Promise<IAITraderDocument> {
  this.holdings.forEach(holding => {
    const currentPrice = stockPrices[holding.stockSymbol]
    if (currentPrice !== undefined) {
      holding.currentValue = holding.quantity * currentPrice
    }
  })
  return this.save()
}

AITraderSchema.methods.calculateProfitLoss = function(this: IAITraderDocument): number {
  const currentAssets = this.totalAssets
  const profitLoss = currentAssets - this.initialCapital
  this.statistics.profitLoss = profitLoss
  return profitLoss
}

AITraderSchema.methods.canBuy = function(this: IAITraderDocument, quantity: number, price: number): boolean {
  const requiredCapital = quantity * price
  return this.currentCapital >= requiredCapital && this.holdingsCount < this.maxPositions
}

AITraderSchema.methods.canSell = function(this: IAITraderDocument, stockSymbol: string, quantity: number): boolean {
  const holding = this.holdings.find(h => h.stockSymbol === stockSymbol)
  return holding ? holding.quantity >= quantity : false
}

// 静态方法
AITraderSchema.statics.createFromTemplate = function(
  this: IAITraderModel,
  template: any,
  marketEnvironmentId: string,
  index: number = 1
): IAITraderDocument {
  const traderId = `${template._id}_${index}_${Date.now()}`
  const traderName = `${template.name}_${index}`
  
  return new this({
    id: traderId,
    templateId: template._id,
    name: traderName,
    initialCapital: template.initialCapital,
    currentCapital: template.initialCapital,
    riskProfile: template.riskProfile,
    tradingStyle: template.tradingStyle,
    maxPositions: template.maxPositions || 10,
    parameters: template.parameters || {},
    marketEnvironmentId,
    holdings: []
  })
}

AITraderSchema.statics.findByMarketEnvironment = function(
  this: IAITraderModel,
  marketEnvironmentId: string,
  options: any = {}
): Promise<IAITraderDocument[]> {
  const query: any = { marketEnvironmentId }
  
  if (options.status) {
    query.status = options.status
  }
  
  if (options.riskProfile) {
    query.riskProfile = options.riskProfile
  }
  
  return this.find(query)
    .populate('templateId', 'name description')
    .sort(options.sort || { createdAt: -1 })
    .limit(options.limit || 0)
}

AITraderSchema.statics.getMarketStatistics = function(this: IAITraderModel, marketEnvironmentId: string): Promise<any[]> {
  return this.aggregate([
    { $match: { marketEnvironmentId } },
    {
      $group: {
        _id: null,
        totalTraders: { $sum: 1 },
        totalCapital: { $sum: { $toDouble: '$initialCapital' } },
        totalCurrentCapital: { $sum: { $toDouble: '$currentCapital' } },
        avgCapital: { $avg: { $toDouble: '$initialCapital' } },
        riskProfileDistribution: {
          $push: '$riskProfile'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalTraders: 1,
        totalCapital: 1,
        totalCurrentCapital: 1,
        avgCapital: 1,
        totalProfitLoss: { $subtract: ['$totalCurrentCapital', '$totalCapital'] },
        riskProfileDistribution: 1
      }
    }
  ])
}

// 中间件
AITraderSchema.pre('save', function(this: IAITraderDocument, next) {
  if (this.isModified('holdings')) {
    // 验证持仓数量不超过最大限制
    if (this.holdings.length > this.maxPositions) {
      return next(new Error(`持仓数量不能超过${this.maxPositions}个`))
    }
  }
  
  // 更新统计信息
  this.calculateProfitLoss()
  
  next()
})

AITraderSchema.pre('validate', function(this: IAITraderDocument, next) {
  // 验证资金不为负数
  if (this.currentCapital < 0) {
    return next(new Error('当前资金不能为负数'))
  }
  
  // 验证持仓数据一致性
  for (const holding of this.holdings) {
    if (holding.quantity <= 0) {
      return next(new Error('持仓数量必须大于0'))
    }
    if (holding.averagePrice <= 0) {
      return next(new Error('平均价格必须大于0'))
    }
  }
  
  next()
})

// 导出模型
const AITrader = mongoose.model<IAITraderDocument, IAITraderModel>('AITrader', AITraderSchema)

export default AITrader