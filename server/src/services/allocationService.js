/**
 * 股票分配算法服务
 * 实现多种股票分配策略，包括加权随机分配、平均分配和基于风险的分配
 */

import crypto from 'crypto'

/**
 * 分配算法类
 */
class AllocationService {
  constructor() {
    this.algorithms = {
      weighted_random: this.weightedRandomAllocation.bind(this),
      equal_distribution: this.equalDistributionAllocation.bind(this),
      risk_based: this.riskBasedAllocation.bind(this)
    }
  }

  /**
   * 执行股票分配
   * @param {Array} traders - 交易员列表
   * @param {Array} stocks - 股票列表
   * @param {String} algorithm - 分配算法名称
   * @param {Number} seed - 随机种子（可选）
   * @returns {Object} 分配结果
   */
  allocateStocks(traders, stocks, algorithm = 'weighted_random', seed = null) {
    if (!traders || traders.length === 0) {
      throw new Error('交易员列表不能为空')
    }

    if (!stocks || stocks.length === 0) {
      throw new Error('股票列表不能为空')
    }

    if (!this.algorithms[algorithm]) {
      throw new Error(`不支持的分配算法: ${algorithm}`)
    }

    // 设置随机种子以确保可重现性
    if (seed !== null) {
      this.setSeed(seed)
    }

    // 执行分配算法
    const result = this.algorithms[algorithm](traders, stocks)

    // 验证分配结果
    this.validateAllocation(result.traders, result.stocks)

    return {
      ...result,
      algorithm,
      seed: seed || this.generateSeed(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 加权随机分配算法
   * 基于交易员的初始资金进行加权随机分配
   */
  weightedRandomAllocation(traders, stocks) {
    const allocatedTraders = traders.map(trader => ({
      ...trader,
      holdings: []
    }))

    const allocatedStocks = stocks.map(stock => ({
      ...stock,
      holders: [],
      allocatedShares: 0,
      availableShares: stock.totalShares
    }))

    // 为每只股票进行分配
    for (const stock of allocatedStocks) {
      this.allocateStockToTraders(stock, allocatedTraders)
    }

    return {
      traders: allocatedTraders,
      stocks: allocatedStocks
    }
  }

  /**
   * 平均分配算法
   * 尽可能平均地将股票分配给所有交易员
   */
  equalDistributionAllocation(traders, stocks) {
    const allocatedTraders = traders.map(trader => ({
      ...trader,
      holdings: []
    }))

    const allocatedStocks = stocks.map(stock => ({
      ...stock,
      holders: [],
      allocatedShares: 0,
      availableShares: stock.totalShares
    }))

    // 为每只股票进行平均分配
    for (const stock of allocatedStocks) {
      this.equallyAllocateStock(stock, allocatedTraders)
    }

    return {
      traders: allocatedTraders,
      stocks: allocatedStocks
    }
  }

  /**
   * 基于风险的分配算法
   * 根据交易员的风险偏好和股票类别进行匹配分配
   */
  riskBasedAllocation(traders, stocks) {
    const allocatedTraders = traders.map(trader => ({
      ...trader,
      holdings: []
    }))

    const allocatedStocks = stocks.map(stock => ({
      ...stock,
      holders: [],
      allocatedShares: 0,
      availableShares: stock.totalShares
    }))

    // 按风险偏好分组交易员
    const tradersByRisk = this.groupTradersByRisk(allocatedTraders)
    
    // 按类别分组股票
    const stocksByCategory = this.groupStocksByCategory(allocatedStocks)

    // 执行基于风险的分配
    this.performRiskBasedAllocation(tradersByRisk, stocksByCategory)

    return {
      traders: allocatedTraders,
      stocks: allocatedStocks
    }
  }

  /**
   * 为单只股票分配给交易员（加权随机）
   */
  allocateStockToTraders(stock, traders) {
    const totalCapital = traders.reduce((sum, trader) => sum + trader.initialCapital, 0)
    let remainingShares = stock.totalShares

    // 计算每个交易员的权重
    const weights = traders.map(trader => trader.initialCapital / totalCapital)

    // 基于权重分配股票
    for (let i = 0; i < traders.length && remainingShares > 0; i++) {
      const trader = traders[i]
      
      // 计算分配数量（带随机因子）
      let allocation
      if (i === traders.length - 1) {
        // 最后一个交易员获得剩余所有股票
        allocation = remainingShares
      } else {
        const baseAllocation = Math.floor(stock.totalShares * weights[i])
        const randomFactor = this.getRandomFloat(0.8, 1.2) // ±20% 随机变化
        allocation = Math.min(
          Math.floor(baseAllocation * randomFactor),
          remainingShares
        )
      }

      if (allocation > 0) {
        // 添加到交易员持仓
        trader.holdings.push({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          quantity: allocation,
          averagePrice: stock.issuePrice,
          currentValue: allocation * stock.currentPrice
        })

        // 添加到股票持有者
        stock.holders.push({
          traderId: trader.id,
          traderName: trader.name,
          quantity: allocation,
          percentage: (allocation / stock.totalShares) * 100
        })

        stock.allocatedShares += allocation
        remainingShares -= allocation
      }
    }

    // 更新可用股数
    stock.availableShares = remainingShares
  }

  /**
   * 平均分配单只股票
   */
  equallyAllocateStock(stock, traders) {
    const baseAllocation = Math.floor(stock.totalShares / traders.length)
    let remainingShares = stock.totalShares - (baseAllocation * traders.length)

    for (let i = 0; i < traders.length; i++) {
      const trader = traders[i]
      
      // 基础分配 + 剩余股票分配
      let allocation = baseAllocation
      if (remainingShares > 0) {
        allocation += 1
        remainingShares -= 1
      }

      if (allocation > 0) {
        // 添加到交易员持仓
        trader.holdings.push({
          stockSymbol: stock.symbol,
          stockName: stock.name,
          quantity: allocation,
          averagePrice: stock.issuePrice,
          currentValue: allocation * stock.currentPrice
        })

        // 添加到股票持有者
        stock.holders.push({
          traderId: trader.id,
          traderName: trader.name,
          quantity: allocation,
          percentage: (allocation / stock.totalShares) * 100
        })

        stock.allocatedShares += allocation
      }
    }

    stock.availableShares = 0
  }

  /**
   * 按风险偏好分组交易员
   */
  groupTradersByRisk(traders) {
    return traders.reduce((groups, trader) => {
      const risk = trader.riskProfile
      if (!groups[risk]) {
        groups[risk] = []
      }
      groups[risk].push(trader)
      return groups
    }, {})
  }

  /**
   * 按类别分组股票
   */
  groupStocksByCategory(stocks) {
    return stocks.reduce((groups, stock) => {
      const category = stock.category || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(stock)
      return groups
    }, {})
  }

  /**
   * 执行基于风险的分配
   */
  performRiskBasedAllocation(tradersByRisk, stocksByCategory) {
    // 风险偏好与股票类别的匹配规则
    const riskCategoryMapping = {
      conservative: ['finance', 'consumer'],
      moderate: ['tech', 'healthcare'],
      aggressive: ['energy', 'tech']
    }

    // 为每种风险偏好的交易员分配相应的股票
    for (const [riskProfile, traders] of Object.entries(tradersByRisk)) {
      const preferredCategories = riskCategoryMapping[riskProfile] || ['other']
      
      // 获取偏好的股票
      const preferredStocks = []
      for (const category of preferredCategories) {
        if (stocksByCategory[category]) {
          preferredStocks.push(...stocksByCategory[category])
        }
      }

      // 如果没有偏好股票，使用所有股票
      const targetStocks = preferredStocks.length > 0 
        ? preferredStocks 
        : Object.values(stocksByCategory).flat()

      // 为这组交易员分配股票
      for (const stock of targetStocks) {
        this.allocateStockToTradersGroup(stock, traders)
      }
    }
  }

  /**
   * 为特定交易员组分配股票
   */
  allocateStockToTradersGroup(stock, traders) {
    if (traders.length === 0 || stock.availableShares === 0) return

    const totalCapital = traders.reduce((sum, trader) => sum + trader.initialCapital, 0)
    let remainingShares = Math.min(stock.availableShares, stock.totalShares)

    for (let i = 0; i < traders.length && remainingShares > 0; i++) {
      const trader = traders[i]
      const weight = trader.initialCapital / totalCapital
      
      let allocation
      if (i === traders.length - 1) {
        allocation = remainingShares
      } else {
        allocation = Math.floor(remainingShares * weight)
      }

      if (allocation > 0) {
        // 检查是否已有该股票持仓
        const existingHolding = trader.holdings.find(h => h.stockSymbol === stock.symbol)
        
        if (existingHolding) {
          // 更新现有持仓
          existingHolding.quantity += allocation
          existingHolding.currentValue = existingHolding.quantity * stock.currentPrice
        } else {
          // 创建新持仓
          trader.holdings.push({
            stockSymbol: stock.symbol,
            stockName: stock.name,
            quantity: allocation,
            averagePrice: stock.issuePrice,
            currentValue: allocation * stock.currentPrice
          })
        }

        // 更新或添加股票持有者
        const existingHolder = stock.holders.find(h => h.traderId === trader.id)
        
        if (existingHolder) {
          existingHolder.quantity += allocation
          existingHolder.percentage = (existingHolder.quantity / stock.totalShares) * 100
        } else {
          stock.holders.push({
            traderId: trader.id,
            traderName: trader.name,
            quantity: allocation,
            percentage: (allocation / stock.totalShares) * 100
          })
        }

        stock.allocatedShares += allocation
        remainingShares -= allocation
      }
    }

    stock.availableShares = stock.totalShares - stock.allocatedShares
  }

  /**
   * 验证分配结果
   */
  validateAllocation(traders, stocks) {
    // 验证股票分配完整性
    for (const stock of stocks) {
      const totalAllocated = stock.holders.reduce((sum, holder) => sum + holder.quantity, 0)
      
      if (totalAllocated !== stock.allocatedShares) {
        throw new Error(`股票 ${stock.symbol} 的持有者数量与已分配数量不匹配`)
      }

      if (stock.allocatedShares > stock.totalShares) {
        throw new Error(`股票 ${stock.symbol} 的分配数量超过总股数`)
      }
    }

    // 验证交易员持仓一致性
    for (const trader of traders) {
      for (const holding of trader.holdings) {
        const stock = stocks.find(s => s.symbol === holding.stockSymbol)
        if (!stock) {
          throw new Error(`交易员 ${trader.name} 持有不存在的股票 ${holding.stockSymbol}`)
        }

        const holder = stock.holders.find(h => h.traderId === trader.id)
        if (!holder || holder.quantity !== holding.quantity) {
          throw new Error(`交易员 ${trader.name} 的 ${holding.stockSymbol} 持仓数量不一致`)
        }
      }
    }
  }

  /**
   * 设置随机种子
   */
  setSeed(seed) {
    this.randomSeed = seed
    this.randomState = seed
  }

  /**
   * 生成随机种子
   */
  generateSeed() {
    return Math.floor(Math.random() * 1000000)
  }

  /**
   * 获取随机浮点数
   */
  getRandomFloat(min, max) {
    if (this.randomState !== undefined) {
      // 使用线性同余生成器确保可重现性
      this.randomState = (this.randomState * 1664525 + 1013904223) % Math.pow(2, 32)
      const random = this.randomState / Math.pow(2, 32)
      return min + random * (max - min)
    }
    
    return min + Math.random() * (max - min)
  }

  /**
   * 获取随机整数
   */
  getRandomInt(min, max) {
    return Math.floor(this.getRandomFloat(min, max + 1))
  }

  /**
   * 计算分配统计信息
   */
  calculateAllocationStatistics(traders, stocks) {
    const stats = {
      totalTraders: traders.length,
      totalStocks: stocks.length,
      totalCapital: traders.reduce((sum, trader) => sum + trader.initialCapital, 0),
      totalMarketValue: stocks.reduce((sum, stock) => sum + (stock.currentPrice * stock.totalShares), 0),
      averageHoldingsPerTrader: 0,
      averageHoldersPerStock: 0,
      capitalDistribution: {},
      stockDistribution: {},
      allocationFairness: 0,
      giniCoefficient: 0
    }

    // 计算平均持仓数
    const totalHoldings = traders.reduce((sum, trader) => sum + trader.holdings.length, 0)
    stats.averageHoldingsPerTrader = totalHoldings / traders.length

    // 计算平均持有者数
    const totalHolders = stocks.reduce((sum, stock) => sum + stock.holders.length, 0)
    stats.averageHoldersPerStock = totalHolders / stocks.length

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

    // 计算分配公平性（Jain's Fairness Index）
    const capitals = traders.map(trader => trader.initialCapital)
    const sum = capitals.reduce((a, b) => a + b, 0)
    const sumSquares = capitals.reduce((a, b) => a + b * b, 0)
    stats.allocationFairness = (sum * sum) / (traders.length * sumSquares)

    // 计算基尼系数
    stats.giniCoefficient = this.calculateGiniCoefficient(capitals)

    return stats
  }

  /**
   * 计算基尼系数
   */
  calculateGiniCoefficient(values) {
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
   * 获取资金范围
   */
  getCapitalRange(capital) {
    if (capital < 10000) return '< 1万'
    if (capital < 100000) return '1-10万'
    if (capital < 1000000) return '10-100万'
    if (capital < 10000000) return '100-1000万'
    return '> 1000万'
  }
}

export default AllocationService