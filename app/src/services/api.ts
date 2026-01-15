import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse, PaginationParams } from '@shared/common'

// 扩展 AxiosRequestConfig 以包含 metadata
declare module 'axios' {
  interface InternalAxiosRequestConfig {
    metadata?: {
      startTime: Date
    }
  }
}

// API 配置接口
interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
}

// 错误响应接口
interface ErrorResponse {
  error: {
    message: string
    code?: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}

// 上传进度回调类型
type UploadProgressCallback = (percentCompleted: number) => void

// API基础配置
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api/v1'
const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 10000

// 创建axios实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 添加请求时间戳
    config.metadata = { startTime: new Date() }

    // 在开发环境中记录请求
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
        params: config.params,
        data: config.data,
      })
    }

    return config
  },
  (error: AxiosError) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // 计算请求耗时
    const endTime = new Date()
    const duration = response.config.metadata ? endTime.getTime() - response.config.metadata.startTime.getTime() : 0

    // 在开发环境中记录响应
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error: AxiosError<ErrorResponse>) => {
    // 计算请求耗时
    const endTime = new Date()
    const duration = error.config?.metadata ? endTime.getTime() - error.config.metadata.startTime.getTime() : 0

    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, {
      status: error.response?.status,
      message: error.message,
      data: error.response?.data,
    })

    // 处理不同类型的错误
    handleApiError(error)

    return Promise.reject(error)
  }
)

// 错误处理函数
const handleApiError = (error: AxiosError<ErrorResponse>): void => {
  if (!error.response) {
    // 网络错误
    ElMessage.error('网络连接失败，请检查网络设置')
    return
  }

  const { status, data } = error.response
  const errorMessage = data?.error?.message || '请求失败'

  switch (status) {
    case 400:
      ElMessage.error(`请求参数错误: ${errorMessage}`)
      break
    case 401:
      ElMessage.error('未授权访问，请重新登录')
      // 可以在这里处理登录跳转
      break
    case 403:
      ElMessage.error('权限不足，无法访问该资源')
      break
    case 404:
      ElMessage.error('请求的资源不存在')
      break
    case 409:
      ElMessage.error(`数据冲突: ${errorMessage}`)
      break
    case 422:
      // 验证错误，显示详细信息
      if (data?.error?.details && Array.isArray(data.error.details)) {
        const messages = data.error.details.map(detail => `${detail.field}: ${detail.message}`)
        ElMessage.error(messages.join('; '))
      } else {
        ElMessage.error(errorMessage)
      }
      break
    case 429:
      ElMessage.error('请求过于频繁，请稍后再试')
      break
    case 500:
      ElMessage.error('服务器内部错误，请稍后再试')
      break
    default:
      ElMessage.error(`请求失败 (${status}): ${errorMessage}`)
  }
}

// API 错误接口
interface ApiError {
  message: string
  code: string
  status?: number
  details?: Array<{
    field: string
    message: string
  }>
}

// 基础API服务类
export class BaseApiService {
  protected baseUrl: string
  protected client: AxiosInstance

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
    this.client = apiClient
  }

  // GET请求
  async get<T = any>(url: string, params: Record<string, any> = {}, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.get<T>(`${this.baseUrl}${url}`, {
        params,
        ...config,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // POST请求
  async post<T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.post<T>(`${this.baseUrl}${url}`, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // PUT请求
  async put<T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.put<T>(`${this.baseUrl}${url}`, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // PATCH请求
  async patch<T = any>(url: string, data: any = {}, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.patch<T>(`${this.baseUrl}${url}`, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // DELETE请求
  async delete<T = any>(url: string, config: AxiosRequestConfig = {}): Promise<T> {
    try {
      const response = await this.client.delete<T>(`${this.baseUrl}${url}`, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // 文件上传
  async upload<T = any>(url: string, file: File, onProgress?: UploadProgressCallback): Promise<T> {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const config: AxiosRequestConfig = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(percentCompleted)
          }
        }
      }

      const response = await this.client.post<T>(`${this.baseUrl}${url}`, formData, config)
      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // 文件下载
  async download(url: string, filename?: string): Promise<Blob> {
    try {
      const response = await this.client.get(`${this.baseUrl}${url}`, {
        responseType: 'blob',
      })

      // 创建下载链接
      const blob = new Blob([response.data])
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename || 'download'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(downloadUrl)

      return response.data
    } catch (error) {
      throw this.handleError(error as AxiosError<ErrorResponse>)
    }
  }

  // 错误处理
  protected handleError(error: AxiosError<ErrorResponse>): ApiError {
    return {
      message: error.response?.data?.error?.message || error.message,
      code: error.response?.data?.error?.code || 'UNKNOWN_ERROR',
      status: error.response?.status,
      details: error.response?.data?.error?.details,
    }
  }
}

// 创建默认实例
export const apiService = new BaseApiService()

// 健康检查函数
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  try {
    // 从环境配置获取基础URL，移除/api/v1前缀用于健康检查
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const response = await apiClient.get<{ status: string; timestamp: string }>('/health', {
      baseURL, // 使用环境变量配置的URL
      timeout: 5000, // 健康检查使用较短超时
    })
    return response.data
  } catch (error) {
    const axiosError = error as AxiosError<ErrorResponse>
    throw {
      message: axiosError.response?.data?.error?.message || axiosError.message,
      code: axiosError.response?.data?.error?.code || 'HEALTH_CHECK_FAILED',
      status: axiosError.response?.status,
    }
  }
}

// 导出axios实例供其他服务使用
export { apiClient }

// 工具函数接口
interface ApiUtils {
  buildParams: (params: Record<string, any>) => Record<string, any>
  buildPaginationParams: (page?: number, limit?: number, sort?: string, order?: string) => PaginationParams & { sort: string; order: string }
  buildSearchParams: (search?: string, filters?: Record<string, any>) => Record<string, any>
}

// 工具函数
export const apiUtils: ApiUtils = {
  // 构建查询参数
  buildParams: (params: Record<string, any>): Record<string, any> => {
    const filtered: Record<string, any> = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filtered[key] = params[key]
      }
    })
    return filtered
  },

  // 处理分页参数
  buildPaginationParams: (page: number = 1, limit: number = 10, sort: string = 'createdAt', order: string = 'desc') => ({
    page,
    limit,
    sort,
    order,
  }),

  // 处理搜索参数
  buildSearchParams: (search: string = '', filters: Record<string, any> = {}): Record<string, any> => ({
    search,
    ...filters,
  }),
}

export default apiService