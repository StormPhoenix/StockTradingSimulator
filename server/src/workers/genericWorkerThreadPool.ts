/**
 * 通用 Worker 线程池
 * 
 * 提供与业务逻辑解耦的通用任务处理能力
 */

import { join } from 'path';
import { GenericWorkerWrapper } from './genericWorkerWrapper';
import {
  GenericTaskRequest,
  BaseTaskPayload,
  TaskError
} from './types/worker/genericTask';
import {
  PoolConfig,
  WorkerThreadStatus,
  PoolStatus,
  PoolEvents,
  WorkerEvent
} from './types/worker/poolConfig';
import { TypedEventEmitter } from '../types/typedEventEmitter';

/**
 * 线程池事件数据接口
 */
export interface GenericWorkerThreadPoolEventData extends Record<PoolEvents, any[]> {
  [PoolEvents.TASK_SUBMITTED]: [
    data: {
      taskId: string;
      taskType: string;
    }
  ];

  [PoolEvents.TASK_STARTED]: [
    data: {
      workerId: string;
      taskId: string;
      taskType: string;
    }
  ];

  [PoolEvents.TASK_COMPLETED]: [
    data: {
      workerId: string;
      taskId: string;
      taskType: string;
      result: any;
      businessResponse?: any;
    }
  ];

  [PoolEvents.TASK_FAILED]: [
    data: {
      workerId: string;
      taskId: string;
      taskType: string;
      error: TaskError;
    }
  ];

  [PoolEvents.TASK_PROGRESS]: [
    data: {
      workerId: string;
      taskId: string;
      taskType: string;
      progress: {
        stage: string;
        percentage: number;
        message: string;
        details?: any;
      };
    }
  ];

  [PoolEvents.WORKER_CREATED]: [
    data: {
      workerId: string;
    }
  ];

  [PoolEvents.WORKER_TERMINATED]: [
    data: {
      workerId: string;
      exitCode?: number;
    }
  ];

  [PoolEvents.WORKER_ERROR]: [
    data: {
      workerId: string;
      taskId?: string;
      error: TaskError;
    }
  ];

  [PoolEvents.WORKER_TIMEOUT]: [
    data: {
      workerId: string;
      taskId?: string;
    }
  ];
}

/**
 * 通用 Worker 线程池
 */
export class GenericWorkerThreadPool extends TypedEventEmitter<GenericWorkerThreadPoolEventData> {
  private workers: Map<string, GenericWorkerWrapper> = new Map();
  private taskQueue: GenericTaskRequest[] = [];
  private activeTasks: Map<string, string> = new Map(); // taskId -> workerId
  private config: PoolConfig;
  private workerScript: string;

  constructor(config: PoolConfig) {
    super();
    this.config = config;

    // 根据环境选择正确的 worker 文件路径
    if (process.env.NODE_ENV === 'production') {
      this.workerScript = join(__dirname, './genericWorkerExecution.js');
    } else {
      // 开发环境使用 ts-node 运行 TypeScript 文件
      this.workerScript = join(__dirname, './genericWorkerExecution.ts');
    }

    this.initializePool();
  }

  /**
   * 提交任务（使用适配器）
   */
  public submitTask<TRequest extends BaseTaskPayload>(
    businessRequest: TRequest
  ): string {
    // 内置 adaptRequest 逻辑：生成任务ID和时间戳，包装业务请求
    const genericRequest: GenericTaskRequest<TRequest> = {
      taskId: this.generateTaskId(),
      timestamp: new Date(),
      payload: businessRequest,
    };

    return this.submitGenericTask(genericRequest);
  }

  /**
   * 提交通用任务
   */
  public submitGenericTask(request: GenericTaskRequest): string {
    // 生成任务ID（如果没有提供）
    if (!request.taskId) {
      request.taskId = this.generateTaskId();
    }

    this.taskQueue.push(request);

    // 发出任务提交事件
    this.broadcast(PoolEvents.TASK_SUBMITTED, {
      taskId: request.taskId,
      taskType: request.payload.type
    });

    this.processQueue();
    return request.taskId;
  }

  /**
   * 初始化 Worker 池
   */
  private initializePool(): void {
    for (let i = 0; i < this.config.poolSize; i++) {
      this.createWorker(`worker-${i}`);
    }
  }

