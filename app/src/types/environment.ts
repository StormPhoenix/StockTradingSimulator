/**
 * 前端市场实例相关类型定义
 * 
 * 前端特定的市场实例管理和UI状态类型
 */

// 重新导出共享类型
export type {
  MarketInstanceStatus,
  MarketInstancePreview,
  MarketInstanceDetails,
  TraderInfo,
  StockInfo,
  TraderPerformance,
  TradingLog,
  CreateMarketInstanceRequest,
  CreateMarketInstanceResponse,
  MarketInstanceExport,
  MarketInstanceSummary
} from '../../../shared/types/marketInstance';

// 导入类型用于本地使用
import type {
  MarketInstanceStatus,
  MarketInstancePreview,
  MarketInstanceDetails,
  TradingLog
} from '../../../shared/types/marketInstance';

/**
 * 模板选项 (用于下拉选择)
 */
export interface TemplateOption {
  id: string;
  name: string;
  description: string;
  traderCount: number;
  stockCount: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedCreationTime: number; // 秒
}

/**
 * 市场模板类型 (兼容性别名)
 */
export type MarketTemplate = TemplateOption;

/**
 * 创建进度信息
 */
export interface CreationProgress {
  requestId: string;
  stage: 'INITIALIZING' | 'READING_TEMPLATES' | 'CREATING_OBJECTS' | 'COMPLETE' | 'ERROR';
  percentage: number;
  message: string;
  startedAt: string;
  estimatedTimeRemaining?: number;
  details?: {
    totalTraders?: number;
    createdTraders?: number;
    totalStocks?: number;
    createdStocks?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 市场实例列表UI状态
 */
export interface MarketInstanceListState {
  marketInstances: MarketInstancePreview[];
  isLoading: boolean;
  selectedMarketInstance: string | null;
  sortBy: 'name' | 'createdAt' | 'status' | 'traderCount';
  sortOrder: 'asc' | 'desc';
  filterStatus: MarketInstanceStatus | 'all';
  searchQuery: string;
}

/**
 * 市场实例详情UI状态
 */
export interface MarketInstanceDetailsState {
  marketInstance: MarketInstanceDetails | null;
  isLoading: boolean;
  activeTab: 'overview' | 'traders' | 'stocks' | 'logs';
  tradingLogs: TradingLog[];
  isLoadingLogs: boolean;
  logsFilter: {
    traderId?: string;
    limit: number;
  };
}

// 保持向后兼容性的别名
export type EnvironmentListState = MarketInstanceListState;
export type EnvironmentDetailsState = MarketInstanceDetailsState;

/**
 * 市场实例管理操作
 */
export interface MarketInstanceAction {
  type: 'view' | 'export' | 'destroy' | 'pause' | 'resume';
  marketInstanceId: string;
  isProcessing: boolean;
}

/**
 * 市场实例导出UI状态
 */
export interface MarketInstanceExportState {
  isExporting: boolean;
  format: 'json';
  includeOptions: {
    templateData: boolean;
    tradingLogs: boolean;
    performanceMetrics: boolean;
  };
  progress: number;
  error: string | null;
}

/**
 * 市场实例统计信息 (用于仪表板)
 */
export interface MarketInstanceStats {
  totalMarketInstances: number;
  activeMarketInstances: number;
  creatingMarketInstances: number;
  errorMarketInstances: number;
  totalTraders: number;
  totalStocks: number;
  totalCapital: number;
  averageCreationTime: number;
  successRate: number;
}

/**
 * 实时更新事件类型
 */
export interface MarketInstanceUpdateEvent {
  type: 'status_change' | 'new_log' | 'trader_update' | 'market_instance_created' | 'market_instance_destroyed';
  marketInstanceId: string;
  data: any;
  timestamp: Date;
}

/**
 * 错误状态类型
 */
export interface MarketInstanceError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * 市场实例操作结果
 */
export interface MarketInstanceOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: MarketInstanceError;
}

/**
 * 前端配置选项
 */
export interface MarketInstanceUIConfig {
  polling: {
    progressInterval: number;
    listRefreshInterval: number;
    logsRefreshInterval: number;
  };
  limits: {
    maxMarketInstances: number;
    maxLogsPerPage: number;
    maxExportSize: number;
  };
  features: {
    enableRealTimeUpdates: boolean;
    enableAutoRefresh: boolean;
    enableExportFeature: boolean;
  };
}

// 保持向后兼容性的别名
export type EnvironmentAction = MarketInstanceAction;
export type EnvironmentExportState = MarketInstanceExportState;
export type EnvironmentStats = MarketInstanceStats;
export type EnvironmentUpdateEvent = MarketInstanceUpdateEvent;
export type EnvironmentError = MarketInstanceError;
export type EnvironmentOperationResult = MarketInstanceOperationResult;
export type EnvironmentUIConfig = MarketInstanceUIConfig;