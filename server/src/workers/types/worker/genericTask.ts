/**
 * 通用任务系统类型定义
 * 
 * 提供与具体业务逻辑解耦的通用任务接口
 */

/**
 * 任务类型枚举
 */
export enum TaskType {
  MARKET_TEMPLATE = 'MARKET_TEMPLATE',
  USER_DATA = 'USER_DATA',
  CONFIG_SYNC = 'CONFIG_SYNC'
}

/**
 * 基础任务 Payload 接口
 * 所有任务 payload 都必须包含 type 字段
 */
export interface BaseTaskPayload {
  type: string;
}

/**
 * 任务错误信息
 */
export interface TaskError {
  code: string;
  message: string;
  stack?: string;
  details?: any;
}

/**
 * 通用任务请求接口
 */
export interface GenericTaskRequest<TPayload extends BaseTaskPayload = BaseTaskPayload> {
  taskId: string;
  timestamp: Date;
  payload: TPayload;
}

/**
 * 通用任务响应接口
 */
export interface GenericTaskResponse<TResult = any> {
  taskId: string;
  taskType: string;
  timestamp: Date;
  status: 'SUCCESS' | 'ERROR';
  result?: TResult;
  error?: TaskError;
}

/**
 * 通用任务进度报告接口
 */
export interface GenericTaskProgress {
  taskId: string;
  taskType: string;
  timestamp: Date;
  stage: string;
  percentage: number;
  message: string;
  details?: any;
}

/**
 * 任务回调接口
 * 业务层实现此接口来接收任务执行结果
 */
export interface TaskCallback<TResult = any> {
  /**
   * 任务完成回调
   */
  onTaskCompleted(taskId: string, result: TResult): void;
  
  /**
   * 任务失败回调
   */
  onTaskFailed(taskId: string, error: TaskError): void;
  
  /**
   * 任务进度回调（可选）
   */
  onTaskProgress?(taskId: string, stage: string, percentage: number, message: string, details?: any): void;
}

/**
 * Worker 消息类型
 */
export type GenericWorkerMessage = 
  | GenericTaskRequest
  | GenericTaskResponse
  | GenericTaskProgress
  | WorkerReadyMessage;

/**
 * Worker 就绪消息
 */
export interface WorkerReadyMessage {
  type: 'READY';
  timestamp: Date;
}

/**
 * 任务处理器接口
 */
export interface TaskHandler<TPayload extends BaseTaskPayload = BaseTaskPayload, TResult = any> {
  readonly taskType: string;
  
  /**
   * 处理任务
   */
  handleTask(request: GenericTaskRequest<TPayload>): Promise<TResult>;
  
  /**
   * 发送进度更新
   */
  sendProgress(taskId: string, stage: string, percentage: number, message: string, details?: any): void;
  
  /**
   * 发送错误
   */
  sendError(taskId: string, error: TaskError): void;
}