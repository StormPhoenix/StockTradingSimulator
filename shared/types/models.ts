import type { Document, ObjectId } from 'mongoose'
import type { ID, Timestamp } from './common.js'
import type { User, UserSession, UserPreferences } from './auth.js'
import type { Portfolio, Position, PortfolioPerformance, PortfolioSettings } from './portfolio.js'
import type { Trade, TradeOrder, TradingStrategy } from './trading.js'
import type { Stock, MarketEnvironment } from './market.js'

// Mongoose 数据库模型类型定义

// ========== 用户模型 ==========
export interface UserDocument extends Omit<User, 'id'>, Document {
  password: string
  passwordResetToken?: string
  passwordResetExpires?: Date
  emailVerificationToken?: string
  emailVerificationExpires?: Date
  
  // 虚拟字段
  fullName: string
  
  // 实例方法
  comparePassword(candidatePassword: string): Promise<boolean>
  generatePasswordResetToken(): string
  generateEmailVerificationToken(): string
  isPasswordResetTokenValid(token: string): boolean
  isEmailVerificationTokenValid(token: string): boolean
}

export interface UserSessionDocument extends Omit<UserSession, 'id'>, Document {}

export interface UserPreferencesDocument extends Omit<UserPreferences, 'id'>, Document {
  userId: ObjectId
}

// ========== 投资组合模型 ==========
export interface PortfolioDocument extends Omit<Portfolio, 'id'>, Document {
  // 虚拟字段
  positions: PositionDocument[]
  performance: PortfolioPerformanceDocument[]
  
  // 实例方法
  calculateTotalValue(): Promise<number>
  calculatePnL(): Promise<{ realized: number; unrealized: number }>
  updateBalance(amount: number): Promise<void>
  canAfford(amount: number): boolean
  getPositionBySymbol(symbol: string): Promise<PositionDocument | null>
}

export interface PositionDocument extends Omit<Position, 'id'>, Document {
  // 实例方法
  updatePrice(newPrice: number): void
  calculatePnL(): { unrealized: number; unrealizedPercent: number }
  calculateWeight(portfolioValue: number): number
}

export interface PortfolioPerformanceDocument extends Omit<PortfolioPerformance, 'portfolioId'>, Document {
  portfolioId: ObjectId
}

export interface PortfolioSettingsDocument extends Omit<PortfolioSettings, 'portfolioId'>, Document {
  portfolioId: ObjectId
}

// ========== 交易模型 ==========
export interface TradeDocument extends Omit<Trade, 'id'>, Document {
  // 实例方法
  calculateTotalAmount(): number
  calculateCommission(): number
  execute(): Promise<void>
  cancel(): Promise<void>
}

export interface TradeOrderDocument extends Omit<TradeOrder, 'id'>, Document {
  // 实例方法
  canExecute(currentPrice: number): boolean
  execute(executionPrice: number, executionQuantity: number): Promise<TradeDocument>
  cancel(): Promise<void>
  expire(): Promise<void>
  calculateCommission(): number
}

export interface TradingStrategyDocument extends Omit<TradingStrategy, 'id'>, Document {
  // 实例方法
  evaluate(marketData: any): Promise<'buy' | 'sell' | 'hold'>
  updatePerformance(trade: TradeDocument): Promise<void>
  backtest(historicalData: any[]): Promise<any>
}

// ========== 市场模型 ==========
export interface StockDocument extends Omit<Stock, 'id'>, Document {
  // 虚拟字段
  marketData: MarketDataDocument[]
  
  // 实例方法
  updatePrice(newPrice: number): Promise<void>
  getLatestPrice(): Promise<number>
  getPriceHistory(days: number): Promise<number[]>
  calculateVolatility(days: number): Promise<number>
}

export interface MarketEnvironmentDocument extends Omit<MarketEnvironment, 'id'>, Document {
  // 虚拟字段
  participants: UserDocument[]
  stocks: StockDocument[]
  
