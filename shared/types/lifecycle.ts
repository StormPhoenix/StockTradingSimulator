/**
 * GameObject 生命周期管理器 - 共享类型定义
 * 
 * 此文件定义了前后端共享的生命周期管理系统类型
 * 用于确保前后端类型一致性和编译时类型检查
 * 
 * 注意：此文件只包含前端需要的统计和监控数据类型
 * 不暴露服务端内部实现细节（如具体的GameObject状态等）
 */

import type { ApiResponse } from './common';

// 重新导出 ApiResponse 以便外部使用
export type { ApiResponse };

// ============================================================================
// 前端调试页面数据传输对象 (DTO)
// ============================================================================

/**
 * 游戏对象统计信息 DTO
 * 前端只需要知道统计数据，不需要具体的对象详情
 */
export interface GameObjectStatsResponse {
  /** 总对象数量 */
  total: number;
  
  /** 按状态分组的对象计数 */
  byState: {
    /** 准备状态对象数量 */
    ready: number;
    /** 活跃状态对象数量 */
    active: number;
    /** 暂停状态对象数量 */
    paused: number;
    /** 销毁中状态对象数量 */
    destroying: number;
    /** 已销毁状态对象数量 */
    destroyed: number;
  };
  
  /** 按类型分组的对象计数 */
  byType: Record<string, number>;
  
  /** 错误统计 */
  errorStats: {
    /** 有错误的对象数量 */
    objectsWithErrors: number;
    /** 总错误次数 */
    totalErrors: number;
  };
}

/**
 * 性能统计 DTO
 */
export interface PerformanceStats {
  /** 当前实际FPS */
  fps: number;
  
  /** 目标FPS */
  targetFPS: number;
  
  /** 当前对象总数 */
  objectCount: number;
  
  /** 上次Tick执行耗时 (毫秒) */
  tickDuration: number;
  
  /** 内存使用情况 */
  memoryUsage: MemoryUsage;
}

/**
 * 内存使用统计
 */
export interface MemoryUsage {
  /** 常驻内存大小 (字节) */
  rss: number;
  
  /** 堆内存总大小 (字节) */
  heapTotal: number;
  
  /** 已使用堆内存 (字节) */
  heapUsed: number;
  
  /** 外部内存使用 (字节) */
  external: number;
  
  /** ArrayBuffer 内存使用 (字节) */
  arrayBuffers: number;
}

/**
 * 游戏循环状态 DTO
 */
export interface LoopStatus {
  /** 循环是否正在运行 */
  isRunning: boolean;
  
  /** 当前设置的FPS */
  fps: number;
  
  /** 运行时长 (毫秒) */
  uptime: number;
  
  /** 总Tick执行次数 */
  totalTicks: number;
}

// ============================================================================
// 请求类型
// ============================================================================

/**
 * 启动游戏循环请求参数
 */
export interface StartLoopRequest {
  /** 目标帧率 (可选，默认30) */
  fps?: number;
}

// ============================================================================
// 错误代码枚举
// ============================================================================

/**
 * 错误代码枚举
 */
export enum ErrorCode {
  OBJECT_NOT_FOUND = 'OBJECT_NOT_FOUND',
  INVALID_STATE_TRANSITION = 'INVALID_STATE_TRANSITION',
  LOOP_ALREADY_RUNNING = 'LOOP_ALREADY_RUNNING',
  LOOP_NOT_RUNNING = 'LOOP_NOT_RUNNING',
  INVALID_FPS = 'INVALID_FPS',
  OBJECT_CREATION_FAILED = 'OBJECT_CREATION_FAILED',
  MAX_ERRORS_EXCEEDED = 'MAX_ERRORS_EXCEEDED'
}

// ============================================================================
// 常量定义
// ============================================================================

/**
 * 生命周期 API 端点路径常量
 */
export const LIFECYCLE_API_ENDPOINTS = {
  GAMEOBJECTS_STATS: '/gameobjects/stats',
  PERFORMANCE: '/performance',
  LOOP_STATUS: '/loop/status',
  LOOP_START: '/loop/start',
  LOOP_STOP: '/loop/stop'
} as const;