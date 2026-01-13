/**
 * JSON转换工具
 * 提供市场环境数据的JSON序列化和反序列化功能
 */

import crypto from 'crypto'

/**
 * JSON工具类
 */
class JsonUtils {
  /**
   * 将市场环境对象转换为导出格式的JSON
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {Object} 导出格式的JSON对象
   */
  static toExportFormat(marketEnvironment) {
    if (!marketEnvironment) {
      throw new Error('市场环境对象不能为空')
    }

    // 创建导出格式的数据结构
    const exportData = {
      // 基础信息
      id: marketEnvironment.id,
      name: marketEnvironment.name,
      description: marketEnvironment.description || '',
      version: marketEnvironment.version || '1.0.0',
      
      // 时间戳
      createdAt: marketEnvironment.createdAt,
      exportedAt: new Date().toISOString(),
      
      // 配置信息
      configuration: {
        allocationAlgorithm: marketEnvironment.allocationAlgorithm,
        allocationSeed: marketEnvironment.allocationSeed,
        totalCapital: marketEnvironment.totalCapital,
        totalMarketValue: marketEnvironment.totalMarketValue
      },
      
      // 交易员数据
      traders: marketEnvironment.traders.map(trader => ({
        id: trader.id,
        name: trader.name,
        templateId: trader.templateId,
        initialCapital: trader.initialCapital,
        currentCapital: trader.currentCapital,
        riskProfile: trader.riskProfile,
        tradingStyle: trader.tradingStyle,
        maxPositions: trader.maxPositions,
        parameters: trader.parameters || {},
        holdings: trader.holdings.map(holding => ({
          stockSymbol: holding.stockSymbol,
          stockName: holding.stockName,
          quantity: holding.quantity,
          averagePrice: holding.averagePrice,
          currentValue: holding.currentValue
        }))
      })),
      
      // 股票数据
      stocks: marketEnvironment.stocks.map(stock => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        templateId: stock.templateId,
        issuePrice: stock.issuePrice,
        currentPrice: stock.currentPrice,
        totalShares: stock.totalShares,
        allocatedShares: stock.allocatedShares,
        availableShares: stock.availableShares,
        category: stock.category,
        holders: stock.holders.map(holder => ({
          traderId: holder.traderId,
          traderName: holder.traderName,
          quantity: holder.quantity,
          percentage: holder.percentage
        }))
      })),
      
      // 统计信息
      statistics: marketEnvironment.statistics ? {
        traderCount: marketEnvironment.statistics.traderCount,
        stockCount: marketEnvironment.statistics.stockCount,
        averageCapitalPerTrader: marketEnvironment.statistics.averageCapitalPerTrader,
        capitalDistribution: marketEnvironment.statistics.capitalDistribution,
        stockDistribution: marketEnvironment.statistics.stockDistribution,
        riskProfileDistribution: marketEnvironment.statistics.riskProfileDistribution,
        tradingStyleDistribution: marketEnvironment.statistics.tradingStyleDistribution,
        allocationFairness: marketEnvironment.statistics.allocationFairness,
        giniCoefficient: marketEnvironment.statistics.giniCoefficient
      } : null,
      
