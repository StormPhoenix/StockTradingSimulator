/**
 * 模板管理API服务
 * 提供前端与后端模板API的交互接口
 */

import type { ID } from '@shared/common'
import apiService from './api'
import { 
  getStockCategoryOptions, 
  getRiskProfileOptions, 
  getTradingStyleOptions, 
  getStatusOptions
} from '@/utils/categoryUtils'
import type { SelectOption } from '@/utils/categoryUtils'

// 查询参数接口
interface StockTemplateQueryParams {
  page?: number
  limit?: number
  status?: 'active' | 'inactive'
  category?: string
  search?: string
}

interface TraderTemplateQueryParams {
  page?: number
  limit?: number
  status?: 'active' | 'inactive'
  riskProfile?: 'conservative' | 'moderate' | 'aggressive'
  search?: string
}

// 股票模板数据接口
interface StockTemplateData {
  name: string
  symbol: string
  issuePrice: number
  totalShares: number
  category?: string
  description?: string
  status?: 'active' | 'inactive'
}

// AI交易员模板数据接口
interface TraderTemplateData {
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle?: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions?: number
  parameters?: Record<string, any>
  description?: string
  status?: 'active' | 'inactive'
}

// 批量操作接口
interface BatchDeleteRequest {
  type: 'stock' | 'trader'
  ids: ID[]
}

interface BatchStatusUpdateRequest {
  type: 'stock' | 'trader'
  ids: ID[]
  status: 'active' | 'inactive'
}

// 验证结果接口
interface ValidationResult {
  isValid: boolean
  errors: string[]
}

class TemplateService {
  private baseURL: string

  constructor() {
    this.baseURL = '/templates'
  }

  // ==================== 股票模板服务 ====================

