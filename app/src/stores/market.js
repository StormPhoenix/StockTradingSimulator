/**
 * 市场环境状态管理
 * 使用Pinia管理市场环境相关的状态和操作
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import marketService from '../services/marketService.js'

export const useMarketStore = defineStore('market', () => {
  // 状态
  const marketEnvironments = ref([])
  const currentMarket = ref(null)
  const loading = ref(false)
  const error = ref(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // 统计数据
  const statistics = ref({
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
   * @param {Object} config - 市场配置
   * @returns {Promise<Object>} 创建结果
   */
  const createMarketEnvironment = async (config) => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.createMarketEnvironment(config)
      
      if (result.success) {
        // 添加到列表开头
        marketEnvironments.value.unshift(result.data)
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取市场环境列表
   * @param {Object} params - 查询参数
   * @returns {Promise<Object>} 查询结果
   */
  const getMarketEnvironments = async (params = {}) => {
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
      error.value = err.message
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
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 市场环境详情
   */
  const getMarketEnvironmentById = async (id) => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.getMarketEnvironmentById(id)
      
      if (result.success) {
        currentMarket.value = result.data
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新市场环境
   * @param {String} id - 市场环境ID
   * @param {Object} updateData - 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  const updateMarketEnvironment = async (id, updateData) => {
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
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除市场环境
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 删除结果
   */
  const deleteMarketEnvironment = async (id) => {
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
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 导出市场环境
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 导出结果
   */
  const exportMarketEnvironment = async (id) => {
    try {
      error.value = null
      const result = await marketService.exportMarketEnvironment(id)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 导入市场环境
   * @param {Object} importData - 导入数据
   * @returns {Promise<Object>} 导入结果
   */
  const importMarketEnvironment = async (importData) => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.importMarketEnvironment(importData)
      
      if (result.success) {
        // 添加到列表开头
        marketEnvironments.value.unshift(result.data)
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 验证市场环境
   * @param {String} id - 市场环境ID
   * @returns {Promise<Object>} 验证结果
   */
  const validateMarketEnvironment = async (id) => {
    try {
      error.value = null
      const result = await marketService.validateMarketEnvironment(id)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 验证导入数据
   * @param {Object} importData - 导入数据
   * @returns {Promise<Object>} 验证结果
   */
  const validateImportData = async (importData) => {
    try {
      error.value = null
      const result = await marketService.validateImportData(importData)
      return result.data
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 获取市场统计
   * @returns {Promise<Object>} 统计数据
   */
  const fetchStatistics = async () => {
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
   * @param {String} period - 时间周期
   * @returns {Promise<Object>} 趋势数据
   */
  const getMarketTrends = async (period = '30d') => {
    try {
      error.value = null
      const result = await marketService.getMarketTrends(period)
      return result
    } catch (err) {
      error.value = err.message
      throw err
    }
  }

  /**
   * 批量删除市场环境
   * @param {Array} ids - 市场环境ID列表
   * @returns {Promise<Object>} 删除结果
   */
  const batchDeleteMarketEnvironments = async (ids) => {
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
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 搜索市场环境
   * @param {String} keyword - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Object>} 搜索结果
   */
  const searchMarketEnvironments = async (keyword, options = {}) => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.searchMarketEnvironments(keyword, options)
      
      if (result.success) {
        marketEnvironments.value = result.data
        pagination.value = result.pagination
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 复制市场环境
   * @param {String} id - 源市场环境ID
   * @param {Object} options - 复制选项
   * @returns {Promise<Object>} 复制结果
   */
  const duplicateMarketEnvironment = async (id, options = {}) => {
    try {
      loading.value = true
      error.value = null

      const result = await marketService.duplicateMarketEnvironment(id, options)
      
      if (result.success) {
        // 添加到列表开头
        marketEnvironments.value.unshift(result.data)
        
        // 更新统计
        await fetchStatistics()
      }

      return result
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新市场环境列表
   * @returns {Promise<void>}
   */
  const refreshMarketEnvironments = async () => {
    await getMarketEnvironments({
      page: pagination.value.page,
      limit: pagination.value.limit
    })
  }

  /**
   * 清空错误状态
   */
  const clearError = () => {
    error.value = null
  }

  /**
   * 清空当前市场
   */
  const clearCurrentMarket = () => {
    currentMarket.value = null
  }

  /**
   * 重置状态
   */
  const resetState = () => {
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
    importMarketEnvironment,
    validateMarketEnvironment,
    validateImportData,
    fetchStatistics,
    getMarketTrends,
    batchDeleteMarketEnvironments,
    searchMarketEnvironments,
    duplicateMarketEnvironment,
    refreshMarketEnvironments,
    clearError,
    clearCurrentMarket,
    resetState
  }
})