  // 实例方法
  addParticipant(userId: ObjectId): Promise<void>
  removeParticipant(userId: ObjectId): Promise<void>
  canJoin(userId: ObjectId): boolean
  start(): Promise<void>
  pause(): Promise<void>
  complete(): Promise<void>
  getLeaderboard(): Promise<any[]>
}

export interface MarketDataDocument extends Document {
  stockId: ObjectId
  symbol: string
  price: number
  change: number
  changePercent: number
  volume: number
  high: number
  low: number
  open: number
  close: number
  timestamp: Timestamp
  
  // 技术指标
  sma20?: number
  sma50?: number
  ema12?: number
  ema26?: number
  rsi?: number
  macd?: number
  bollinger?: {
    upper: number
    middle: number
    lower: number
  }
}

// ========== 模板模型 ==========
export interface StockTemplateDocument extends Document {
  name: string
  symbol: string
  issuePrice: number
  totalShares: number
  category: 'tech' | 'finance' | 'healthcare' | 'energy' | 'consumer'
  description?: string
  status: 'active' | 'inactive'
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // 实例方法
  toSafeObject(): any
}

export interface AITraderTemplateDocument extends Document {
  name: string
  initialCapital: number
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  tradingStyle: 'day_trading' | 'swing_trading' | 'position_trading'
  maxPositions: number
  parameters: Record<string, any>
  description?: string
  status: 'active' | 'inactive'
  createdAt: Timestamp
  updatedAt: Timestamp
  
  // 实例方法
  toSafeObject(): any
}

// ========== 系统模型 ==========
export interface AuditLogDocument extends Document {
  userId?: ObjectId
  action: string
  resource: string
  resourceId?: ObjectId
  details: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: Timestamp
}

export interface SystemConfigDocument extends Document {
  key: string
  value: any
  description?: string
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface NotificationDocument extends Document {
  userId: ObjectId
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  readAt?: Timestamp
  createdAt: Timestamp
}

export type NotificationType = 
  | 'trade_executed'
  | 'order_filled'
  | 'order_cancelled'
  | 'price_alert'
  | 'portfolio_performance'
  | 'system_maintenance'
  | 'account_security'

// ========== 数据库集合名称 ==========
export const COLLECTION_NAMES = {
  USERS: 'users',
  USER_SESSIONS: 'user_sessions',
  USER_PREFERENCES: 'user_preferences',
  PORTFOLIOS: 'portfolios',
  POSITIONS: 'positions',
  PORTFOLIO_PERFORMANCE: 'portfolio_performance',
  PORTFOLIO_SETTINGS: 'portfolio_settings',
  TRADES: 'trades',
  TRADE_ORDERS: 'trade_orders',
  TRADING_STRATEGIES: 'trading_strategies',
  STOCKS: 'stocks',
  MARKET_ENVIRONMENTS: 'market_environments',
  MARKET_DATA: 'market_data',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_CONFIG: 'system_config',
  NOTIFICATIONS: 'notifications'
} as const

// ========== 索引定义 ==========
export const DATABASE_INDEXES = {
  USERS: [
    { email: 1 },
    { username: 1 },
    { 'email': 1, 'isActive': 1 }
  ],
  PORTFOLIOS: [
    { userId: 1 },
    { 'userId': 1, 'isActive': 1 }
  ],
  POSITIONS: [
    { portfolioId: 1 },
    { stockSymbol: 1 },
    { 'portfolioId': 1, 'stockSymbol': 1 }
  ],
  TRADES: [
    { userId: 1 },
    { portfolioId: 1 },
    { stockSymbol: 1 },
    { createdAt: -1 },
    { 'userId': 1, 'createdAt': -1 }
  ],
  TRADE_ORDERS: [
    { userId: 1 },
    { portfolioId: 1 },
    { status: 1 },
    { 'userId': 1, 'status': 1 }
  ],
  MARKET_DATA: [
    { stockId: 1 },
    { symbol: 1 },
    { timestamp: -1 },
    { 'symbol': 1, 'timestamp': -1 }
  ]
} as const