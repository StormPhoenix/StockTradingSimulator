/**
 * K 线 API 粒度字符串与后端 TimeSeries Granularity 枚举映射
 *
 * 约定：
 * - 1w 对应 DAY_5（约一周交易日）
 * - 1M 对应 DAY_20（约一月交易日）
 */

import { Granularity } from '../types/timeSeries/core';

/** API 接受的 K 线粒度字符串（小写，1M 用 '1M'） */
export type KLineGranularityString =
  | '1m'
  | '5m'
  | '15m'
  | '30m'
  | '60m'
  | '1d'
  | '1w'
  | '1M';

const MAP: Record<KLineGranularityString, Granularity> = {
  '1m': Granularity.MIN_1,
  '5m': Granularity.MIN_5,
  '15m': Granularity.MIN_15,
  '30m': Granularity.MIN_30,
  '60m': Granularity.MIN_60,
  '1d': Granularity.DAY_1,
  '1w': Granularity.DAY_5,
  '1M': Granularity.DAY_20,
};

/**
 * 将 API 粒度字符串转为 TimeSeries Granularity
 * @param s 前端/API 传入的粒度，如 '1m', '1d', '1w', '1M'
 * @returns 对应的 Granularity 枚举，无效则返回 null
 */
export function klineGranularityToTimeSeries(s: string): Granularity | null {
  const key = s as KLineGranularityString;
  if (key in MAP) return MAP[key];
  return null;
}

/** 合法的 K 线粒度字符串列表（用于校验） */
export const VALID_KLINE_GRANULARITIES: KLineGranularityString[] = [
  '1m', '5m', '15m', '30m', '60m', '1d', '1w', '1M',
];

export function isValidKLineGranularity(s: string): s is KLineGranularityString {
  return VALID_KLINE_GRANULARITIES.includes(s as KLineGranularityString);
}
