import type { ID, Timestamp, BaseEntity } from './common'

// 市场环境状态
export type MarketStatus = 'draft' | 'active' | 'paused' | 'completed'

// 难度级别
export type DifficultyLevel = 'easy' | 'medium' | 'hard'

// 风险偏好类型
export type RiskProfile = 'conservative' | 'moderate' | 'aggressive'

// 交易风格类型
export type TradingStyle = 'day_trading' | 'swing_trading' | 'position_trading'

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
  // 用于分配服务的额外字段
  templateId?: string
  issuePrice?: number
  totalShares?: number
  allocatedShares?: number
  availableShares?: number
  holders?: Holder[]
  category?: string
}

// 持仓信息
export interface Holding {
  stockSymbol: string
  quantity: number
  currentValue: number
  stockName?: string
  averagePrice?: number
}

// 持有者信息
export interface Holder {
  traderId: ID
  traderName: string
  quantity: number
  percentage: number
}

// 交易员信息
export interface Trader extends BaseEntity {
  name: string
  templateId?: string
  initialCapital: number
  currentCapital?: number
  riskProfile: RiskProfile
  tradingStyle?: TradingStyle
  maxPositions?: number
  parameters?: Record<string, any>
  holdings?: Holding[]
}

// 市场统计信息
export interface MarketStatistics {
  traderCount: number
  stockCount: number
  totalCapital?: number
  averageCapitalPerTrader?: number
  capitalDistribution?: Record<string, number>
  stockDistribution?: Record<string, number>
  riskProfileDistribution?: Record<string, number>
  tradingStyleDistribution?: Record<string, number>
  allocationFairness?: number
  giniCoefficient?: number
}

// 扩展的市场环境接口（用于验证服务）
export interface MarketEnvironmentData extends MarketEnvironment {
  traders: Trader[]
  stocks: Stock[]
  statistics?: MarketStatistics
  totalCapital?: number
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

// 导入导出相关类型
export interface ImportData {
  version?: string
  [key: string]: any
}

export interface ExportMetadata {
  version: string
  exportedAt: Timestamp
  checksum?: string
  description?: string
  exportFormat?: string
  exportTool?: string
  exportVersion?: string
  [key: string]: any
}

export interface ExportFormat {
  id: ID
  name: string
  description: string
  version?: string
  createdAt: Timestamp
  updatedAt: Timestamp
  exportedAt?: Timestamp
  configuration?: {
    allocationAlgorithm: string
    allocationSeed: number
    totalCapital: number
    totalMarketValue: number
  }
  traders: Trader[]
  stocks: Stock[]
  statistics?: MarketStatistics
  metadata?: ExportMetadata
}