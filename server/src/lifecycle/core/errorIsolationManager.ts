import { GameObject, GameObjectState, LifecycleError, ErrorCode } from '../types';

/**
 * 错误隔离管理器
 * 
 * 处理游戏对象运行时错误，防止单个对象的错误影响整个系统
 * 实现错误计数和自动销毁机制
 */
export class ErrorIsolationManager {
  private errorCounts = new Map<number, number>();
  private errorHistory = new Map<number, Array<{
    timestamp: Date;
    error: string;
    phase: string;
    stack?: string;
  }>>();
  private maxErrors: number;

  /**
   * 构造函数
   * 
   * @param maxErrors 每个对象的最大错误次数，默认为3
   */
  constructor(maxErrors: number = 3) {
    this.maxErrors = maxErrors;
  }

  /**
   * 处理对象错误
   * 记录错误信息，增加错误计数，并在超过阈值时标记对象为销毁状态
   * 
   * @param obj 发生错误的游戏对象
   * @param error 错误对象
   * @param phase 错误发生的阶段（onBeginPlay, onTick, onDestroy）
   * @returns 是否应该销毁对象
   */
  handleObjectError(obj: GameObject, error: Error, phase: string): boolean {
    const objectId = obj.id;
    
    // 增加错误计数
    const currentCount = this.errorCounts.get(objectId) || 0;
    const newCount = currentCount + 1;
    this.errorCounts.set(objectId, newCount);

    // 记录错误历史
    this.recordErrorHistory(objectId, error, phase);

    // 记录错误日志
    console.error(
      `GameObject ${objectId} (${obj.constructor.name}) error in ${phase}:`,
      error.message,
      `(${newCount}/${this.maxErrors})`
    );

    // 如果错误次数超过阈值，标记对象为销毁状态
    if (newCount >= this.maxErrors) {
      console.warn(
        `GameObject ${objectId} exceeded maximum error count (${this.maxErrors}), marking for destruction`
      );
      
      // 只有在对象不是已经在销毁过程中时才转换状态
      if (obj.state !== GameObjectState.DESTROYING && obj.state !== GameObjectState.DESTROYED) {
        obj.state = GameObjectState.DESTROYING;
      }
      
      return true; // 应该销毁对象
    }

    return false; // 不需要销毁对象
  }

  /**
   * 记录错误历史
   * 
   * @param objectId 对象ID
   * @param error 错误对象
   * @param phase 错误阶段
   */
  private recordErrorHistory(objectId: number, error: Error, phase: string): void {
    if (!this.errorHistory.has(objectId)) {
      this.errorHistory.set(objectId, []);
    }

    const history = this.errorHistory.get(objectId)!;
    history.push({
      timestamp: new Date(),
      error: error.message,
      phase,
      stack: error.stack
    });

    // 限制历史记录数量，避免内存泄漏
    const maxHistorySize = 10;
    if (history.length > maxHistorySize) {
      history.splice(0, history.length - maxHistorySize);
    }
  }

  /**
   * 获取对象的错误计数
   * 
   * @param objectId 对象ID
   * @returns 错误计数
   */
  getErrorCount(objectId: number): number {
    return this.errorCounts.get(objectId) || 0;
  }

  /**
   * 获取对象的错误历史
   * 
   * @param objectId 对象ID
   * @returns 错误历史数组
   */
  getErrorHistory(objectId: number): Array<{
    timestamp: Date;
    error: string;
    phase: string;
    stack?: string;
  }> {
    return this.errorHistory.get(objectId) || [];
  }

  /**
   * 清除对象的错误记录
   * 通常在对象被销毁时调用
   * 
   * @param objectId 对象ID
   */
  clearErrorCount(objectId: number): void {
    this.errorCounts.delete(objectId);
    this.errorHistory.delete(objectId);
  }

  /**
   * 重置对象的错误计数（保留历史记录）
   * 
   * @param objectId 对象ID
   */
  resetErrorCount(objectId: number): void {
    this.errorCounts.set(objectId, 0);
  }

