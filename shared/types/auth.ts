import type { ID, Timestamp } from './common'

// 用户认证相关类型
export interface User {
  id: ID
  email: string
  username: string
  firstName?: string
  lastName?: string
  avatar?: string
  role: UserRole
  isActive: boolean
  emailVerified: boolean
  lastLoginAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type UserRole = 'admin' | 'user' | 'guest'

// 认证请求和响应
export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
  expiresIn: number
}

export interface RegisterRequest {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

export interface RegisterResponse {
  user: User
  token: string
  message: string
}

// JWT Token 相关
export interface JWTPayload {
  userId: ID
  email: string
  role: UserRole
  iat: number
  exp: number
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  token: string
  expiresIn: number
}

// 密码重置
export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

// 用户配置
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  notifications: {
    email: boolean
    push: boolean
    trading: boolean
    portfolio: boolean
  }
}

// 用户会话
export interface UserSession {
  id: ID
  userId: ID
  token: string
  refreshToken: string
  ipAddress: string
  userAgent: string
  isActive: boolean
  expiresAt: Timestamp
  createdAt: Timestamp
}