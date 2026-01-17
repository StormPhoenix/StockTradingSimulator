import type { ID, Timestamp } from './common'

// 交易模拟相关类型
export interface Trade {
  id: ID
  userId: ID
  portfolioId: ID
  stockId: ID
  stockSymbol: string
  type: TradeType
  action: TradeAction
  quantity: number
  price: number
  totalAmount: number
  commission: number
  status: TradeStatus
  executedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TradeType = 'market' | 'limit' | 'stop' | 'stop_limit'
export type TradeAction = 'buy' | 'sell'
export type TradeStatus = 'pending' | 'executed' | 'cancelled' | 'rejected'

// 交易订单
export interface TradeOrder {
  id: ID
  userId: ID
  portfolioId: ID
  stockId: ID
  stockSymbol: string
  type: TradeType
  action: TradeAction
  quantity: number
  price?: number // limit orders
  stopPrice?: number // stop orders
  limitPrice?: number // stop-limit orders
  timeInForce: TimeInForce
  status: OrderStatus
  filledQuantity: number
  averagePrice?: number
  commission: number
  expiresAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type TimeInForce = 'day' | 'gtc' | 'ioc' | 'fok' // Good Till Cancelled, Immediate or Cancel, Fill or Kill
export type OrderStatus = 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected' | 'expired'

// 交易执行结果
export interface TradeExecution {
  id: ID
  orderId: ID
  tradeId: ID
  quantity: number
  price: number
  commission: number
  executedAt: Timestamp
}

// 交易历史
export interface TradeHistory {
  id: ID
  userId: ID
  portfolioId: ID
  trades: Trade[]
  totalTrades: number
  totalVolume: number
  totalCommission: number
  profitLoss: number
  winRate: number
  period: {
    startDate: Timestamp
    endDate: Timestamp
  }
}

// 交易策略
export interface TradingStrategy {
  id: ID
  name: string
  description: string
  type: StrategyType
  parameters: Record<string, any>
  isActive: boolean
  performance: StrategyPerformance
  createdAt: Timestamp
  updatedAt: Timestamp
}

export type StrategyType = 'momentum' | 'mean_reversion' | 'breakout' | 'custom'

export interface StrategyPerformance {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  maxDrawdown: number
  sharpeRatio: number
}

// 市场数据
export interface MarketData {
  stockId: ID
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
}

// 技术指标
export interface TechnicalIndicator {
  name: string
  value: number
  signal: 'buy' | 'sell' | 'hold'
  timestamp: Timestamp
}

// 风险管理
export interface RiskManagement {
  maxPositionSize: number
  maxDailyLoss: number
  stopLossPercent: number
  takeProfitPercent: number
  maxOpenPositions: number
}