      // 元数据
      metadata: {
        ...marketEnvironment.metadata,
        exportFormat: 'StockTradeSimulator-MarketEnvironment-v1.0',
        exportTool: 'StockTradeSimulator-Server',
        exportVersion: '1.0.0',
        checksum: null // 将在后面计算
      }
    }

    // 计算校验和
    exportData.metadata.checksum = this.calculateChecksum(exportData)

    return exportData
  }

  /**
   * 从导入的JSON数据创建市场环境对象
   * @param {Object} importData - 导入的JSON数据
   * @returns {Object} 市场环境对象
   */
  static fromImportFormat(importData) {
    if (!importData) {
      throw new Error('导入数据不能为空')
    }

    // 验证导入数据格式
    this.validateImportFormat(importData)

    // 验证校验和
    if (importData.metadata?.checksum) {
      const originalChecksum = importData.metadata.checksum
      const tempData = { ...importData }
      tempData.metadata = { ...tempData.metadata, checksum: null }
      const calculatedChecksum = this.calculateChecksum(tempData)
      
      if (originalChecksum !== calculatedChecksum) {
        console.warn('数据校验和不匹配，文件可能已被修改')
      }
    }

    // 转换为市场环境对象格式
    const marketEnvironment = {
      id: importData.id,
      name: importData.name,
      description: importData.description || '',
      version: importData.version || '1.0.0',
      
      // 配置信息
      allocationAlgorithm: importData.configuration?.allocationAlgorithm || 'imported',
      allocationSeed: importData.configuration?.allocationSeed,
      totalCapital: importData.configuration?.totalCapital || 0,
      totalMarketValue: importData.configuration?.totalMarketValue || 0,
      
      // 交易员数据
      traders: importData.traders.map(trader => ({
        id: trader.id,
        name: trader.name,
        templateId: trader.templateId,
        initialCapital: trader.initialCapital,
        currentCapital: trader.currentCapital || trader.initialCapital,
        riskProfile: trader.riskProfile,
        tradingStyle: trader.tradingStyle,
        maxPositions: trader.maxPositions || 10,
        parameters: trader.parameters || {},
        holdings: trader.holdings || [],
        createdAt: new Date()
      })),
      
      // 股票数据
      stocks: importData.stocks.map(stock => ({
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        templateId: stock.templateId,
        issuePrice: stock.issuePrice,
        currentPrice: stock.currentPrice || stock.issuePrice,
        totalShares: stock.totalShares,
        allocatedShares: stock.allocatedShares || 0,
        availableShares: stock.availableShares || 0,
        category: stock.category,
        holders: stock.holders || [],
        createdAt: new Date()
      })),
      
      // 统计信息
      statistics: importData.statistics || {},
      
      // 元数据
      metadata: {
        ...importData.metadata,
        importedAt: new Date(),
        originalExportedAt: importData.exportedAt,
        originalId: importData.id
      },
      
      // 时间戳
      createdAt: importData.createdAt ? new Date(importData.createdAt) : new Date()
    }

    return marketEnvironment
  }

  /**
   * 验证导入数据格式
   * @param {Object} data - 导入数据
   */
  static validateImportFormat(data) {
    const errors = []

    // 基础字段验证
    if (!data.id) errors.push('缺少市场环境ID')
    if (!data.traders || !Array.isArray(data.traders)) errors.push('缺少或无效的交易员数据')
    if (!data.stocks || !Array.isArray(data.stocks)) errors.push('缺少或无效的股票数据')

    // 交易员数据验证
    if (data.traders) {
      data.traders.forEach((trader, index) => {
        if (!trader.id) errors.push(`交易员 ${index + 1} 缺少ID`)
        if (!trader.name) errors.push(`交易员 ${index + 1} 缺少名称`)
        if (typeof trader.initialCapital !== 'number') errors.push(`交易员 ${index + 1} 初始资金无效`)
        if (!trader.riskProfile) errors.push(`交易员 ${index + 1} 缺少风险偏好`)
      })
    }

    // 股票数据验证
    if (data.stocks) {
      data.stocks.forEach((stock, index) => {
        if (!stock.id) errors.push(`股票 ${index + 1} 缺少ID`)
        if (!stock.symbol) errors.push(`股票 ${index + 1} 缺少代码`)
        if (!stock.name) errors.push(`股票 ${index + 1} 缺少名称`)
        if (typeof stock.totalShares !== 'number') errors.push(`股票 ${index + 1} 总股数无效`)
        if (typeof stock.issuePrice !== 'number') errors.push(`股票 ${index + 1} 发行价无效`)
      })
    }

    // 版本兼容性检查
    if (data.version && !this.isVersionCompatible(data.version)) {
      errors.push(`不支持的数据版本: ${data.version}`)
    }

    if (errors.length > 0) {
      throw new Error(`导入数据格式验证失败: ${errors.join(', ')}`)
    }
  }

  /**
   * 检查版本兼容性
   * @param {String} version - 数据版本
   * @returns {Boolean} 是否兼容
   */
  static isVersionCompatible(version) {
    const supportedVersions = ['1.0.0', '1.0.1', '1.1.0']
    return supportedVersions.includes(version)
  }

  /**
   * 计算数据校验和
   * @param {Object} data - 数据对象
   * @returns {String} 校验和
   */
  static calculateChecksum(data) {
    // 创建数据的标准化字符串表示
    const normalizedData = this.normalizeForChecksum(data)
    const dataString = JSON.stringify(normalizedData)
    
    // 计算MD5哈希
    return crypto.createHash('md5').update(dataString, 'utf8').digest('hex')
  }

  /**
   * 标准化数据用于校验和计算
   * @param {Object} data - 原始数据
   * @returns {Object} 标准化数据
   */
  static normalizeForChecksum(data) {
    // 移除会变化的字段
    const normalized = JSON.parse(JSON.stringify(data))
    
    // 移除时间戳和元数据中的动态字段
    delete normalized.exportedAt
    if (normalized.metadata) {
      delete normalized.metadata.checksum
      delete normalized.metadata.exportedAt
      delete normalized.metadata.importedAt
    }

    // 对数组进行排序以确保一致性
    if (normalized.traders) {
      normalized.traders.sort((a, b) => a.id.localeCompare(b.id))
      normalized.traders.forEach(trader => {
        if (trader.holdings) {
          trader.holdings.sort((a, b) => a.stockSymbol.localeCompare(b.stockSymbol))
        }
      })
    }

    if (normalized.stocks) {
      normalized.stocks.sort((a, b) => a.symbol.localeCompare(b.symbol))
      normalized.stocks.forEach(stock => {
        if (stock.holders) {
          stock.holders.sort((a, b) => a.traderId.localeCompare(b.traderId))
        }
      })
    }

    return normalized
  }

  /**
   * 压缩JSON数据
   * @param {Object} data - 要压缩的数据
   * @returns {String} 压缩后的JSON字符串
   */
  static compress(data) {
    // 移除不必要的空白和格式化
    return JSON.stringify(data, null, 0)
  }

  /**
   * 美化JSON数据
   * @param {Object} data - 要美化的数据
   * @returns {String} 美化后的JSON字符串
   */
  static prettify(data) {
    return JSON.stringify(data, null, 2)
  }

  /**
   * 验证JSON字符串格式
   * @param {String} jsonString - JSON字符串
   * @returns {Boolean} 是否为有效JSON
   */
  static isValidJson(jsonString) {
    try {
      JSON.parse(jsonString)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * 安全解析JSON字符串
   * @param {String} jsonString - JSON字符串
   * @returns {Object} 解析后的对象
   */
  static safeParseJson(jsonString) {
    try {
      return JSON.parse(jsonString)
    } catch (error) {
      throw new Error(`JSON解析失败: ${error.message}`)
    }
  }

  /**
   * 生成导出文件名
   * @param {Object} marketEnvironment - 市场环境对象
   * @returns {String} 文件名
   */
  static generateExportFilename(marketEnvironment) {
    const name = marketEnvironment.name || 'market'
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
    const id = marketEnvironment.id.slice(-8) // 取ID的后8位
    
    return `${name}_${id}_${timestamp}.json`
  }

  /**
   * 验证导出数据完整性
   * @param {Object} exportData - 导出数据
   * @returns {Object} 验证结果
   */
  static validateExportData(exportData) {
    const errors = []
    const warnings = []

    // 基础验证
    if (!exportData.traders || exportData.traders.length === 0) {
      errors.push('导出数据中没有交易员')
    }

    if (!exportData.stocks || exportData.stocks.length === 0) {
      errors.push('导出数据中没有股票')
    }

    // 数据一致性验证
    if (exportData.traders && exportData.stocks) {
      // 验证持仓一致性
      exportData.traders.forEach(trader => {
        trader.holdings.forEach(holding => {
          const stock = exportData.stocks.find(s => s.symbol === holding.stockSymbol)
          if (!stock) {
            errors.push(`交易员 ${trader.name} 持有不存在的股票 ${holding.stockSymbol}`)
          }
        })
      })

      // 验证股票分配一致性
      exportData.stocks.forEach(stock => {
        const totalAllocated = stock.holders.reduce((sum, holder) => sum + holder.quantity, 0)
        if (totalAllocated !== stock.totalShares) {
          warnings.push(`股票 ${stock.symbol} 的分配数量与总股数不匹配`)
        }
      })
    }

    // 统计信息验证
    if (exportData.statistics) {
      const actualTraderCount = exportData.traders ? exportData.traders.length : 0
      const actualStockCount = exportData.stocks ? exportData.stocks.length : 0
      
      if (exportData.statistics.traderCount !== actualTraderCount) {
        warnings.push('统计信息中的交易员数量与实际不符')
      }
      
      if (exportData.statistics.stockCount !== actualStockCount) {
        warnings.push('统计信息中的股票数量与实际不符')
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 创建数据摘要
   * @param {Object} data - 数据对象
   * @returns {Object} 数据摘要
   */
  static createDataSummary(data) {
    return {
      id: data.id,
      name: data.name,
      version: data.version,
      traderCount: data.traders ? data.traders.length : 0,
      stockCount: data.stocks ? data.stocks.length : 0,
      totalCapital: data.configuration?.totalCapital || 0,
      totalMarketValue: data.configuration?.totalMarketValue || 0,
      createdAt: data.createdAt,
      exportedAt: data.exportedAt,
      checksum: data.metadata?.checksum
    }
  }
}

export default JsonUtils