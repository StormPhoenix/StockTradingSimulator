/**
 * 市场验证服务
 * 提供市场环境数据的完整性验证和业务规则检查
 */

import MarketUtils from '../utils/marketUtils.js'
import JsonUtils from '../utils/jsonUtils.js'

/**
 * 验证服务类
 */
class ValidationService {
  /**
   * 验证市场环境完整性
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validateMarketEnvironment(marketEnvironment) {
    const errors = []
    const warnings = []
    const info = []

    try {
      // 基础结构验证
      const structureValidation = this.validateStructure(marketEnvironment)
      errors.push(...structureValidation.errors)
      warnings.push(...structureValidation.warnings)

      // 业务规则验证
      const businessValidation = this.validateBusinessRules(marketEnvironment)
      errors.push(...businessValidation.errors)
      warnings.push(...businessValidation.warnings)

      // 数据一致性验证
      const consistencyValidation = this.validateDataConsistency(marketEnvironment)
      errors.push(...consistencyValidation.errors)
      warnings.push(...consistencyValidation.warnings)

      // 性能和规模验证
      const performanceValidation = this.validatePerformanceConstraints(marketEnvironment)
      warnings.push(...performanceValidation.warnings)
      info.push(...performanceValidation.info)

      // 数据质量验证
      const qualityValidation = this.validateDataQuality(marketEnvironment)
      warnings.push(...qualityValidation.warnings)
      info.push(...qualityValidation.info)

    } catch (error) {
      errors.push(`验证过程发生错误: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors: [...new Set(errors)], // 去重
      warnings: [...new Set(warnings)], // 去重
      info: [...new Set(info)], // 去重
      summary: {
        totalIssues: errors.length + warnings.length,
        criticalErrors: errors.length,
        warnings: warnings.length,
        informational: info.length
      }
    }
  }

  /**
   * 验证数据结构
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validateStructure(marketEnvironment) {
    const errors = []
    const warnings = []

    // 必需字段验证
    const requiredFields = ['id', 'traders', 'stocks']
    requiredFields.forEach(field => {
      if (!marketEnvironment[field]) {
        errors.push(`缺少必需字段: ${field}`)
      }
    })

    // 数组字段验证
    if (marketEnvironment.traders && !Array.isArray(marketEnvironment.traders)) {
      errors.push('traders字段必须是数组')
    }

    if (marketEnvironment.stocks && !Array.isArray(marketEnvironment.stocks)) {
      errors.push('stocks字段必须是数组')
    }

    // 空数组检查
    if (Array.isArray(marketEnvironment.traders) && marketEnvironment.traders.length === 0) {
      errors.push('市场环境必须包含至少一个交易员')
    }

    if (Array.isArray(marketEnvironment.stocks) && marketEnvironment.stocks.length === 0) {
      errors.push('市场环境必须包含至少一只股票')
    }

    // 交易员结构验证
    if (Array.isArray(marketEnvironment.traders)) {
      marketEnvironment.traders.forEach((trader, index) => {
        const traderErrors = this.validateTraderStructure(trader, index)
        errors.push(...traderErrors)
      })
    }

    // 股票结构验证
    if (Array.isArray(marketEnvironment.stocks)) {
      marketEnvironment.stocks.forEach((stock, index) => {
        const stockErrors = this.validateStockStructure(stock, index)
        errors.push(...stockErrors)
      })
    }

    return { errors, warnings }
  }

  /**
   * 验证交易员结构
   * @param {Object} trader - 交易员对象
   * @param {Number} index - 索引
   * @returns {Array} 错误列表
   */
  static validateTraderStructure(trader, index) {
    const errors = []
    const requiredFields = ['id', 'name', 'initialCapital', 'riskProfile']

    requiredFields.forEach(field => {
      if (trader[field] === undefined || trader[field] === null) {
        errors.push(`交易员 ${index + 1} 缺少必需字段: ${field}`)
      }
    })

    // 数据类型验证
    if (trader.initialCapital !== undefined && typeof trader.initialCapital !== 'number') {
      errors.push(`交易员 ${index + 1} 的初始资金必须是数字`)
    }

    if (trader.currentCapital !== undefined && typeof trader.currentCapital !== 'number') {
      errors.push(`交易员 ${index + 1} 的当前资金必须是数字`)
    }

    if (trader.maxPositions !== undefined && (!Number.isInteger(trader.maxPositions) || trader.maxPositions < 1)) {
      errors.push(`交易员 ${index + 1} 的最大持仓数必须是正整数`)
    }

    // 枚举值验证
    const validRiskProfiles = ['conservative', 'moderate', 'aggressive']
    if (trader.riskProfile && !validRiskProfiles.includes(trader.riskProfile)) {
      errors.push(`交易员 ${index + 1} 的风险偏好无效: ${trader.riskProfile}`)
    }

    const validTradingStyles = ['day_trading', 'swing_trading', 'position_trading']
    if (trader.tradingStyle && !validTradingStyles.includes(trader.tradingStyle)) {
      errors.push(`交易员 ${index + 1} 的交易风格无效: ${trader.tradingStyle}`)
    }

    // 持仓数组验证
    if (trader.holdings && !Array.isArray(trader.holdings)) {
      errors.push(`交易员 ${index + 1} 的持仓必须是数组`)
    }

    return errors
  }

