/**
 * MarketEnvironment 市场环境模型
 * 用于表示完整的市场环境状态，包含所有交易员和股票
 */

import mongoose, { Document, Schema, Model } from 'mongoose'

// 类型定义
export interface IStockHolding {
  stockSymbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentValue: number
}

export interface IShareHolder {
  traderId: string
  traderName: string
  quantity: number
  percentage: number
}

export interface IAITrader {
  id: string
  templateId: mongoose.Types.ObjectId
  name: string
  initialCapital: number
  currentCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle?: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  holdings: IStockHolding[]
  parameters: Record<string, any>
  createdAt: Date
}

export interface IStock {
  id: string
  templateId: mongoose.Types.ObjectId
  symbol: string
  name: string
  issuePrice: number
  currentPrice: number
  totalShares: number
  availableShares: number
  allocatedShares: number
  category?: 'tech' | 'finance' | 'healthcare' | 'energy' | 'consumer'
  holders: IShareHolder[]
  createdAt: Date
}

export interface IStatistics {
  traderCount: number
  stockCount: number
  averageCapitalPerTrader: number
  capitalDistribution: Record<string, number>
  stockDistribution: Record<string, number>
  allocationFairness?: number
  giniCoefficient?: number
}

export interface IMarketEnvironment {
  id: string
  name?: string
  description?: string
  traders: IAITrader[]
  stocks: IStock[]
  totalCapital: number
  totalMarketValue: number
  allocationAlgorithm: 'weighted_random' | 'equal_distribution' | 'risk_based'
  allocationSeed?: number
  statistics: IStatistics
  metadata: Record<string, any>
  version: string
  createdAt: Date
  updatedAt: Date
}

// Document 接口
export interface IMarketEnvironmentDocument extends Omit<IMarketEnvironment, 'id'>, Document {
  isValid: boolean
  calculateTotalCapital(): number
  calculateTotalMarketValue(): number
  updateStatistics(): void
  calculateCapitalDistribution(): Record<string, number>
  calculateStockDistribution(): Record<string, number>
  calculateAllocationFairness(): number
  calculateGiniCoefficient(): number
  getCapitalRange(capital: number): string
}

// Model 接口
export interface IMarketEnvironmentModel extends Model<IMarketEnvironmentDocument> {
  findByTraderCount(min: number, max: number): Promise<IMarketEnvironmentDocument[]>
  findByStockCount(min: number, max: number): Promise<IMarketEnvironmentDocument[]>
}

// 股票持仓结构
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
      message: '股票数量必须为整数'
    }
  },
  averagePrice: {
    type: Number,
    required: true,
    min: 0.01,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  currentValue: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  }
}, { _id: false })

// 股东结构
const ShareHolderSchema = new Schema<IShareHolder>({
  traderId: {
    type: String,
    required: true,
    trim: true
  },
  traderName: {
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
      message: '持有数量必须为整数'
    }
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    set: (v: number) => Math.round(v * 10000) / 10000 // 保留4位小数
  }
}, { _id: false })

