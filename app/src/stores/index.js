import { createPinia } from 'pinia'

// 创建pinia实例
const pinia = createPinia()

// 开发环境插件
if (import.meta.env.DEV) {
  // 添加开发工具支持
  pinia.use(({ store }) => {
    // 在控制台中暴露store实例，方便调试
    if (typeof window !== 'undefined') {
      window.__PINIA_STORES__ = window.__PINIA_STORES__ || {}
      window.__PINIA_STORES__[store.$id] = store
    }
    
    // 记录store的创建
    console.log(`🏪 Store created: ${store.$id}`)
  })
}

// 通用store状态
export const storeStates = {
  // 加载状态
  loading: {
    idle: 'idle',
    pending: 'pending',
    success: 'success',
    error: 'error',
  },
  
  // 通用错误处理
  createErrorState: () => ({
    loading: false,
    error: null,
    lastUpdated: null,
  }),
  
  // 通用分页状态
  createPaginationState: () => ({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  }),
}

// 通用store操作
export const storeActions = {
  // 设置加载状态
  setLoading: (state, loading) => {
    state.loading = loading
    if (!loading) {
      state.lastUpdated = new Date().toISOString()
    }
  },
  
  // 设置错误状态
  setError: (state, error) => {
    state.error = error
    state.loading = false
  },
  
  // 清除错误
  clearError: (state) => {
    state.error = null
  },
  
  // 设置分页信息
  setPagination: (state, pagination) => {
    Object.assign(state.pagination, pagination)
  },
  
  // 重置状态
  resetState: (state, initialState) => {
    Object.assign(state, initialState)
  },
}

// 通用getters
export const storeGetters = {
  // 是否正在加载
  isLoading: (state) => state.loading === true || state.loading === 'pending',
  
  // 是否有错误
  hasError: (state) => state.error !== null,
  
  // 获取错误信息
  errorMessage: (state) => state.error?.message || state.error,
  
  // 是否有数据
  hasData: (state) => state.items && state.items.length > 0,
  
  // 数据总数
  totalItems: (state) => state.pagination?.total || 0,
}

// Store工厂函数
export const createBaseStore = (name, initialState = {}) => {
  return {
    id: name,
    state: () => ({
      ...storeStates.createErrorState(),
      ...storeStates.createPaginationState(),
      items: [],
      ...initialState,
    }),
    getters: {
      ...storeGetters,
    },
    actions: {
      ...storeActions,
      
      // 通用的获取列表方法
      async fetchItems(apiCall, params = {}) {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(params)
          
          if (response.success) {
            this.items = response.data.items || response.data
            if (response.data.pagination) {
              this.setPagination(response.data.pagination)
            }
          } else {
            throw new Error(response.error?.message || 'Failed to fetch items')
          }
        } catch (error) {
          console.error(`❌ Error fetching ${name}:`, error)
          this.setError(error)
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的创建方法
      async createItem(apiCall, data) {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(data)
          
          if (response.success) {
            // 将新项目添加到列表开头
            this.items.unshift(response.data)
            return response.data
          } else {
            throw new Error(response.error?.message || 'Failed to create item')
          }
        } catch (error) {
          console.error(`❌ Error creating ${name}:`, error)
          this.setError(error)
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的更新方法
      async updateItem(apiCall, id, data) {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(id, data)
          
          if (response.success) {
            // 更新列表中的项目
            const index = this.items.findIndex(item => item.id === id)
            if (index !== -1) {
              this.items[index] = response.data
            }
            return response.data
          } else {
            throw new Error(response.error?.message || 'Failed to update item')
          }
        } catch (error) {
          console.error(`❌ Error updating ${name}:`, error)
          this.setError(error)
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的删除方法
      async deleteItem(apiCall, id) {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(id)
          
          if (response.success) {
            // 从列表中移除项目
            const index = this.items.findIndex(item => item.id === id)
            if (index !== -1) {
              this.items.splice(index, 1)
            }
            return true
          } else {
            throw new Error(response.error?.message || 'Failed to delete item')
          }
        } catch (error) {
          console.error(`❌ Error deleting ${name}:`, error)
          this.setError(error)
          throw error
        } finally {
          this.setLoading(false)
        }
      },
    },
  }
}

export default pinia