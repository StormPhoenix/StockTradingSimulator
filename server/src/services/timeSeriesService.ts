/**
 * Time Series Service
 * 时间序列服务 - 封装 TimeSeriesManager 的业务逻辑
 *
 * @feature 008-time-series-aggregation
 * @since 2026-01-27
 */

import {
  TimeSeriesManager,
  Granularity,
  DataType,
  Metric,
  MissingDataStrategy,
  type SeriesDefinition,
  type DataPoint,
  type AggregatedPoint,
} from '../types/timeSeries';

class TimeSeriesService {
  private manager: TimeSeriesManager;

  constructor() {
    this.manager = new TimeSeriesManager();
  }

  /**
   * 创建时间序列
   */
  createSeries(config: {
    seriesId: string;
    name: string;
    dataType: DataType;
    granularityLevels: Granularity[];
    metrics: Metric[];
  }): void {
    const seriesDefinition: SeriesDefinition = {
      seriesId: config.seriesId,
      name: config.name,
      dataType: config.dataType,
      granularityLevels: config.granularityLevels,
      metrics: config.metrics,
      missingDataStrategy:
        config.dataType === DataType.CONTINUOUS
          ? MissingDataStrategy.USE_PREVIOUS
          : MissingDataStrategy.USE_ZERO,
    };

    this.manager.createSeries(seriesDefinition);
  }

  /**
   * 批量添加数据点
   */
  addDataPoints(seriesId: string, dataPoints: DataPoint[]): void {
    // 按时间戳排序，确保时间顺序正确
    const sortedPoints = [...dataPoints].sort(
      (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
    );

    for (const point of sortedPoints) {
      this.manager.addDataPoint(seriesId, point);
    }
  }

  /**
   * 查询聚合数据
   */
  queryAggregatedData(options: {
    seriesId: string;
    granularity: Granularity;
    startTime: Date;
    endTime: Date;
  }): AggregatedPoint[] {
    return this.manager.queryAggregatedData(options);
  }

  /**
   * 获取最新数据
   */
  getLatestData(seriesId: string, granularity: Granularity): AggregatedPoint | null {
    return this.manager.getLatestData(seriesId, granularity);
  }

  /**
   * 获取所有序列 ID
   */
  getAllSeriesIds(): string[] {
    return this.manager.getAllSeriesIds();
  }

  /**
   * 删除序列
   */
  removeSeries(seriesId: string): void {
    this.manager.removeSeries(seriesId);
  }

  /**
   * 清除指定序列的所有聚合数据
   */
  clearAggregatedData(seriesId: string): void {
    this.manager.clearAggregatedData(seriesId);
  }

  /**
   * 清除指定序列在指定时间之前的聚合数据
   */
  clearAggregatedDataBefore(seriesId: string, beforeTime: Date): void {
    this.manager.clearAggregatedDataBefore(seriesId, beforeTime);
  }

  /**
   * 获取管理器实例（用于高级操作）
   */
  getManager(): TimeSeriesManager {
    return this.manager;
  }
}

// 导出单例
export const timeSeriesService = new TimeSeriesService();
