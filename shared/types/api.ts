import type { ID, ApiResponse, PaginationParams, QueryParams } from './common'
import type { User, LoginRequest, RegisterRequest } from './auth'
import type { Portfolio, Position, PortfolioPerformance } from './portfolio'
import type { Trade, TradeOrder, MarketData } from './trading'
import type { Stock, MarketEnvironment } from './market'

// API 请求和响应类型定义

// ========== 认证 API ==========
export namespace AuthAPI {
  export type LoginRequest = import('./auth').LoginRequest
  export interface LoginResponse extends ApiResponse<{
    user: User
    token: string
    refreshToken: string
    expiresIn: number
  }> {}

  export type RegisterRequest = import('./auth').RegisterRequest
  export interface RegisterResponse extends ApiResponse<{
    user: User
    token: string
  }> {}

  export interface LogoutResponse extends ApiResponse<{}> {}

  export interface RefreshTokenRequest {
    refreshToken: string
  }
  export interface RefreshTokenResponse extends ApiResponse<{
    token: string
    expiresIn: number
  }> {}
}

// ========== 用户 API ==========
export namespace UserAPI {
  export interface GetProfileResponse extends ApiResponse<User> {}
  
  export interface UpdateProfileRequest {
    firstName?: string
    lastName?: string
    avatar?: string
  }
  export interface UpdateProfileResponse extends ApiResponse<User> {}

  export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
  }
  export interface ChangePasswordResponse extends ApiResponse<{}> {}
}

// ========== 投资组合 API ==========
export namespace PortfolioAPI {
  export interface GetPortfoliosRequest extends QueryParams {}
  export interface GetPortfoliosResponse extends ApiResponse<{
    portfolios: Portfolio[]
    total: number
    page: number
    limit: number
  }> {}

  export interface GetPortfolioRequest {
    portfolioId: ID
  }
  export interface GetPortfolioResponse extends ApiResponse<Portfolio> {}

  export interface CreatePortfolioRequest {
    name: string
    description?: string
    initialBalance: number
  }
  export interface CreatePortfolioResponse extends ApiResponse<Portfolio> {}

  export interface UpdatePortfolioRequest {
    portfolioId: ID
    name?: string
    description?: string
  }
  export interface UpdatePortfolioResponse extends ApiResponse<Portfolio> {}

  export interface DeletePortfolioRequest {
    portfolioId: ID
  }
  export interface DeletePortfolioResponse extends ApiResponse<{}> {}

  export interface GetPositionsRequest {
    portfolioId: ID
  }
  export interface GetPositionsResponse extends ApiResponse<Position[]> {}

  export interface GetPerformanceRequest {
    portfolioId: ID
    period?: string
    startDate?: string
    endDate?: string
  }
  export interface GetPerformanceResponse extends ApiResponse<PortfolioPerformance> {}
}

// ========== 交易 API ==========
export namespace TradingAPI {
  export interface GetTradesRequest extends QueryParams {
    portfolioId?: ID
    stockSymbol?: string
    status?: string
    startDate?: string
    endDate?: string
  }
  export interface GetTradesResponse extends ApiResponse<{
    trades: Trade[]
    total: number
    page: number
    limit: number
  }> {}

  export interface CreateTradeOrderRequest {
    portfolioId: ID
    stockSymbol: string
    type: 'market' | 'limit' | 'stop' | 'stop_limit'
    action: 'buy' | 'sell'
    quantity: number
    price?: number
    stopPrice?: number
    limitPrice?: number
    timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok'
  }
  export interface CreateTradeOrderResponse extends ApiResponse<TradeOrder> {}

  export interface GetOrdersRequest extends QueryParams {
    portfolioId?: ID
    status?: string
  }
  export interface GetOrdersResponse extends ApiResponse<{
    orders: TradeOrder[]
    total: number
    page: number
    limit: number
  }> {}

  export interface CancelOrderRequest {
    orderId: ID
  }
  export interface CancelOrderResponse extends ApiResponse<TradeOrder> {}
}

// ========== 市场数据 API ==========
export namespace MarketAPI {
  export interface GetStocksRequest extends QueryParams {
    sector?: string
    exchange?: string
    minPrice?: number
    maxPrice?: number
  }
  export interface GetStocksResponse extends ApiResponse<{
    stocks: Stock[]
    total: number
    page: number
    limit: number
  }> {}

  export interface GetStockRequest {
    symbol: string
  }
  export interface GetStockResponse extends ApiResponse<Stock> {}

  export interface GetMarketDataRequest {
    symbols: string[]
    interval?: '1m' | '5m' | '15m' | '1h' | '1d'
  }
  export interface GetMarketDataResponse extends ApiResponse<MarketData[]> {}

  export interface GetMarketEnvironmentsRequest extends QueryParams {}
  export interface GetMarketEnvironmentsResponse extends ApiResponse<{
    environments: MarketEnvironment[]
    total: number
    page: number
    limit: number
  }> {}

  export interface CreateMarketEnvironmentRequest {
    name: string
    description: string
    difficulty: 'easy' | 'medium' | 'hard'
    maxParticipants: number
    duration: number
  }
  export interface CreateMarketEnvironmentResponse extends ApiResponse<MarketEnvironment> {}
}

// ========== 通用 API 类型 ==========
export interface ErrorResponse extends ApiResponse<null> {
  success: false
  error: string
  code?: string
  details?: any
}

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationErrorResponse extends ErrorResponse {
  errors: ValidationError[]
}

// HTTP 状态码
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
  SERVICE_UNAVAILABLE = 503
}

// API 端点路径
export const API_ENDPOINTS = {
  // 认证
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password'
  },
  
  // 用户
  USER: {
    PROFILE: '/api/user/profile',
    UPDATE_PROFILE: '/api/user/profile',
    CHANGE_PASSWORD: '/api/user/change-password'
  },
  
  // 投资组合
  PORTFOLIO: {
    LIST: '/api/portfolios',
    CREATE: '/api/portfolios',
    GET: (id: ID) => `/api/portfolios/${id}`,
    UPDATE: (id: ID) => `/api/portfolios/${id}`,
    DELETE: (id: ID) => `/api/portfolios/${id}`,
    POSITIONS: (id: ID) => `/api/portfolios/${id}/positions`,
    PERFORMANCE: (id: ID) => `/api/portfolios/${id}/performance`
  },
  
  // 交易
  TRADING: {
    TRADES: '/api/trades',
    ORDERS: '/api/orders',
    CREATE_ORDER: '/api/orders',
    CANCEL_ORDER: (id: ID) => `/api/orders/${id}/cancel`
  },
  
  // 市场
  MARKET: {
    STOCKS: '/api/market/stocks',
    STOCK: (symbol: string) => `/api/market/stocks/${symbol}`,
    MARKET_DATA: '/api/market/data',
    ENVIRONMENTS: '/api/market/environments',
    CREATE_ENVIRONMENT: '/api/market/environments'
  }
} as const