// AI交易员运行时对象
const AITraderSchema = new Schema<IAITrader>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'AITraderTemplate',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  initialCapital: {
    type: Number,
    required: true,
    min: 1000,
    max: 100000000,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  currentCapital: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  riskProfile: {
    type: String,
    required: true,
    enum: ['conservative', 'moderate', 'aggressive']
  },
  tradingStyle: {
    type: String,
    enum: ['day_trading', 'swing_trading', 'position_trading']
  },
  maxPositions: {
    type: Number,
    default: 10,
    min: 1,
    max: 100,
    validate: {
      validator: Number.isInteger,
      message: '最大持仓数量必须为整数'
    }
  },
  holdings: [StockHoldingSchema],
  parameters: {
    type: Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

// 股票运行时对象
const StockSchema = new Schema<IStock>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'StockTemplate',
    required: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z0-9]{1,10}$/
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  issuePrice: {
    type: Number,
    required: true,
    min: 0.01,
    max: 999999.99,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0.01,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  totalShares: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000000,
    validate: {
      validator: Number.isInteger,
      message: '总股数必须为整数'
    }
  },
  availableShares: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '可用股数必须为整数'
    }
  },
  allocatedShares: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '已分配股数必须为整数'
    }
  },
  category: {
    type: String,
    enum: ['tech', 'finance', 'healthcare', 'energy', 'consumer']
  },
  holders: [ShareHolderSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

// 统计信息结构
const StatisticsSchema = new Schema<IStatistics>({
  traderCount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '交易员数量必须为整数'
    }
  },
  stockCount: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '股票数量必须为整数'
    }
  },
  averageCapitalPerTrader: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  capitalDistribution: {
    type: Schema.Types.Mixed,
    default: {}
  },
  stockDistribution: {
    type: Schema.Types.Mixed,
    default: {}
  },
  allocationFairness: {
    type: Number,
    min: 0,
    max: 1,
    set: (v: number) => Math.round(v * 10000) / 10000 // 保留4位小数
  },
  giniCoefficient: {
    type: Number,
    min: 0,
    max: 1,
    set: (v: number) => Math.round(v * 10000) / 10000 // 保留4位小数
  }
}, { _id: false })

// 市场环境主模型
const MarketEnvironmentSchema = new Schema<IMarketEnvironmentDocument, IMarketEnvironmentModel>({
  id: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  name: {
    type: String,
    trim: true,
    maxlength: 200,
    default: function(this: IMarketEnvironmentDocument) {
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, '').slice(0, 15)
      return `Market_${timestamp}`
    }
  },
  description: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  traders: [AITraderSchema],
  stocks: [StockSchema],
  totalCapital: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  totalMarketValue: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100 // 保留2位小数
  },
  allocationAlgorithm: {
    type: String,
    default: 'weighted_random',
    enum: ['weighted_random', 'equal_distribution', 'risk_based']
  },
  allocationSeed: {
    type: Number,
    validate: {
      validator: Number.isInteger,
      message: '随机种子必须为整数'
    }
  },
  statistics: StatisticsSchema,
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: String,
    default: '1.0.0',
    match: /^\d+\.\d+\.\d+$/
  }
}, {
  timestamps: true,
  collection: 'market_environments'
})

// 索引
MarketEnvironmentSchema.index({ id: 1 }, { unique: true })
MarketEnvironmentSchema.index({ createdAt: -1 })
MarketEnvironmentSchema.index({ 'statistics.traderCount': 1, 'statistics.stockCount': 1 })
MarketEnvironmentSchema.index({ name: 'text', description: 'text' })

// 虚拟字段
MarketEnvironmentSchema.virtual('isValid').get(function(this: IMarketEnvironmentDocument) {
  return this.traders.length > 0 && this.stocks.length > 0
})

// 实例方法
MarketEnvironmentSchema.methods.calculateTotalCapital = function(this: IMarketEnvironmentDocument): number {
  return this.traders.reduce((total, trader) => total + trader.initialCapital, 0)
}

MarketEnvironmentSchema.methods.calculateTotalMarketValue = function(this: IMarketEnvironmentDocument): number {
  return this.stocks.reduce((total, stock) => total + (stock.currentPrice * stock.totalShares), 0)
}

MarketEnvironmentSchema.methods.updateStatistics = function(this: IMarketEnvironmentDocument): void {
  const traderCount = this.traders.length
  const stockCount = this.stocks.length
  const totalCapital = this.calculateTotalCapital()
  
  this.statistics = {
    traderCount,
    stockCount,
    averageCapitalPerTrader: traderCount > 0 ? totalCapital / traderCount : 0,
    capitalDistribution: this.calculateCapitalDistribution(),
    stockDistribution: this.calculateStockDistribution(),
    allocationFairness: this.calculateAllocationFairness(),
    giniCoefficient: this.calculateGiniCoefficient()
  }
  
  this.totalCapital = totalCapital
  this.totalMarketValue = this.calculateTotalMarketValue()
}

