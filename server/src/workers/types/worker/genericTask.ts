/**
 * 通用任务系统类型定义
 * 
 * 提供与具体业务逻辑解耦的通用任务接口
 */

/**
 * 任务类型枚举
 */
export enum TaskType {
  CREATE_MARKET_INSTANCE = 'MARKET_TEMPLATE',
}

/**
 * 基础任务 Payload 接口
 * 所有任务 payload 都必须包含 type 字段
 */
export interface BaseTaskPayload {
  type: string;
}

/**
 * 基础任务结果接口
 * 所有任务结果都必须包含 type 字段
 */
export interface BaseTaskResult {
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
 * Worker 消息类型枚举
 */
export enum WorkerMessageType {
  TASK_RESPONSE = 'TASK_RESPONSE',
  TASK_PROGRESS = 'TASK_PROGRESS'
}

/**
 * 基础 Worker 消息接口
 * 所有从 Worker 线程返回的消息都必须继承此接口
 */
export interface BaseWorkerMessage {
  messageType: WorkerMessageType;
  taskId: string;
  timestamp: Date;
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
export interface GenericTaskResponse<TResult extends BaseTaskResult = BaseTaskResult> extends BaseWorkerMessage {
  messageType: WorkerMessageType.TASK_RESPONSE;
  status: 'SUCCESS' | 'ERROR';
  result?: TResult;
  error?: TaskError;
}

/**
 * 通用任务进度报告接口
 */
export interface GenericTaskProgress extends BaseWorkerMessage {
  messageType: WorkerMessageType.TASK_PROGRESS;
  taskType: string;
  stage: string;
  percentage: number;
  message: string;
  details?: any;
}

/**
 * 任务回调接口
 * 业务层实现此接口来接收任务执行结果
 */
export interface TaskCallback<TResult extends BaseTaskResult = BaseTaskResult> {
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
export type GenericWorkerMessage = BaseWorkerMessage & (
  | GenericTaskResponse
  | GenericTaskProgress
);


/**
 * 任务处理器接口
 */
export interface TaskHandler<TPayload extends BaseTaskPayload = BaseTaskPayload, TResult extends BaseTaskResult = BaseTaskResult> {
  readonly taskType: string;

  /**
   * 处理任务
   */
  handleTask(request: GenericTaskRequest<TPayload>): Promise<TResult>;
}