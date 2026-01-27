/**
 * Time Window Management
 * 时间窗口管理
 *
 * 本文件实现时间窗口的核心逻辑，包括窗口对齐、
 * 窗口生命周期管理、聚合数据存储等
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import { Granularity } from './core';

/**
 * 获取粒度对应的毫秒数
 */
export function getGranularityMilliseconds(granularity: Granularity): number {
  const millisecondsMap: Record<Granularity, number> = {
    [Granularity.MIN_1]: 60 * 1000,           // 1 分钟
    [Granularity.MIN_5]: 5 * 60 * 1000,          // 5 分钟
    [Granularity.MIN_15]: 15 * 60 * 1000,        // 15 分钟
    [Granularity.MIN_30]: 30 * 60 * 1000,        // 30 分钟
    [Granularity.MIN_60]: 60 * 60 * 1000,        // 1 小时
    [Granularity.MIN_120]: 120 * 60 * 1000,       // 2 小时
    [Granularity.DAY_1]: 24 * 60 * 60 * 1000,        // 1 天
    [Granularity.DAY_5]: 5 * 24 * 60 * 1000,         // 5 天
    [Granularity.DAY_20]: 20 * 24 * 60 * 1000,        // 20 天
    [Granularity.DAY_120]: 120 * 24 * 60 * 1000,      // 120 天
    [Granularity.DAY_250]: 250 * 24 * 60 * 1000,     // 250 天
  };

  return millisecondsMap[granularity] || 60 * 1000;
}

/**
 * 将时间戳对齐到指定粒度的自然边界
 * 确保时间窗口精确对齐（FR-006）
 *
 * @param timestamp - 原始时间戳
 * @param granularity - 时间粒度
 * @returns 对齐后的时间
 */
export function alignTimeToGranularity(timestamp: Date, granularity: Granularity): Date {
  const milliseconds = getGranularityMilliseconds(granularity);
  const aligned = Math.floor(timestamp.getTime() / milliseconds) * milliseconds;
  return new Date(aligned);
}

/**
 * 生成窗口唯一标识
 *
 * @param seriesId - 序列 ID
 * @param granularity - 时间粒度
 * @param timestamp - 时间戳
 * @returns 窗口 ID
 */
export function generateWindowKey(
  seriesId: string,
  granularity: Granularity,
  timestamp: Date
): string {
  const alignedTime = alignTimeToGranularity(timestamp, granularity);
  return `${seriesId}:${granularity}:${alignedTime.getTime()}`;
}
