/**
 * 市场环境工具函数
 * 提供市场环境创建、验证、转换等通用功能
 */

import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

// 交易员配置接口
interface TraderConfig {
  templateId: string
  count: number
}

// 市场配置接口
interface MarketConfig {
  traderConfigs?: TraderConfig[]
  stockTemplateIds?: string[]
  allocationAlgorithm?: string
  seed?: number
}

// 验证结果接口
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// 交易员持仓接口
interface TraderHolding {
  stockSymbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentValue: number
}

// 交易员接口
interface Trader {
  id: string
  name: string
  templateId: string
  initialCapital: number
  currentCapital: number
  riskProfile: string
  tradingStyle?: string
  maxPositions: number
  parameters: Record<string, any>
  holdings: TraderHolding[]
  createdAt?: Date
}

// 股票持有者接口
interface StockHolder {
  traderId: string
  traderName: string
  quantity: number
  percentage: number
}

// 股票接口
interface Stock {
  id: string
  symbol: string
  name: string
  templateId: string
  issuePrice: number
  currentPrice: number
  totalShares: number
  allocatedShares: number
  availableShares: number
  category?: string
  holders: StockHolder[]
  createdAt?: Date
}

// 市场统计信息接口
interface MarketStatistics {
  traderCount: number
  stockCount: number
  totalCapital: number
  totalMarketValue: number
  averageCapitalPerTrader: number
  capitalDistribution: Record<string, number>
  stockDistribution: Record<string, number>
  riskProfileDistribution: Record<string, number>
  tradingStyleDistribution: Record<string, number>
  allocationFairness: number
  giniCoefficient: number
  concentrationIndex: number
}

// 市场环境接口
interface MarketEnvironment {
  id: string
  name: string
  description?: string
  version?: string
  createdAt: Date | string
  allocationAlgorithm: string
  allocationSeed: number
  totalCapital: number
  totalMarketValue: number
  traders: Trader[]
  stocks: Stock[]
  statistics?: MarketStatistics
  metadata?: Record<string, any>
}

// 市场摘要接口
interface MarketSummary {
  id: string
  name: string
  createdAt: Date | string
  traderCount: number
  stockCount: number
  totalCapital: number
  totalMarketValue: number
  allocationAlgorithm: string
  version?: string
  statistics?: {
    averageCapitalPerTrader: number
    allocationFairness: number
    giniCoefficient: number
  }
  riskDistribution: Record<string, number>
  categoryDistribution: Record<string, number>
}

/**
 * 市场工具类
 */
