import type { ID, Timestamp } from './common'
import type { Trade } from './trading'

// 投资组合相关类型
export interface Portfolio {
  id: ID
  userId: ID
  name: string
  description?: string
  initialBalance: number
  currentBalance: number
  totalValue: number
  availableCash: number
  investedAmount: number
  unrealizedPnL: number
  realizedPnL: number
  totalReturn: number
  totalReturnPercent: number
  dayChange: number
  dayChangePercent: number
  isActive: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 持仓信息
export interface Position {
  id: ID
  portfolioId: ID
  stockId: ID
  stockSymbol: string
  stockName: string
  quantity: number
  averagePrice: number
  currentPrice: number
  marketValue: number
  costBasis: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  dayChange: number
  dayChangePercent: number
  weight: number // 在投资组合中的权重百分比
  createdAt: Timestamp
  updatedAt: Timestamp
}

// 投资组合性能
export interface PortfolioPerformance {
  portfolioId: ID
  period: PerformancePeriod
  startDate: Timestamp
  endDate: Timestamp
  startValue: number
  endValue: number
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
  maxDrawdownPercent: number
  winRate: number
  profitFactor: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  largestWin: number
  largestLoss: number
  averageWin: number
  averageLoss: number
}

export type PerformancePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'ALL'

// 投资组合分析
export interface PortfolioAnalysis {
  portfolioId: ID
  assetAllocation: AssetAllocation[]
  sectorAllocation: SectorAllocation[]
  riskMetrics: RiskMetrics
  correlation: CorrelationMatrix
  diversificationScore: number
  concentrationRisk: number
  liquidityScore: number
}

export interface AssetAllocation {
  assetType: AssetType
  value: number
  percentage: number
  count: number
}

export type AssetType = 'stocks' | 'bonds' | 'cash' | 'commodities' | 'crypto' | 'other'

export interface SectorAllocation {
  sector: string
  value: number
  percentage: number
  positions: number
}

export interface RiskMetrics {
  beta: number
  alpha: number
  standardDeviation: number
  valueAtRisk: number // VaR at 95% confidence
  expectedShortfall: number // CVaR
  informationRatio: number
  treynorRatio: number
  calmarRatio: number
}

export interface CorrelationMatrix {
  [symbol: string]: {
    [symbol: string]: number
  }
}

// 投资组合历史
export interface PortfolioHistory {
  id: ID
  portfolioId: ID
  date: Timestamp
  totalValue: number
  cash: number
  investedAmount: number
  dayChange: number
  dayChangePercent: number
  positions: PositionSnapshot[]
}

export interface PositionSnapshot {
  stockSymbol: string
  quantity: number
  price: number
  value: number
}

// 投资组合设置
export interface PortfolioSettings {
  portfolioId: ID
  autoRebalance: boolean
  rebalanceFrequency: RebalanceFrequency
  targetAllocation: TargetAllocation[]
  riskTolerance: RiskTolerance
  investmentHorizon: InvestmentHorizon
  notifications: PortfolioNotifications
}

export type RebalanceFrequency = 'never' | 'monthly' | 'quarterly' | 'annually'
export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive'
export type InvestmentHorizon = 'short' | 'medium' | 'long' // < 2 years, 2-10 years, > 10 years

export interface TargetAllocation {
  assetType: AssetType
  targetPercent: number
  minPercent: number
  maxPercent: number
}

export interface PortfolioNotifications {
  dailyReport: boolean
  weeklyReport: boolean
  monthlyReport: boolean
  priceAlerts: boolean
  rebalanceAlerts: boolean
  performanceAlerts: boolean
}

// 投资组合比较
export interface PortfolioComparison {
  portfolios: Portfolio[]
  benchmark?: string
  period: PerformancePeriod
  metrics: ComparisonMetrics[]
}

export interface ComparisonMetrics {
  portfolioId: ID
  totalReturn: number
  annualizedReturn: number
  volatility: number
  sharpeRatio: number
  maxDrawdown: number
}