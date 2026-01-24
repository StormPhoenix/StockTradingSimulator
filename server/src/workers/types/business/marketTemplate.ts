/**
 * 市场模板业务类型定义
 * 
 * 定义市场模板相关的业务数据结构
 */

import { BaseTaskPayload, TaskType } from '../worker/genericTask';

/**
 * 市场模板请求
 */
export interface MarketTemplateRequest extends BaseTaskPayload {
  type: TaskType.MARKET_TEMPLATE;
  templateId: string;
  userId: string;
}

/**
 * 交易所模板
 */
export interface ExchangeTemplate {
  _id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 交易员模板
 */
export interface TraderTemplate {
  _id: string;
  name: string;
  riskProfile: 'conservative' | 'moderate' | 'aggressive';
  initialCapital: number;
  createdAt: Date;
}

/**
 * 股票模板
 */
export interface StockTemplate {
  _id: string;
  symbol: string;
  companyName: string;
  category: string;
  issuePrice: number;
  totalShares: number;
  createdAt: Date;
}

/**
 * 市场模板响应
 */
export interface MarketTemplateResponse {
  exchange: ExchangeTemplate;
  traders: TraderTemplate[];
  stocks: StockTemplate[];
}

/**
 * 市场模板进度阶段
 */
export enum MarketTemplateStage {
  DATABASE_READING = 'DATABASE_READING',
  DATA_PROCESSING = 'DATA_PROCESSING',
  COMPLETE = 'COMPLETE'
}

/**
 * 市场模板进度详情
 */
export interface MarketTemplateProgressDetails {
  totalTraders?: number;
  processedTraders?: number;
  totalStocks?: number;
  processedStocks?: number;
}