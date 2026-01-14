// 基础类型定义
export type ID = string
export type Timestamp = Date | string

// API 响应格式
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

// 分页参数
export interface PaginationParams {
  page?: number
  limit?: number
}

// 查询参数
export interface QueryParams extends PaginationParams {
  search?: string
  filter?: Record<string, any>
}

// 排序参数
export interface SortParams {
  field: string
  order: 'asc' | 'desc'
}

// 基础实体接口
export interface BaseEntity {
  id: ID
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 错误类型
export interface ApiError {
  code: string
  message: string
  details?: any
}

// 验证结果
export interface ValidationResult {
  isValid: boolean
  errors?: string[]
}