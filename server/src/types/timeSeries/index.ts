/**
 * Time Series Aggregation Library
 * 时间序列聚合系统 - 支持多周期K线数据生成和查询
 *
 * 本模块提供纯数据结构和核心逻辑，不涉及持久化或API
 * 所有数据仅存储在内存中，窗口关闭后自动清除
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

// Core types and enums
export * from './core';

// Time window management
export * from './windows';

// Aggregators
export * from './aggregators';

// Metrics
export * from './metrics';

// TimeSeriesManager
export { TimeSeriesManager } from './windows/impl';
