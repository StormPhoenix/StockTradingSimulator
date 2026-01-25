/**
 * Worker 线程池服务
 * 
 * 提供统一的线程池管理和任务提交接口
 * 这是一个通用的线程池服务，不包含具体的业务逻辑
 */

import { EventEmitter } from 'events';
import { GenericWorkerThreadPool, createGenericWorkerThreadPool } from '../workers/genericWorkerThreadPool';
import { BaseTaskPayload } from '../workers/types/worker/genericTask';
import {
  PoolEvents
} from '../workers/types/worker/poolConfig';

/**
 * Worker 线程池服务 (单例模式)
 */
export class WorkerThreadPoolService extends EventEmitter {
  private static instance: WorkerThreadPoolService | null = null;
  private pool: GenericWorkerThreadPool;

  private constructor() {
    super();
    
    // 创建通用线程池
    this.pool = createGenericWorkerThreadPool();
    
    // 设置事件转发
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
   * 提交任务
   */
  public submitTask<TRequest extends BaseTaskPayload>(
    request: TRequest
  ): string {
    return this.pool.submitTask(request);
  }

  /**
   * 设置事件转发
   */
  private setupEventForwarding(): void {
    // 转发线程池事件
    this.pool.on(PoolEvents.TASK_SUBMITTED, (event) => {
      this.emit('taskSubmitted', event);
    });

    this.pool.on(PoolEvents.TASK_STARTED, (event) => {
      this.emit('taskStarted', event);
    });

    this.pool.on(PoolEvents.TASK_COMPLETED, (event) => {
      this.emit('taskCompleted', event);
    });

    this.pool.on(PoolEvents.TASK_FAILED, (event) => {
      this.emit('taskFailed', event);
    });

    this.pool.on(PoolEvents.TASK_PROGRESS, (event) => {
      this.emit('taskProgress', event);
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