  /**
   * 验证股票结构
   * @param {Object} stock - 股票对象
   * @param {Number} index - 索引
   * @returns {Array} 错误列表
   */
  static validateStockStructure(stock, index) {
    const errors = []
    const requiredFields = ['id', 'symbol', 'name', 'totalShares', 'issuePrice']

    requiredFields.forEach(field => {
      if (stock[field] === undefined || stock[field] === null) {
        errors.push(`股票 ${index + 1} 缺少必需字段: ${field}`)
      }
    })

    // 数据类型验证
    if (stock.totalShares !== undefined && (!Number.isInteger(stock.totalShares) || stock.totalShares < 1)) {
      errors.push(`股票 ${index + 1} 的总股数必须是正整数`)
    }

    if (stock.issuePrice !== undefined && (typeof stock.issuePrice !== 'number' || stock.issuePrice <= 0)) {
      errors.push(`股票 ${index + 1} 的发行价必须是正数`)
    }

    if (stock.currentPrice !== undefined && (typeof stock.currentPrice !== 'number' || stock.currentPrice <= 0)) {
      errors.push(`股票 ${index + 1} 的当前价格必须是正数`)
    }

    // 股票代码格式验证
    if (stock.symbol && !/^[A-Z0-9]{1,10}$/.test(stock.symbol)) {
      errors.push(`股票 ${index + 1} 的代码格式无效: ${stock.symbol}`)
    }

    // 持有者数组验证
    if (stock.holders && !Array.isArray(stock.holders)) {
      errors.push(`股票 ${index + 1} 的持有者必须是数组`)
    }

    return errors
  }