  /**
   * 创建新的 Worker
   */
  private createWorker(id: string): void {
    const worker = new GenericWorkerWrapper(id, this.workerScript, this.config);

    // 设置事件监听器
    worker.bind(WorkerEvent.TASK_COMPLETED, (workerId: string, taskId: string, taskType: string, result: any) => {
      this.handleTaskCompleted({ workerId, taskId, taskType, result });
    });

    worker.bind(WorkerEvent.TASK_FAILED, (workerId: string, taskId: string, taskType: string, error: TaskError) => {
      this.handleTaskFailed({ workerId, taskId, taskType, error });
    });

    worker.bind(WorkerEvent.TASK_PROGRESS, (workerId: string, taskId: string, taskType: string, progress: {
      stage: string;
      percentage: number;
      message: string;
      details?: any;
    }) => {
      this.handleTaskProgress({ workerId, taskId, taskType, progress });
    });

    worker.bind(WorkerEvent.TASK_STARTED, (workerId: string, taskId: string, taskType: string) => {
      this.broadcast(PoolEvents.TASK_STARTED, { workerId, taskId, taskType });
    });

    worker.bind(WorkerEvent.WORKER_TIMEOUT, (workerId: string, taskId?: string) => {
      this.handleWorkerTimeout({ workerId, taskId });
    });

    worker.bind(WorkerEvent.WORKER_ERROR, (workerId: string, taskId: string, error: TaskError) => {
      this.handleWorkerError({ workerId, taskId, error });
    });

    this.workers.set(id, worker);

    this.broadcast(PoolEvents.WORKER_CREATED, {
      workerId: id
    });
  }

  /**
   * 处理任务完成
   */
  private handleTaskCompleted(event: any): void {
    this.activeTasks.delete(event.taskId);

    try {
      const businessResponse = event.result;
      this.broadcast(PoolEvents.TASK_COMPLETED, {
        ...event,
        businessResponse
      });
    } catch (error) {
      console.error('Error adapting response:', error);
      this.broadcast(PoolEvents.TASK_COMPLETED, event);
    }

    this.processQueue();
  }

  /**
   * 处理任务失败
   */
  private handleTaskFailed(event: any): void {
    this.activeTasks.delete(event.taskId);

    this.broadcast(PoolEvents.TASK_FAILED, event);
    this.processQueue();
  }

  /**
   * 处理任务进度
   */
  private handleTaskProgress(event: any): void {

    this.broadcast(PoolEvents.TASK_PROGRESS, event);
  }

  /**
   * 处理 Worker 超时
   */
  private handleWorkerTimeout(event: any): void {
    if (event.taskId) {
      this.activeTasks.delete(event.taskId);
    }

    this.broadcast(PoolEvents.WORKER_TIMEOUT, event);

    // 重启超时的 Worker
    this.restartWorker(event.workerId);
    this.processQueue();
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(event: any): void {
    if (event.taskId) {
      this.activeTasks.delete(event.taskId);
    }

    this.broadcast(PoolEvents.WORKER_ERROR, event);

    // 重启错误的 Worker
    this.restartWorker(event.workerId);
    this.processQueue();
  }

  /**
   * 重启 Worker
   */
  private async restartWorker(workerId: string): Promise<void> {
    const worker = this.workers.get(workerId);
    if (worker) {
      await worker.terminate();
      this.workers.delete(workerId);
    }

    // 创建新的 Worker
    this.createWorker(workerId);
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    if (this.taskQueue.length === 0) {
      return;
    }

    // 检查并发限制
    if (this.activeTasks.size >= this.config.maxConcurrent) {
      return;
    }

    // 找到空闲的 Worker
    const idleWorker = Array.from(this.workers.values())
      .find(worker => worker.status === WorkerThreadStatus.IDLE);

    if (!idleWorker) {
      return;
    }

    // 分配任务
    const request = this.taskQueue.shift()!;
    this.activeTasks.set(request.taskId, idleWorker.id);

    idleWorker.executeTask(request).catch((error: Error) => {
      this.broadcast(PoolEvents.WORKER_ERROR, {
        workerId: idleWorker.id,
        taskId: request.taskId,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          stack: error.stack
        }
      });
    });

    // 继续处理队列
    setImmediate(() => this.processQueue());
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 获取池状态信息
   */
  public getPoolStatus(): PoolStatus {
    const workers = Array.from(this.workers.values());

    return {
      totalWorkers: workers.length,
      idleWorkers: workers.filter(w => w.status === WorkerThreadStatus.IDLE).length,
      busyWorkers: workers.filter(w => w.status === WorkerThreadStatus.BUSY).length,
      errorWorkers: workers.filter(w => w.status === WorkerThreadStatus.ERROR).length,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      workers: workers.map(w => w.getInfo())
    };
  }

  /**
   * 关闭 Worker 池
   */
  public async shutdown(): Promise<void> {
    // 清空队列
    this.taskQueue = [];

    // 终止所有 Worker
    const terminatePromises = Array.from(this.workers.values())
      .map(worker => worker.terminate());

    await Promise.all(terminatePromises);
    this.workers.clear();
    this.activeTasks.clear();
  }
}

/**
 * 创建通用 Worker 线程池实例
 */
export function createGenericWorkerThreadPool(): GenericWorkerThreadPool {
  const config: PoolConfig = {
    poolSize: parseInt(process.env.WORKER_THREAD_POOL_SIZE || '4'),
    maxConcurrent: parseInt(process.env.WORKER_THREAD_MAX_CONCURRENT || '2'),
    timeoutMs: parseInt(process.env.WORKER_THREAD_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.WORKER_THREAD_RETRY_ATTEMPTS || '3'),
    idleTimeoutMs: parseInt(process.env.WORKER_THREAD_IDLE_TIMEOUT || '300000')
  };

  return new GenericWorkerThreadPool(config);
}