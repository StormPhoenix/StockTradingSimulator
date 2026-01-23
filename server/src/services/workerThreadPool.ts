/**
 * Worker Thread 池管理服务
 * 
 * 管理 Worker Thread 的创建、分配、监控和清理
 */

import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import { join } from 'path';
import {
  WorkerMessage,
  TemplateRequestMessage,
  TemplateDataMessage,
  WorkerProgressMessage,
  WorkerErrorMessage,
  WorkerThreadConfig,
  WorkerThreadStatus,
  WorkerThreadInfo
} from '../types/workerMessages';
import { EnvironmentManagerEvents, WorkerPoolEvents } from '../types/eventTypes';

/**
 * Worker Thread 实例包装器
 */
class WorkerThreadWrapper extends EventEmitter {
  public readonly id: string;
  public status: WorkerThreadStatus = WorkerThreadStatus.IDLE;
  public currentRequestId?: string;
  public readonly startedAt: Date = new Date();
  public lastActiveAt: Date = new Date();
  public processedRequests: number = 0;
  public errorCount: number = 0;

  private worker: Worker;
  private timeoutHandle?: NodeJS.Timeout;

  constructor(
    id: string,
    workerScript: string,
    private config: WorkerThreadConfig
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
    this.worker.on('message', (message: WorkerMessage) => {
      this.lastActiveAt = new Date();
      
      switch (message.type) {
        case 'TEMPLATE_DATA':
          this.handleTemplateData(message as TemplateDataMessage);
          break;
        case 'PROGRESS':
          this.handleProgress(message as WorkerProgressMessage);
          break;
        case 'ERROR':
          this.handleError(message as WorkerErrorMessage);
          break;
      }
    });

    this.worker.on('error', (error: Error) => {
      this.errorCount++;
      this.status = WorkerThreadStatus.ERROR;
      this.emit(WorkerPoolEvents.ERROR, {
        workerId: this.id,
        requestId: this.currentRequestId,
        error
      });
    });

    this.worker.on('exit', (code: number) => {
      this.status = WorkerThreadStatus.TERMINATED;
      this.emit(WorkerPoolEvents.EXIT, {
        workerId: this.id,
        exitCode: code
      });
    });
  }

  /**
   * 处理模板数据响应
   */
  private handleTemplateData(message: TemplateDataMessage): void {
    this.clearTimeout();
    this.status = WorkerThreadStatus.IDLE;
    this.processedRequests++;
    this.currentRequestId = undefined;
    
    this.emit(WorkerPoolEvents.TEMPLATE_DATA, {
      workerId: this.id,
      requestId: message.requestId,
      data: message.payload
    });
  }

  /**
   * 处理进度更新
   */
  private handleProgress(message: WorkerProgressMessage): void {
    this.emit(WorkerPoolEvents.PROGRESS, {
      workerId: this.id,
      requestId: message.requestId,
      progress: message.payload
    });
  }

  /**
   * 处理错误消息
   */
  private handleError(message: WorkerErrorMessage): void {
    this.clearTimeout();
    this.errorCount++;
    this.status = WorkerThreadStatus.ERROR;
    this.currentRequestId = undefined;
    
    this.emit(WorkerPoolEvents.WORKER_ERROR, {
      workerId: this.id,
      requestId: message.requestId,
      error: message.payload
    });
  }

  /**
   * 执行模板读取任务
   */
  public async executeTask(request: TemplateRequestMessage): Promise<void> {
    if (this.status !== WorkerThreadStatus.IDLE) {
      throw new Error(`Worker ${this.id} is not idle (status: ${this.status})`);
    }

    this.status = WorkerThreadStatus.BUSY;
    this.currentRequestId = request.requestId;
    this.lastActiveAt = new Date();

    // 设置超时
    this.timeoutHandle = setTimeout(() => {
      this.handleTimeout();
    }, this.config.timeoutMs);

    // 发送任务到 Worker Thread
    this.worker.postMessage(request);
  }

