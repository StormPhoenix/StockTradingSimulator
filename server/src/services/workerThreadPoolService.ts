/**
 * Worker 线程池服务
 * 
 * 提供统一的线程池管理和任务提交接口
 */

import { EventEmitter } from 'events';
import { GenericWorkerThreadPool, createGenericWorkerThreadPool } from '../workers/genericWorkerThreadPool';
import { MarketTemplateTaskAdapter, createMarketTemplateTaskAdapter } from '../adapters/marketTemplateTaskAdapter';
import {
  MarketTemplateRequest,
  MarketTemplateResponse
} from '../workers/types/business/marketTemplate';
import {
  TaskType
} from '../workers/types/worker/genericTask';
import {
  PoolEvents
} from '../workers/types/worker/poolConfig';

/**
 * Worker 线程池服务
 */
export class WorkerThreadPoolService extends EventEmitter {
  private pool: GenericWorkerThreadPool;
  private marketTemplateAdapter: MarketTemplateTaskAdapter;

  constructor() {
    super();
    
    // 创建通用线程池
    this.pool = createGenericWorkerThreadPool();
    
    // 创建市场模板适配器
    this.marketTemplateAdapter = createMarketTemplateTaskAdapter();
    
    // 注册适配器
    this.pool.registerTaskAdapter(this.marketTemplateAdapter);
    
    // 设置事件转发
    this.setupEventForwarding();
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

    // 转发市场模板特定事件
    this.marketTemplateAdapter.on('marketTemplateProgress', (progress) => {
      this.emit('marketTemplateProgress', progress);
    });

    this.marketTemplateAdapter.on('marketTemplateError', (error) => {
      this.emit('marketTemplateError', error);
    });
  }

  /**
   * 提交市场模板任务
   */
  public async submitMarketTemplateTask(
    templateId: string,
    userId: string
  ): Promise<string> {
    const request: MarketTemplateRequest = {
      templateId,
      userId
    };

    return this.pool.submitTask(TaskType.MARKET_TEMPLATE, request);
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
 * 创建 Worker 线程池服务实例
 */
export function createWorkerThreadPoolService(): WorkerThreadPoolService {
  return new WorkerThreadPoolService();
}