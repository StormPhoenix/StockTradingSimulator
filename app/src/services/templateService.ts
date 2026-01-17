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