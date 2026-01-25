/**
 * Worker 通用工具函数
 * 
 * 提供 Worker Thread 中常用的通用功能
 */

import { parentPort } from 'worker_threads';
import {
  GenericTaskProgress,
  GenericTaskResponse,
  TaskError
} from '../types/worker/genericTask';

/**
 * 发送进度更新到主线程
 * 
 * @param taskId - 任务ID
 * @param taskType - 任务类型
 * @param stage - 当前阶段
 * @param percentage - 完成百分比 (0-100)
 * @param message - 进度消息
 * @param details - 可选的详细信息
 */
export function sendProgress(
  taskId: string,
  taskType: string,
  stage: string,
  percentage: number,
  message: string,
  details?: any
): void {
  const progress: GenericTaskProgress = {
    taskId,
    taskType,
    timestamp: new Date(),
    stage,
    percentage,
    message,
    details
  };

  parentPort?.postMessage(progress);
}

/**
 * 发送错误信息到主线程
 * 
 * @param taskId - 任务ID
 * @param taskType - 任务类型
 * @param error - 错误信息
 */
export function sendError(
  taskId: string,
  taskType: string,
  error: TaskError
): void {
  const response: GenericTaskResponse = {
    taskId,
    taskType,
    timestamp: new Date(),
    status: 'ERROR',
    error
  };

  parentPort?.postMessage(response);
}

/**
 * 发送成功结果到主线程
 * 
 * @param taskId - 任务ID
 * @param taskType - 任务类型
 * @param result - 任务结果
 */
export function sendSuccess<TResult = any>(
  taskId: string,
  taskType: string,
  result: TResult
): void {
  const response: GenericTaskResponse<TResult> = {
    taskId,
    taskType,
    timestamp: new Date(),
    status: 'SUCCESS',
    result
  };

  parentPort?.postMessage(response);
}

/**
 * 创建任务错误对象的便捷函数
 * 
 * @param code - 错误代码
 * @param message - 错误消息
 * @param details - 可选的错误详情
 * @param stack - 可选的堆栈信息
 * @returns TaskError 对象
 */
export function createTaskError(
  code: string,
  message: string,
  details?: any,
  stack?: string
): TaskError {
  return {
    code,
    message,
    details,
    stack
  };
}

/**
 * 从 Error 对象创建 TaskError 的便捷函数
 * 
 * @param error - JavaScript Error 对象
 * @param code - 可选的错误代码，默认为 'UNKNOWN_ERROR'
 * @param details - 可选的额外详情
 * @returns TaskError 对象
 */
export function createTaskErrorFromError(
  error: Error,
  code: string = 'UNKNOWN_ERROR',
  details?: any
): TaskError {
  return {
    code,
    message: error.message,
    stack: error.stack,
    details
  };
}