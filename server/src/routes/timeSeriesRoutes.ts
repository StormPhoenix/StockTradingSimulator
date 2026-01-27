/**
 * Time Series Routes
 * 时间序列路由 - 提供时间序列相关的 API
 *
 * @feature 008-time-series-aggregation
 * @since 2026-01-27
 */

import { Router, Request, Response } from 'express';
import { timeSeriesService } from '../services/timeSeriesService';
import { TimeSeriesSimulationService } from '../services/timeSeriesSimulationService';
import { Granularity, DataType, Metric } from '../types/timeSeries';

const router = Router();

// 创建模拟服务实例
const simulationService = new TimeSeriesSimulationService(
  timeSeriesService.getManager()
);

/**
 * 创建时间序列
 * 创建时默认支持所有粒度
 */
router.post('/series', (req: Request, res: Response) => {
  try {
    const { seriesId, name, dataType, metrics } = req.body;

    if (!seriesId || !name || !dataType || !metrics) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, name, dataType, metrics',
      });
    }

    timeSeriesService.createSeries({
      seriesId,
      name,
      dataType: dataType as DataType,
      metrics: metrics as Metric[],
    });

    res.json({
      success: true,
      message: 'Series created successfully (all granularities supported)',
      data: { seriesId, name, dataType, metrics },
    });
  } catch (error) {
    console.error('Error creating series:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 批量添加数据点
 */
router.post('/data-points', (req: Request, res: Response) => {
  try {
    const { seriesId, dataPoints } = req.body;

    if (!seriesId || !dataPoints || !Array.isArray(dataPoints)) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, dataPoints (array)',
      });
    }

    timeSeriesService.addDataPoints(seriesId, dataPoints);

    res.json({
      success: true,
      message: `Added ${dataPoints.length} data points`,
      data: { count: dataPoints.length },
    });
  } catch (error) {
    console.error('Error adding data points:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 查询聚合数据
 */
router.get('/aggregated', (req: Request, res: Response) => {
  try {
    const { seriesId, granularity, startTime, endTime } = req.query;

    if (!seriesId || !granularity || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required query params: seriesId, granularity, startTime, endTime',
      });
    }

    const data = timeSeriesService.queryAggregatedData({
      seriesId: seriesId as string,
      granularity: granularity as Granularity,
      startTime: new Date(startTime as string),
      endTime: new Date(endTime as string),
    });

    res.json({
      success: true,
      data,
      count: data.length,
    });
  } catch (error) {
    console.error('Error querying aggregated data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取最新数据
 */
router.get('/latest/:seriesId/:granularity', (req: Request, res: Response) => {
  try {
    const { seriesId, granularity } = req.params;

    const data = timeSeriesService.getLatestData(seriesId as string, granularity as Granularity);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error getting latest data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 获取所有序列 ID
 */
router.get('/series', (req: Request, res: Response) => {
  try {
    const seriesIds = timeSeriesService.getAllSeriesIds();

    res.json({
      success: true,
      data: seriesIds,
      count: seriesIds.length,
    });
  } catch (error) {
    console.error('Error getting series IDs:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 删除序列
 */
router.delete('/series/:seriesId', (req: Request, res: Response) => {
  try {
    const { seriesId } = req.params;

    timeSeriesService.removeSeries(seriesId as string);

    res.json({
      success: true,
      message: 'Series deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting series:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 清除聚合数据
 */
router.delete('/aggregated/:seriesId', (req: Request, res: Response) => {
  try {
    const { seriesId } = req.params;
    const { beforeTime } = req.query;

    if (beforeTime) {
      timeSeriesService.clearAggregatedDataBefore(
        seriesId as string,
        new Date(beforeTime as string)
      );
    } else {
      timeSeriesService.clearAggregatedData(seriesId as string);
    }

    res.json({
      success: true,
      message: 'Aggregated data cleared successfully',
    });
  } catch (error) {
    console.error('Error clearing aggregated data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成模拟数据
 */
router.post('/simulate', (req: Request, res: Response) => {
  try {
    const {
      seriesId,
      baseTime,
      pointCount = 100,
      intervalSeconds = 60,
      initialPrice = 100,
      baseVolume = 1000,
      priceVolatility = 0.01,
      volumeVolatility = 0.5,
    } = req.body;

    if (!seriesId || !baseTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, baseTime',
      });
    }

    const dataPoints = simulationService.generateDataPoints({
      seriesId,
      baseTime: new Date(baseTime),
      pointCount,
      intervalSeconds,
      initialPrice,
      baseVolume,
      priceVolatility,
      volumeVolatility,
    });

    res.json({
      success: true,
      message: `Generated ${dataPoints.length} data points`,
      data: {
        count: dataPoints.length,
        seriesId,
        startTime: dataPoints[0].timestamp,
        endTime: dataPoints[dataPoints.length - 1].timestamp,
      },
    });
  } catch (error) {
    console.error('Error generating simulated data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

/**
 * 生成并添加模拟数据到时间序列
 */
router.post('/simulate-and-add', (req: Request, res: Response) => {
  try {
    const {
      seriesId,
      baseTime,
      pointCount = 100,
      intervalSeconds = 60,
      initialPrice = 100,
      baseVolume = 1000,
      priceVolatility = 0.01,
      volumeVolatility = 0.5,
    } = req.body;

    if (!seriesId || !baseTime) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: seriesId, baseTime',
      });
    }

    simulationService.generateAndAddDataPoints({
      seriesId,
      baseTime: new Date(baseTime),
      pointCount,
      intervalSeconds,
      initialPrice,
      baseVolume,
      priceVolatility,
      volumeVolatility,
    });

    res.json({
      success: true,
      message: `Generated and added ${pointCount} data points to series ${seriesId}`,
      data: {
        pointCount,
        seriesId,
      },
    });
  } catch (error) {
    console.error('Error generating and adding simulated data:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
});

export default router;
