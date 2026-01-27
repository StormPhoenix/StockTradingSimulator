/**
 * Time Series Manager Implementation
 * 时间序列管理器实现
 *
 * 本文件实现 TimeSeriesManager 类，负责：
 * 1. 管理多个时间序列定义
 * 2. 维护多个粒度的活跃窗口
 * 3. 接收并聚合数据点到时间窗口
 * 4. 查询聚合数据
 * 5. 自动管理窗口生命周期（关闭和清除）
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

import type {
  SeriesDefinition,
  DataPoint,
  TimeWindow,
  AggregatedPoint,
} from '../core';
import { WindowStatus, Granularity } from '../core';
import {
  generateWindowKey,
  alignTimeToGranularity,
  getGranularityMilliseconds,
} from '../windows';
import {
  initializeAccumulator,
  updateAccumulator,
  createAggregatedPoint,
} from '../aggregators';

/**
 * 时间序列管理器
 * 负责管理多个时间序列的聚合和查询
 */
export class TimeSeriesManager {
  /** 序列定义存储 */
  private seriesDefinitions: Map<string, SeriesDefinition> = new Map();

  /** 活跃窗口存储：seriesId -> granularity -> windowKey -> TimeWindow */
  private activeWindows: Map<string, Map<Granularity, Map<string, TimeWindow>>> = new Map();

  /** 聚合数据存储：seriesId -> AggregatedPoint[] */
  private aggregatedData: Map<string, AggregatedPoint[]> = new Map();

  /** 最后数据点时间戳：seriesId -> timestamp，用于验证时间顺序 */
  private lastDataPointTimestamps: Map<string, Date> = new Map();

  /**
   * 创建时间序列定义
   *
   * @param seriesDefinition - 序列定义
   */
  createSeries(seriesDefinition: SeriesDefinition): void {
    this.seriesDefinitions.set(seriesDefinition.seriesId, seriesDefinition);
  }

  /**
   * 删除时间序列定义
   *
   * @param seriesId - 序列 ID
   */
  removeSeries(seriesId: string): void {
    this.seriesDefinitions.delete(seriesId);
    this.activeWindows.delete(seriesId);
    this.aggregatedData.delete(seriesId);
    this.lastDataPointTimestamps.delete(seriesId);
  }

  /**
   * 添加数据点到时间序列
   *
   * @param seriesId - 序列 ID
   * @param dataPoint - 数据点
   * @throws 如果序列不存在、数据点无效或时间顺序错误
   */
  addDataPoint(seriesId: string, dataPoint: DataPoint): void {
    // 验证序列定义
    const seriesDef = this.seriesDefinitions.get(seriesId);
    if (!seriesDef) {
      throw new Error(`Series ${seriesId} does not exist`);
    }

    // 验证数据点
    if (!dataPoint.timestamp || isNaN(dataPoint.value)) {
      throw new Error('Invalid data point: timestamp must be a valid Date, value must be a number');
    }

    // 验证时间顺序（不能逆时添加）
    const lastTimestamp = this.lastDataPointTimestamps.get(seriesId);
    if (lastTimestamp && dataPoint.timestamp < lastTimestamp) {
      throw new Error(
        `Invalid data point: timestamp ${dataPoint.timestamp.toISOString()} is before the last data point ${lastTimestamp.toISOString()}. Time series data must be added in chronological order.`
      );
    }

    // 更新最后数据点时间戳
    this.lastDataPointTimestamps.set(seriesId, dataPoint.timestamp);

    // 获取或创建活跃窗口 Map
    let granularityWindows = this.activeWindows.get(seriesId);
    if (!granularityWindows) {
      granularityWindows = new Map();
      this.activeWindows.set(seriesId, granularityWindows);
    }

    // 为每个粒度创建或更新窗口（默认支持所有粒度）
    const allGranularities = Object.values(Granularity);
    for (const granularity of allGranularities) {
      const windowKey = generateWindowKey(seriesId, granularity, dataPoint.timestamp);

      // 获取该粒度的窗口 Map
      let windowsMap = granularityWindows.get(granularity);
      if (!windowsMap) {
        windowsMap = new Map();
        granularityWindows.set(granularity, windowsMap);
      }

      const existingWindow = windowsMap.get(windowKey);

      if (existingWindow) {
        // 窗口存在，更新累加器
        if (existingWindow.status === WindowStatus.ACTIVE) {
          existingWindow.accumulator = updateAccumulator(existingWindow.accumulator, dataPoint);
          existingWindow.dataPoints.push(dataPoint);
        }
      } else {
        // 创建新窗口
        const startTime = alignTimeToGranularity(dataPoint.timestamp, granularity);
        const endTime = new Date(startTime.getTime() + getGranularityMilliseconds(granularity));

        const newWindow: TimeWindow = {
          windowId: windowKey,
          seriesId,
          granularity,
          startTime,
          endTime,
          status: WindowStatus.ACTIVE,
          dataPoints: [dataPoint],
          accumulator: updateAccumulator(initializeAccumulator(), dataPoint),
        };

        windowsMap.set(windowKey, newWindow);
      }
    }

    // 检查并关闭已完成的窗口（基于数据点时间戳，而非系统时间）
    this.checkAndCloseWindows(seriesId, dataPoint.timestamp);
  }