MarketEnvironmentSchema.methods.calculateCapitalDistribution = function(this: IMarketEnvironmentDocument): Record<string, number> {
  const distribution: Record<string, number> = {}
  this.traders.forEach(trader => {
    const range = this.getCapitalRange(trader.initialCapital)
    distribution[range] = (distribution[range] || 0) + 1
  })
  return distribution
}

MarketEnvironmentSchema.methods.calculateStockDistribution = function(this: IMarketEnvironmentDocument): Record<string, number> {
  const distribution: Record<string, number> = {}
  this.stocks.forEach(stock => {
    const category = stock.category || 'other'
    distribution[category] = (distribution[category] || 0) + 1
  })
  return distribution
}

MarketEnvironmentSchema.methods.calculateAllocationFairness = function(this: IMarketEnvironmentDocument): number {
  // 使用 Jain's Fairness Index 计算分配公平性
  if (this.traders.length === 0) return 1
  
  const capitals = this.traders.map(trader => trader.initialCapital)
  const sum = capitals.reduce((a, b) => a + b, 0)
  const sumSquares = capitals.reduce((a, b) => a + b * b, 0)
  
  return (sum * sum) / (this.traders.length * sumSquares)
}

MarketEnvironmentSchema.methods.calculateGiniCoefficient = function(this: IMarketEnvironmentDocument): number {
  // 计算基尼系数
  if (this.traders.length === 0) return 0
  
  const capitals = this.traders.map(trader => trader.initialCapital).sort((a, b) => a - b)
  const n = capitals.length
  const sum = capitals.reduce((a, b) => a + b, 0)
  
  if (sum === 0) return 0
  
  let index = 0
  for (let i = 0; i < n; i++) {
    index += (2 * (i + 1) - n - 1) * capitals[i]
  }
  
  return index / (n * sum)
}

MarketEnvironmentSchema.methods.getCapitalRange = function(this: IMarketEnvironmentDocument, capital: number): string {
  if (capital < 10000) return '< 1万'
  if (capital < 100000) return '1-10万'
  if (capital < 1000000) return '10-100万'
  if (capital < 10000000) return '100-1000万'
  return '> 1000万'
}

// 静态方法
MarketEnvironmentSchema.statics.findByTraderCount = function(
  this: IMarketEnvironmentModel,
  min: number,
  max: number
): Promise<IMarketEnvironmentDocument[]> {
  return this.find({
    'statistics.traderCount': { $gte: min, $lte: max }
  })
}

MarketEnvironmentSchema.statics.findByStockCount = function(
  this: IMarketEnvironmentModel,
  min: number,
  max: number
): Promise<IMarketEnvironmentDocument[]> {
  return this.find({
    'statistics.stockCount': { $gte: min, $lte: max }
  })
}

// 中间件
MarketEnvironmentSchema.pre('save', function(this: IMarketEnvironmentDocument, next) {
  // 更新统计信息
  this.updateStatistics()
  
  // 验证数据完整性
  if (this.traders.length === 0) {
    return next(new Error('市场环境至少需要一个交易员'))
  }
  
  if (this.stocks.length === 0) {
    return next(new Error('市场环境至少需要一只股票'))
  }
  
  // 验证股票分配完整性
  for (const stock of this.stocks) {
    const totalAllocated = stock.holders.reduce((sum, holder) => sum + holder.quantity, 0)
    if (totalAllocated !== stock.totalShares) {
      return next(new Error(`股票 ${stock.symbol} 的分配数量不等于总股数`))
    }
  }
  
  next()
})

MarketEnvironmentSchema.pre('validate', function(this: IMarketEnvironmentDocument, next) {
  // 生成唯一ID
  if (!this.id) {
    this.id = `market_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  next()
})

// 导出模型
const MarketEnvironment = mongoose.model<IMarketEnvironmentDocument, IMarketEnvironmentModel>('MarketEnvironment', MarketEnvironmentSchema)

export default MarketEnvironment