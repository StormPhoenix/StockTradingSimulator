/**
 * 事件类型枚举定义
 * 
 * 统一管理系统中所有事件名称，便于搜索和引用
 */

/**
 * Worker Thread Pool 事件枚举
 */
export enum WorkerPoolEvents {
  TEMPLATE_DATA = 'templateData',
  PROGRESS = 'progress',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  CRASH = 'crash',
  EXIT = 'exit',
  WORKER_ERROR = 'workerError'
}

/**
 * Environment Manager 事件枚举
 */
export enum EnvironmentManagerEvents {
  TEMPLATE_DATA = 'templateData',
  PROGRESS = 'progress',
  ERROR = 'error',
  TIMEOUT = 'timeout',
  RECOVERY = 'recovery',
  PROGRESS_UPDATE = 'progressUpdate',
  ENVIRONMENT_CREATED = 'environmentCreated',
  ENVIRONMENT_CREATION_FAILED = 'environmentCreationFailed',
  ENVIRONMENT_DESTROYED = 'environmentDestroyed'
}

/**
 * Worker Error Handler 事件枚举
 */
export enum ErrorHandlerEvents {
  RECOVERY = 'recovery'
}

/**
 * 所有事件类型的联合类型
 */
export type AllEventTypes = WorkerPoolEvents | EnvironmentManagerEvents | ErrorHandlerEvents;

/**
 * 事件数据接口定义
 */
export interface EventData {
  [WorkerPoolEvents.TEMPLATE_DATA]: {
    workerId: string;
    requestId: string;
    data: any;
  };
  
  [WorkerPoolEvents.PROGRESS]: {
    workerId: string;
    requestId: string;
    progress: any;
  };
  
  [WorkerPoolEvents.ERROR]: {
    workerId: string;
    requestId: string;
    error: Error;
  };
  
  [WorkerPoolEvents.TIMEOUT]: {
    workerId: string;
    requestId?: string;
  };
  
  [WorkerPoolEvents.CRASH]: {
    workerId: string;
    requestId?: string;
    error: Error;
  };
  
  [WorkerPoolEvents.EXIT]: {
    workerId: string;
    exitCode: number;
  };
  
  [WorkerPoolEvents.WORKER_ERROR]: {
    workerId: string;
    requestId: string;
    error: any;
  };
  
  [EnvironmentManagerEvents.PROGRESS_UPDATE]: {
    requestId: string;
    stage: string;
    percentage: number;
    message: string;
    details?: any;
  };
  
  [EnvironmentManagerEvents.ENVIRONMENT_CREATED]: {
    requestId: string;
    environmentId: string;
    environment: any;
  };
  
  [EnvironmentManagerEvents.ENVIRONMENT_CREATION_FAILED]: {
    requestId: string;
    error: any;
  };
  
  [EnvironmentManagerEvents.ENVIRONMENT_DESTROYED]: {
    environmentId: string;
    userId: string;
    destroyedAt: Date;
  };
  
  [ErrorHandlerEvents.RECOVERY]: {
    error: any;
    strategy: any;
  };
}