  /**
   * 验证业务规则
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validateBusinessRules(marketEnvironment) {
    const errors = []
    const warnings = []

    // ID唯一性验证
    const traderIds = marketEnvironment.traders?.map(t => t.id) || []
    const stockSymbols = marketEnvironment.stocks?.map(s => s.symbol) || []

    if (traderIds.length !== new Set(traderIds).size) {
      errors.push('存在重复的交易员ID')
    }

    if (stockSymbols.length !== new Set(stockSymbols).size) {
      errors.push('存在重复的股票代码')
    }

    // 资金验证
    marketEnvironment.traders?.forEach((trader, index) => {
      if (trader.initialCapital < 1000) {
        warnings.push(`交易员 ${index + 1} 的初始资金过低: ${trader.initialCapital}`)
      }

      if (trader.initialCapital > 100000000) {
        warnings.push(`交易员 ${index + 1} 的初始资金过高: ${trader.initialCapital}`)
      }

      if (trader.currentCapital < 0) {
        errors.push(`交易员 ${index + 1} 的当前资金不能为负数`)
      }
    })

    // 股票验证
    marketEnvironment.stocks?.forEach((stock, index) => {
      if (stock.totalShares > 1000000000) {
        warnings.push(`股票 ${index + 1} 的总股数过大: ${stock.totalShares}`)
      }

      if (stock.issuePrice > 999999.99) {
        warnings.push(`股票 ${index + 1} 的发行价过高: ${stock.issuePrice}`)
      }

      if (stock.currentPrice && Math.abs(stock.currentPrice - stock.issuePrice) / stock.issuePrice > 10) {
        warnings.push(`股票 ${index + 1} 的当前价格与发行价差异过大`)
      }
    })

    return { errors, warnings }
  }

  /**
   * 验证数据一致性
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validateDataConsistency(marketEnvironment) {
    const errors = []
    const warnings = []

    if (!marketEnvironment.traders || !marketEnvironment.stocks) {
      return { errors, warnings }
    }

    // 持仓一致性验证
    marketEnvironment.traders.forEach(trader => {
      trader.holdings?.forEach(holding => {
        const stock = marketEnvironment.stocks.find(s => s.symbol === holding.stockSymbol)
        
        if (!stock) {
          errors.push(`交易员 ${trader.name} 持有不存在的股票: ${holding.stockSymbol}`)
          return
        }

        const holder = stock.holders?.find(h => h.traderId === trader.id)
        if (!holder) {
          errors.push(`股票 ${stock.symbol} 的持有者列表中未找到交易员 ${trader.name}`)
        } else if (holder.quantity !== holding.quantity) {
          errors.push(`交易员 ${trader.name} 的 ${stock.symbol} 持仓数量不一致`)
        }

        // 验证持仓价值计算
        const expectedValue = holding.quantity * stock.currentPrice
        if (Math.abs(expectedValue - holding.currentValue) > 0.01) {
          warnings.push(`交易员 ${trader.name} 的 ${stock.symbol} 持仓价值计算可能有误`)
        }
      })
    })

    // 股票分配一致性验证
    marketEnvironment.stocks.forEach(stock => {
      const totalAllocated = stock.holders?.reduce((sum, holder) => sum + holder.quantity, 0) || 0
      
      if (totalAllocated !== stock.totalShares) {
        errors.push(`股票 ${stock.symbol} 的分配数量 (${totalAllocated}) 不等于总股数 (${stock.totalShares})`)
      }

      if (stock.allocatedShares !== totalAllocated) {
        errors.push(`股票 ${stock.symbol} 的已分配数量字段不一致`)
      }

      if (stock.availableShares !== stock.totalShares - stock.allocatedShares) {
        errors.push(`股票 ${stock.symbol} 的可用股数计算错误`)
      }

      // 验证持有比例
      stock.holders?.forEach(holder => {
        const expectedPercentage = (holder.quantity / stock.totalShares) * 100
        if (Math.abs(expectedPercentage - holder.percentage) > 0.01) {
          warnings.push(`股票 ${stock.symbol} 持有者 ${holder.traderName} 的持有比例计算可能有误`)
        }
      })
    })

    // 统计信息一致性验证
    if (marketEnvironment.statistics) {
      const stats = marketEnvironment.statistics
      const actualTraderCount = marketEnvironment.traders.length
      const actualStockCount = marketEnvironment.stocks.length
      
      if (stats.traderCount !== actualTraderCount) {
        warnings.push(`统计信息中的交易员数量 (${stats.traderCount}) 与实际数量 (${actualTraderCount}) 不符`)
      }
      
      if (stats.stockCount !== actualStockCount) {
        warnings.push(`统计信息中的股票数量 (${stats.stockCount}) 与实际数量 (${actualStockCount}) 不符`)
      }

      // 验证总资金
      const actualTotalCapital = marketEnvironment.traders.reduce((sum, trader) => sum + trader.initialCapital, 0)
      if (Math.abs(actualTotalCapital - marketEnvironment.totalCapital) > 0.01) {
        warnings.push('总资金统计不准确')
      }
    }

    return { errors, warnings }
  }

  /**
   * 验证性能约束
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validatePerformanceConstraints(marketEnvironment) {
    const warnings = []
    const info = []

    const traderCount = marketEnvironment.traders?.length || 0
    const stockCount = marketEnvironment.stocks?.length || 0

    // 规模检查
    if (traderCount > 1000) {
      warnings.push(`交易员数量 (${traderCount}) 超过推荐限制 (1000)，可能影响性能`)
    } else if (traderCount > 500) {
      info.push(`交易员数量较多 (${traderCount})，建议关注性能表现`)
    }

    if (stockCount > 100) {
      warnings.push(`股票数量 (${stockCount}) 超过推荐限制 (100)，可能影响性能`)
    } else if (stockCount > 50) {
      info.push(`股票数量较多 (${stockCount})，建议关注性能表现`)
    }

    // 复杂度检查
    const totalHoldings = marketEnvironment.traders?.reduce((sum, trader) => sum + (trader.holdings?.length || 0), 0) || 0
    if (totalHoldings > 10000) {
      warnings.push(`总持仓记录数 (${totalHoldings}) 过多，可能影响查询性能`)
    }

    // 内存使用估算
    const estimatedMemoryMB = this.estimateMemoryUsage(marketEnvironment)
    if (estimatedMemoryMB > 50) {
      warnings.push(`估计内存使用 (${estimatedMemoryMB.toFixed(1)}MB) 较高`)
    } else if (estimatedMemoryMB > 10) {
      info.push(`估计内存使用: ${estimatedMemoryMB.toFixed(1)}MB`)
    }

    return { warnings, info }
  }

  /**
   * 验证数据质量
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 验证结果
   */
  static validateDataQuality(marketEnvironment) {
    const warnings = []
    const info = []

    // 名称质量检查
    const traderNames = marketEnvironment.traders?.map(t => t.name) || []
    const stockNames = marketEnvironment.stocks?.map(s => s.name) || []

    // 检查重复名称
    const duplicateTraderNames = traderNames.filter((name, index) => traderNames.indexOf(name) !== index)
    if (duplicateTraderNames.length > 0) {
      warnings.push(`存在重复的交易员名称: ${[...new Set(duplicateTraderNames)].join(', ')}`)
    }

    const duplicateStockNames = stockNames.filter((name, index) => stockNames.indexOf(name) !== index)
    if (duplicateStockNames.length > 0) {
      warnings.push(`存在重复的股票名称: ${[...new Set(duplicateStockNames)].join(', ')}`)
    }

    // 检查名称格式
    traderNames.forEach(name => {
      if (name && name.length > 100) {
        warnings.push(`交易员名称过长: ${name.substring(0, 50)}...`)
      }
    })

    stockNames.forEach(name => {
      if (name && name.length > 100) {
        warnings.push(`股票名称过长: ${name.substring(0, 50)}...`)
      }
    })

    // 数据分布检查
    if (marketEnvironment.traders) {
      const riskDistribution = {}
      marketEnvironment.traders.forEach(trader => {
        riskDistribution[trader.riskProfile] = (riskDistribution[trader.riskProfile] || 0) + 1
      })

      const totalTraders = marketEnvironment.traders.length
      Object.entries(riskDistribution).forEach(([risk, count]) => {
        const percentage = (count / totalTraders) * 100
        if (percentage > 80) {
          info.push(`${risk} 风险偏好的交易员占比过高 (${percentage.toFixed(1)}%)`)
        }
      })
    }

    return { warnings, info }
  }

