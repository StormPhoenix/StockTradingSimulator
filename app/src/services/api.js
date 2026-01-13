import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'

// API基础配置
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001') + '/api/v1'
const API_TIMEOUT = import.meta.env.VITE_API_TIMEOUT || 10000

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
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
  (error) => {
    console.error('❌ Request Error:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    // 计算请求耗时
    const endTime = new Date()
    const duration = endTime - response.config.metadata.startTime

    // 在开发环境中记录响应
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
        status: response.status,
        data: response.data,
      })
    }

    return response
  },
  (error) => {
    // 计算请求耗时
    const endTime = new Date()
    const duration = error.config?.metadata ? endTime - error.config.metadata.startTime : 0

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
const handleApiError = (error) => {
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

// 基础API服务类
export class BaseApiService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl
    this.client = apiClient
  }

  // GET请求
  async get(url, params = {}, config = {}) {
    try {
      const response = await this.client.get(`${this.baseUrl}${url}`, {
        params,
        ...config,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // POST请求
  async post(url, data = {}, config = {}) {
    try {
      const response = await this.client.post(`${this.baseUrl}${url}`, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // PUT请求
  async put(url, data = {}, config = {}) {
    try {
      const response = await this.client.put(`${this.baseUrl}${url}`, data, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // DELETE请求
  async delete(url, config = {}) {
    try {
      const response = await this.client.delete(`${this.baseUrl}${url}`, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // 文件上传
  async upload(url, file, onProgress = null) {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }

      if (onProgress) {
        config.onUploadProgress = (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(percentCompleted)
        }
      }

      const response = await this.client.post(`${this.baseUrl}${url}`, formData, config)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // 文件下载
  async download(url, filename = null) {
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
      throw this.handleError(error)
    }
  }

  // 错误处理
  handleError(error) {
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
export const healthCheck = async () => {
  try {
    // 从环境配置获取基础URL，移除/api/v1前缀用于健康检查
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'
    const response = await apiClient.get('/health', {
      baseURL, // 使用环境变量配置的URL
      timeout: 5000, // 健康检查使用较短超时
    })
    return response.data
  } catch (error) {
    throw {
      message: error.response?.data?.error?.message || error.message,
      code: error.response?.data?.error?.code || 'HEALTH_CHECK_FAILED',
      status: error.response?.status,
    }
  }
}

// 导出axios实例供其他服务使用
export { apiClient }

// 工具函数
export const apiUtils = {
  // 构建查询参数
  buildParams: (params) => {
    const filtered = {}
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
        filtered[key] = params[key]
      }
    })
    return filtered
  },

  // 处理分页参数
  buildPaginationParams: (page = 1, limit = 10, sort = 'createdAt', order = 'desc') => ({
    page,
    limit,
    sort,
    order,
  }),

  // 处理搜索参数
  buildSearchParams: (search = '', filters = {}) => ({
    search,
    ...filters,
  }),
}

export default apiService
