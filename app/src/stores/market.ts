/**
 * 市场环境状态管理
 * 使用Pinia管理市场环境相关的状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import marketService from '../services/marketService'

// Define types
interface MarketEnvironment {
  id: string
  _id?: string
  name: string
  description: string
  allocationAlgorithm?: string
  version?: string
  createdAt: string | Date
  updatedAt: string | Date
  statistics?: {
    traderCount: number
    stockCount: number
  }
  totalCapital?: number
  totalMarketValue?: number
  traders?: Array<{
    name: string
    initialCapital: number
    riskProfile: string
    tradingStyle: string
    holdings?: any[]
    templateId?: { name: string }
  }>
  stocks?: Array<{
    symbol: string
    name: string
    issuePrice: number
    totalShares: number
    category: string
    holders?: any[]
    templateId?: { name: string }
  }>
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

interface Statistics {
  totalMarkets: number
  totalTraders: number
  totalStocks: number
  totalCapital: number
  averageTraders: number
  averageStocks: number
}

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  pagination?: Pagination
  message?: string
  filename?: string
}

interface CreateMarketEnvironmentRequest {
  name?: string
  description?: string
  allocationAlgorithm: string
  traderConfigs: Array<{
    templateId: string
    count: number
    capitalMultiplier: number
    capitalVariation: number
  }>
  stockTemplateIds: string[]
}

interface SearchOptions {
  page?: number
  limit?: number
  [key: string]: any
}

export const useMarketStore = defineStore('market', () => {
  // 状态
  const marketEnvironments = ref<MarketEnvironment[]>([])
  const currentMarket = ref<MarketEnvironment | null>(null)
  const loading = ref<boolean>(false)
  const error = ref<string | null>(null)
  const pagination = ref<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // 统计数据
  const statistics = ref<Statistics>({
    totalMarkets: 0,
    totalTraders: 0,
    totalStocks: 0,
    totalCapital: 0,
    averageTraders: 0,
    averageStocks: 0
  })

  // 计算属性
  const hasMarkets = computed(() => marketEnvironments.value.length > 0)
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => !!error.value)

  // 操作方法

  /**
   * 创建市场环境
   */
  const createMarketEnvironment = async (config: CreateMarketEnvironmentRequest): Promise<ApiResponse<MarketEnvironment>> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.createMarketEnvironment(config as any)
      
      if (result.success) {
        // 添加到列表开头
        marketEnvironments.value.unshift(result.data)
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取市场环境列表
   */
  const getMarketEnvironments = async (params: Record<string, any> = {}): Promise<ApiResponse<MarketEnvironment[]>> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.getMarketEnvironments(params)
      
      if (result.success) {
        marketEnvironments.value = result.data || []
        pagination.value = result.pagination || { page: 1, limit: 20, total: 0, pages: 0 }
      } else {
        console.warn('API返回失败状态:', result)
        marketEnvironments.value = []
        pagination.value = { page: 1, limit: 20, total: 0, pages: 0 }
      }

      return result
    } catch (err) {
      console.error('获取市场环境列表失败:', err)
      error.value = (err as Error).message
      // 确保在错误时也有默认值
      marketEnvironments.value = []
      pagination.value = { page: 1, limit: 20, total: 0, pages: 0 }
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取市场环境详情
   */
  const getMarketEnvironmentById = async (id: string): Promise<ApiResponse<MarketEnvironment>> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.getMarketEnvironmentById(id)
      
      if (result.success) {
        currentMarket.value = result.data
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新市场环境
   */
  const updateMarketEnvironment = async (id: string, updateData: Partial<MarketEnvironment>): Promise<ApiResponse<MarketEnvironment>> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.updateMarketEnvironment(id, updateData)
      
      if (result.success) {
        // 更新列表中的项目
        const index = marketEnvironments.value.findIndex(market => market._id === id)
        if (index > -1) {
          marketEnvironments.value[index] = result.data
        }
        
        // 如果更新的是当前市场，也更新当前市场
        if (currentMarket.value?._id === id) {
          currentMarket.value = result.data
        }
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除市场环境
   */
  const deleteMarketEnvironment = async (id: string): Promise<ApiResponse> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.deleteMarketEnvironment(id)
      
      if (result.success) {
        // 从列表中移除
        const index = marketEnvironments.value.findIndex(market => market.id === id)
        if (index > -1) {
          marketEnvironments.value.splice(index, 1)
        }
        
        // 如果删除的是当前市场，清空当前市场
        if (currentMarket.value?.id === id) {
          currentMarket.value = null
        }
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出市场环境
   */
  const exportMarketEnvironment = async (id: string): Promise<ApiResponse> => {
    try {
      error.value = null
      const result = await marketService.exportMarketEnvironment(id)
      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    }
  }

  /**
   * 验证市场环境
   */
  const validateMarketEnvironment = async (id: string): Promise<ApiResponse> => {
    try {
      error.value = null
      const result = await marketService.validateMarketEnvironment(id)
      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    }
  }

  /**
   * 验证导入数据
   */
  const validateImportData = async (importData: any): Promise<any> => {
    try {
      error.value = null
      const result = await marketService.validateImportData(importData)
      return result.data
    } catch (err) {
      error.value = (err as Error).message
      throw err
    }
  }

  /**
   * 获取市场统计
   */
  const fetchStatistics = async (): Promise<ApiResponse<Statistics> | undefined> => {
    try {
      const result = await marketService.getMarketStatsSummary()
      
      if (result.success) {
        statistics.value = result.data
      }

      return result
    } catch (err) {
      console.error('获取统计数据失败:', err)
      // 不抛出错误，统计数据获取失败不应影响主要功能
    }
  }

  /**
   * 获取市场趋势
   */
  const getMarketTrends = async (period: string = '30d'): Promise<ApiResponse> => {
    try {
      error.value = null
      const result = await marketService.getMarketTrends(period)
      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    }
  }

  /**
   * 批量删除市场环境
   */
  const batchDeleteMarketEnvironments = async (ids: string[]): Promise<ApiResponse> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.batchDeleteMarketEnvironments(ids)
      
      if (result.success) {
        // 从列表中移除已删除的项目
        marketEnvironments.value = marketEnvironments.value.filter(
          market => !ids.includes(market.id)
        )
        
        // 如果当前市场被删除，清空当前市场
        if (currentMarket.value && ids.includes(currentMarket.value.id)) {
          currentMarket.value = null
        }
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索市场环境
   */
  const searchMarketEnvironments = async (keyword: string, options: SearchOptions = {}): Promise<ApiResponse<MarketEnvironment[]>> => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.searchMarketEnvironments(keyword, options)
      
      if (result.success) {
        marketEnvironments.value = result.data || []
        pagination.value = result.pagination || { page: 1, limit: 10, total: 0, pages: 0 }
      }

      return result
    } catch (err) {
      error.value = (err as Error).message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新市场环境列表
   */
  const refreshMarketEnvironments = async (): Promise<void> => {
    await getMarketEnvironments({
      page: pagination.value.page,
      limit: pagination.value.limit
    })
  }

  /**
   * 清空错误状态
   */
  const clearError = (): void => {
    error.value = null
  }

  /**
   * 清空当前市场
   */
  const clearCurrentMarket = (): void => {
    currentMarket.value = null
  }

  /**
   * 重置状态
   */
  const resetState = (): void => {
    marketEnvironments.value = []
    currentMarket.value = null
    loading.value = false
    error.value = null
    pagination.value = {
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    }
    statistics.value = {
      totalMarkets: 0,
      totalTraders: 0,
      totalStocks: 0,
      totalCapital: 0,
      averageTraders: 0,
      averageStocks: 0
    }
  }

  // 返回状态和方法
  return {
    // 状态
    marketEnvironments,
    currentMarket,
    loading,
    error,
    pagination,
    statistics,

    // 计算属性
    hasMarkets,
    isLoading,
    hasError,

    // 操作方法
    createMarketEnvironment,
    updateMarketEnvironment,
    getMarketEnvironments,
    getMarketEnvironmentById,
    deleteMarketEnvironment,
    exportMarketEnvironment,
    validateMarketEnvironment,
    validateImportData,
    fetchStatistics,
    getMarketTrends,
    batchDeleteMarketEnvironments,
    searchMarketEnvironments,
    refreshMarketEnvironments,
    clearError,
    clearCurrentMarket,
    resetState
  }
})