  /**
   * 处理任务超时
   */
  private handleTimeout(): void {
    this.errorCount++;
    this.status = WorkerThreadStatus.ERROR;
    
    this.emit(WorkerPoolEvents.TIMEOUT, {
      workerId: this.id,
      requestId: this.currentRequestId
    });
    
    this.currentRequestId = undefined;
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
      currentRequestId: this.currentRequestId,
      startedAt: this.startedAt,
      lastActiveAt: this.lastActiveAt,
      processedRequests: this.processedRequests,
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

/**
 * Worker Thread 池管理器
 */
export class WorkerThreadPool extends EventEmitter {
  private workers: Map<string, WorkerThreadWrapper> = new Map();
  private requestQueue: TemplateRequestMessage[] = [];
  private activeRequests: Map<string, string> = new Map(); // requestId -> workerId
  private config: WorkerThreadConfig;
  private workerScript: string;

  constructor(config: WorkerThreadConfig) {
    super();
    this.config = config;

    // 根据环境选择正确的 worker 文件路径
    if (process.env.NODE_ENV === 'production') {
      this.workerScript = join(__dirname, '../workers/templateReader.js');
    } else {
      // 开发环境使用 ts-node 运行 TypeScript 文件
      this.workerScript = join(__dirname, '../workers/templateReader.ts');
    }

    this.initializePool();
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
    const worker = new WorkerThreadWrapper(id, this.workerScript, this.config);
    
    // 设置事件监听器
    worker.on(WorkerPoolEvents.TEMPLATE_DATA, (event) => {
      this.handleWorkerTemplateData(event);
    });
    
    worker.on(WorkerPoolEvents.PROGRESS, (event) => {
      this.emit(WorkerPoolEvents.PROGRESS, event);
    });
    
    worker.on(WorkerPoolEvents.WORKER_ERROR, (event) => {
      this.handleWorkerError(event);
    });
    
    worker.on(WorkerPoolEvents.TIMEOUT, (event) => {
      this.handleWorkerTimeout(event);
    });
    
    worker.on(WorkerPoolEvents.ERROR, (event) => {
      this.handleWorkerCrash(event);
    });

    this.workers.set(id, worker);
  }

  /**
   * 处理 Worker 模板数据响应
   */
  private handleWorkerTemplateData(event: any): void {
    this.activeRequests.delete(event.requestId);
    this.emit(EnvironmentManagerEvents.TEMPLATE_DATA, event);
    this.processQueue();
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(event: any): void {
    this.activeRequests.delete(event.requestId);
    this.emit(WorkerPoolEvents.ERROR, event);
    this.processQueue();
  }

  /**
   * 处理 Worker 超时
   */
  private handleWorkerTimeout(event: any): void {
    this.activeRequests.delete(event.requestId);
    this.emit(WorkerPoolEvents.TIMEOUT, event);
    
    // 重启超时的 Worker
    this.restartWorker(event.workerId);
    this.processQueue();
  }

  /**
   * 处理 Worker 崩溃
   */
  private handleWorkerCrash(event: any): void {
    if (event.requestId) {
      this.activeRequests.delete(event.requestId);
    }
    
    this.emit(WorkerPoolEvents.CRASH, event);
    
    // 重启崩溃的 Worker
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
   * 提交模板读取任务
   */
  public async submitTask(templateId: string, userId: string): Promise<string> {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: TemplateRequestMessage = {
      type: 'TEMPLATE_REQUEST',
      requestId,
      timestamp: new Date(),
      payload: {
        templateId,
        userId
      }
    };

    this.requestQueue.push(request);
    this.processQueue();
    
    return requestId;
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    if (this.requestQueue.length === 0) {
      return;
    }

    // 检查并发限制
    if (this.activeRequests.size >= this.config.maxConcurrent) {
      return;
    }

    // 找到空闲的 Worker
    const idleWorker = Array.from(this.workers.values())
      .find(worker => worker.status === WorkerThreadStatus.IDLE);

    if (!idleWorker) {
      return;
    }

    // 分配任务
    const request = this.requestQueue.shift()!;
    this.activeRequests.set(request.requestId, idleWorker.id);
    
    idleWorker.executeTask(request).catch((error) => {
      this.emit(WorkerPoolEvents.ERROR, {
        workerId: idleWorker.id,
        requestId: request.requestId,
        error
      });
    });

    // 继续处理队列
    setImmediate(() => this.processQueue());
  }

  /**
   * 获取池状态信息
   */
  public getPoolStatus(): {
    totalWorkers: number;
    idleWorkers: number;
    busyWorkers: number;
    errorWorkers: number;
    queueLength: number;
    activeRequests: number;
    workers: WorkerThreadInfo[];
  } {
    const workers = Array.from(this.workers.values());
    
    return {
      totalWorkers: workers.length,
      idleWorkers: workers.filter(w => w.status === WorkerThreadStatus.IDLE).length,
      busyWorkers: workers.filter(w => w.status === WorkerThreadStatus.BUSY).length,
      errorWorkers: workers.filter(w => w.status === WorkerThreadStatus.ERROR).length,
      queueLength: this.requestQueue.length,
      activeRequests: this.activeRequests.size,
      workers: workers.map(w => w.getInfo())
    };
  }

  /**
   * 关闭 Worker 池
   */
  public async shutdown(): Promise<void> {
    // 清空队列
    this.requestQueue = [];
    
    // 终止所有 Worker
    const terminatePromises = Array.from(this.workers.values())
      .map(worker => worker.terminate());
    
    await Promise.all(terminatePromises);
    this.workers.clear();
    this.activeRequests.clear();
  }
}

/**
 * 创建 Worker Thread 池实例
 */
export function createWorkerThreadPool(): WorkerThreadPool {
  const config: WorkerThreadConfig = {
    poolSize: parseInt(process.env.WORKER_THREAD_POOL_SIZE || '4'),
    maxConcurrent: parseInt(process.env.WORKER_THREAD_MAX_CONCURRENT || '2'),
    timeoutMs: parseInt(process.env.WORKER_THREAD_TIMEOUT_MS || '30000'),
    retryAttempts: parseInt(process.env.WORKER_THREAD_RETRY_ATTEMPTS || '3'),
    idleTimeoutMs: parseInt(process.env.WORKER_THREAD_IDLE_TIMEOUT || '300000')
  };

  return new WorkerThreadPool(config);
}