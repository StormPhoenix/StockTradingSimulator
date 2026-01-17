/**
 * 市场验证服务
 * 提供市场环境数据的完整性验证和业务规则检查
 */

import MarketUtils from '../utils/marketUtils'
import JsonUtils from '../utils/jsonUtils'
import type { ID } from '@shared/common'
import type { 
  MarketEnvironmentData, 
  Trader, 
  Stock, 
  Holding, 
  Holder, 
  MarketStatistics,
  ImportData,
  ExportFormat,
  RiskProfile,
  TradingStyle
} from '@shared/market'

// 验证结果接口
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  summary: ValidationSummary
}

interface ValidationSummary {
  totalIssues: number
  criticalErrors: number
  warnings: number
  informational: number
}

// 基础验证结果接口
interface BaseValidationResult {
  errors: string[]
  warnings: string[]
}

// 性能验证结果接口
interface PerformanceValidationResult {
  warnings: string[]
  info: string[]
}

/**
 * 验证服务类
 */
class ValidationService {
  /**
   * 验证市场环境完整性
   * @param marketEnvironment - 市场环境对象
   * @returns 验证结果
   */
  static validateMarketEnvironment(marketEnvironment: MarketEnvironmentData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const info: string[] = []

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

    } catch (error: any) {
      errors.push(`验证过程中发生错误: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
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
   */
  static validateStructure(marketEnvironment: MarketEnvironmentData): BaseValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // 必需字段验证
    const requiredFields: (keyof MarketEnvironmentData)[] = ['id', 'traders', 'stocks']
    requiredFields.forEach(field => {
      if (!marketEnvironment[field]) {
        errors.push(`缺少必需字段: ${String(field)}`)
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

    return { errors, warnings }
  }

  /**
   * 验证业务规则
   */
  static validateBusinessRules(marketEnvironment: MarketEnvironmentData): BaseValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // ID唯一性验证
    const traderIds = marketEnvironment.traders?.map((t: Trader) => t.id) || []
    const stockSymbols = marketEnvironment.stocks?.map((s: Stock) => s.symbol) || []

    if (traderIds.length !== new Set(traderIds).size) {
      errors.push('交易员ID存在重复')
    }

    if (stockSymbols.length !== new Set(stockSymbols).size) {
      errors.push('股票代码存在重复')
    }

    return { errors, warnings }
  }

  /**
   * 验证数据一致性
   */
  static validateDataConsistency(marketEnvironment: MarketEnvironmentData): BaseValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    if (!marketEnvironment.traders || !marketEnvironment.stocks) {
      return { errors, warnings }
    }

    // 持仓一致性验证
    marketEnvironment.traders.forEach((trader: Trader) => {
      trader.holdings?.forEach((holding: Holding) => {
        const stock = marketEnvironment.stocks.find((s: Stock) => s.symbol === holding.stockSymbol)
        
        if (!stock) {
          errors.push(`交易员 ${trader.name} 持有的股票 ${holding.stockSymbol} 不存在`)
        }
      })
    })

    return { errors, warnings }
  }

  /**
   * 验证性能约束
   */
  static validatePerformanceConstraints(marketEnvironment: MarketEnvironmentData): PerformanceValidationResult {
    const warnings: string[] = []
    const info: string[] = []

    const traderCount = marketEnvironment.traders?.length || 0
    const stockCount = marketEnvironment.stocks?.length || 0

    // 规模检查
    if (traderCount > 1000) {
      warnings.push(`交易员数量 (${traderCount}) 过多，可能影响性能`)
    }

    if (stockCount > 500) {
      warnings.push(`股票数量 (${stockCount}) 过多，可能影响性能`)
    }

    return { warnings, info }
  }

  /**
   * 验证数据质量
   */
  static validateDataQuality(marketEnvironment: MarketEnvironmentData): PerformanceValidationResult {
    const warnings: string[] = []
    const info: string[] = []

    // 名称质量检查
    const traderNames = marketEnvironment.traders?.map((t: Trader) => t.name) || []
    const stockNames = marketEnvironment.stocks?.map((s: Stock) => s.name) || []

    // 检查重复名称
    const duplicateTraderNames = traderNames.filter((name: string, index: number) => 
      traderNames.indexOf(name) !== index
    )
    
    const duplicateStockNames = stockNames.filter((name: string, index: number) => 
      stockNames.indexOf(name) !== index
    )

    if (duplicateTraderNames.length > 0) {
      warnings.push('存在重复的交易员名称')
    }

    if (duplicateStockNames.length > 0) {
      warnings.push('存在重复的股票名称')
    }

    return { warnings, info }
  }

  /**
   * 估算内存使用量
   */
  static estimateMemoryUsage(marketEnvironment: MarketEnvironmentData): number {
    // 简单的内存使用估算
    const jsonString = JSON.stringify(marketEnvironment)
    const bytesPerChar = 2 // UTF-16编码
    const estimatedBytes = jsonString.length * bytesPerChar
    return estimatedBytes / (1024 * 1024) // 转换为MB
  }

  /**
   * 验证导入数据
   */
  static validateImportData(importData: ImportData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const info: string[] = []

    try {
      // JSON格式验证
      const formatValidation = JsonUtils.validateImportFormat(importData)
      // JsonUtils.validateImportFormat 会抛出异常，如果到这里说明格式正确
      info.push('导入数据格式验证通过')

      // 转换为市场环境对象并验证
      const marketEnvironment = JsonUtils.fromImportFormat(importData as ExportFormat)
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
      const integrityValidation = JsonUtils.validateExportData(importData as ExportFormat)
      errors.push(...integrityValidation.errors)
      warnings.push(...integrityValidation.warnings)

    } catch (error: any) {
      errors.push(`导入数据验证失败: ${error.message}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      info,
      summary: {
        totalIssues: errors.length + warnings.length,
        criticalErrors: errors.length,
        warnings: warnings.length,
        informational: info.length
      }
    }
  }
}

export default ValidationService