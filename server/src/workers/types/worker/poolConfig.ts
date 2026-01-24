/**
 * 线程池配置类型定义
 */

/**
 * Worker 线程状态
 */
export enum WorkerThreadStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  TERMINATED = 'TERMINATED'
}

/**
 * 线程池通用配置
 */
export interface PoolConfig {
  poolSize: number;
  maxConcurrent: number;
  timeoutMs: number;
  retryAttempts: number;
  idleTimeoutMs: number;
}

/**
 * Worker 线程信息
 */
export interface WorkerThreadInfo {
  id: string;
  status: WorkerThreadStatus;
  currentTaskId?: string;
  startedAt: Date;
  lastActiveAt: Date;
  processedTasks: number;
  errorCount: number;
}

/**
 * 线程池状态信息
 */
export interface PoolStatus {
  totalWorkers: number;
  idleWorkers: number;
  busyWorkers: number;
  errorWorkers: number;
  queueLength: number;
  activeTasks: number;
  workers: WorkerThreadInfo[];
}

/**
 * 线程池事件类型
 */
export enum PoolEvents {
  TASK_SUBMITTED = 'task:submitted',
  TASK_STARTED = 'task:started',
  TASK_PROGRESS = 'task:progress',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  WORKER_CREATED = 'worker:created',
  WORKER_TERMINATED = 'worker:terminated',
  WORKER_ERROR = 'worker:error',
  WORKER_TIMEOUT = 'worker:timeout',
  WORKER_CRASH = 'worker:crash'
}