/**
 * 股票运行时模型
 * 用于市场环境初始化时生成的股票实例
 */

import mongoose, { Document, Schema, Model, Types } from 'mongoose'

// 类型定义
export interface IShareHolder {
  traderId: string
  traderName: string
  quantity: number
  percentage: number
}

export interface IPriceHistory {
  price: number
  timestamp: Date
  volume: number
}

export interface IMarketData {
  marketCap?: number
  volume24h: number
  volatility: number
  beta: number
}

export interface IStock {
  id: string
  templateId: Types.ObjectId
  symbol: string
  name: string
  issuePrice: number
  currentPrice: number
  totalShares: number
  availableShares: number
  allocatedShares: number
  category?: 'tech' | 'finance' | 'healthcare' | 'energy' | 'consumer'
  holders: IShareHolder[]
  priceHistory: IPriceHistory[]
  marketEnvironmentId: string
  marketData: IMarketData
  status: 'active' | 'suspended' | 'delisted'
  createdAt: Date
  updatedAt: Date
}

// Document 接口
export interface IStockDocument extends Omit<IStock, 'id'>, Document {
  marketCap: number
  priceChange: number
  priceChangePercent: number
  holdersCount: number
  allocationRate: number
  latestPrice: number
  
  allocateShares(traderId: string, traderName: string, quantity: number): Promise<IStockDocument>
  deallocateShares(traderId: string, quantity: number): Promise<IStockDocument>
  updatePrice(newPrice: number, volume?: number): Promise<IStockDocument>
  calculateVolatility(days?: number): number
  getHolderByTraderId(traderId: string): IShareHolder | undefined
  getTopHolders(limit?: number): IShareHolder[]
}

// Model 接口
export interface IStockModel extends Model<IStockDocument> {
  createFromTemplate(template: any, marketEnvironmentId: string): IStockDocument
  findByMarketEnvironment(marketEnvironmentId: string, options?: any): Promise<IStockDocument[]>
  getMarketStatistics(marketEnvironmentId: string): Promise<any[]>
}

// 股东持股子文档
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
      message: '持有数量必须是整数'
    }
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    get: (value: number) => Math.round(value * 10000) / 10000 // 保留4位小数
  }
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true }
})

