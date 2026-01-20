/**
 * Worker Thread 通信消息类型定义
 * 
 * 提供主线程与Worker Thread之间的类型安全消息传递接口
 */

/**
 * 基础Worker消息接口
 */
export interface WorkerMessage {
  type: 'TEMPLATE_REQUEST' | 'TEMPLATE_DATA' | 'ERROR' | 'PROGRESS';
  requestId: string;
  timestamp: Date;
}

/**
 * 模板请求消息 (主线程 → Worker Thread)
 */
export interface TemplateRequestMessage extends WorkerMessage {
  type: 'TEMPLATE_REQUEST';
  payload: {
    templateId: string;
    userId: string;
  };
}

/**
 * 模板数据响应消息 (Worker Thread → 主线程)
 */
export interface TemplateDataMessage extends WorkerMessage {
  type: 'TEMPLATE_DATA';
  payload: {
    exchange: ExchangeTemplate;
    traders: TraderTemplate[];
    stocks: StockTemplate[];
  };
}

/**
 * 进度报告消息 (Worker Thread → 主线程)
 */
export interface WorkerProgressMessage extends WorkerMessage {
  type: 'PROGRESS';
  payload: {
    stage: 'DATABASE_READING' | 'DATA_PROCESSING' | 'COMPLETE';
    percentage: number;
    message: string;
    details?: {
      totalTraders: number;
      processedTraders: number;
      totalStocks: number;
      processedStocks: number;
    };
  };
}

/**
 * 错误消息 (Worker Thread → 主线程)
 */
export interface WorkerErrorMessage extends WorkerMessage {
  type: 'ERROR';
  payload: {
    code: string;
    message: string;
    stack?: string;
    details?: any;
  };
}

/**
 * Worker Thread 配置接口
 */
export interface WorkerThreadConfig {
  poolSize: number;
  maxConcurrent: number;
  timeoutMs: number;
  retryAttempts: number;
  idleTimeoutMs: number;
}

/**
 * 模板数据类型 (从数据库读取)
 */
export interface ExchangeTemplate {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TraderTemplate {
  _id: string;
  name: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  initialCapital: number;
  createdAt: Date;
}

export interface StockTemplate {
  _id: string;
  symbol: string;
  companyName: string;
  category: string;
  issuePrice: number;
  totalShares: number;
  createdAt: Date;
}

/**
 * Worker Thread 状态枚举
 */
export enum WorkerThreadStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  TERMINATED = 'TERMINATED'
}

/**
 * Worker Thread 实例信息
 */
export interface WorkerThreadInfo {
  id: string;
  status: WorkerThreadStatus;
  currentRequestId?: string;
  startedAt: Date;
  lastActiveAt: Date;
  processedRequests: number;
  errorCount: number;
}