  /**
   * 检查并关闭已完成的窗口
   *
   * 基于数据点时间戳判断窗口是否应该关闭，而非依赖系统时间
   * 当新数据点的时间戳超过了窗口的 endTime 时，该窗口应该关闭
   *
   * @param seriesId - 序列 ID
   * @param currentTimestamp - 当前数据点的时间戳
   */
  private checkAndCloseWindows(seriesId: string, currentTimestamp: Date): void {
    const granularityWindows = this.activeWindows.get(seriesId);
    if (!granularityWindows) return;

    const seriesDef = this.seriesDefinitions.get(seriesId);
    if (!seriesDef) return;

    for (const [granularity, windowsMap] of granularityWindows.entries()) {
      for (const [windowKey, window] of windowsMap.entries()) {
        // 当窗口的 endTime 早于或等于当前数据点时间戳时，关闭该窗口
        // 这意味着当前数据点的时间戳已经超出了该窗口的时间范围
        if (window.status === WindowStatus.ACTIVE && window.endTime <= currentTimestamp) {
          // 关闭窗口
          window.status = WindowStatus.CLOSED;

          // 创建聚合数据点
          const aggregatedPoint = createAggregatedPoint(
            window.accumulator,
            window.startTime,
            window.endTime,
            seriesId,
            granularity
          );

          // 存储聚合数据
          let seriesAggregated = this.aggregatedData.get(seriesId);
          if (!seriesAggregated) {
            seriesAggregated = [];
          }
          seriesAggregated.push(aggregatedPoint);
          this.aggregatedData.set(seriesId, seriesAggregated);

          // 从活跃窗口中移除
          windowsMap.delete(windowKey);
        }
      }
    }
  }

  /**
   * 查询聚合数据
   *
   * @param options - 查询选项
   * @returns 聚合数据点数组
   */
  queryAggregatedData(options: {
    seriesId: string;
    granularity: Granularity;
    startTime: Date;
    endTime: Date;
  }): AggregatedPoint[] {
    // 验证序列定义
    const seriesDef = this.seriesDefinitions.get(options.seriesId);
    if (!seriesDef) {
      throw new Error(`Series ${options.seriesId} does not exist`);
    }

    // 验证时间范围
    if (options.startTime > options.endTime) {
      throw new Error('Start time must be before end time');
    }

    // 获取聚合数据
    const seriesAggregated = this.aggregatedData.get(options.seriesId);
    if (!seriesAggregated) {
      return [];
    }

    // 过滤和排序
    return seriesAggregated
      .filter(point =>
        point.seriesId === options.seriesId &&
        point.granularity === options.granularity &&
        point.startTime >= options.startTime &&
        point.endTime <= options.endTime
      )
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  /**
   * 获取最新数据
   *
   * @param seriesId - 序列 ID
   * @param granularity - 时间粒度
   * @returns 最新的聚合数据点
   */
  getLatestData(seriesId: string, granularity: Granularity): AggregatedPoint | null {
    const seriesAggregated = this.aggregatedData.get(seriesId);
    if (!seriesAggregated) return null;

    const filtered = seriesAggregated.filter(point =>
      point.seriesId === seriesId &&
      point.granularity === granularity
    );

    if (filtered.length === 0) return null;

    return filtered.reduce((latest, current) =>
      current.endTime.getTime() > latest.endTime.getTime() ? current : latest
    );
  }

  /**
   * 获取所有序列 ID
   *
   * @returns 序列 ID 数组
   */
  getAllSeriesIds(): string[] {
    return Array.from(this.seriesDefinitions.keys());
  }

  /**
   * 清除指定序列的所有聚合数据
   *
   * @param seriesId - 序列 ID
   */
  clearAggregatedData(seriesId: string): void {
    this.aggregatedData.delete(seriesId);
  }

  /**
   * 清除指定序列在指定时间之前的聚合数据
   *
   * @param seriesId - 序列 ID
   * @param beforeTime - 清除此时间之前的数据
   */
  clearAggregatedDataBefore(seriesId: string, beforeTime: Date): void {
    const seriesAggregated = this.aggregatedData.get(seriesId);
    if (!seriesAggregated) return;

    const filtered = seriesAggregated.filter(point => point.endTime >= beforeTime);
    this.aggregatedData.set(seriesId, filtered);
  }

  /**
   * 清除指定序列的所有活跃窗口
   * 注意：这会丢弃所有未关闭的窗口及其数据
   *
   * @param seriesId - 序列 ID
   */
  clearActiveWindows(seriesId: string): void {
    this.activeWindows.delete(seriesId);
  }
}
