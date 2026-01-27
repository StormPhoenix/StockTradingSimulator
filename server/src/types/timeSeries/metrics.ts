/**
 * Metrics Calculation
 * 指标计算
 *
 * 本文件提供指标计算的辅助函数，用于扩展聚合指标
 * 当前实现了基础指标，支持后续添加高级指标
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import { Metric } from './core';

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
