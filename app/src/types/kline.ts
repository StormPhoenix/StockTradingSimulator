/**
 * K 线相关类型（与后端 API / 设计文档一致）
 * API 返回的 timestamp 为 ISO 字符串，前端可转为 Date 使用
 */

/** K 线数据点（API 中 timestamp 为 ISO 字符串） */
export interface KLinePoint {
  timestamp: string | Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  amount?: number;
  changePercent?: number;
  changeAmount?: number;
}

/** K 线元数据 */
export interface KLineMetadata {
  symbol: string;
  name: string;
  decimal: number;
  preClose: number;
  total: number;
  market?: number;
  preSettlement?: number;
}

/** K 线接口响应 data 结构 */
export interface KLineDataResult {
  metadata: KLineMetadata;
  data: KLinePoint[];
  granularity: string;
  isFull: boolean;
  nextCursor?: string;
}

/** 前端支持的 K 线粒度（与后端 1m|5m|15m|30m|60m|1d|1w|1M 一致） */
export const KLINE_GRANULARITIES = ['1m', '5m', '15m', '30m', '60m', '1d', '1w', '1M'] as const;
export type KLineGranularity = (typeof KLINE_GRANULARITIES)[number];

/** WebSocket 推送：kline_update 的 data 部分 */
export interface KLineUpdatePayload {
  symbol: string;
  granularity: string;
  data: KLinePoint[];
}

/** WebSocket 服务端消息 */
export interface MarketInstanceWsMessage {
  type: 'kline_update' | 'error';
  timestamp?: string;
  data?: KLineUpdatePayload | { code?: string; message?: string };
}
