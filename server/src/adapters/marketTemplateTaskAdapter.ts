/**
 * 市场模板任务适配器
 * 
 * 将市场模板业务逻辑适配到通用任务系统
 */

import { EventEmitter } from 'events';
import {
  TaskAdapter,
  GenericTaskRequest,
  GenericTaskResponse,
  GenericTaskProgress,
  TaskError,
  TaskType
} from '../workers/types/worker/genericTask';
import {
  MarketTemplateRequest,
  MarketTemplateResponse,
  MarketTemplateStage
} from '../workers/types/business/marketTemplate';

/**
 * 市场模板任务适配器
 */
export class MarketTemplateTaskAdapter extends EventEmitter implements TaskAdapter<MarketTemplateRequest, MarketTemplateResponse> {
  public readonly taskType = TaskType.MARKET_TEMPLATE;

  /**
   * 将业务请求转换为通用任务请求
   */
  public adaptRequest(businessRequest: MarketTemplateRequest): GenericTaskRequest<MarketTemplateRequest> {
    return {
      taskId: this.generateTaskId(),
      taskType: this.taskType,
      timestamp: new Date(),
      payload: businessRequest,
      metadata: {
        userId: businessRequest.userId,
        templateId: businessRequest.templateId
      }
    };
  }

  /**
   * 将通用任务响应转换为业务响应
   */
  public adaptResponse(genericResponse: GenericTaskResponse): MarketTemplateResponse {
    if (genericResponse.status === 'ERROR') {
      throw new Error(`Market template task failed: ${genericResponse.error?.message}`);
    }

    if (!genericResponse.result) {
      throw new Error('Market template task completed but no result provided');
    }

    // 验证响应数据结构
    const result = genericResponse.result as MarketTemplateResponse;
    this.validateMarketTemplateResponse(result);

    return result;
  }

  /**
   * 处理进度更新
   */
  public handleProgress(progress: GenericTaskProgress): void {
    // 将通用进度转换为业务进度事件
    const businessProgress = {
      taskId: progress.taskId,
      templateId: this.extractTemplateId(progress.taskId),
      stage: progress.stage as MarketTemplateStage,
      percentage: progress.percentage,
      message: progress.message,
      details: progress.details,
      timestamp: progress.timestamp
    };

    // 发出业务进度事件
    this.emit('marketTemplateProgress', businessProgress);
    
    console.log(`Market template progress [${progress.taskId}]: ${progress.stage} - ${progress.percentage}% - ${progress.message}`);
  }

  /**
   * 处理错误
   */
  public handleError(taskId: string, error: TaskError): void {
    const businessError = {
      taskId,
      templateId: this.extractTemplateId(taskId),
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date()
    };

    // 发出业务错误事件
    this.emit('marketTemplateError', businessError);
    
    console.error(`Market template error [${taskId}]: ${error.code} - ${error.message}`);
  }

  /**
   * 验证市场模板响应数据
   */
  private validateMarketTemplateResponse(response: MarketTemplateResponse): void {
    if (!response.exchange) {
      throw new Error('Invalid market template response: missing exchange data');
    }

    if (!response.traders || !Array.isArray(response.traders)) {
      throw new Error('Invalid market template response: missing or invalid traders data');
    }

    if (!response.stocks || !Array.isArray(response.stocks)) {
      throw new Error('Invalid market template response: missing or invalid stocks data');
    }

    // 验证交易所数据
    if (!response.exchange._id || !response.exchange.name) {
      throw new Error('Invalid exchange data: missing required fields');
    }

    // 验证交易员数据
    for (const trader of response.traders) {
      if (!trader._id || !trader.name || !trader.riskProfile || trader.initialCapital <= 0) {
        throw new Error(`Invalid trader data: ${trader._id}`);
      }
    }

    // 验证股票数据
    for (const stock of response.stocks) {
      if (!stock._id || !stock.symbol || !stock.companyName || stock.issuePrice <= 0 || stock.totalShares <= 0) {
        throw new Error(`Invalid stock data: ${stock._id}`);
      }
    }
  }

  /**
   * 从任务ID中提取模板ID（如果存储在metadata中）
   */
  private extractTemplateId(taskId: string): string {
    // 这里可以根据实际需要实现从taskId或其他地方提取templateId的逻辑
    // 暂时返回taskId作为占位符
    return taskId;
  }

  /**
   * 生成任务ID
   */
  private generateTaskId(): string {
    return `market_template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * 创建市场模板任务适配器实例
 */
export function createMarketTemplateTaskAdapter(): MarketTemplateTaskAdapter {
  return new MarketTemplateTaskAdapter();
}