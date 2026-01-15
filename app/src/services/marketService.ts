/**
 * 市场环境API服务
 * 提供市场环境相关的API调用功能
 */

import type { ID } from '@shared/common'
import apiClient from './api.js'

// API响应接口
interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  warnings?: string[]
  statistics?: any
}

// 分页信息接口
interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

// 市场环境查询参数接口
interface MarketQueryParams {
  page?: number
  limit?: number
  search?: string
  [key: string]: any
}

// 市场环境配置接口
interface MarketConfig {
  name: string
  description?: string
  traders: any[]
  stocks: any[]
  [key: string]: any
}

// 导出结果接口
interface ExportResult {
  success: boolean
  data: any
  filename: string
}

// 验证结果接口
interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  info: string[]
  summary: {
    totalIssues: number
    criticalErrors: number
    warnings: number
    informational: number
  }
}

// 导入数据接口
interface ImportData {
  id?: ID
  name?: string
  description?: string
  traders?: any[]
  stocks?: any[]
  version?: string
  [key: string]: any
}

// 搜索选项接口
interface SearchOptions {
  page?: number
  limit?: number
  [key: string]: any
}

// 复制选项接口
interface DuplicateOptions {
  name?: string
  description?: string
}

/**
 * 市场服务类
 */
class MarketService {
  /**
   * 创建市场环境
   * @param config - 市场配置
   * @returns API响应
   */
  async createMarketEnvironment(config: MarketConfig): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/market', config)
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
  async getMarketEnvironments(params: MarketQueryParams = {}): Promise<ApiResponse<any[]> & { pagination: PaginationInfo }> {
    try {
      const response = await apiClient.get('/market', { params })

      // 处理后端API响应格式
      let resultData: any[] = []
      let resultPagination: PaginationInfo = { page: 1, limit: 20, total: 0, pages: 0 }

      // 检查响应数据结构
      if (response.data && response.data.data) {
        // 标准格式：{ success: true, data: { data: [...], pagination: {...} } }
        // 简化格式：{ success: true, data: [...] }
        resultData = response.data.data
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
  async updateMarketEnvironment(id: ID, updateData: Partial<MarketConfig>): Promise<ApiResponse> {
    try {
      const response = await apiClient.put(`/market/${id}`, updateData)
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
  async getMarketEnvironmentById(id: ID): Promise<ApiResponse> {
    try {
      const response = await apiClient.get(`/market/${id}`)
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
  async deleteMarketEnvironment(id: ID): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/market/${id}`)
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
  async exportMarketEnvironment(id: ID): Promise<ExportResult> {
    try {
      console.log('开始导出市场环境，ID:', id)
      const response = await apiClient.get(`/market/${id}/export`)
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
   * 导入市场环境
   * @param importData - 导入数据
   * @returns API响应
   */
  async importMarketEnvironment(importData: ImportData): Promise<ApiResponse> {
    try {
      const response = await apiClient.post('/market/import', importData)
      return {
        success: true,
        data: response.data.data,
        message: response.data.message,
        warnings: response.data.warnings
      }
    } catch (error: any) {
      console.error('导入市场环境失败:', error)
      throw new Error(error.response?.data?.message || '导入市场环境失败')
    }
  }

  /**
   * 验证市场环境
   * @param id - 市场环境ID
   * @returns 验证结果
   */
  async validateMarketEnvironment(id: ID): Promise<ApiResponse<ValidationResult>> {
    try {
      const response = await apiClient.post(`/market/${id}/validate`)
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
  async validateImportData(importData: ImportData): Promise<ApiResponse<ValidationResult>> {
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
  async getMarketStatsSummary(): Promise<ApiResponse> {
    try {
      const response = await apiClient.get('/market/stats/summary')
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
  async getMarketTrends(period: string = '30d'): Promise<ApiResponse> {
    try {
      const response = await apiClient.get('/market/stats/trends', {
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
  async batchDeleteMarketEnvironments(ids: ID[]): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete('/market/batch', {
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
  async searchMarketEnvironments(keyword: string, options: SearchOptions = {}): Promise<ApiResponse<any[]> & { pagination?: PaginationInfo }> {
    try {
      const params = {
        search: keyword,
        ...options
      }

      const response = await apiClient.get('/market', { params })
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

  /**
   * 复制市场环境
   * @param id - 源市场环境ID
   * @param options - 复制选项
   * @returns API响应
   */
  async duplicateMarketEnvironment(id: ID, options: DuplicateOptions = {}): Promise<ApiResponse> {
    try {
      // 先导出原市场环境
      const exportResult = await this.exportMarketEnvironment(id)

      if (!exportResult.success) {
        throw new Error('导出原市场环境失败')
      }

      // 修改导入数据
      const importData = { ...exportResult.data }
      importData.name = options.name || `${importData.name}_copy`
      importData.description = options.description || `${importData.description || ''} (复制)`

      // 导入新市场环境
      const importResult = await this.importMarketEnvironment(importData)

      return {
        success: true,
        data: importResult.data,
        message: '市场环境复制成功'
      }
    } catch (error: any) {
      console.error('复制市场环境失败:', error)
      throw new Error(error.message || '复制市场环境失败')
    }
  }
}

// 创建服务实例
const marketService = new MarketService()

export default marketService