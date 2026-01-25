/**
 * 前端环境相关类型定义
 * 
 * 前端特定的环境管理和UI状态类型
 */

// 重新导出共享类型
export type {
  EnvironmentStatus,
  EnvironmentPreview,
  EnvironmentDetails,
  TraderInfo,
  StockInfo,
  TraderPerformance,
  TradingLog,
  CreateEnvironmentRequest,
  CreateEnvironmentResponse,
  EnvironmentExport,
  EnvironmentSummary
} from '../../../shared/types/environment';

// 导入类型用于本地使用
import type {
  EnvironmentStatus,
  EnvironmentPreview,
  EnvironmentDetails,
  TradingLog
} from '../../../shared/types/environment';

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
  environments: EnvironmentPreview[];
  isLoading: boolean;
  selectedEnvironment: string | null;
  sortBy: 'name' | 'createdAt' | 'status' | 'traderCount';
  sortOrder: 'asc' | 'desc';
  filterStatus: EnvironmentStatus | 'all';
  searchQuery: string;
}

/**
 * 市场实例详情UI状态
 */
export interface MarketInstanceDetailsState {
  environment: EnvironmentDetails | null;
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
 * 环境管理操作
 */
export interface EnvironmentAction {
  type: 'view' | 'export' | 'destroy' | 'pause' | 'resume';
  environmentId: string;
  isProcessing: boolean;
}

/**
 * 环境导出UI状态
 */
export interface EnvironmentExportState {
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
 * 环境统计信息 (用于仪表板)
 */
export interface EnvironmentStats {
  totalEnvironments: number;
  activeEnvironments: number;
  creatingEnvironments: number;
  errorEnvironments: number;
  totalTraders: number;
  totalStocks: number;
  totalCapital: number;
  averageCreationTime: number;
  successRate: number;
}

/**
 * 实时更新事件类型
 */
export interface EnvironmentUpdateEvent {
  type: 'status_change' | 'new_log' | 'trader_update' | 'environment_created' | 'environment_destroyed';
  environmentId: string;
  data: any;
  timestamp: Date;
}

/**
 * 错误状态类型
 */
export interface EnvironmentError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
  suggestedAction?: string;
}

/**
 * 环境操作结果
 */
export interface EnvironmentOperationResult {
  success: boolean;
  message: string;
  data?: any;
  error?: EnvironmentError;
}

/**
 * 前端配置选项
 */
export interface EnvironmentUIConfig {
  polling: {
    progressInterval: number;
    listRefreshInterval: number;
    logsRefreshInterval: number;
  };
  limits: {
    maxEnvironments: number;
    maxLogsPerPage: number;
    maxExportSize: number;
  };
  features: {
    enableRealTimeUpdates: boolean;
    enableAutoRefresh: boolean;
    enableExportFeature: boolean;
  };
}