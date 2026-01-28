/**
 * Test Data Generator
 * 测试数据生成器
 *
 * 生成测试数据用于验证时间序列数据结构和聚合逻辑
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import type {
  SeriesDefinition,
  DataPoint,
  Granularity,
} from '../types/timeSeries/core';
import { GenerationStrategy } from '../types/timeSeries/core';
import type { TimeSeriesManager } from '../types/timeSeries/manager';
import type { TestDataGeneratorConfig } from './config';
import { RandomWalkStrategy, type RandomWalkConfig } from './strategies/randomWalk';

/**
 * 测试数据生成器类
 */
export class TestDataGenerator {
  /** 配置 */
  private config: TestDataGeneratorConfig;

  /** 随机游走策略 */
  private strategy: RandomWalkStrategy;

  /** 当前价格 */
  private currentPrice: number;

  /** 已生成的数据点数量 */
  private generatedCount: number;

  /**
   * 构造函数
   *
   * @param config - 生成器配置
   */
  constructor(config: TestDataGeneratorConfig) {
    this.config = {
      enabled: config.enabled ?? false,
      seriesId: config.seriesId,
      initialPrice: config.initialPrice ?? 100,
      enableDebugLog: config.enableDebugLog ?? false,
      strategy: config.strategy ?? GenerationStrategy.RANDOM_WALK,
    };

    // 初始化随机游走策略
    const initialPrice = this.config.initialPrice ?? 100;
    const randomWalkConfig: RandomWalkConfig = {
      volatility: initialPrice * 0.01, // 1% 波动
      baseVolume: 1000,
      volumeVolatility: 0.5,
    };
    this.strategy = new RandomWalkStrategy(randomWalkConfig);

    this.currentPrice = initialPrice;
    this.generatedCount = 0;
  }

  /**
   * 生成单个数据点
   *
   * @param timestamp - 时间戳（可选，默认当前时间）
   * @returns 数据点
   */
  generateDataPoint(timestamp: Date = new Date()): DataPoint {
    // 生成新价格
    this.currentPrice = this.strategy.generatePrice(this.currentPrice);
    const volume = this.strategy.generateVolume();

    const dataPoint: DataPoint = {
      timestamp,
      value: this.currentPrice,
      volume,
    };

    this.generatedCount++;

    // 打印调试日志
    if (this.config.enableDebugLog) {
      this.printDebugLog(dataPoint);
    }

    return dataPoint;
  }

  /**
   * 生成并注入数据点到时间序列
   *
   * @param manager - 时间序列管理器
   * @param count - 生成数据点数量
   * @param intervalMs - 数据点间隔（毫秒）
   */
  generateAndInject(
    manager: TimeSeriesManager,
    count: number,
    intervalMs: number = 1000
  ): void {
    if (!this.config.enabled) {
      if (this.config.enableDebugLog) {
        console.log('[TestDataGenerator] Generator is disabled');
      }
      return;
    }

    let timestamp = new Date();
    for (let i = 0; i < count; i++) {
      const dataPoint = this.generateDataPoint(timestamp);
      manager.addDataPoint(this.config.seriesId, dataPoint);

      timestamp = new Date(timestamp.getTime() + intervalMs);
    }

    if (this.config.enableDebugLog) {
      console.log(`[TestDataGenerator] Generated ${count} data points`);
    }
  }

  /**
   * 生成指定时间范围内的数据
   *
   * @param manager - 时间序列管理器
   * @param startTime - 开始时间
   * @param endTime - 结束时间
   * @param intervalMs - 数据点间隔（毫秒）
   */
  generateTimeRange(
    manager: TimeSeriesManager,
    startTime: Date,
    endTime: Date,
    intervalMs: number = 1000
  ): void {
    if (!this.config.enabled) {
      if (this.config.enableDebugLog) {
        console.log('[TestDataGenerator] Generator is disabled');
      }
      return;
    }

    let timestamp = new Date(startTime);
    let count = 0;

    while (timestamp <= endTime) {
      const dataPoint = this.generateDataPoint(timestamp);
      manager.addDataPoint(this.config.seriesId, dataPoint);

      timestamp = new Date(timestamp.getTime() + intervalMs);
      count++;
    }

    if (this.config.enableDebugLog) {
      console.log(`[TestDataGenerator] Generated ${count} data points from ${startTime.toISOString()} to ${endTime.toISOString()}`);
    }
  }

  /**
   * 打印调试日志
   *
   * @param dataPoint - 数据点
   */
  private printDebugLog(dataPoint: DataPoint): void {
    const timestamp = dataPoint.timestamp.toISOString();
    const price = dataPoint.value.toFixed(2);
    const volume = dataPoint.volume ?? 0;

    console.log(`[TestDataGenerator] Generated data point #${this.generatedCount}:`);
    console.log(`  - Timestamp: ${timestamp}`);
    console.log(`  - Price: $${price}`);
    console.log(`  - Volume: ${volume}`);
  }

  /**
   * 启用生成器
   */
  enable(): void {
    this.config.enabled = true;
    if (this.config.enableDebugLog) {
      console.log('[TestDataGenerator] Generator enabled');
    }
  }

  /**
   * 禁用生成器
   */
  disable(): void {
    this.config.enabled = false;
    if (this.config.enableDebugLog) {
      console.log('[TestDataGenerator] Generator disabled');
    }
  }

  /**
   * 更新配置
   *
   * @param config - 新配置
   */
  updateConfig(config: Partial<TestDataGeneratorConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.initialPrice !== undefined) {
      this.currentPrice = config.initialPrice;
    }

    if (this.config.enableDebugLog) {
      console.log('[TestDataGenerator] Config updated:', this.config);
    }
  }

  /**
   * 获取当前配置
   *
   * @returns 当前配置
   */
  getConfig(): TestDataGeneratorConfig {
    return { ...this.config };
  }

  /**
   * 重置生成器状态
   */
  reset(): void {
    this.currentPrice = this.config.initialPrice ?? 100;
    this.generatedCount = 0;

    if (this.config.enableDebugLog) {
      console.log('[TestDataGenerator] Generator reset');
    }
  }

  /**
   * 获取已生成数据点数量
   *
   * @returns 数据点数量
   */
  getGeneratedCount(): number {
    return this.generatedCount;
  }

  /**
   * 获取当前价格
   *
   * @returns 当前价格
   */
  getCurrentPrice(): number {
    return this.currentPrice;
  }
}
