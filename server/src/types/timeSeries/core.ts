/**
 * Core Types and Interfaces
 * 核心类型和接口定义
 *
 * 本文件定义时间序列聚合系统的所有核心类型和接口
 * 包括数据类型、指标、枚举等
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

/**
 * 数据类型枚举
 */
export enum DataType {
  /** 连续值（如价格，始终有效） */
  CONTINUOUS = 'CONTINUOUS',
  /** 离散值（如成交量，事件计数） */
  DISCRETE = 'DISCRETE',
}

/**
 * 聚合指标枚举
 */
export enum Metric {
  /** 开盘价（第一个值） */
  OPEN = 'OPEN',
  /** 最高价（最大值） */
  HIGH = 'HIGH',
  /** 最低价（最小值） */
  LOW = 'LOW',
  /** 收盘价（最后一个值） */
  CLOSE = 'CLOSE',
  /** 成交量（累加值） */
  VOLUME = 'VOLUME',
  /** 成交量加权平均价 */
  VWAP = 'VWAP',
}

/**
 * 缺失数据策略枚举
 */
export enum MissingDataStrategy {
  /** 连续值使用上一个值 */
  USE_PREVIOUS = 'USE_PREVIOUS',
  /** 离散值使用 0 */
  USE_ZERO = 'USE_ZERO',
}

/**
 * 时间粒度枚举
 */
export enum Granularity {
  /** 1 分钟 */
  MIN_1 = 'MIN_1',
  /** 5 分钟 */
  MIN_5 = 'MIN_5',
  /** 15 分钟 */
  MIN_15 = 'MIN_15',
  /** 30 分钟 */
  MIN_30 = 'MIN_30',
  /** 60 分钟（1 小时） */
  MIN_60 = 'MIN_60',
  /** 120 分钟（2 小时） */
  MIN_120 = 'MIN_120',
  /** 1 天 */
  DAY_1 = 'DAY_1',
  /** 5 天 */
  DAY_5 = 'DAY_5',
  /** 20 天 */
  DAY_20 = 'DAY_20',
  /** 120 天 */
  DAY_120 = 'DAY_120',
  /** 250 天 */
  DAY_250 = 'DAY_250',
}

/**
 * 窗口状态枚举
 */
export enum WindowStatus {
  /** 活跃状态，接收新数据 */
  ACTIVE = 'ACTIVE',
  /** 关闭中，停止接收新数据 */
  CLOSING = 'CLOSING',
  /** 已关闭，等待清除 */
  CLOSED = 'CLOSED',
}

/**
 * 生成策略枚举
 */
export enum GenerationStrategy {
  /** 随机游走（±1% 波动） */
  RANDOM_WALK = 'RANDOM_WALK',
}

/**
 * 序列定义接口
 * 定义一个时间序列的配置，包括数据类型、指标计算规则等
 * 所有时间序列默认支持所有粒度
 */
export interface SeriesDefinition {
  /** 序列唯一标识，格式：{type}:{identifier}:{metric} */
  seriesId: string;
  /** 序列名称 */
  name: string;
  /** 数据类型（CONTINUOUS 或 DISCRETE） */
  dataType: DataType;
  /** 需要计算的指标列表 */
  metrics: Metric[];
  /** 缺失数据策略 */
  missingDataStrategy: MissingDataStrategy;
}

/**
 * 数据点接口
 * 原始时间序列数据点，由交易事件生成
 */
export interface DataPoint {
  /** 数据点时间戳 */
  timestamp: Date;
  /** 数据值 */
  value: number;
  /** 附加元数据（可选） */
  metadata?: Record<string, any>;
}

/**
 * 聚合累加器接口
 * 用于增量聚合，避免重复计算
 */
export interface Accumulator {
  /** 数据点数量 */
  count: number;
  /** 第一个值（开盘价） */
  open: number | null;
  /** 最大值（最高价） */
  high: number;
  /** 最小值（最低价） */
  low: number;
  /** 最后一个值（收盘价） */
  close: number;
  /** 离散值累加（成交量） */
  volume: number;
  /** 用于 VWAP 计算（Σ(price × volume)） */
  priceSum: number;
  /** 用于 VWAP 计算（Σ volume） */
  volumeSum: number;
}

/**
 * 时间窗口接口
 * 固定时间间隔的聚合窗口，存储原始数据点和累加器
 */
export interface TimeWindow {
  /** 窗口唯一标识 */
  windowId: string;
  /** 所属序列 ID */
  seriesId: string;
  /** 时间粒度 */
  granularity: Granularity;
  /** 窗口开始时间（对齐到自然边界） */
  startTime: Date;
  /** 窗口结束时间 */
  endTime: Date;
  /** 窗口状态 */
  status: WindowStatus;
  /** 原始数据点列表 */
  dataPoints: DataPoint[];
  /** 聚合累加器 */
  accumulator: Accumulator;
}

/**
 * 聚合数据点接口
 * 完成聚合后的数据点，窗口关闭后短期保留在内存
 */
export interface AggregatedPoint {
  /** 序列唯一标识 */
  seriesId: string;
  /** 时间粒度 */
  granularity: Granularity;
  /** 窗口开始时间 */
  startTime: Date;
  /** 窗口结束时间 */
  endTime: Date;
  /** 开盘价 */
  open: number;
  /** 最高价 */
  high: number;
  /** 最低价 */
  low: number;
  /** 收盘价 */
  close: number;
  /** 成交量（累加） */
  volume: number;
  /** 成交量加权平均价（可选） */
  vwap?: number;
  /** 原始数据点数量 */
  dataPointCount: number;
  /** 创建时间（窗口关闭时） */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
}

/**
 * 测试数据生成器配置接口
 */
export interface TestDataGeneratorConfig {
  /** 是否启用 */
  enabled: boolean;
  /** 生成策略 */
  strategy: GenerationStrategy;
  /** 价格波动率（±%） */
  priceVolatility: number;
  /** 基础成交量 */
  baseVolume: number;
  /** 成交量波动率（±%） */
  volumeVolatility: number;
  /** 是否打印调试日志 */
  debugLogging: boolean;
  /** 初始价格 */
  initialPrice?: number;
}
