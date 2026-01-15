import type { 
  UserDocument, 
  PortfolioDocument, 
  PositionDocument,
  TradeDocument, 
  TradeOrderDocument,
  StockDocument,
  MarketEnvironmentDocument 
} from '@shared/models'
import type { 
  User, 
  LoginRequest, 
  RegisterRequest 
} from '@shared/auth'
import type { 
  Portfolio, 
  Position, 
  PortfolioPerformance 
} from '@shared/portfolio'
import type { 
  Trade, 
  MarketData 
} from '@shared/trading'
import type { 
  Stock 
} from '@shared/market'
import type { QueryParams } from '@shared/common'

// 服务层类型定义

// ========== 基础服务接口 ==========
export interface BaseService<T, TDocument = T> {
  findById(id: string): Promise<TDocument | null>
  findAll(query?: QueryParams): Promise<TDocument[]>
  create(data: Partial<T>): Promise<TDocument>
  update(id: string, data: Partial<T>): Promise<TDocument | null>
  delete(id: string): Promise<boolean>
}

// ========== 用户服务 ==========
export interface UserService extends BaseService<User, UserDocument> {
  // 认证相关
  authenticate(credentials: LoginRequest): Promise<AuthResult>
  register(userData: RegisterRequest): Promise<AuthResult>
  refreshToken(refreshToken: string): Promise<TokenResult>
  logout(userId: string): Promise<void>
  
  // 用户管理
  findByEmail(email: string): Promise<UserDocument | null>
  findByUsername(username: string): Promise<UserDocument | null>
  updateProfile(userId: string, data: Partial<User>): Promise<UserDocument | null>
  changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>
  
  // 密码重置
  requestPasswordReset(email: string): Promise<void>
  resetPassword(token: string, newPassword: string): Promise<void>
  
  // 邮箱验证
  sendVerificationEmail(userId: string): Promise<void>
  verifyEmail(token: string): Promise<void>
  
  // 用户状态
  activateUser(userId: string): Promise<void>
  deactivateUser(userId: string): Promise<void>
  
  // 用户偏好
  getUserPreferences(userId: string): Promise<any>
  updateUserPreferences(userId: string, preferences: any): Promise<any>
}

export interface AuthResult {
  user: UserDocument
  token: string
  refreshToken: string
  expiresIn: number
}

export interface TokenResult {
  token: string
  expiresIn: number
}

// ========== 投资组合服务 ==========
export interface PortfolioService extends BaseService<Portfolio, PortfolioDocument> {
  // 投资组合管理
  findByUserId(userId: string): Promise<PortfolioDocument[]>
  createForUser(userId: string, data: CreatePortfolioData): Promise<PortfolioDocument>
  updateBalance(portfolioId: string, amount: number): Promise<PortfolioDocument | null>
  
  // 持仓管理
  getPositions(portfolioId: string): Promise<PositionDocument[]>
  getPosition(portfolioId: string, stockSymbol: string): Promise<PositionDocument | null>
  updatePosition(portfolioId: string, stockSymbol: string, data: Partial<Position>): Promise<PositionDocument | null>
  addPosition(portfolioId: string, positionData: CreatePositionData): Promise<PositionDocument>
  removePosition(portfolioId: string, stockSymbol: string): Promise<boolean>
  
  // 性能分析
  getPerformance(portfolioId: string, period?: string): Promise<PortfolioPerformance>
  getHistoricalPerformance(portfolioId: string, startDate: Date, endDate: Date): Promise<any[]>
  calculateReturns(portfolioId: string): Promise<ReturnMetrics>
  
  // 风险分析
  calculateRisk(portfolioId: string): Promise<RiskMetrics>
  getDiversificationMetrics(portfolioId: string): Promise<DiversificationMetrics>
  
  // 投资组合比较
  comparePortfolios(portfolioIds: string[]): Promise<ComparisonResult>
}

export interface CreatePortfolioData {
  name: string
  description?: string
  initialBalance: number
}

export interface CreatePositionData {
  stockSymbol: string
  stockName: string
  quantity: number
  averagePrice: number
}

export interface ReturnMetrics {
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  dailyReturn: number
  weeklyReturn: number
  monthlyReturn: number
  yearToDateReturn: number
}

export interface RiskMetrics {
  volatility: number
  beta: number
  sharpeRatio: number
  maxDrawdown: number
  valueAtRisk: number
  expectedShortfall: number
}

export interface DiversificationMetrics {
  sectorDiversification: number
  geographicDiversification: number
  correlationScore: number
  concentrationRisk: number
}

export interface ComparisonResult {
  portfolios: PortfolioDocument[]
  metrics: ComparisonMetrics[]
  benchmark?: BenchmarkData
}

export interface ComparisonMetrics {
  portfolioId: string
  returns: ReturnMetrics
  risk: RiskMetrics
  sharpeRatio: number
  informationRatio: number
}

export interface BenchmarkData {
  name: string
  returns: ReturnMetrics
  risk: RiskMetrics
}

// ========== 交易服务 ==========
export interface TradingService extends BaseService<Trade, TradeDocument> {
  // 订单管理
  createOrder(orderData: CreateOrderData): Promise<TradeOrderDocument>
  getOrders(userId: string, query?: OrderQuery): Promise<TradeOrderDocument[]>
  getOrder(orderId: string): Promise<TradeOrderDocument | null>
  cancelOrder(orderId: string): Promise<TradeOrderDocument | null>
  
