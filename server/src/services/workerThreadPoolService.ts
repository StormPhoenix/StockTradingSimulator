/**
 * Worker 线程池服务
 * 
 * 提供统一的线程池管理和任务提交接口
 * 这是一个通用的线程池服务，不包含具体的业务逻辑
 */

import { EventEmitter } from 'events';
import { GenericWorkerThreadPool, createGenericWorkerThreadPool } from '../workers/genericWorkerThreadPool';
import { BaseTaskPayload, TaskCallback } from '../workers/types/worker/genericTask';
import {
  PoolEvents
} from '../workers/types/worker/poolConfig';

/**
 * Worker 线程池服务 (单例模式)
 */
export class WorkerThreadPoolService {
  private static instance: WorkerThreadPoolService | null = null;
  private pool: GenericWorkerThreadPool;
  private taskCallbacks: Map<string, TaskCallback> = new Map();

  private constructor() {
    // 创建通用线程池
    this.pool = createGenericWorkerThreadPool();

    // 设置事件转发（保持向后兼容）
    this.setupEventForwarding();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): WorkerThreadPoolService {
    if (!WorkerThreadPoolService.instance) {
      WorkerThreadPoolService.instance = new WorkerThreadPoolService();
    }
    return WorkerThreadPoolService.instance;
  }

  /**
   * 销毁单例实例（主要用于测试或应用关闭）
   */
  public static async destroyInstance(): Promise<void> {
    if (WorkerThreadPoolService.instance) {
      await WorkerThreadPoolService.instance.shutdown();
      WorkerThreadPoolService.instance = null;
    }
  }

  /**
   * 提交任务（使用回调接口）
   */
  public submitTask<TRequest extends BaseTaskPayload>(
    request: TRequest,
    callback: TaskCallback
  ): string {
    const taskId = this.pool.submitTask(request);

    // 存储回调对象
    this.taskCallbacks.set(taskId, callback);

    return taskId;
  }

  /**
   * 设置事件转发（保持向后兼容）
   */
  private setupEventForwarding(): void {
    // 转发线程池事件
    this.pool.bind(PoolEvents.TASK_SUBMITTED, (event: { taskId: string; taskType: string; }) => {
      // TODO 任务提交事件
    });

    this.pool.bind(PoolEvents.TASK_STARTED, (event: { workerId: string; taskId: string; taskType: string; }) => {
      // TODO 任务开始事件
    });

    this.pool.bind(PoolEvents.TASK_COMPLETED, (event: {
      workerId: string;
      taskId: string;
      taskType: string;
      result: any;
      businessResponse?: any;
    }) => {
      // 触发回调
      const callback = this.taskCallbacks.get(event.taskId);
      if (callback) {
        callback.onTaskCompleted(event.taskId, event.result);
        // 清理回调引用
        this.taskCallbacks.delete(event.taskId);
      }
    });

    this.pool.bind(PoolEvents.TASK_FAILED, (event: {
      workerId: string;
      taskId: string;
      taskType: string;
      error: any;
    }) => {
      // 触发回调
      const callback = this.taskCallbacks.get(event.taskId);
      if (callback) {
        callback.onTaskFailed(event.taskId, event.error);
        // 清理回调引用
        this.taskCallbacks.delete(event.taskId);
      }
    });

    this.pool.bind(PoolEvents.TASK_PROGRESS, (event: {
      workerId: string;
      taskId: string;
      taskType: string;
      progress: {
        stage: string;
        percentage: number;
        message: string;
        details?: any;
      };
    }) => {
      // 触发回调
      const callback = this.taskCallbacks.get(event.taskId);
      if (callback && callback.onTaskProgress) {
        callback.onTaskProgress(
          event.taskId,
          event.progress.stage,
          event.progress.percentage,
          event.progress.message,
          event.progress.details
        );
      }
    });
  }

  /**
   * 获取线程池状态
   */
  public getPoolStatus() {
    return this.pool.getPoolStatus();
  }

  /**
   * 关闭线程池
   */
  public async shutdown(): Promise<void> {
    // 清理所有回调引用
    this.taskCallbacks.clear();
    await this.pool.shutdown();
  }
}

/**
 * 获取 Worker 线程池服务单例实例
 * @deprecated 推荐直接使用 WorkerThreadPoolService.getInstance()
 */
export function createWorkerThreadPoolService(): WorkerThreadPoolService {
  return WorkerThreadPoolService.getInstance();
}

/**
 * 获取 Worker 线程池服务单例实例
 */
export function getWorkerThreadPoolService(): WorkerThreadPoolService {
  return WorkerThreadPoolService.getInstance();
}