  /**
   * 估算内存使用量
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Number} 估算的内存使用量(MB)
   */
  static estimateMemoryUsage(marketEnvironment) {
    // 简单的内存使用估算
    const jsonString = JSON.stringify(marketEnvironment)
    const bytesPerChar = 2 // UTF-16编码
    const estimatedBytes = jsonString.length * bytesPerChar
    const estimatedMB = estimatedBytes / (1024 * 1024)
    
    // 考虑对象开销，乘以1.5倍
    return estimatedMB * 1.5
  }

  /**
   * 验证导入数据
   * @param {Object} importData - 导入数据
   * @returns {Object} 验证结果
   */
  static validateImportData(importData) {
    const errors = []
    const warnings = []
    const info = []

    try {
      // JSON格式验证
      const formatValidation = JsonUtils.validateImportFormat(importData)
      // JsonUtils.validateImportFormat 会抛出异常，如果到这里说明格式正确
      info.push('导入数据格式验证通过')

      // 转换为市场环境对象并验证
      const marketEnvironment = JsonUtils.fromImportFormat(importData)
      const marketValidation = this.validateMarketEnvironment(marketEnvironment)
      
      errors.push(...marketValidation.errors)
      warnings.push(...marketValidation.warnings)
      info.push(...marketValidation.info)

      // 版本兼容性检查
      if (importData.version) {
        if (JsonUtils.isVersionCompatible(importData.version)) {
          info.push(`数据版本 ${importData.version} 兼容`)
        } else {
          warnings.push(`数据版本 ${importData.version} 可能不完全兼容`)
        }
      }

      // 数据完整性检查
      const integrityValidation = JsonUtils.validateExportData(importData)
      errors.push(...integrityValidation.errors)
      warnings.push(...integrityValidation.warnings)

    } catch (error) {
      errors.push(`导入数据验证失败: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors: [...new Set(errors)],
      warnings: [...new Set(warnings)],
      info: [...new Set(info)],
      summary: {
        totalIssues: errors.length + warnings.length,
        criticalErrors: errors.length,
        warnings: warnings.length,
        informational: info.length
      }
    }
  }

  /**
   * 生成验证报告
   * @param {Object} validationResult - 验证结果
   * @returns {String} 验证报告
   */
  static generateValidationReport(validationResult) {
    const { valid, errors, warnings, info, summary } = validationResult
    
    let report = '# 市场环境验证报告\n\n'
    
    // 总体状态
    report += `## 验证状态: ${valid ? '✅ 通过' : '❌ 失败'}\n\n`
    
    // 摘要
    report += '## 验证摘要\n'
    report += `- 总问题数: ${summary.totalIssues}\n`
    report += `- 严重错误: ${summary.criticalErrors}\n`
    report += `- 警告: ${summary.warnings}\n`
    report += `- 信息: ${summary.informational}\n\n`
    
    // 详细信息
    if (errors.length > 0) {
      report += '## ❌ 严重错误\n'
      errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`
      })
      report += '\n'
    }
    
    if (warnings.length > 0) {
      report += '## ⚠️ 警告\n'
      warnings.forEach((warning, index) => {
        report += `${index + 1}. ${warning}\n`
      })
      report += '\n'
    }
    
    if (info.length > 0) {
      report += '## ℹ️ 信息\n'
      info.forEach((item, index) => {
        report += `${index + 1}. ${item}\n`
      })
      report += '\n'
    }
    
    // 建议
    report += '## 建议\n'
    if (valid) {
      report += '- 数据验证通过，可以安全使用\n'
    } else {
      report += '- 请修复所有严重错误后重新验证\n'
      if (warnings.length > 0) {
        report += '- 建议关注警告信息，确保数据质量\n'
      }
    }
    
    report += `\n---\n生成时间: ${new Date().toISOString()}`
    
    return report
  }
}

export default ValidationService