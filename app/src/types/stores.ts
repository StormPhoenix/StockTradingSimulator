import type { Ref, ComputedRef } from 'vue'
import type { User, UserPreferences } from '@shared/auth'
import type { Portfolio, Position, PortfolioPerformance } from '@shared/portfolio'
import type { Trade, TradeOrder, MarketData } from '@shared/trading'
import type { Stock, MarketEnvironment } from '@shared/market'

// Pinia Store 类型定义

// ========== 认证 Store ==========
export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

export interface AuthGetters {
  isLoggedIn: ComputedRef<boolean>
  userRole: ComputedRef<string | null>
  userName: ComputedRef<string>
  userEmail: ComputedRef<string>
  hasRole: ComputedRef<(role: string) => boolean>
}

export interface AuthActions {
  // 登录相关
  login(credentials: LoginCredentials): Promise<void>
  logout(): Promise<void>
  register(userData: RegisterData): Promise<void>
  
  // Token 管理
  refreshAccessToken(): Promise<void>
  setToken(token: string): void
  clearToken(): void
  
  // 用户信息
  fetchUserProfile(): Promise<void>
  updateProfile(data: Partial<User>): Promise<void>
  changePassword(data: ChangePasswordData): Promise<void>
  
  // 状态管理
  setLoading(loading: boolean): void
  setError(error: string | null): void
  clearError(): void
}

export interface LoginCredentials {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

// ========== 投资组合 Store ==========
export interface PortfolioState {
  portfolios: Portfolio[]
  currentPortfolio: Portfolio | null
  positions: Position[]
  performance: PortfolioPerformance | null
  isLoading: boolean
  error: string | null
}

export interface PortfolioGetters {
  portfolioCount: ComputedRef<number>
  totalValue: ComputedRef<number>
  totalPnL: ComputedRef<number>
  totalPnLPercent: ComputedRef<number>
  topPerformers: ComputedRef<Position[]>
  worstPerformers: ComputedRef<Position[]>
  portfolioById: ComputedRef<(id: string) => Portfolio | undefined>
  positionBySymbol: ComputedRef<(symbol: string) => Position | undefined>
}

export interface PortfolioActions {
  // 投资组合管理
  fetchPortfolios(): Promise<void>
  createPortfolio(data: CreatePortfolioData): Promise<Portfolio>
  updatePortfolio(id: string, data: Partial<Portfolio>): Promise<Portfolio>
  deletePortfolio(id: string): Promise<void>
  setCurrentPortfolio(portfolio: Portfolio | null): void
  
  // 持仓管理
  fetchPositions(portfolioId: string): Promise<void>
  updatePosition(position: Position): void
  
  // 性能数据
  fetchPerformance(portfolioId: string, period?: string): Promise<void>
  
  // 状态管理
  setLoading(loading: boolean): void
  setError(error: string | null): void
  clearError(): void
}

export interface CreatePortfolioData {
  name: string
  description?: string
  initialBalance: number
}

// ========== 交易 Store ==========
export interface TradingState {
  trades: Trade[]
  orders: TradeOrder[]
  currentOrder: TradeOrder | null
  isLoading: boolean
  error: string | null
}

export interface TradingGetters {
  tradeCount: ComputedRef<number>
  orderCount: ComputedRef<number>
  pendingOrders: ComputedRef<TradeOrder[]>
  executedTrades: ComputedRef<Trade[]>
  totalCommission: ComputedRef<number>
  tradesBySymbol: ComputedRef<(symbol: string) => Trade[]>
  ordersByStatus: ComputedRef<(status: string) => TradeOrder[]>
}

export interface TradingActions {
  // 交易管理
  fetchTrades(params?: TradeQueryParams): Promise<void>
  createOrder(orderData: CreateOrderData): Promise<TradeOrder>
  cancelOrder(orderId: string): Promise<void>
  
  // 订单管理
  fetchOrders(params?: OrderQueryParams): Promise<void>
  setCurrentOrder(order: TradeOrder | null): void
  
