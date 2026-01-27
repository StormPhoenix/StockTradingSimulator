/**
 * Test Data Generator Configuration
 * 测试数据生成器配置
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import type { GenerationStrategy } from '../types/timeSeries/core';

/**
 * 测试数据生成器配置接口
 */
export interface TestDataGeneratorConfig {
  /** 是否启用生成器 */
  enabled: boolean;

  /** 序列 ID */
  seriesId: string;

  /** 初始价格 */
  initialPrice?: number;

  /** 是否启用调试日志 */
  enableDebugLog?: boolean;

  /** 生成策略 */
  strategy?: GenerationStrategy;
}