// 价格历史子文档
const PriceHistorySchema = new Schema<IPriceHistory>({
  price: {
    type: Number,
    required: true,
    min: 0,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  volume: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  _id: false,
  toJSON: { getters: true },
  toObject: { getters: true }
})

// 股票主模式
const StockSchema = new Schema<IStockDocument, IStockModel>({
  // 基本信息
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  templateId: {
    type: Schema.Types.ObjectId,
    ref: 'StockTemplate',
    required: true,
    index: true
  },
  symbol: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    match: /^[A-Z0-9]{1,10}$/,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  
  // 价格信息
  issuePrice: {
    type: Number,
    required: true,
    min: 0.01,
    max: 999999.99,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0.01,
    get: (value: any) => value ? parseFloat(value.toString()) : 0
  },
  
  // 股本信息
  totalShares: {
    type: Number,
    required: true,
    min: 1,
    max: 1000000000,
    validate: {
      validator: Number.isInteger,
      message: '总股数必须是整数'
    }
  },
  availableShares: {
    type: Number,
    required: true,
    min: 0,
    validate: {
      validator: Number.isInteger,
      message: '可用股数必须是整数'
    }
  },
  allocatedShares: {
    type: Number,
    required: true,
    min: 0,
    default: 0,
    validate: {
      validator: Number.isInteger,
      message: '已分配股数必须是整数'
    }
  },
  
  // 分类信息
  category: {
    type: String,
    enum: ['tech', 'finance', 'healthcare', 'energy', 'consumer'],
    index: true
  },
  
  // 持股信息
  holders: [ShareHolderSchema],
  
  // 价格历史
  priceHistory: [PriceHistorySchema],
  
  // 关联信息
  marketEnvironmentId: {
    type: String,
    required: true,
    index: true
  },
  
  // 市场数据
  marketData: {
    marketCap: {
      type: Number,
      get: (value: any) => value ? parseFloat(value.toString()) : 0
    },
    volume24h: {
      type: Number,
      default: 0,
      min: 0
    },
    volatility: {
      type: Number,
      default: 0,
      min: 0,
      max: 1
    },
    beta: {
      type: Number,
      default: 1,
      min: 0
    }
  },
  
  // 状态信息
  status: {
    type: String,
    enum: ['active', 'suspended', 'delisted'],
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
  collection: 'stocks',
  timestamps: { updatedAt: 'updatedAt' },
  toJSON: { 
    getters: true,
    transform: function(doc, ret) {
      delete ret._id
      delete ret.__v
      return ret
    }
  },
  toObject: { getters: true }
})

// 索引
StockSchema.index({ marketEnvironmentId: 1, status: 1 })
StockSchema.index({ templateId: 1, createdAt: -1 })
StockSchema.index({ symbol: 1, marketEnvironmentId: 1 }, { unique: true })
StockSchema.index({ category: 1, status: 1 })

// 虚拟字段
StockSchema.virtual('marketCap').get(function(this: IStockDocument) {
  return this.currentPrice * this.totalShares
})

StockSchema.virtual('priceChange').get(function(this: IStockDocument) {
  return this.currentPrice - this.issuePrice
})

StockSchema.virtual('priceChangePercent').get(function(this: IStockDocument) {
  return ((this.currentPrice - this.issuePrice) / this.issuePrice) * 100
})

StockSchema.virtual('holdersCount').get(function(this: IStockDocument) {
  return this.holders.length
})

StockSchema.virtual('allocationRate').get(function(this: IStockDocument) {
  return (this.allocatedShares / this.totalShares) * 100
})

StockSchema.virtual('latestPrice').get(function(this: IStockDocument) {
  if (this.priceHistory.length > 0) {
    return this.priceHistory[this.priceHistory.length - 1].price
  }
  return this.currentPrice
})

// 实例方法
StockSchema.methods.allocateShares = function(
  this: IStockDocument,
  traderId: string,
  traderName: string,
  quantity: number
): Promise<IStockDocument> {
  if (quantity <= 0) {
    throw new Error('分配数量必须大于0')
  }
  
  if (this.availableShares < quantity) {
    throw new Error('可用股数不足')
  }
  
  // 检查是否已有该交易员的持股
  const existingHolder = this.holders.find(h => h.traderId === traderId)
  
  if (existingHolder) {
    // 更新现有持股
    existingHolder.quantity += quantity
    existingHolder.percentage = (existingHolder.quantity / this.totalShares) * 100
  } else {
    // 添加新股东
    this.holders.push({
      traderId,
      traderName,
      quantity,
      percentage: (quantity / this.totalShares) * 100
    })
  }
  
  // 更新股本信息
  this.availableShares -= quantity
  this.allocatedShares += quantity
  
  return this.save()
}

StockSchema.methods.deallocateShares = function(
  this: IStockDocument,
  traderId: string,
  quantity: number
): Promise<IStockDocument> {
  const holder = this.holders.find(h => h.traderId === traderId)
  
  if (!holder) {
    throw new Error('未找到该交易员的持股记录')
  }
  
  if (holder.quantity < quantity) {
    throw new Error('持股数量不足')
  }
  
  holder.quantity -= quantity
  holder.percentage = (holder.quantity / this.totalShares) * 100
  
  // 如果持股为0，移除股东记录
  if (holder.quantity === 0) {
    this.holders = this.holders.filter(h => h.traderId !== traderId)
  }
  
  // 更新股本信息
  this.availableShares += quantity
  this.allocatedShares -= quantity
  
  return this.save()
}

StockSchema.methods.updatePrice = function(
  this: IStockDocument,
  newPrice: number,
  volume: number = 0
): Promise<IStockDocument> {
  if (newPrice <= 0) {
    throw new Error('价格必须大于0')
  }
  
  // 添加价格历史记录
  this.priceHistory.push({
    price: newPrice,
    volume,
    timestamp: new Date()
  })
  
  // 限制价格历史记录数量（保留最近1000条）
  if (this.priceHistory.length > 1000) {
    this.priceHistory = this.priceHistory.slice(-1000)
  }
  
  // 更新当前价格
  this.currentPrice = newPrice
  
  // 更新市场数据
  this.marketData.marketCap = this.marketCap
  this.marketData.volume24h = volume
  
  return this.save()
}

StockSchema.methods.calculateVolatility = function(this: IStockDocument, days: number = 30): number {
  if (this.priceHistory.length < 2) {
    return 0
  }
  
  const recentPrices = this.priceHistory.slice(-days).map(p => p.price)
  
  if (recentPrices.length < 2) {
    return 0
  }
  
  // 计算日收益率
  const returns: number[] = []
  for (let i = 1; i < recentPrices.length; i++) {
    returns.push((recentPrices[i] - recentPrices[i-1]) / recentPrices[i-1])
  }
  
  // 计算标准差
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length
  const volatility = Math.sqrt(variance)
  
  this.marketData.volatility = volatility
  return volatility
}

StockSchema.methods.getHolderByTraderId = function(this: IStockDocument, traderId: string): IShareHolder | undefined {
  return this.holders.find(h => h.traderId === traderId)
}

StockSchema.methods.getTopHolders = function(this: IStockDocument, limit: number = 10): IShareHolder[] {
  return this.holders
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, limit)
}

// 静态方法
StockSchema.statics.createFromTemplate = function(
  this: IStockModel,
  template: any,
  marketEnvironmentId: string
): IStockDocument {
  const stockId = `${template._id}_${Date.now()}`
  
  return new this({
    id: stockId,
    templateId: template._id,
    symbol: template.symbol,
    name: template.name,
    issuePrice: template.issuePrice,
    currentPrice: template.issuePrice,
    totalShares: template.totalShares,
    availableShares: template.totalShares,
    allocatedShares: 0,
    category: template.category,
    marketEnvironmentId,
    holders: [],
    priceHistory: [{
      price: template.issuePrice,
      timestamp: new Date(),
      volume: 0
    }],
    marketData: {
      marketCap: template.issuePrice * template.totalShares,
      volume24h: 0,
      volatility: 0,
      beta: 1
    }
  })
}

StockSchema.statics.findByMarketEnvironment = function(
  this: IStockModel,
  marketEnvironmentId: string,
  options: any = {}
): Promise<IStockDocument[]> {
  const query: any = { marketEnvironmentId }
  
  if (options.status) {
    query.status = options.status
  }
  
  if (options.category) {
    query.category = options.category
  }
  
  if (options.symbol) {
    query.symbol = new RegExp(options.symbol, 'i')
  }
  
  return this.find(query)
    .populate('templateId', 'name description')
    .sort(options.sort || { symbol: 1 })
    .limit(options.limit || 0)
}

StockSchema.statics.getMarketStatistics = function(this: IStockModel, marketEnvironmentId: string): Promise<any[]> {
  return this.aggregate([
    { $match: { marketEnvironmentId } },
    {
      $group: {
        _id: null,
        totalStocks: { $sum: 1 },
        totalMarketCap: { $sum: { $multiply: [{ $toDouble: '$currentPrice' }, '$totalShares'] } },
        totalShares: { $sum: '$totalShares' },
        totalAllocatedShares: { $sum: '$allocatedShares' },
        avgPrice: { $avg: { $toDouble: '$currentPrice' } },
        categoryDistribution: {
          $push: '$category'
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalStocks: 1,
        totalMarketCap: 1,
        totalShares: 1,
        totalAllocatedShares: 1,
        avgPrice: 1,
        allocationRate: { 
          $multiply: [
            { $divide: ['$totalAllocatedShares', '$totalShares'] }, 
            100
          ] 
        },
        categoryDistribution: 1
      }
    }
  ])
}

// 中间件
StockSchema.pre('save', function(this: IStockDocument, next) {
  // 验证股本一致性
  if (this.allocatedShares + this.availableShares !== this.totalShares) {
    return next(new Error('股本分配不一致'))
  }
  
  // 验证持股总数
  const totalHoldings = this.holders.reduce((sum, holder) => sum + holder.quantity, 0)
  if (totalHoldings !== this.allocatedShares) {
    return next(new Error('持股总数与已分配股数不一致'))
  }
  
  // 更新市场数据
  this.marketData.marketCap = this.marketCap
  
  next()
})

StockSchema.pre('validate', function(this: IStockDocument, next) {
  // 验证价格
  if (this.currentPrice <= 0) {
    return next(new Error('当前价格必须大于0'))
  }
  
  // 验证股本
  if (this.availableShares < 0) {
    return next(new Error('可用股数不能为负数'))
  }
  
  if (this.allocatedShares < 0) {
    return next(new Error('已分配股数不能为负数'))
  }
  
  next()
})

// 导出模型
const Stock = mongoose.model<IStockDocument, IStockModel>('Stock', StockSchema)

export default Stock