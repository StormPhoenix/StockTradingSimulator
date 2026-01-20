/**
 * 环境创建进度跟踪类型定义
 * 
 * 用于前后端之间的进度状态通信
 */

/**
 * 创建进度阶段枚举
 */
export enum CreationStage {
  INITIALIZING = 'INITIALIZING',
  READING_TEMPLATES = 'READING_TEMPLATES', 
  CREATING_OBJECTS = 'CREATING_OBJECTS',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

/**
 * 环境创建进度接口
 */
export interface CreationProgress {
  /** 请求唯一标识符 */
  requestId: string;
  
  /** 当前创建阶段 */
  stage: CreationStage;
  
  /** 完成百分比 (0-100) */
  percentage: number;
  
  /** 当前阶段描述信息 */
  message: string;
  
  /** 详细进度信息 */
  details: {
    totalTraders: number;
    createdTraders: number;
    totalStocks: number;
    createdStocks: number;
  };
  
  /** 错误信息 (仅在ERROR阶段) */
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  
  /** 预估剩余时间 (秒) */
  estimatedTimeRemaining?: number;
  
  /** 开始时间 */
  startedAt: Date;
  
  /** 完成时间 (仅在COMPLETE或ERROR阶段) */
  completedAt?: Date;
}

/**
 * 进度里程碑定义
 */
export const PROGRESS_MILESTONES = {
  [CreationStage.INITIALIZING]: 0,
  [CreationStage.READING_TEMPLATES]: 30,
  [CreationStage.CREATING_OBJECTS]: 70,
  [CreationStage.COMPLETE]: 100,
  [CreationStage.ERROR]: -1
} as const;

/**
 * 进度更新事件类型
 */
export interface ProgressUpdateEvent {
  requestId: string;
  progress: CreationProgress;
  timestamp: Date;
}

/**
 * 进度跟踪器配置
 */
export interface ProgressTrackerConfig {
  /** 进度更新间隔 (毫秒) */
  updateIntervalMs: number;
  
  /** 最大跟踪时间 (毫秒) */
  maxTrackingTimeMs: number;
  
  /** 是否启用时间估算 */
  enableTimeEstimation: boolean;
}