  /**
   * 获取股票模板列表
   * @param params - 查询参数
   * @returns API响应
   */
  async getStockTemplates(params: StockTemplateQueryParams = {}): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/stocks`, { params })
      return response
    } catch (error) {
      console.error('获取股票模板列表失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 根据ID获取股票模板
   * @param id - 模板ID
   * @returns 股票模板数据
   */
  async getStockTemplateById(id: ID): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/stocks/${id}`)
      return response
    } catch (error) {
      console.error('获取股票模板详情失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 创建股票模板
   * @param templateData - 股票模板数据
   * @returns 创建结果
   */
  async createStockTemplate(templateData: StockTemplateData): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/stocks`, templateData)
      return response
    } catch (error) {
      console.error('创建股票模板失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 更新股票模板
   * @param id - 模板ID
   * @param templateData - 更新的模板数据
   * @returns 更新结果
   */
  async updateStockTemplate(id: ID, templateData: Partial<StockTemplateData>): Promise<any> {
    try {
      const response = await apiService.put(`${this.baseURL}/stocks/${id}`, templateData)
      return response
    } catch (error) {
      console.error('更新股票模板失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 删除股票模板
   * @param id - 模板ID
   * @returns 删除结果
   */
  async deleteStockTemplate(id: ID): Promise<any> {
    try {
      const response = await apiService.delete(`${this.baseURL}/stocks/${id}`)
      return response
    } catch (error) {
      console.error('删除股票模板失败:', error)
      throw this._handleError(error)
    }
  }

  // ==================== AI交易员模板服务 ====================

  /**
   * 获取AI交易员模板列表
   * @param params - 查询参数
   * @returns API响应
   */
  async getTraderTemplates(params: TraderTemplateQueryParams = {}): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/traders`, { params })
      return response
    } catch (error) {
      console.error('获取AI交易员模板列表失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 根据ID获取AI交易员模板
   * @param id - 模板ID
   * @returns AI交易员模板数据
   */
  async getTraderTemplateById(id: ID): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/traders/${id}`)
      return response
    } catch (error) {
      console.error('获取AI交易员模板详情失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 创建AI交易员模板
   * @param templateData - AI交易员模板数据
   * @returns 创建结果
   */
  async createTraderTemplate(templateData: TraderTemplateData): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/traders`, templateData)
      return response
    } catch (error) {
      console.error('创建AI交易员模板失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 更新AI交易员模板
   * @param id - 模板ID
   * @param templateData - 更新的模板数据
   * @returns 更新结果
   */
  async updateTraderTemplate(id: ID, templateData: Partial<TraderTemplateData>): Promise<any> {
    try {
      const response = await apiService.put(`${this.baseURL}/traders/${id}`, templateData)
      return response
    } catch (error) {
      console.error('更新AI交易员模板失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 删除AI交易员模板
   * @param id - 模板ID
   * @returns 删除结果
   */
  async deleteTraderTemplate(id: ID): Promise<any> {
    try {
      const response = await apiService.delete(`${this.baseURL}/traders/${id}`)
      return response
    } catch (error) {
      console.error('删除AI交易员模板失败:', error)
      throw this._handleError(error)
    }
  }

  // ==================== 批量操作服务 ====================

  /**
   * 批量删除模板
   * @param type - 模板类型 (stock/trader)
   * @param ids - 模板ID数组
   * @returns 批量删除结果
   */
  async batchDeleteTemplates(type: 'stock' | 'trader', ids: ID[]): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/batch/delete`, {
        type,
        ids
      })
      return response
    } catch (error) {
      console.error('批量删除模板失败:', error)
      throw this._handleError(error)
    }
  }

  /**
   * 批量更新模板状态
   * @param type - 模板类型 (stock/trader)
   * @param ids - 模板ID数组
   * @param status - 新状态 (active/inactive)
   * @returns 批量更新结果
   */
  async batchUpdateTemplateStatus(type: 'stock' | 'trader', ids: ID[], status: 'active' | 'inactive'): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/batch/status`, {
        type,
        ids,
        status
      })
      return response
    } catch (error) {
      console.error('批量更新模板状态失败:', error)
      throw this._handleError(error)
    }
  }

  // ==================== 统计信息服务 ====================

  /**
   * 获取模板统计信息
   * @returns 统计数据
   */
  async getTemplateStats(): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/stats`)
      return response
    } catch (error) {
      console.error('获取模板统计信息失败:', error)
      throw this._handleError(error)
    }
  }

  // ==================== 市场环境模板服务 ====================

  /**
   * 创建市场环境
   * @param config - 市场配置
   * @returns API响应
   */
  async createMarketEnvironment(config: any): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/markets`, config)
      return {
        success: true,
        data: response.data.data,
        statistics: response.data.statistics,
        warnings: response.data.warnings,
        message: response.data.message
      }
    } catch (error: any) {
      // 提取具体的错误信息
      let errorMessage = '创建市场环境失败'

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.details) {
          errorMessage = Array.isArray(errorData.details)
            ? errorData.details.join(', ')
            : errorData.details
        }
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * 获取市场环境列表
   * @param params - 查询参数
   * @returns API响应
   */
  async getMarketEnvironments(params: any = {}): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/markets`, { params })

      // 处理后端API响应格式
      let resultData: any[] = []
      let resultPagination: any = { page: 1, limit: 20, total: 0, pages: 0 }

      // 检查响应数据结构
      if (response.data && response.data.data) {
        // 标准格式：{ success: true, data: [...], pagination: {...} }
        resultData = response.data.data
        if (response.data.pagination) {
          resultPagination = response.data.pagination
        }
      } else if (response.data && Array.isArray(response.data)) {
        // 简化格式：直接返回数组
        resultData = response.data
      }

      return {
        success: true,
        data: resultData,
        pagination: resultPagination
      }
    } catch (error: any) {
      console.error('获取市场环境列表失败:', error)
      console.error('错误详情:', error.response?.data)

      const errorMessage = error.response?.data?.message || error.message || '获取市场环境列表失败'
      throw new Error(errorMessage)
    }
  }

  /**
   * 更新市场环境
   * @param id - 市场环境ID
   * @param updateData - 更新数据
   * @returns API响应
   */
  async updateMarketEnvironment(id: ID, updateData: any): Promise<any> {
    try {
      const response = await apiService.put(`${this.baseURL}/markets/${id}`, updateData)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('更新市场环境失败:', error)

      // 提取具体的错误信息
      let errorMessage = '更新市场环境失败'

      if (error.response?.data) {
        const errorData = error.response.data
        if (errorData.message) {
          errorMessage = errorData.message
        } else if (errorData.error?.message) {
          errorMessage = errorData.error.message
        } else if (errorData.details) {
          errorMessage = Array.isArray(errorData.details)
            ? errorData.details.join(', ')
            : errorData.details
        }
      }

      throw new Error(errorMessage)
    }
  }

  /**
   * 根据ID获取市场环境详情
   * @param id - 市场环境ID
   * @returns API响应
   */
  async getMarketEnvironmentById(id: ID): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/markets/${id}`)
      return {
        success: response.success,
        data: response.data
      }
    } catch (error: any) {
      console.error('获取市场环境详情失败:', error)
      throw new Error(error.response?.data?.message || '获取市场环境详情失败')
    }
  }

  /**
   * 删除市场环境
   * @param id - 市场环境ID
   * @returns API响应
   */
  async deleteMarketEnvironment(id: ID): Promise<any> {
    try {
      const response = await apiService.delete(`${this.baseURL}/markets/${id}`)
      return {
        success: response.success,
        message: response.message
      }
    } catch (error: any) {
      console.error('删除市场环境失败:', error)
      throw new Error(error.response?.data?.message || '删除市场环境失败')
    }
  }

  /**
   * 导出市场环境
   * @param id - 市场环境ID
   * @returns 导出数据
   */
  async exportMarketEnvironment(id: ID): Promise<any> {
    try {
      console.log('开始导出市场环境，ID:', id)
      const response = await apiService.get(`${this.baseURL}/markets/${id}/export`)
      console.log('导出API响应数据:', response.data)
      console.log('响应数据类型:', typeof response.data)

      // 检查响应数据
      if (!response.data) {
        throw new Error('响应数据为空')
      }

      if (typeof response.data !== 'object') {
        throw new Error(`响应数据格式错误，期望对象类型，实际为: ${typeof response.data}`)
      }

      console.log('响应数据的所有键:', Object.keys(response.data))

      // 处理标准格式：{ success: true, data: {...}, filename: "..." }
      if (response.data.success && response.data.data && response.data.filename) {
        console.log('检测到标准导出格式')
        return {
          success: true,
          data: response.data.data,
          filename: response.data.filename
        }
      }

      // 兼容旧格式：直接返回导出数据
      if (response.data.id && (response.data.name || response.data.traders || response.data.stocks)) {
        console.log('检测到直接导出数据格式（兼容模式）')

        // 生成默认文件名
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')
        const marketName = (response.data.name && typeof response.data.name === 'string') ?
          response.data.name.replace(/[^a-zA-Z0-9_-]/g, '_') : 'market'
        const marketId = (response.data.id && typeof response.data.id === 'string') ?
          response.data.id.slice(-8) : 'unknown'
        const filename = `${marketName}_${marketId}_${timestamp}.json`

        return {
          success: true,
          data: response.data,
          filename
        }
      }

      // 其他情况
      console.error('未识别的响应格式:', response.data)
      console.error('响应数据的键:', Object.keys(response.data))
      throw new Error('无法识别的导出数据格式')

    } catch (error: any) {
      console.error('导出市场环境失败:', error)
      console.error('错误详情:', error.response?.data)
      console.error('错误状态码:', error.response?.status)

      const errorMessage = error.response?.data?.message || error.message || '导出市场环境失败'
      throw new Error(errorMessage)
    }
  }

  /**
   * 验证市场环境
   * @param id - 市场环境ID
   * @returns 验证结果
   */
  async validateMarketEnvironment(id: ID): Promise<any> {
    try {
      const response = await apiService.post(`${this.baseURL}/markets/${id}/validate`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('验证市场环境失败:', error)
      throw new Error(error.response?.data?.message || '验证市场环境失败')
    }
  }

  /**
   * 验证导入数据
   * @param importData - 导入数据
   * @returns 验证结果
   */
  async validateImportData(importData: any): Promise<any> {
    try {
      // 前端简单验证
      const errors: string[] = []
      const warnings: string[] = []
      const info: string[] = []

      // 基础字段验证
      if (!importData.id) errors.push('缺少市场环境ID')
      if (!importData.traders || !Array.isArray(importData.traders)) {
        errors.push('缺少或无效的交易员数据')
      }
      if (!importData.stocks || !Array.isArray(importData.stocks)) {
        errors.push('缺少或无效的股票数据')
      }

      // 数据量检查
      if (importData.traders && importData.traders.length > 1000) {
        warnings.push('交易员数量过多，可能影响性能')
      }
      if (importData.stocks && importData.stocks.length > 100) {
        warnings.push('股票数量过多，可能影响性能')
      }

      // 版本检查
      if (importData.version) {
        const supportedVersions = ['1.0.0', '1.0.1', '1.1.0']
        if (supportedVersions.includes(importData.version)) {
          info.push(`数据版本 ${importData.version} 兼容`)
        } else {
          warnings.push(`数据版本 ${importData.version} 可能不完全兼容`)
        }
      }

      return {
        success: true,
        data: {
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
    } catch (error: any) {
      console.error('验证导入数据失败:', error)
      return {
        success: false,
        data: {
          valid: false,
          errors: [error.message || '验证失败'],
          warnings: [],
          info: [],
          summary: {
            totalIssues: 1,
            criticalErrors: 1,
            warnings: 0,
            informational: 0
          }
        }
      }
    }
  }

  /**
   * 获取市场统计摘要
   * @returns 统计数据
   */
  async getMarketStatsSummary(): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/markets/stats/summary`)
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('获取市场统计失败:', error)
      throw new Error(error.response?.data?.message || '获取市场统计失败')
    }
  }

  /**
   * 获取市场趋势数据
   * @param period - 时间周期
   * @returns 趋势数据
   */
  async getMarketTrends(period: string = '30d'): Promise<any> {
    try {
      const response = await apiService.get(`${this.baseURL}/markets/stats/trends`, {
        params: { period }
      })
      return {
        success: true,
        data: response.data.data
      }
    } catch (error: any) {
      console.error('获取市场趋势失败:', error)
      throw new Error(error.response?.data?.message || '获取市场趋势失败')
    }
  }

  /**
   * 批量删除市场环境
   * @param ids - 市场环境ID列表
   * @returns API响应
   */
  async batchDeleteMarketEnvironments(ids: ID[]): Promise<any> {
    try {
      const response = await apiService.delete(`${this.baseURL}/markets/batch`, {
        data: { ids }
      })
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('批量删除市场环境失败:', error)
      throw new Error(error.response?.data?.message || '批量删除市场环境失败')
    }
  }

  /**
   * 搜索市场环境
   * @param keyword - 搜索关键词
   * @param options - 搜索选项
   * @returns 搜索结果
   */
  async searchMarketEnvironments(keyword: string, options: any = {}): Promise<any> {
    try {
      const params = {
        search: keyword,
        ...options
      }

      const response = await apiService.get(`${this.baseURL}/markets`, { params })
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination
      }
    } catch (error: any) {
      console.error('搜索市场环境失败:', error)
      throw new Error(error.response?.data?.message || '搜索市场环境失败')
    }
  }

  // ==================== 工具方法 ====================

  /**
   * 验证股票模板数据
   * @param templateData - 股票模板数据
   * @returns 验证结果
   */
  validateStockTemplate(templateData: StockTemplateData): ValidationResult {
    const errors: string[] = []

    // 必填字段验证
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('股票名称不能为空')
    }
    if (!templateData.symbol || templateData.symbol.trim().length === 0) {
      errors.push('股票代码不能为空')
    }
    if (!templateData.issuePrice || templateData.issuePrice <= 0) {
      errors.push('发行价格必须大于0')
    }
    if (!templateData.totalShares || templateData.totalShares <= 0) {
      errors.push('总股本必须大于0')
    }

    // 格式验证
    if (templateData.symbol && !/^[A-Z0-9]{1,10}$/.test(templateData.symbol)) {
      errors.push('股票代码格式不正确（1-10位大写字母或数字）')
    }
    if (templateData.name && templateData.name.length > 100) {
      errors.push('股票名称不能超过100个字符')
    }
    if (templateData.description && templateData.description.length > 500) {
      errors.push('描述信息不能超过500个字符')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证AI交易员模板数据
   * @param templateData - AI交易员模板数据
   * @returns 验证结果
   */
  validateTraderTemplate(templateData: TraderTemplateData): ValidationResult {
    const errors: string[] = []

    // 必填字段验证
    if (!templateData.name || templateData.name.trim().length === 0) {
      errors.push('模板名称不能为空')
    }
    if (!templateData.initialCapital || templateData.initialCapital < 1000) {
      errors.push('初始资金不能少于1000')
    }
    if (!templateData.riskProfile) {
      errors.push('风险偏好不能为空')
    }

    // 格式验证
    if (templateData.name && templateData.name.length > 100) {
      errors.push('模板名称不能超过100个字符')
    }
    if (templateData.initialCapital && templateData.initialCapital > 100000000) {
      errors.push('初始资金不能超过1亿')
    }
    if (templateData.maxPositions && (templateData.maxPositions < 1 || templateData.maxPositions > 100)) {
      errors.push('最大持仓数量必须在1-100之间')
    }
    if (templateData.description && templateData.description.length > 500) {
      errors.push('描述信息不能超过500个字符')
    }

    // 枚举值验证
    const validRiskProfiles = ['conservative', 'moderate', 'aggressive']
    if (templateData.riskProfile && !validRiskProfiles.includes(templateData.riskProfile)) {
      errors.push('无效的风险偏好')
    }

    const validTradingStyles = ['day_trading', 'swing_trading', 'position_trading']
    if (templateData.tradingStyle && !validTradingStyles.includes(templateData.tradingStyle)) {
      errors.push('无效的交易风格')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * 处理API错误
   * @param error - 原始错误
   * @returns 处理后的错误
   */
  private _handleError(error: any): Error {
    if (error.response) {
      // 服务器响应错误
      const { status, data } = error.response
      const message = data?.message || `请求失败 (${status})`
      const apiError = new Error(message) as any
      apiError.status = status
      apiError.data = data
      return apiError
    } else if (error.request) {
      // 网络错误
      return new Error('网络连接失败，请检查网络设置')
    } else {
      // 其他错误
      return new Error(error.message || '未知错误')
    }
  }

  // ==================== 常量定义 ====================

  /**
   * 股票分类选项
   */
  static get STOCK_CATEGORIES(): SelectOption[] {
    return getStockCategoryOptions()
  }

  /**
   * 风险偏好选项
   */
  static get RISK_PROFILES(): SelectOption[] {
    return getRiskProfileOptions()
  }

  /**
   * 交易风格选项
   */
  static get TRADING_STYLES(): SelectOption[] {
    return getTradingStyleOptions()
  }

  /**
   * 状态选项
   */
  static get STATUS_OPTIONS(): SelectOption[] {
    return getStatusOptions()
  }
}

export default new TemplateService()