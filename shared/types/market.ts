import type { ID, Timestamp, BaseEntity } from './common'

// 市场环境状态
export type MarketStatus = 'draft' | 'active' | 'paused' | 'completed'

// 难度级别
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// 市场环境
export interface MarketEnvironment extends BaseEntity {
  name: string
  description: string
  difficulty: DifficultyLevel
  maxParticipants: number
  duration: number // 持续时间（分钟）
  status: MarketStatus
  startTime?: Timestamp
  endTime?: Timestamp
}

// 股票信息
export interface Stock extends BaseEntity {
  symbol: string
  name: string
  sector: string
  currentPrice: number
  previousClose: number
  volume: number
  marketCap?: number
  isActive: boolean
}

// 交易类型
export type TradeType = 'buy' | 'sell'

// 交易状态
export type TradeStatus = 'pending' | 'executed' | 'cancelled' | 'failed'

// 交易记录
export interface Trade extends BaseEntity {
  userId: ID
  stockId: ID
  marketEnvironmentId: ID
  type: TradeType
  quantity: number
  price: number
  totalAmount: number
  status: TradeStatus
  executedAt?: Timestamp
}

// 市场数据
export interface MarketData {
  stockId: ID
  price: number
  volume: number
  timestamp: Timestamp
  high: number
  low: number
  open: number
  close: number
}

// 价格历史
export interface PriceHistory {
  stockId: ID
  prices: {
    timestamp: Timestamp
    price: number
    volume: number
  }[]
}