  // 状态管理
  setLoading(loading: boolean): void
  setError(error: string | null): void
  clearError(): void
}

export interface TradeQueryParams {
  portfolioId?: string
  stockSymbol?: string
  status?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

export interface OrderQueryParams {
  portfolioId?: string
  status?: string
  page?: number
  limit?: number
}

export interface CreateOrderData {
  portfolioId: string
  stockSymbol: string
  type: 'market' | 'limit' | 'stop' | 'stop_limit'
  action: 'buy' | 'sell'
  quantity: number
  price?: number
  stopPrice?: number
  limitPrice?: number
  timeInForce?: 'day' | 'gtc' | 'ioc' | 'fok'
}

// ========== 市场数据 Store ==========
export interface MarketState {
  stocks: Stock[]
  marketData: Record<string, MarketData>
  environments: MarketEnvironment[]
  currentEnvironment: MarketEnvironment | null
  watchlist: string[]
  isLoading: boolean
  error: string | null
}

export interface MarketGetters {
  stockCount: ComputedRef<number>
  watchlistStocks: ComputedRef<Stock[]>
  stockBySymbol: ComputedRef<(symbol: string) => Stock | undefined>
  marketDataBySymbol: ComputedRef<(symbol: string) => MarketData | undefined>
  topGainers: ComputedRef<Stock[]>
  topLosers: ComputedRef<Stock[]>
  mostActive: ComputedRef<Stock[]>
}

export interface MarketActions {
  // 股票数据
  fetchStocks(params?: StockQueryParams): Promise<void>
  fetchStock(symbol: string): Promise<Stock>
  searchStocks(query: string): Promise<Stock[]>
  
  // 市场数据
  fetchMarketData(symbols: string[]): Promise<void>
  subscribeToMarketData(symbols: string[]): void
  unsubscribeFromMarketData(symbols: string[]): void
  
  // 观察列表
  addToWatchlist(symbol: string): void
  removeFromWatchlist(symbol: string): void
  clearWatchlist(): void
  
  // 市场环境
  fetchEnvironments(): Promise<void>
  joinEnvironment(environmentId: string): Promise<void>
  leaveEnvironment(environmentId: string): Promise<void>
  setCurrentEnvironment(environment: MarketEnvironment | null): void
  
  // 状态管理
  setLoading(loading: boolean): void
  setError(error: string | null): void
  clearError(): void
}

export interface StockQueryParams {
  sector?: string
  exchange?: string
  minPrice?: number
  maxPrice?: number
  search?: string
  page?: number
  limit?: number
}

// ========== 应用设置 Store ==========
export interface AppState {
  theme: 'light' | 'dark' | 'auto'
  language: string
  currency: string
  timezone: string
  notifications: NotificationSettings
  layout: LayoutSettings
  isLoading: boolean
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  trading: boolean
  portfolio: boolean
  market: boolean
}

export interface LayoutSettings {
  sidebarCollapsed: boolean
  sidebarWidth: number
  headerHeight: number
  footerHeight: number
  compactMode: boolean
}

export interface AppGetters {
  isDarkMode: ComputedRef<boolean>
  currentLanguage: ComputedRef<string>
  formattedCurrency: ComputedRef<(amount: number) => string>
  isNotificationEnabled: ComputedRef<(type: string) => boolean>
}

export interface AppActions {
  // 主题设置
  setTheme(theme: 'light' | 'dark' | 'auto'): void
  toggleTheme(): void
  
  // 语言设置
  setLanguage(language: string): void
  
  // 通知设置
  updateNotificationSettings(settings: Partial<NotificationSettings>): void
  
  // 布局设置
  updateLayoutSettings(settings: Partial<LayoutSettings>): void
  toggleSidebar(): void
  
  // 数据持久化
  loadSettings(): void
  saveSettings(): void
  
  // 状态管理
  setLoading(loading: boolean): void
}

// ========== WebSocket Store ==========
export interface WebSocketState {
  connected: boolean
  reconnecting: boolean
  subscriptions: Set<string>
  error: string | null
}

export interface WebSocketActions {
  connect(): void
  disconnect(): void
  subscribe(channel: string): void
  unsubscribe(channel: string): void
  send(message: any): void
  
  // 事件处理
  onMessage(handler: (data: any) => void): void
  onError(handler: (error: Error) => void): void
  onConnect(handler: () => void): void
  onDisconnect(handler: () => void): void
}

// ========== Store 类型联合 ==========
export interface RootState {
  auth: AuthState
  portfolio: PortfolioState
  trading: TradingState
  market: MarketState
  app: AppState
  websocket: WebSocketState
}

// Store 实例类型
export type AuthStore = AuthState & AuthGetters & AuthActions
export type PortfolioStore = PortfolioState & PortfolioGetters & PortfolioActions
export type TradingStore = TradingState & TradingGetters & TradingActions
export type MarketStore = MarketState & MarketGetters & MarketActions
export type AppStore = AppState & AppGetters & AppActions
export type WebSocketStore = WebSocketState & WebSocketActions