  /**
   * 获取所有对象的错误统计
   * 
   * @returns 错误统计信息
   */
  getErrorStatistics(): {
    totalObjects: number;
    objectsWithErrors: number;
    totalErrors: number;
    objectsNearLimit: number;
    errorsByPhase: Record<string, number>;
  } {
    const totalObjects = this.errorCounts.size;
    let objectsWithErrors = 0;
    let totalErrors = 0;
    let objectsNearLimit = 0;
    const errorsByPhase: Record<string, number> = {};

    // 统计错误计数
    for (const count of this.errorCounts.values()) {
      if (count > 0) {
        objectsWithErrors++;
        totalErrors += count;
        
        if (count >= this.maxErrors - 1) {
          objectsNearLimit++;
        }
      }
    }

    // 统计各阶段错误
    for (const history of this.errorHistory.values()) {
      for (const record of history) {
        errorsByPhase[record.phase] = (errorsByPhase[record.phase] || 0) + 1;
      }
    }

    return {
      totalObjects,
      objectsWithErrors,
      totalErrors,
      objectsNearLimit,
      errorsByPhase
    };
  }

  /**
   * 获取错误频繁的对象列表
   * 
   * @param threshold 错误阈值，默认为最大错误数的一半
   * @returns 错误频繁的对象ID列表
   */
  getProblematicObjects(threshold?: number): Array<{
    objectId: number;
    errorCount: number;
    lastError?: {
      timestamp: Date;
      error: string;
      phase: string;
    };
  }> {
    const errorThreshold = threshold || Math.ceil(this.maxErrors / 2);
    const result: Array<{
      objectId: number;
      errorCount: number;
      lastError?: {
        timestamp: Date;
        error: string;
        phase: string;
      };
    }> = [];

    for (const [objectId, count] of this.errorCounts.entries()) {
      if (count >= errorThreshold) {
        const history = this.errorHistory.get(objectId);
        const lastError = history && history.length > 0 ? 
          history[history.length - 1] : undefined;

        result.push({
          objectId,
          errorCount: count,
          lastError: lastError ? {
            timestamp: lastError.timestamp,
            error: lastError.error,
            phase: lastError.phase
          } : undefined
        });
      }
    }

    // 按错误计数降序排序
    result.sort((a, b) => b.errorCount - a.errorCount);
    return result;
  }

  /**
   * 设置最大错误次数
   * 
   * @param maxErrors 新的最大错误次数
   */
  setMaxErrors(maxErrors: number): void {
    if (maxErrors <= 0) {
      throw new LifecycleError(
        'Max errors must be a positive integer',
        ErrorCode.INVALID_FPS
      );
    }
    this.maxErrors = maxErrors;
  }

  /**
   * 获取最大错误次数
   * 
   * @returns 最大错误次数
   */
  getMaxErrors(): number {
    return this.maxErrors;
  }

  /**
   * 清理所有错误记录
   * 主要用于系统重置
   */
  clear(): void {
    this.errorCounts.clear();
    this.errorHistory.clear();
  }

  /**
   * 执行安全的对象方法调用
   * 自动处理异常并记录错误
   * 
   * @param obj 游戏对象
   * @param methodName 方法名称
   * @param method 要执行的方法
   * @param args 方法参数
   * @returns 是否执行成功
   */
  safeExecute<T extends any[]>(
    obj: GameObject,
    methodName: string,
    method: (...args: T) => void,
    ...args: T
  ): boolean {
    try {
      method.apply(obj, args);
      return true;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this.handleObjectError(obj, err, methodName);
      return false;
    }
  }

  /**
   * 批量清理已销毁对象的错误记录
   * 
   * @param destroyedObjectIds 已销毁的对象ID列表
   * @returns 清理的记录数量
   */
  cleanupDestroyedObjects(destroyedObjectIds: number[]): number {
    let cleanedCount = 0;
    
    for (const objectId of destroyedObjectIds) {
      if (this.errorCounts.has(objectId) || this.errorHistory.has(objectId)) {
        this.clearErrorCount(objectId);
        cleanedCount++;
      }
    }
    
    return cleanedCount;
  }
}