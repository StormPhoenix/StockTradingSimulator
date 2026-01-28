/**
 * Time Series Utilities
 * 时间序列工具函数
 *
 * 本文件包含时间序列聚合系统的所有工具函数，包括：
 * - 聚合器函数（累加器操作）
 * - 指标计算辅助函数
 * - 时间窗口工具函数
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import type { Accumulator, DataPoint, AggregatedPoint } from './core';
import { Granularity, Metric } from './core';

// ============================================================================
// 聚合器函数
// ============================================================================

/**
 * 初始化累加器
 *
 * @returns 空累加器
 */
export function initializeAccumulator(): Accumulator {
  return {
    count: 0,
    open: null,
    high: Number.MIN_SAFE_INTEGER,
    low: Number.MAX_SAFE_INTEGER,
    close: 0,
    volume: 0,
    priceSum: 0,
    volumeSum: 0,
  };
}

/**
 * 更新累加器（增量聚合）
 * 原子操作，避免重复计算
 *
 * @param acc - 当前累加器
 * @param dataPoint - 新的数据点
 * @returns 更新后的累加器
 */
export function updateAccumulator(
  acc: Accumulator,
  dataPoint: DataPoint
): Accumulator {
  const volume = dataPoint.volume ?? 0;
  return {
    count: acc.count + 1,
    open: acc.open ?? dataPoint.value,
    high: Math.max(acc.high, dataPoint.value),
    low: Math.min(acc.low, dataPoint.value),
    close: dataPoint.value,
    volume: acc.volume + volume,
    priceSum: acc.priceSum + dataPoint.value * (volume || 1),
    volumeSum: acc.volumeSum + (volume || 1),
  };
}

/**
 * 从累加器创建聚合数据点
 *
 * @param acc - 累加器
 * @param startTime - 窗口开始时间
 * @param endTime - 窗口结束时间
 * @param seriesId - 序列 ID
 * @param granularity - 时间粒度
 * @returns 聚合数据点
 */
export function createAggregatedPoint(
  acc: Accumulator,
  startTime: Date,
  endTime: Date,
  seriesId: string,
  granularity: Granularity
): AggregatedPoint {
  return {
    seriesId,
    granularity,
    startTime,
    endTime,
    open: acc.open!,
    high: acc.high,
    low: acc.low,
    close: acc.close,
    volume: acc.volume,
    vwap: acc.volumeSum > 0 ? acc.priceSum / acc.volumeSum : undefined,
    dataPointCount: acc.count,
    createdAt: endTime,  // 使用窗口结束时间作为创建时间
    updatedAt: endTime,  // 使用窗口结束时间作为更新时间
  };
}

// ============================================================================
// 指标计算辅助函数
// ============================================================================

/**
 * 检查是否需要计算指定指标
 *
 * @param metrics - 已配置的指标列表
 * @param metric - 要检查的指标
 * @returns 是否需要计算
 */
export function shouldCalculateMetric(metrics: Metric[], metric: Metric): boolean {
  return metrics.includes(metric);
}

/**
 * 获取指标显示名称
 *
 * @param metric - 指标
 * @returns 显示名称
 */
export function getMetricDisplayName(metric: Metric): string {
  const displayNames: Record<Metric, string> = {
    [Metric.OPEN]: '开盘价',
    [Metric.HIGH]: '最高价',
    [Metric.LOW]: '最低价',
    [Metric.CLOSE]: '收盘价',
    [Metric.VOLUME]: '成交量',
    [Metric.VWAP]: '成交量加权平均价',
  };

  return displayNames[metric] || metric;
}

/**
 * 验证聚合数据的有效性
 *
 * @param open - 开盘价
 * @param high - 最高价
 * @param low - 最低价
 * @param close - 收盘价
 * @returns 是否有效
 */
export function validateAggregatedValues(
  open: number,
  high: number,
  low: number,
  close: number
): boolean {
  return high >= Math.max(open, close) && low <= Math.min(open, close);
}

// ============================================================================
// 时间窗口工具函数
// ============================================================================

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
