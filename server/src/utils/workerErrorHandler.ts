/**
 * Worker Thread 错误处理工具
 * 
 * 提供统一的错误处理、重试机制和错误恢复策略
 */

import { EventEmitter } from 'events';

/**
 * 错误类型枚举
 */
export enum WorkerErrorType {
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  MEMORY_ERROR = 'MEMORY_ERROR',
  WORKER_CRASH = 'WORKER_CRASH',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * 错误严重程度
 */
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * Worker 错误信息
 */
export interface WorkerError {
  type: WorkerErrorType;
  severity: ErrorSeverity;
  message: string;
  code: string;
  workerId?: string;
  requestId?: string;
  timestamp: Date;
  stack?: string;
  details?: any;
  retryable: boolean;
  retryCount: number;
  maxRetries: number;
}

/**
 * 重试策略配置
 */
export interface RetryConfig {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  jitterMs: number;
}

/**
 * 错误恢复策略
 */
export interface RecoveryStrategy {
  type: 'RETRY' | 'RESTART_WORKER' | 'FAILOVER' | 'ABORT';
  config?: any;
}

/**
 * Worker Thread 错误处理器
 */
export class WorkerErrorHandler extends EventEmitter {
  private errorHistory: Map<string, WorkerError[]> = new Map();
  private retryConfig: RetryConfig;
  private maxErrorHistorySize = 100;

  constructor(retryConfig?: Partial<RetryConfig>) {
    super();
    this.retryConfig = {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 30000,
      backoffMultiplier: 2,
      jitterMs: 100,
      ...retryConfig
    };
  }

  /**
   * 处理 Worker 错误
   */
  public handleError(
    error: Error | any,
    context: {
      workerId?: string;
      requestId?: string;
      operation?: string;
    }
  ): WorkerError {
    const workerError = this.createWorkerError(error, context);
    
    // 记录错误历史
    this.recordError(workerError);
    
    // 发出错误事件
    this.emit('error', workerError);
    
    // 根据错误类型和严重程度确定恢复策略
    const strategy = this.determineRecoveryStrategy(workerError);
    this.emit('recovery', { error: workerError, strategy });
    
    return workerError;
  }

  /**
   * 创建标准化的 Worker 错误对象
   */
  private createWorkerError(
    error: Error | any,
    context: {
      workerId?: string;
      requestId?: string;
      operation?: string;
    }
  ): WorkerError {
    const errorType = this.classifyError(error);
    const severity = this.determineSeverity(errorType, error);
    
    return {
      type: errorType,
      severity,
      message: error.message || 'Unknown error occurred',
      code: error.code || `${errorType}_${Date.now()}`,
      workerId: context.workerId,
      requestId: context.requestId,
      timestamp: new Date(),
      stack: error.stack,
      details: {
        operation: context.operation,
        originalError: error
      },
      retryable: this.isRetryable(errorType, error),
      retryCount: 0,
      maxRetries: this.retryConfig.maxAttempts
    };
  }

  /**
   * 错误分类
   */
  private classifyError(error: Error | any): WorkerErrorType {
    const message = error.message?.toLowerCase() || '';
    const code = error.code?.toLowerCase() || '';
    
    // 连接错误
    if (message.includes('connection') || code.includes('econnrefused') || code.includes('enotfound')) {
      return WorkerErrorType.CONNECTION_ERROR;
    }
    
    // 超时错误
    if (message.includes('timeout') || code.includes('timeout')) {
      return WorkerErrorType.TIMEOUT_ERROR;
    }
    
    // 数据库错误
    if (message.includes('database') || message.includes('mongodb') || message.includes('mongoose')) {
      return WorkerErrorType.DATABASE_ERROR;
    }
    
    // 验证错误
    if (message.includes('validation') || message.includes('invalid') || code.includes('validation')) {
      return WorkerErrorType.VALIDATION_ERROR;
    }
    
    // 内存错误
    if (message.includes('memory') || message.includes('heap') || code.includes('enomem')) {
      return WorkerErrorType.MEMORY_ERROR;
    }
    
    // Worker 崩溃
    if (message.includes('worker') && (message.includes('crash') || message.includes('exit'))) {
      return WorkerErrorType.WORKER_CRASH;
    }
    
    return WorkerErrorType.UNKNOWN_ERROR;
  }

  /**
   * 确定错误严重程度
   */
  private determineSeverity(errorType: WorkerErrorType, error: any): ErrorSeverity {
    switch (errorType) {
      case WorkerErrorType.WORKER_CRASH:
      case WorkerErrorType.MEMORY_ERROR:
        return ErrorSeverity.CRITICAL;
      
      case WorkerErrorType.DATABASE_ERROR:
      case WorkerErrorType.CONNECTION_ERROR:
        return ErrorSeverity.HIGH;
      
      case WorkerErrorType.TIMEOUT_ERROR:
        return ErrorSeverity.MEDIUM;
      
      case WorkerErrorType.VALIDATION_ERROR:
        return ErrorSeverity.LOW;
      
      default:
        return ErrorSeverity.MEDIUM;
    }
  }

