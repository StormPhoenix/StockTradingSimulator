/**
 * 市场实例相关共享类型定义
 * 
 * 前后端共享的市场实例数据结构
 */

/**
 * 市场实例状态枚举
 */
export enum MarketInstanceStatus {
  CREATING = 'CREATING',
  ACTIVE = 'ACTIVE', 
  PAUSED = 'PAUSED',
  ERROR = 'ERROR'
}

/**
 * 市场实例预览信息 (用于列表显示)
 */
export interface MarketInstancePreview {
  /** 市场实例唯一标识符 */
  exchangeId: string;
  
  /** 市场实例名称 */
  name: string;
  
  /** 市场实例描述 */
  description: string;
  
  /** 当前状态 */
  status: MarketInstanceStatus;
  
  /** 创建时间 */
  createdAt: Date;
  
  /** 最后活跃时间 */
  lastActiveAt: Date;
  
  /** 统计信息 */
  statistics: {
    traderCount: number;
    stockCount: number;
    totalCapital: number;
    averageCapitalPerTrader: number;
  };
  
  /** 模板信息 */
  templateInfo: {
    templateId: string;
    templateName: string;
  };
}

/**
 * 市场实例详细信息
 */
export interface MarketInstanceDetails extends MarketInstancePreview {
  /** AI交易员列表 */
  traders: TraderInfo[];
  
  /** 股票列表 */
  stocks: StockInfo[];
}

/**
 * AI交易员信息
 */
export interface TraderInfo {
  id: string;
  name: string;
  currentCapital: number;
  initialCapital: number;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  isActive: boolean;
  performanceMetrics: TraderPerformance;
}

/**
 * 股票信息
 */
export interface StockInfo {
  id: string;
  symbol: string;
  companyName: string;
  category: string;
  currentPrice: number;
  issuePrice: number;
  totalShares: number;
  marketCap: number;
}

/**
 * 交易员绩效指标
 */
export interface TraderPerformance {
  totalTrades: number;
  profitLoss: number;
  profitLossPercentage: number;
  winRate: number;
  averageTradeValue: number;
  lastTradeAt?: Date;
}

/**
 * 交易日志
 */
export interface TradingLog {
  id: string;
  traderId: string;
  traderName: string;
  type: 'buy' | 'sell' | 'hold' | 'error' | 'info';
  message: string;
  timestamp: Date;
  details?: {
    capital?: number;
    decisionType?: 'BUY' | 'SELL' | 'HOLD';
    targetStock?: string;
    riskProfile?: string;
    tradingStyle?: string;
    [key: string]: any;
  };
}

/**
 * 市场实例创建请求
 */
export interface CreateMarketInstanceRequest {
  templateId: string;
  name?: string;
}

/**
 * 市场实例创建响应
 */
export interface CreateMarketInstanceResponse {
  requestId: string;
  message: string;
  progressUrl: string;
}

/**
 * 市场实例导出数据
 */
export interface MarketInstanceExport {
  exportedAt: Date;
  marketInstance: MarketInstanceDetails;
  templateData: {
    exchange: any;
    traders: any[];
    stocks: any[];
  };
  runtimeState: {
    tradingLogs: TradingLog[];
    performanceMetrics: Record<string, TraderPerformance>;
  };
}

/**
 * 市场实例摘要信息
 */
export interface MarketInstanceSummary {
  totalMarketInstances: number;
  activeMarketInstances: number;
  creatingMarketInstances: number;
  errorMarketInstances: number;
  totalTraders: number;
  totalStocks: number;
  totalCapital: number;
}