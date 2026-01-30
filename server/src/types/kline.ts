/**
 * K 线 API 响应类型（与前端/设计文档一致）
 */

/** K 线数据点（timestamp 使用窗口 startTime） */
export interface KLinePoint {
  timestamp: Date;
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

export interface KLineDataResult {
  metadata: KLineMetadata;
  data: KLinePoint[];
  granularity: string;
  isFull: boolean;
  nextCursor?: string;
}
