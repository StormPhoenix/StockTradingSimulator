/**
 * 通用 Worker 线程包装器
 * 
 * 封装 Worker Thread 的生命周期管理和消息处理
 */

import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import {
  GenericTaskRequest,
  GenericTaskResponse,
  GenericTaskProgress,
  GenericWorkerMessage,
} from '../../workers/types/worker/genericTask';
import {
  WorkerThreadStatus,
  PoolConfig,
  WorkerThreadInfo,
  PoolEvents
} from '../../workers/types/worker/poolConfig';

/**
 * 通用 Worker 线程包装器
 */
export class GenericWorkerWrapper extends EventEmitter {
  public readonly id: string;
  public status: WorkerThreadStatus = WorkerThreadStatus.IDLE;
  public currentTaskId?: string;
  public readonly startedAt: Date = new Date();
  public lastActiveAt: Date = new Date();
  public processedTasks: number = 0;
  public errorCount: number = 0;

  private worker: Worker;
  private timeoutHandle?: NodeJS.Timeout;

  constructor(
    id: string,
    workerScript: string,
    private config: PoolConfig
  ) {
    super();
    this.id = id;
    
    // 根据环境创建不同的 Worker
    if (process.env.NODE_ENV === 'production') {
      // 生产环境直接使用编译后的 JS 文件
      this.worker = new Worker(workerScript);
    } else {
      // 开发环境使用 ts-node/register 来支持 TypeScript
      this.worker = new Worker(workerScript, {
        execArgv: ['--require', 'ts-node/register']
      });
    }
    
    this.setupWorkerListeners();
  }

  /**
   * 设置 Worker 事件监听器
   */
  private setupWorkerListeners(): void {
    this.worker.on('message', (message: GenericWorkerMessage) => {
      this.lastActiveAt = new Date();
      
      // 检查消息类型
      if ('type' in message && message.type === 'READY') {
        // Worker 就绪消息
        console.log(`Worker ${this.id} is ready`);
        return;
      }
      
      // 根据消息属性判断类型
      if ('status' in message) {
        // 任务响应消息
        this.handleTaskResponse(message as GenericTaskResponse);
      } else if ('stage' in message) {
        // 进度消息
        this.handleProgress(message as GenericTaskProgress);
      }
    });

    this.worker.on('error', (error: Error) => {
      this.errorCount++;
      this.status = WorkerThreadStatus.ERROR;
      this.emit(PoolEvents.WORKER_ERROR, {
        workerId: this.id,
        taskId: this.currentTaskId,
        error: {
          code: 'WORKER_ERROR',
          message: error.message,
          stack: error.stack
        }
      });
    });

    this.worker.on('exit', (code: number) => {
      this.status = WorkerThreadStatus.TERMINATED;
      this.emit(PoolEvents.WORKER_TERMINATED, {
        workerId: this.id,
        exitCode: code
      });
    });
  }

  /**
   * 处理任务响应
   */
  private handleTaskResponse(message: GenericTaskResponse): void {
    this.clearTimeout();
    this.status = WorkerThreadStatus.IDLE;
    this.processedTasks++;
    const taskId = this.currentTaskId;
    this.currentTaskId = undefined;
    
    if (message.status === 'SUCCESS') {
      this.emit(PoolEvents.TASK_COMPLETED, {
        workerId: this.id,
        taskId: message.taskId,
        taskType: message.taskType,
        result: message.result
      });
    } else {
      this.errorCount++;
      this.emit(PoolEvents.TASK_FAILED, {
        workerId: this.id,
        taskId: message.taskId,
        taskType: message.taskType,
        error: message.error
      });
    }
  }

  /**
   * 处理进度更新
   */
  private handleProgress(message: GenericTaskProgress): void {
    this.emit(PoolEvents.TASK_PROGRESS, {
      workerId: this.id,
      taskId: message.taskId,
      taskType: message.taskType,
      progress: {
        stage: message.stage,
        percentage: message.percentage,
        message: message.message,
        details: message.details
      }
    });
  }

  /**
   * 执行任务
   */
  public async executeTask(request: GenericTaskRequest): Promise<void> {
    if (this.status !== WorkerThreadStatus.IDLE) {
      throw new Error(`Worker ${this.id} is not idle (status: ${this.status})`);
    }

    this.status = WorkerThreadStatus.BUSY;
    this.currentTaskId = request.taskId;
    this.lastActiveAt = new Date();

    // 设置超时
    this.timeoutHandle = setTimeout(() => {
      this.handleTimeout();
    }, this.config.timeoutMs);

    // 发送任务到 Worker Thread
    this.worker.postMessage(request);
    
    // 发出任务开始事件
    this.emit(PoolEvents.TASK_STARTED, {
      workerId: this.id,
      taskId: request.taskId,
      taskType: request.payload.type
    });
  }

  /**
   * 处理任务超时
   */
  private handleTimeout(): void {
    this.errorCount++;
    this.status = WorkerThreadStatus.ERROR;
    
    const taskId = this.currentTaskId;
    this.currentTaskId = undefined;
    
    this.emit(PoolEvents.WORKER_TIMEOUT, {
      workerId: this.id,
      taskId
    });
  }

  /**
   * 清除超时定时器
   */
  private clearTimeout(): void {
    if (this.timeoutHandle) {
      clearTimeout(this.timeoutHandle);
      this.timeoutHandle = undefined;
    }
  }

  /**
   * 获取 Worker 信息
   */
  public getInfo(): WorkerThreadInfo {
    return {
      id: this.id,
      status: this.status,
      currentTaskId: this.currentTaskId,
      startedAt: this.startedAt,
      lastActiveAt: this.lastActiveAt,
      processedTasks: this.processedTasks,
      errorCount: this.errorCount
    };
  }

  /**
   * 终止 Worker
   */
  public async terminate(): Promise<void> {
    this.clearTimeout();
    this.status = WorkerThreadStatus.TERMINATED;
    await this.worker.terminate();
  }
}