  /**
   * 判断错误是否可重试
   */
  private isRetryable(errorType: WorkerErrorType, error: any): boolean {
    switch (errorType) {
      case WorkerErrorType.CONNECTION_ERROR:
      case WorkerErrorType.TIMEOUT_ERROR:
      case WorkerErrorType.DATABASE_ERROR:
        return true;
      
      case WorkerErrorType.VALIDATION_ERROR:
      case WorkerErrorType.MEMORY_ERROR:
        return false;
      
      case WorkerErrorType.WORKER_CRASH:
        return true; // 可以重启 Worker
      
      default:
        return false;
    }
  }

  /**
   * 确定恢复策略
   */
  private determineRecoveryStrategy(workerError: WorkerError): RecoveryStrategy {
    const { type, severity, retryCount, maxRetries } = workerError;
    
    // 如果已达到最大重试次数
    if (retryCount >= maxRetries) {
      return { type: 'ABORT' };
    }
    
    switch (type) {
      case WorkerErrorType.WORKER_CRASH:
        return { type: 'RESTART_WORKER' };
      
      case WorkerErrorType.CONNECTION_ERROR:
      case WorkerErrorType.TIMEOUT_ERROR:
      case WorkerErrorType.DATABASE_ERROR:
        return { type: 'RETRY' };
      
      case WorkerErrorType.MEMORY_ERROR:
        if (severity === ErrorSeverity.CRITICAL) {
          return { type: 'RESTART_WORKER' };
        }
        return { type: 'RETRY' };
      
      case WorkerErrorType.VALIDATION_ERROR:
        return { type: 'ABORT' };
      
      default:
        return { type: 'RETRY' };
    }
  }

  /**
   * 记录错误历史
   */
  private recordError(workerError: WorkerError): void {
    const key = workerError.workerId || 'global';
    
    if (!this.errorHistory.has(key)) {
      this.errorHistory.set(key, []);
    }
    
    const history = this.errorHistory.get(key)!;
    history.push(workerError);
    
    // 限制历史记录大小
    if (history.length > this.maxErrorHistorySize) {
      history.splice(0, history.length - this.maxErrorHistorySize);
    }
  }

  /**
   * 计算重试延迟时间
   */
  public calculateRetryDelay(retryCount: number): number {
    const { baseDelayMs, maxDelayMs, backoffMultiplier, jitterMs } = this.retryConfig;
    
    // 指数退避
    let delay = baseDelayMs * Math.pow(backoffMultiplier, retryCount);
    
    // 限制最大延迟
    delay = Math.min(delay, maxDelayMs);
    
    // 添加随机抖动
    const jitter = Math.random() * jitterMs;
    delay += jitter;
    
    return Math.floor(delay);
  }

  /**
   * 获取 Worker 错误统计
   */
  public getErrorStats(workerId?: string): {
    totalErrors: number;
    errorsByType: Record<WorkerErrorType, number>;
    errorsBySeverity: Record<ErrorSeverity, number>;
    recentErrors: WorkerError[];
  } {
    const key = workerId || 'global';
    const errors = workerId 
      ? this.errorHistory.get(key) || []
      : Array.from(this.errorHistory.values()).flat();
    
    const errorsByType = {} as Record<WorkerErrorType, number>;
    const errorsBySeverity = {} as Record<ErrorSeverity, number>;
    
    // 初始化计数器
    Object.values(WorkerErrorType).forEach(type => {
      errorsByType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      errorsBySeverity[severity] = 0;
    });
    
    // 统计错误
    errors.forEach(error => {
      errorsByType[error.type]++;
      errorsBySeverity[error.severity]++;
    });
    
    // 获取最近的错误 (最多10个)
    const recentErrors = errors
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    return {
      totalErrors: errors.length,
      errorsByType,
      errorsBySeverity,
      recentErrors
    };
  }

  /**
   * 清理错误历史
   */
  public clearErrorHistory(workerId?: string): void {
    if (workerId) {
      this.errorHistory.delete(workerId);
    } else {
      this.errorHistory.clear();
    }
  }

  /**
   * 检查 Worker 健康状态
   */
  public checkWorkerHealth(workerId: string): {
    isHealthy: boolean;
    errorRate: number;
    recentErrorCount: number;
    recommendations: string[];
  } {
    const errors = this.errorHistory.get(workerId) || [];
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    // 计算最近一小时的错误
    const recentErrors = errors.filter(error => error.timestamp >= oneHourAgo);
    const recentErrorCount = recentErrors.length;
    
    // 计算错误率 (错误数/小时)
    const errorRate = recentErrorCount;
    
    // 健康状态判断
    const isHealthy = errorRate < 5 && !recentErrors.some(e => e.severity === ErrorSeverity.CRITICAL);
    
    // 生成建议
    const recommendations: string[] = [];
    if (errorRate > 10) {
      recommendations.push('Consider restarting the worker due to high error rate');
    }
    if (recentErrors.some(e => e.type === WorkerErrorType.MEMORY_ERROR)) {
      recommendations.push('Monitor memory usage and consider increasing memory limits');
    }
    if (recentErrors.some(e => e.type === WorkerErrorType.CONNECTION_ERROR)) {
      recommendations.push('Check database connectivity and network stability');
    }
    
    return {
      isHealthy,
      errorRate,
      recentErrorCount,
      recommendations
    };
  }
}

/**
 * 创建默认的错误处理器实例
 */
export function createWorkerErrorHandler(config?: Partial<RetryConfig>): WorkerErrorHandler {
  return new WorkerErrorHandler(config);
}