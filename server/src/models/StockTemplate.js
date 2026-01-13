import mongoose from 'mongoose'
import { BaseSchema, validators, commonFields, registerModel } from './index.js'

// 股票模板Schema
const stockTemplateSchema = new BaseSchema({
  // 股票名称
  name: {
    type: String,
    required: [true, '股票名称是必填项'],
    trim: true,
    minlength: [1, '股票名称至少1个字符'],
    maxlength: [100, '股票名称最多100个字符'],
    validate: validators.name,
  },
  
  // 股票代码
  symbol: {
    type: String,
    required: [true, '股票代码是必填项'],
    unique: true,
    uppercase: true,
    trim: true,
    validate: validators.stockSymbol,
  },
  
  // 发行价格
  issuePrice: {
    type: mongoose.Schema.Types.Decimal128,
    required: [true, '发行价格是必填项'],
    min: [0.01, '发行价格至少0.01元'],
    max: [999999.99, '发行价格不能超过999999.99元'],
    validate: validators.price,
    get: (value) => value ? parseFloat(value.toString()) : value,
    set: (value) => value ? mongoose.Types.Decimal128.fromString(value.toString()) : value,
  },
  
  // 总股本
  totalShares: {
    type: Number,
    required: [true, '总股本是必填项'],
    min: [1, '总股本至少为1股'],
    max: [1000000000, '总股本不能超过10亿股'],
    validate: validators.shares,
  },
  
  // 股票分类
  category: {
    type: String,
    enum: {
      values: ['tech', 'finance', 'healthcare', 'energy', 'consumer'],
      message: '股票分类必须是预定义的类型之一',
    },
  },
  
  // 通用字段
  ...commonFields,
})

// 索引
stockTemplateSchema.index({ symbol: 1 }, { unique: true })
stockTemplateSchema.index({ status: 1, createdAt: -1 })
stockTemplateSchema.index({ category: 1, status: 1 })
stockTemplateSchema.index({ name: 'text', description: 'text' })

// 虚拟字段
stockTemplateSchema.virtual('marketValue').get(function() {
  return this.issuePrice * this.totalShares
})

// 实例方法
stockTemplateSchema.methods.toSafeObject = function() {
  const obj = this.toObject()
  return {
    id: obj.id,
    name: obj.name,
    symbol: obj.symbol,
    issuePrice: obj.issuePrice,
    totalShares: obj.totalShares,
    category: obj.category,
    description: obj.description,
    status: obj.status,
    marketValue: this.marketValue,
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
    createdBy: obj.createdBy,
  }
}

// 静态方法
stockTemplateSchema.statics.findBySymbol = function(symbol) {
  return this.findOne({ symbol: symbol.toUpperCase(), status: 'active' })
}

stockTemplateSchema.statics.findByCategory = function(category, options = {}) {
  const query = { category, status: 'active' }
  return this.find(query, null, options)
}

stockTemplateSchema.statics.searchByName = function(searchTerm, options = {}) {
  const query = {
    $text: { $search: searchTerm },
    status: 'active',
  }
  return this.find(query, null, options)
}

// 查询助手
stockTemplateSchema.query.active = function() {
  return this.where({ status: 'active' })
}

stockTemplateSchema.query.byCategory = function(category) {
  return this.where({ category })
}

// 中间件
stockTemplateSchema.pre('save', function(next) {
  // 确保symbol是大写
  if (this.symbol) {
    this.symbol = this.symbol.toUpperCase()
  }
  
  // 验证issuePrice精度
  if (this.issuePrice) {
    const priceStr = this.issuePrice.toString()
    const decimalPlaces = priceStr.includes('.') ? priceStr.split('.')[1].length : 0
    if (decimalPlaces > 2) {
      return next(new Error('发行价格最多保留2位小数'))
    }
  }
  
  next()
})

stockTemplateSchema.pre('findOneAndUpdate', function(next) {
  // 确保更新时symbol也是大写
  if (this.getUpdate().$set && this.getUpdate().$set.symbol) {
    this.getUpdate().$set.symbol = this.getUpdate().$set.symbol.toUpperCase()
  }
  
  next()
})

// 删除前检查是否被使用
stockTemplateSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // 这里可以检查是否有市场环境在使用这个模板
    // const marketCount = await MarketEnvironment.countDocuments({ 'stocks.templateId': this._id })
    // if (marketCount > 0) {
    //   throw new Error('该股票模板正在被使用，无法删除')
    // }
    next()
  } catch (error) {
    next(error)
  }
})

// 注册模型
const StockTemplate = registerModel('StockTemplate', stockTemplateSchema)

export default StockTemplate