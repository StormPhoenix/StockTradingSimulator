/**
 * Aggregators
 * 聚合器实现
 *
 * 本文件实现增量聚合的逻辑，使用累加器避免重复计算
 * 支持 open/high/low/close/volume/vwap 等指标计算
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import type { Accumulator, DataPoint, AggregatedPoint } from './core';
import { Granularity } from './core';

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
  return {
    count: acc.count + 1,
    open: acc.open ?? dataPoint.value,
    high: Math.max(acc.high, dataPoint.value),
    low: Math.min(acc.low, dataPoint.value),
    close: dataPoint.value,
    volume: acc.volume + (dataPoint.metadata?.volume || 0),
    priceSum: acc.priceSum + dataPoint.value * (dataPoint.metadata?.volume || 1),
    volumeSum: acc.volumeSum + (dataPoint.metadata?.volume || 1),
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
