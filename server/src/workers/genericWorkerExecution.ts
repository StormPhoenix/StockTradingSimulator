/**
 * 通用 Worker 线程执行器
 * 
 * 接收通用任务请求并路由到具体的任务处理器
 */

import { parentPort } from 'worker_threads';
import {
  GenericTaskRequest,
  GenericTaskResponse,
  WorkerMessageType,
  TaskHandler
} from './types/worker/genericTask';
import { MarketTemplateTaskHandler } from './handlers/marketTemplateTaskHandler';

/**
 * 通用 Worker 执行器
 */
class GenericWorkerExecution {
  private taskHandlers = new Map<string, TaskHandler>();

  constructor() {
    this.registerBuiltinHandlers();
  }

  /**
   * 注册内置任务处理器
   */
  private registerBuiltinHandlers(): void {
    // 注册市场模板任务处理器
    const marketTemplateHandler = new MarketTemplateTaskHandler();
    this.registerTaskHandler(marketTemplateHandler.taskType, marketTemplateHandler);
  }

  /**
   * 注册任务处理器
   */
  public registerTaskHandler(taskType: string, handler: TaskHandler): void {
    this.taskHandlers.set(taskType, handler);
    console.log(`Registered task handler for type: ${taskType}`);
  }

  /**
   * 派发任务到具体的处理器
   */
  public async dispatchTask(request: GenericTaskRequest): Promise<void> {
    try {
      const taskType = request.payload.type;
      const handler = this.taskHandlers.get(taskType);

      if (!handler) {
        throw new Error(`No handler registered for task type: ${taskType}`);
      }

      console.log(`Dispatching task: ${request.taskId} (type: ${taskType})`);

      // 执行任务
      const result = await handler.handleTask(request);

      // 发送成功响应
      this.sendTaskResponse({
        messageType: WorkerMessageType.TASK_RESPONSE,
        taskId: request.taskId,
        timestamp: new Date(),
        status: 'SUCCESS',
        result: {
          ...result,
          type: taskType
        }
      });

      console.log(`Task completed successfully: ${request.taskId}`);

    } catch (error) {
      const taskType = request.payload.type;
      console.error(`Task failed: ${request.taskId}`, error);

      // 发送错误响应
      this.sendTaskResponse({
        messageType: WorkerMessageType.TASK_RESPONSE,
        taskId: request.taskId,
        timestamp: new Date(),
        status: 'ERROR',
        result: {
          type: taskType
        },
        error: {
          code: 'TASK_EXECUTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error occurred',
          stack: error instanceof Error ? error.stack : undefined,
          details: error
        }
      });
    }
  }

  /**
   * 发送任务响应到主线程
   */
  private sendTaskResponse(response: GenericTaskResponse): void {
    parentPort?.postMessage(response);
  }
}

// 创建执行器实例
const workerExecution = new GenericWorkerExecution();

/**
 * Worker Thread 主入口
 */
if (parentPort) {
  // 监听来自主线程的消息
  parentPort.on('message', async (message: GenericTaskRequest) => {
    console.log(`Worker received task: ${message.taskId} (type: ${message.payload.type})`);
    await workerExecution.dispatchTask(message);
  });

  // 发送 Worker 就绪信号
  parentPort.postMessage({
    type: 'READY',
    timestamp: new Date()
  });

  console.log('Generic worker thread initialized and ready');
} else {
  console.error('Worker thread: parentPort is not available');
  process.exit(1);
}

// 导出执行器实例供测试使用
export { workerExecution };