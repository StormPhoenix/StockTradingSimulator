/**
 * 通用 Worker 线程包装器
 * 
 * 封装 Worker Thread 的生命周期管理和消息处理
 */

import { Worker } from 'worker_threads';
import {
  GenericTaskRequest,
  GenericTaskResponse,
  GenericTaskProgress,
  GenericWorkerMessage,
  WorkerMessageType,
  TaskError,
} from './types/worker/genericTask';
import {
  WorkerThreadStatus,
  PoolConfig,
  WorkerThreadInfo,
  WorkerEvent
} from './types/worker/poolConfig';
import { TypedEventEmitter } from '../types/typedEventEmitter';

/**
 * Worker Wrapper 事件数据接口
 */
export interface WorkerWrapperEventData extends Record<WorkerEvent, any[]> {
  [WorkerEvent.TASK_STARTED]: [
    workerId: string,
    taskId: string,
    taskType: string];

  [WorkerEvent.TASK_COMPLETED]: [
    response: GenericTaskResponse];

  [WorkerEvent.TASK_FAILED]: [
    workerId: string,
    taskId: string,
    taskType: string,
    error: TaskError];

  [WorkerEvent.TASK_PROGRESS]: [
    progress: GenericTaskProgress];

  [WorkerEvent.WORKER_ERROR]: [
    workerId: string,
    taskId: string,
    error: TaskError]

  [WorkerEvent.WORKER_TIMEOUT]: [
    workerId: string,
    taskId?: string];

  [WorkerEvent.WORKER_TERMINATED]: [
    workerId: string,
    exitCode: number]
}

/**
 * 通用 Worker 线程包装器
 */
export class GenericWorkerWrapper extends TypedEventEmitter<WorkerWrapperEventData> {
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

      // 根据 messageType 字段判断消息类型
      switch (message.messageType) {
        case WorkerMessageType.TASK_RESPONSE:
          this.handleTaskResponse(message as GenericTaskResponse);
          break;
        case WorkerMessageType.TASK_PROGRESS:
          this.handleProgress(message as GenericTaskProgress);
          break;
        default:
          console.warn(`Unknown message type: ${(message as any).messageType}`);
      }
    });

    this.worker.on('error', (error: Error) => {
      this.errorCount++;
      this.status = WorkerThreadStatus.ERROR;
      this.broadcast(WorkerEvent.WORKER_ERROR,
        this.id,
        this.currentTaskId || '',
        {
          code: 'WORKER_ERROR',
          message: error.message,
          stack: error.stack
        }
      );
    });

    this.worker.on('exit', (code: number) => {
      this.status = WorkerThreadStatus.TERMINATED;
      this.broadcast(WorkerEvent.WORKER_TERMINATED,
        this.id,
        code
      );
    });
  }

  /**
   * 处理任务响应
   */
  private handleTaskResponse(message: GenericTaskResponse): void {
    this.clearTimeout();
    this.status = WorkerThreadStatus.IDLE;
    this.processedTasks++;
    this.currentTaskId = undefined;

    if (message.status === 'SUCCESS') {
      this.broadcast(WorkerEvent.TASK_COMPLETED, message);
    } else {
      this.errorCount++;
      this.broadcast(WorkerEvent.TASK_FAILED,
        this.id,
        message.taskId,
        message.result?.type || 'UNKNOWN',
        message.error || {
          code: 'UNKNOWN_ERROR',
          message: 'Task failed without error details'
        }
      );
    }
  }

  /**
   * 处理进度更新
   */
  private handleProgress(message: GenericTaskProgress): void {
    this.broadcast(WorkerEvent.TASK_PROGRESS, message);
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
    this.broadcast(WorkerEvent.TASK_STARTED,
      this.id,
      request.taskId,
      request.payload.type
    );
  }

  /**
   * 处理任务超时
   */
  private handleTimeout(): void {
    this.errorCount++;
    this.status = WorkerThreadStatus.ERROR;

    const taskId = this.currentTaskId;
    this.currentTaskId = undefined;

    this.broadcast(WorkerEvent.WORKER_TIMEOUT,
      this.id,
      taskId
    );
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