class MarketUtils {
  /**
   * 生成唯一的市场环境ID
   * @returns 唯一ID
   */
  static generateMarketId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 11)
    return `market_${timestamp}_${random}`
  }

  /**
   * 生成唯一的交易员ID
   * @returns 唯一ID
   */
  static generateTraderId(): string {
    return `trader_${uuidv4()}`
  }

  /**
   * 生成唯一的股票ID
   * @returns 唯一ID
   */
  static generateStockId(): string {
    return `stock_${uuidv4()}`
  }

  /**
   * 生成交易员名称
   * @param templateName - 模板名称
   * @param index - 序号
   * @returns 交易员名称
   */
  static generateTraderName(templateName: string, index: number): string {
    return `${templateName}_${String(index).padStart(3, '0')}`
  }

  /**
   * 验证市场环境配置
   * @param config - 市场配置
   * @returns 验证结果
   */
  static validateMarketConfig(config: MarketConfig): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 基础验证
    if (!config) {
      errors.push('市场配置不能为空')
      return { valid: false, errors, warnings }
    }

    // 验证交易员配置
    if (!config.traderConfigs || config.traderConfigs.length === 0) {
      errors.push('至少需要配置一个交易员模板')
    } else {
      config.traderConfigs.forEach((traderConfig, index) => {
        if (!traderConfig.templateId) {
          errors.push(`交易员配置 ${index + 1} 缺少模板ID`)
        }
        if (!traderConfig.count || traderConfig.count < 1) {
          errors.push(`交易员配置 ${index + 1} 的数量必须大于0`)
        }
        if (traderConfig.count > 1000) {
          warnings.push(`交易员配置 ${index + 1} 的数量过多，可能影响性能`)
        }
      })
    }

    // 验证股票配置
    if (!config.stockTemplateIds || config.stockTemplateIds.length === 0) {
      errors.push('至少需要选择一个股票模板')
    } else {
      if (config.stockTemplateIds.length > 100) {
        warnings.push('股票数量过多，可能影响性能')
      }
    }

    // 验证分配算法
    const validAlgorithms = ['weighted_random', 'equal_distribution', 'risk_based']
    if (config.allocationAlgorithm && !validAlgorithms.includes(config.allocationAlgorithm)) {
      errors.push(`不支持的分配算法: ${config.allocationAlgorithm}`)
    }

    // 验证随机种子
    if (config.seed !== undefined && config.seed !== null && (!Number.isInteger(config.seed) || config.seed < 0)) {
      errors.push('随机种子必须是非负整数')
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 计算市场环境统计信息
   * @param traders - 交易员列表
   * @param stocks - 股票列表
   * @returns 统计信息
   */
  static calculateMarketStatistics(traders: Trader[], stocks: Stock[]): MarketStatistics {
    const stats: MarketStatistics = {
      traderCount: traders.length,
      stockCount: stocks.length,
      totalCapital: 0,
      totalMarketValue: 0,
      averageCapitalPerTrader: 0,
      capitalDistribution: {},
      stockDistribution: {},
      riskProfileDistribution: {},
      tradingStyleDistribution: {},
      allocationFairness: 0,
      giniCoefficient: 0,
      concentrationIndex: 0
    }

    if (traders.length === 0) return stats

    // 计算总资金和平均资金
    stats.totalCapital = traders.reduce((sum, trader) => sum + trader.initialCapital, 0)
    stats.averageCapitalPerTrader = stats.totalCapital / traders.length

    // 计算总市值
    stats.totalMarketValue = stocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.totalShares), 0)

    // 计算资金分布
    traders.forEach(trader => {
      const range = this.getCapitalRange(trader.initialCapital)
      stats.capitalDistribution[range] = (stats.capitalDistribution[range] || 0) + 1
    })

    // 计算股票分布
    stocks.forEach(stock => {
      const category = stock.category || 'other'
      stats.stockDistribution[category] = (stats.stockDistribution[category] || 0) + 1
    })

    // 计算风险偏好分布
    traders.forEach(trader => {
      const risk = trader.riskProfile
      stats.riskProfileDistribution[risk] = (stats.riskProfileDistribution[risk] || 0) + 1
    })

    // 计算交易风格分布
    traders.forEach(trader => {
      const style = trader.tradingStyle || 'unknown'
      stats.tradingStyleDistribution[style] = (stats.tradingStyleDistribution[style] || 0) + 1
    })

    // 计算分配公平性（Jain's Fairness Index）
    const capitals = traders.map(trader => trader.initialCapital)
    stats.allocationFairness = this.calculateJainsFairnessIndex(capitals)

    // 计算基尼系数
    stats.giniCoefficient = this.calculateGiniCoefficient(capitals)

    // 计算集中度指数（HHI）
    stats.concentrationIndex = this.calculateHerfindahlIndex(capitals)

    return stats
  }

  /**
   * 计算Jain公平性指数
   * @param values - 数值数组
   * @returns 公平性指数 (0-1)
   */
  static calculateJainsFairnessIndex(values: number[]): number {
    if (values.length === 0) return 1

    const sum = values.reduce((a, b) => a + b, 0)
    const sumSquares = values.reduce((a, b) => a + b * b, 0)

    if (sumSquares === 0) return 1

    return (sum * sum) / (values.length * sumSquares)
  }

  /**
   * 计算基尼系数
   * @param values - 数值数组
   * @returns 基尼系数 (0-1)
   */
  static calculateGiniCoefficient(values: number[]): number {
    if (values.length === 0) return 0

    const sortedValues = [...values].sort((a, b) => a - b)
    const n = sortedValues.length
    const sum = sortedValues.reduce((a, b) => a + b, 0)

    if (sum === 0) return 0

    let index = 0
    for (let i = 0; i < n; i++) {
      index += (2 * (i + 1) - n - 1) * sortedValues[i]
    }

    return index / (n * sum)
  }

  /**
   * 计算赫芬达尔指数（HHI）
   * @param values - 数值数组
   * @returns 集中度指数
   */
  static calculateHerfindahlIndex(values: number[]): number {
    if (values.length === 0) return 0

    const total = values.reduce((a, b) => a + b, 0)
    if (total === 0) return 0

    const shares = values.map(value => value / total)
    return shares.reduce((sum, share) => sum + share * share, 0)
  }

  /**
   * 获取资金范围标签
   * @param capital - 资金数额
   * @returns 范围标签
   */
  static getCapitalRange(capital: number): string {
    if (capital < 10000) return '< 1万'
    if (capital < 100000) return '1-10万'
    if (capital < 1000000) return '10-100万'
    if (capital < 10000000) return '100-1000万'
    return '> 1000万'
  }

  /**
   * 验证股票分配完整性
   * @param stocks - 股票列表
   * @returns 验证结果
   */
  static validateStockAllocation(stocks: Stock[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    stocks.forEach(stock => {
      const totalAllocated = stock.holders.reduce((sum, holder) => sum + holder.quantity, 0)
      
      if (totalAllocated !== stock.totalShares) {
        errors.push(`股票 ${stock.symbol} 的分配数量 (${totalAllocated}) 不等于总股数 (${stock.totalShares})`)
      }

      if (stock.allocatedShares !== totalAllocated) {
        errors.push(`股票 ${stock.symbol} 的已分配数量字段不一致`)
      }

      if (stock.availableShares !== stock.totalShares - stock.allocatedShares) {
        errors.push(`股票 ${stock.symbol} 的可用股数计算错误`)
      }

      // 检查持有者比例
      stock.holders.forEach(holder => {
        const expectedPercentage = (holder.quantity / stock.totalShares) * 100
        const actualPercentage = holder.percentage
        
        if (Math.abs(expectedPercentage - actualPercentage) > 0.01) {
          warnings.push(`股票 ${stock.symbol} 持有者 ${holder.traderName} 的持有比例计算可能有误`)
        }
      })
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 验证交易员持仓一致性
   * @param traders - 交易员列表
   * @param stocks - 股票列表
   * @returns 验证结果
   */
  static validateTraderHoldings(traders: Trader[], stocks: Stock[]): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    traders.forEach(trader => {
      trader.holdings.forEach(holding => {
        const stock = stocks.find(s => s.symbol === holding.stockSymbol)
        
        if (!stock) {
          errors.push(`交易员 ${trader.name} 持有不存在的股票 ${holding.stockSymbol}`)
          return
        }

        const holder = stock.holders.find(h => h.traderId === trader.id)
        
        if (!holder) {
          errors.push(`股票 ${holding.stockSymbol} 的持有者列表中未找到交易员 ${trader.name}`)
        } else if (holder.quantity !== holding.quantity) {
          errors.push(`交易员 ${trader.name} 的 ${holding.stockSymbol} 持仓数量不一致`)
        }

        // 检查当前市值计算
        const expectedValue = holding.quantity * stock.currentPrice
        if (Math.abs(expectedValue - holding.currentValue) > 0.01) {
          warnings.push(`交易员 ${trader.name} 的 ${holding.stockSymbol} 当前市值计算可能有误`)
        }
      })
    })

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 生成市场环境摘要
   * @param marketEnvironment - 市场环境对象
   * @returns 摘要信息
   */
  static generateMarketSummary(marketEnvironment: MarketEnvironment): MarketSummary {
    const summary: MarketSummary = {
      id: marketEnvironment.id,
      name: marketEnvironment.name,
      createdAt: marketEnvironment.createdAt,
      traderCount: marketEnvironment.traders.length,
      stockCount: marketEnvironment.stocks.length,
      totalCapital: marketEnvironment.totalCapital,
      totalMarketValue: marketEnvironment.totalMarketValue,
      allocationAlgorithm: marketEnvironment.allocationAlgorithm,
      version: marketEnvironment.version,
      riskDistribution: {},
      categoryDistribution: {}
    }

    // 添加统计摘要
    if (marketEnvironment.statistics) {
      summary.statistics = {
        averageCapitalPerTrader: marketEnvironment.statistics.averageCapitalPerTrader,
        allocationFairness: marketEnvironment.statistics.allocationFairness,
        giniCoefficient: marketEnvironment.statistics.giniCoefficient
      }
    }

    // 添加风险分布
    const riskDistribution: Record<string, number> = {}
    marketEnvironment.traders.forEach(trader => {
      const risk = trader.riskProfile
      riskDistribution[risk] = (riskDistribution[risk] || 0) + 1
    })
    summary.riskDistribution = riskDistribution

    // 添加股票类别分布
    const categoryDistribution: Record<string, number> = {}
    marketEnvironment.stocks.forEach(stock => {
      const category = stock.category || 'other'
      categoryDistribution[category] = (categoryDistribution[category] || 0) + 1
    })
    summary.categoryDistribution = categoryDistribution

    return summary
  }

  /**
   * 生成随机种子
   * @returns 随机种子
   */
  static generateRandomSeed(): number {
    return Math.floor(Math.random() * 1000000)
  }

  /**
   * 创建哈希值
   * @param data - 要哈希的数据
   * @returns 哈希值
   */
  static createHash(data: string): string {
    return crypto.createHash('md5').update(data).digest('hex')
  }

  /**
   * 格式化货币数额
   * @param amount - 金额
   * @param currency - 货币符号
   * @returns 格式化后的金额
   */
  static formatCurrency(amount: number, currency: string = '¥'): string {
    if (typeof amount !== 'number') return `${currency}0.00`
    
    return `${currency}${amount.toLocaleString('zh-CN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`
  }

  /**
   * 格式化百分比
   * @param value - 数值
   * @param decimals - 小数位数
   * @returns 格式化后的百分比
   */
  static formatPercentage(value: number, decimals: number = 2): string {
    if (typeof value !== 'number') return '0.00%'
    
    return `${(value * 100).toFixed(decimals)}%`
  }

  /**
   * 格式化数量
   * @param quantity - 数量
   * @returns 格式化后的数量
   */
  static formatQuantity(quantity: number): string {
    if (typeof quantity !== 'number') return '0'
    
    return quantity.toLocaleString('zh-CN')
  }

  /**
   * 深度克隆对象
   * @param obj - 要克隆的对象
   * @returns 克隆后的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime()) as T
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as T
    
    const cloned = {} as T
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = this.deepClone(obj[key])
      }
    }
    
    return cloned
  }

  /**
   * 检查对象是否为空
   * @param obj - 要检查的对象
   * @returns 是否为空
   */
  static isEmpty(obj: any): boolean {
    if (obj === null || obj === undefined) return true
    if (typeof obj === 'string') return obj.trim().length === 0
    if (Array.isArray(obj)) return obj.length === 0
    if (typeof obj === 'object') return Object.keys(obj).length === 0
    
    return false
  }

  /**
   * 安全地获取嵌套属性
   * @param obj - 对象
   * @param path - 属性路径
   * @param defaultValue - 默认值
   * @returns 属性值或默认值
   */
  static safeGet<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined || !(key in current)) {
        return defaultValue
      }
      current = current[key]
    }
    
    return current
  }
}

export default MarketUtils