/**
 * Time Series Simulation Service
 * 时间序列模拟服务 - 生成模拟的时间序列数据
 *
 * @feature 008-time-series-aggregation
 * @since 2026-01-27
 */

import { TimeSeriesManager } from '../types/timeSeries';
import type { DataPoint, Granularity } from '../types/timeSeries';

export class TimeSeriesSimulationService {
  constructor(private timeSeriesManager: TimeSeriesManager) {}

  /**
   * 生成随机游走价格
   * @param previousPrice 前一个价格
   * @param volatility 波动率（默认 1%）
   * @returns 新价格
   */
  private generateRandomWalkPrice(previousPrice: number, volatility: number = 0.01): number {
    const change = 1 + (Math.random() - 0.5) * 2 * volatility;
    return previousPrice * change;
  }

  /**
   * 生成随机成交量
   * @param baseVolume 基础成交量
   * @param volatility 波动率（默认 50%）
   * @returns 新成交量
   */
  private generateRandomVolume(baseVolume: number, volatility: number = 0.5): number {
    const change = 1 + (Math.random() - 0.5) * 2 * volatility;
    return Math.floor(baseVolume * change);
  }

  /**
   * 生成模拟数据点
   * @param config 配置
   */
  generateDataPoints(config: {
    seriesId: string;
    baseTime: Date;
    pointCount: number;
    intervalSeconds: number;
    initialPrice?: number;
    baseVolume?: number;
    priceVolatility?: number;
    volumeVolatility?: number;
  }): DataPoint[] {
    const {
      seriesId,
      baseTime,
      pointCount,
      intervalSeconds,
      initialPrice = 100,
      baseVolume = 1000,
      priceVolatility = 0.01,
      volumeVolatility = 0.5,
    } = config;

    const dataPoints: DataPoint[] = [];
    let currentPrice = initialPrice;

    for (let i = 0; i < pointCount; i++) {
      const timestamp = new Date(
        baseTime.getTime() + i * intervalSeconds * 1000
      );

      // 生成价格
      currentPrice = this.generateRandomWalkPrice(currentPrice, priceVolatility);

      // 生成成交量
      const volume = this.generateRandomVolume(baseVolume, volumeVolatility);

      dataPoints.push({
        timestamp,
        value: currentPrice,
        metadata: {
          volume,
          seriesId,
          pointIndex: i,
        },
      });
    }

    return dataPoints;
  }

  /**
   * 生成并添加数据点到时间序列管理器
   */
  generateAndAddDataPoints(config: {
    seriesId: string;
    baseTime: Date;
    pointCount: number;
    intervalSeconds: number;
    initialPrice?: number;
    baseVolume?: number;
    priceVolatility?: number;
    volumeVolatility?: number;
  }): void {
    const dataPoints = this.generateDataPoints(config);

    // 按时间戳排序并添加
    const sortedPoints = [...dataPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const point of sortedPoints) {
      this.timeSeriesManager.addDataPoint(config.seriesId, point);
    }
  }
}