  // 交易执行
  executeOrder(orderId: string, executionData: ExecutionData): Promise<TradeDocument>
  executeTrade(tradeData: CreateTradeData): Promise<TradeDocument>
  
  // 交易历史
  getTradeHistory(userId: string, query?: TradeQuery): Promise<TradeDocument[]>
  getPortfolioTrades(portfolioId: string, query?: TradeQuery): Promise<TradeDocument[]>
  
  // 交易分析
  getTradeStatistics(userId: string, period?: string): Promise<TradeStatistics>
  getPerformanceMetrics(userId: string, period?: string): Promise<TradingPerformance>
  
  // 风险管理
  validateOrder(orderData: CreateOrderData): Promise<ValidationResult>
  checkRiskLimits(userId: string, orderData: CreateOrderData): Promise<RiskCheckResult>
  
  // 佣金计算
  calculateCommission(orderData: CreateOrderData): Promise<number>
}

export interface CreateOrderData {
  userId: string
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

export interface CreateTradeData {
  userId: string
  portfolioId: string
  stockSymbol: string
  action: 'buy' | 'sell'
  quantity: number
  price: number
}

export interface ExecutionData {
  price: number
  quantity: number
  timestamp: Date
}

export interface OrderQuery extends QueryParams {
  portfolioId?: string
  status?: string
  startDate?: Date
  endDate?: Date
}

export interface TradeQuery extends QueryParams {
  portfolioId?: string
  stockSymbol?: string
  action?: 'buy' | 'sell'
  startDate?: Date
  endDate?: Date
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface RiskCheckResult {
  passed: boolean
  violations: RiskViolation[]
  recommendations: string[]
}

export interface RiskViolation {
  type: string
  message: string
  severity: 'low' | 'medium' | 'high'
}

export interface TradeStatistics {
  totalTrades: number
  totalVolume: number
  totalCommission: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  largestWin: number
  largestLoss: number
}

export interface TradingPerformance {
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  sharpeRatio: number
  maxDrawdown: number
  volatility: number
  beta: number
  alpha: number
}

// ========== 市场数据服务 ==========
export interface MarketService extends BaseService<Stock, StockDocument> {
  // 股票数据
  findBySymbol(symbol: string): Promise<StockDocument | null>
  searchStocks(query: string): Promise<StockDocument[]>
  getStocksBySymbols(symbols: string[]): Promise<StockDocument[]>
  getStocksBySector(sector: string): Promise<StockDocument[]>
  
  // 市场数据
  getMarketData(symbols: string[]): Promise<MarketData[]>
  getLatestPrice(symbol: string): Promise<number | null>
  getPriceHistory(symbol: string, days: number): Promise<PriceHistoryData[]>
  
  // 技术分析
  calculateTechnicalIndicators(symbol: string, period: number): Promise<TechnicalIndicators>
  getMovingAverages(symbol: string, periods: number[]): Promise<MovingAverageData[]>
  
  // 市场环境
  getMarketEnvironments(): Promise<MarketEnvironmentDocument[]>
  createMarketEnvironment(data: CreateEnvironmentData): Promise<MarketEnvironmentDocument>
  joinEnvironment(environmentId: string, userId: string): Promise<void>
  leaveEnvironment(environmentId: string, userId: string): Promise<void>
  
  // 市场统计
  getMarketSummary(): Promise<MarketSummary>
  getTopMovers(): Promise<TopMoversData>
  getSectorPerformance(): Promise<SectorPerformanceData[]>
}

export interface PriceHistoryData {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface TechnicalIndicators {
  sma20: number
  sma50: number
  ema12: number
  ema26: number
  rsi: number
  macd: number
  bollingerBands: {
    upper: number
    middle: number
    lower: number
  }
}

export interface MovingAverageData {
  period: number
  value: number
  type: 'SMA' | 'EMA'
}

export interface CreateEnvironmentData {
  name: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  maxParticipants: number
  duration: number
}

export interface MarketSummary {
  totalStocks: number
  advancers: number
  decliners: number
  unchanged: number
  totalVolume: number
  marketCap: number
}

export interface TopMoversData {
  gainers: StockDocument[]
  losers: StockDocument[]
  mostActive: StockDocument[]
}

export interface SectorPerformanceData {
  sector: string
  change: number
  changePercent: number
  volume: number
  marketCap: number
}

// ========== 通知服务 ==========
export interface NotificationService {
  sendEmail(to: string, subject: string, content: string): Promise<void>
  sendPushNotification(userId: string, title: string, message: string): Promise<void>
  createNotification(userId: string, type: string, data: any): Promise<void>
  getNotifications(userId: string, query?: QueryParams): Promise<any[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
}

// ========== 审计服务 ==========
export interface AuditService {
  logAction(userId: string, action: string, resource: string, details: any): Promise<void>
  getAuditLogs(query?: AuditQuery): Promise<any[]>
  getUserActivity(userId: string, query?: QueryParams): Promise<any[]>
}

export interface AuditQuery extends QueryParams {
  userId?: string
  action?: string
  resource?: string
  startDate?: Date
  endDate?: Date
}

// ========== 缓存服务 ==========
export interface CacheService {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(pattern?: string): Promise<void>
  exists(key: string): Promise<boolean>
}