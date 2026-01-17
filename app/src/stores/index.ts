import { createPinia, type Pinia, type Store } from 'pinia'

// 扩展 Window 接口以支持调试
declare global {
  interface Window {
    __PINIA_STORES__?: Record<string, any>
  }
}

// 创建pinia实例
const pinia: Pinia = createPinia()

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

// 加载状态类型
export type LoadingState = 'idle' | 'pending' | 'success' | 'error'

// 基础状态接口
export interface BaseErrorState {
  loading: boolean
  error: string | null
  lastUpdated: string | null
}

export interface BasePaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 通用store状态
export const storeStates = {
  // 加载状态
  loading: {
    idle: 'idle' as const,
    pending: 'pending' as const,
    success: 'success' as const,
    error: 'error' as const,
  },
  
  // 通用错误处理
  createErrorState: (): BaseErrorState => ({
    loading: false,
    error: null,
    lastUpdated: null,
  }),
  
  // 通用分页状态
  createPaginationState: (): BasePaginationState => ({
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
  setLoading: (state: any, loading: boolean): void => {
    state.loading = loading
    if (!loading) {
      state.lastUpdated = new Date().toISOString()
    }
  },
  
  // 设置错误状态
  setError: (state: any, error: string | Error | null): void => {
    state.error = error instanceof Error ? error.message : error
    state.loading = false
  },
  
  // 清除错误
  clearError: (state: any): void => {
    state.error = null
  },
  
  // 设置分页信息
  setPagination: (state: any, pagination: Partial<BasePaginationState>): void => {
    Object.assign(state.pagination, pagination)
  },
  
  // 重置状态
  resetState: (state: any, initialState: any): void => {
    Object.assign(state, initialState)
  },
}

// 通用getters
export const storeGetters = {
  // 是否正在加载
  isLoading: (state: any): boolean => state.loading === true || state.loading === 'pending',
  
  // 是否有错误
  hasError: (state: any): boolean => state.error !== null,
  
  // 获取错误信息
  errorMessage: (state: any): string => state.error?.message || state.error || '',
  
  // 是否有数据
  hasData: (state: any): boolean => state.items && state.items.length > 0,
  
  // 数据总数
  totalItems: (state: any): number => state.pagination?.total || 0,
}

// API 调用函数类型
export type ApiCall<T = any, P = any> = (params?: P) => Promise<{
  success: boolean
  data: T
  error?: { message: string }
}>

export type ApiCallWithId<T = any, P = any> = (id: string, data?: P) => Promise<{
  success: boolean
  data: T
  error?: { message: string }
}>

export type ApiCallDelete = (id: string) => Promise<{
  success: boolean
  error?: { message: string }
}>

// Store工厂函数
export const createBaseStore = <T = any>(name: string, initialState: any = {}) => {
  return {
    id: name,
    state: () => ({
      ...storeStates.createErrorState(),
      pagination: storeStates.createPaginationState(),
      items: [] as T[],
      ...initialState,
    }),
    getters: {
      ...storeGetters,
    },
    actions: {
      // 设置加载状态
      setLoading(loading: boolean): void {
        ;(this as any).loading = loading
        if (!loading) {
          ;(this as any).lastUpdated = new Date().toISOString()
        }
      },
      
      // 设置错误状态
      setError(error: string | Error | null): void {
        ;(this as any).error = error instanceof Error ? error.message : error
        ;(this as any).loading = false
      },
      
      // 清除错误
      clearError(): void {
        ;(this as any).error = null
      },
      
      // 设置分页信息
      setPagination(pagination: Partial<BasePaginationState>): void {
        Object.assign((this as any).pagination, pagination)
      },
      
      // 重置状态
      resetState(initialState: any): void {
        Object.assign(this as any, initialState)
      },
      
      // 通用的获取列表方法
      async fetchItems<P = any>(apiCall: ApiCall<{ items?: T[], pagination?: Partial<BasePaginationState> } | T[], P>, params: P = {} as P): Promise<void> {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(params)
          
          if (response.success) {
            if (Array.isArray(response.data)) {
              ;(this as any).items = response.data
            } else {
              ;(this as any).items = response.data.items || []
              if (response.data.pagination) {
                this.setPagination(response.data.pagination)
              }
            }
          } else {
            throw new Error(response.error?.message || 'Failed to fetch items')
          }
        } catch (error) {
          console.error(`❌ Error fetching ${name}:`, error)
          this.setError(error instanceof Error ? error : new Error(String(error)))
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的创建方法
      async createItem<P = any>(apiCall: ApiCall<T, P>, data: P): Promise<T> {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(data)
          
          if (response.success) {
            // 将新项目添加到列表开头
            ;(this as any).items.unshift(response.data)
            return response.data
          } else {
            throw new Error(response.error?.message || 'Failed to create item')
          }
        } catch (error) {
          console.error(`❌ Error creating ${name}:`, error)
          this.setError(error instanceof Error ? error : new Error(String(error)))
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的更新方法
      async updateItem<P = any>(apiCall: ApiCallWithId<T, P>, id: string, data: P): Promise<T> {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(id, data)
          
          if (response.success) {
            // 更新列表中的项目
            const index = (this as any).items.findIndex((item: any) => item.id === id)
            if (index !== -1) {
              ;(this as any).items[index] = response.data
            }
            return response.data
          } else {
            throw new Error(response.error?.message || 'Failed to update item')
          }
        } catch (error) {
          console.error(`❌ Error updating ${name}:`, error)
          this.setError(error instanceof Error ? error : new Error(String(error)))
          throw error
        } finally {
          this.setLoading(false)
        }
      },
      
      // 通用的删除方法
      async deleteItem(apiCall: ApiCallDelete, id: string): Promise<boolean> {
        try {
          this.setLoading(true)
          this.clearError()
          
          const response = await apiCall(id)
          
          if (response.success) {
            // 从列表中移除项目
            const index = (this as any).items.findIndex((item: any) => item.id === id)
            if (index !== -1) {
              ;(this as any).items.splice(index, 1)
            }
            return true
          } else {
            throw new Error(response.error?.message || 'Failed to delete item')
          }
        } catch (error) {
          console.error(`❌ Error deleting ${name}:`, error)
          this.setError(error instanceof Error ? error : new Error(String(error)))
          throw error
        } finally {
          this.setLoading(false)
        }
      },
    },
  }
}

export default pinia