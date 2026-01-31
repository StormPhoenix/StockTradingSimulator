/**
 * 游戏实例 API 路由
 * 
 * 提供游戏实例创建、管理、监控的 RESTful API 端点
 */

/// <reference path="../types/express.d.ts" />
import { Router, Request, Response } from 'express';
import gameInstanceController from '../controllers/gameInstanceController';
import { EnvironmentManagerEvents } from '../types/eventTypes';
import { CreationProgress } from '../../../shared/types/progress';
import { isValidKLineGranularity } from '../utils/klineGranularity';

const router = Router();

/**
 * 获取市场实例列表
 * GET /api/v1/market-instances
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    const marketInstances = gameInstanceController.getMarketInstances(userId);
    
    const response = {
      success: true,
      data: {
        marketInstances: marketInstances,
        meta: {
          total: marketInstances.length,
          active: marketInstances.filter(env => env.status === 'ACTIVE').length,
          creating: marketInstances.filter(env => env.status === 'CREATING').length
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Failed to get market instances:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve market instances'
      }
    });
  }
});

/**
 * 创建新市场实例
 * POST /api/v1/market-instances
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { templateId, name } = req.body;
    
    // 验证请求参数
    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Template ID is required'
        }
      });
    }
    
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    // 创建环境
    const requestId = gameInstanceController.createMarketInstance(templateId, userId, name);
    
    const response = {
      success: true,
      data: {
        requestId,
        message: 'Environment creation initiated',
        progressUrl: `/api/v1/market-instances/progress/${requestId}`
      }
    };
    
    res.status(202).json(response);
    
  } catch (error) {
    console.error('Failed to create environment:', error);
    
    if (error instanceof Error && error.message.includes('Template')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'TEMPLATE_NOT_FOUND',
          message: 'Market environment template not found'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to create environment'
        }
      });
    }
  }
});

/**
 * 市场实例 ID 子路由（子路由挂载，避免 :environmentId 吃掉 overview、stocks 等路径）
 * 挂载在 /:environmentId，路径如 /market-instances/123、/market-instances/123/overview
 */
const idRouter = Router({ mergeParams: true });

/**
 * 获取单只股票 K 线数据
 * GET /api/v1/market-instances/:environmentId/stocks/:symbol/kline
 * Query: granularity (必填 1m|5m|15m|30m|60m|1d|1w|1M), startTime?, endTime?, limit?
 */
idRouter.get('/stocks/:symbol/kline', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const symbol = req.params.symbol as string;
    const userId = req.user?.id || 'default-user';
    const granularity = (req.query.granularity as string) || '';
    const startTime = req.query.startTime as string | undefined;
    const endTime = req.query.endTime as string | undefined;
    const limitParam = req.query.limit as string | undefined;
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    if (!granularity || !isValidKLineGranularity(granularity)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'granularity is required and must be one of: 1m, 5m, 15m, 30m, 60m, 1d, 1w, 1M'
        }
      });
    }

    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }

    const result = gameInstanceController.getKLineData(environmentId, userId, symbol, {
      granularity,
      startTime,
      endTime,
      limit: limit && !isNaN(limit) ? limit : undefined
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found in this market instance' }
      });
    }

    res.json({
      success: true,
      data: {
        ...result,
        data: result.data.map(p => ({
          ...p,
          timestamp: p.timestamp.toISOString()
        }))
      }
    });
  } catch (error) {
    console.error('Failed to get kline:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve kline data' }
    });
  }
});

/**
 * 获取单只股票详情（占位，待实现或复用详情中的股票）
 * GET /api/v1/market-instances/:environmentId/stocks/:symbol
 */
idRouter.get('/stocks/:symbol', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const symbol = req.params.symbol as string;
    const userId = req.user?.id || 'default-user';
    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }
    const stock = marketInstance.stocks.find((s: { symbol: string }) => s.symbol === symbol);
    if (!stock) {
      return res.status(404).json({
        success: false,
        error: { code: 'STOCK_NOT_FOUND', message: 'Stock not found in this market instance' }
      });
    }
    res.json({ success: true, data: stock });
  } catch (error) {
    console.error('Failed to get stock:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve stock' }
    });
  }
});

/**
 * 获取交易所实例模拟时间与倍速（供总览页显示与轮询，倍速可被其他地方修改故需实时刷新）
 * GET /api/v1/market-instances/:environmentId/time
 */
idRouter.get('/time', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    const exchange = gameInstanceController.getExchangeInstance(environmentId, userId);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }
    const simulatedTime = exchange.getSimulatedTime();
    const timeAcceleration = exchange.getTimeAcceleration();
    res.json({
      success: true,
      data: {
        simulatedTime: simulatedTime.toISOString(),
        timeAcceleration
      }
    });
  } catch (error) {
    console.error('Failed to get simulated time:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve simulated time' }
    });
  }
});

/**
 * 设置交易所时间模拟倍速（0.1 - 1000）
 * PATCH /api/v1/market-instances/:environmentId/time
 * Body: { timeAcceleration: number }
 */
idRouter.patch('/time', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    const exchange = gameInstanceController.getExchangeInstance(environmentId, userId);
    if (!exchange) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }
    const value = req.body?.timeAcceleration;
    const timeAcceleration = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(timeAcceleration) || timeAcceleration < 0.1 || timeAcceleration > 1000) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'timeAcceleration must be a number between 0.1 and 1000'
        }
      });
    }
    exchange.setTimeAcceleration(timeAcceleration);
    const simulatedTime = exchange.getSimulatedTime();
    res.json({
      success: true,
      data: {
        simulatedTime: simulatedTime.toISOString(),
        timeAcceleration: exchange.getTimeAcceleration()
      }
    });
  } catch (error) {
    console.error('Failed to set time acceleration:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to set time acceleration' }
    });
  }
});

/**
 * 获取市场总览（占位，待实现；时间以游戏时间为准）
 * GET /api/v1/market-instances/:environmentId/overview
 */
idRouter.get('/overview', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }
    const exchange = gameInstanceController.getExchangeInstance(environmentId, userId);
    const simulatedTime = exchange ? exchange.getSimulatedTime().toISOString() : undefined;
    // 占位：todayVolume、volumeTrend 待从交易所游戏时间与 TimeSeriesManager 实现
    res.json({
      success: true,
      data: {
        statistics: {
          ...marketInstance.statistics,
          todayVolume: 0
        },
        volumeTrend: [],
        exchangeId: marketInstance.exchangeId,
        name: marketInstance.name,
        description: marketInstance.description,
        status: marketInstance.status,
        createdAt: marketInstance.createdAt,
        lastActiveAt: marketInstance.lastActiveAt,
        simulatedTime
      }
    });
  } catch (error) {
    console.error('Failed to get overview:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve overview' }
    });
  }
});

/**
 * 获取成交量趋势（占位，待实现；每点 volume 为时间窗口增量，时间字段用窗口 start）
 * GET /api/v1/market-instances/:environmentId/volume-trend
 */
idRouter.get('/volume-trend', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    }
    // 占位：从 TimeSeriesManager 按游戏时间查询，每点 volume 为窗口增量
    res.json({ success: true, data: [] });
  } catch (error) {
    console.error('Failed to get volume-trend:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve volume trend' }
    });
  }
});

/**
 * 获取市场实例详情
 * GET /api/v1/market-instances/:environmentId
 */
idRouter.get('/', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'MARKET_INSTANCE_NOT_FOUND',
          message: 'Market instance not found'
        }
      });
    }
    res.json({
      success: true,
      data: marketInstance
    });
  } catch (error) {
    console.error('Failed to get market instance details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve market instance details'
      }
    });
  }
});

/**
 * 销毁市场实例
 * DELETE /api/v1/market-instances/:environmentId
 */
idRouter.delete('/', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const userId = req.user?.id || 'default-user';
    await gameInstanceController.destroyMarketInstance(environmentId, userId);
    res.json({
      success: true,
      data: {
        message: 'Environment destroyed successfully',
        destroyedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Failed to destroy market instance:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    } else if (error instanceof Error && error.message.includes('busy')) {
      res.status(409).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_BUSY', message: 'Cannot destroy market instance while creation is in progress' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to destroy market instance' }
      });
    }
  }
});

/**
 * 导出市场实例状态
 * GET /api/v1/market-instances/:environmentId/export
 */
idRouter.get('/export', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const { format = 'json' } = req.query;
    const userId = req.user?.id || 'default-user';
    const exportData = await gameInstanceController.exportMarketInstanceState(environmentId, userId);
    if (format === 'json') {
      res.json({ success: true, data: exportData });
    } else {
      const filename = `market-instance-${environmentId}-${new Date().toISOString().split('T')[0]}.json`;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Failed to export market instance:', error);
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: { code: 'MARKET_INSTANCE_NOT_FOUND', message: 'Market instance not found' }
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'EXPORT_ERROR', message: 'Failed to export market instance state' }
      });
    }
  }
});

/**
 * 获取交易日志
 * GET /api/v1/market-instances/:environmentId/logs
 */
idRouter.get('/logs', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const { limit = 50, traderId } = req.query;
    const userId = req.user?.id || 'default-user';
    const marketInstance = gameInstanceController.getMarketInstanceDetails(environmentId, userId);
    if (!marketInstance) {
      return res.status(404).json({
        success: false,
        error: { code: 'ENVIRONMENT_NOT_FOUND', message: 'Environment not found' }
      });
    }
    const logs: any[] = [];
    res.json({
      success: true,
      data: logs,
      meta: { total: logs.length, limit: parseInt(limit as string), environmentId }
    });
  } catch (error) {
    console.error('Failed to get trading logs:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve trading logs' }
    });
  }
});

router.use('/:environmentId', idRouter);

/**
 * 获取创建进度
 * GET /api/v1/market-instances/progress/:requestId
 */
router.get('/progress/:requestId', async (req: Request, res: Response) => {
  try {
    const requestId = req.params.requestId as string;
    
    const progress = gameInstanceController.getCreationProgress(requestId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROGRESS_NOT_FOUND',
          message: 'Progress request not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: progress
    });
    
  } catch (error) {
    console.error('Failed to get creation progress:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve progress information'
      }
    });
  }
});

/**
 * 获取管理器状态 (调试端点)
 * GET /api/v1/market-instances/_status
 */
router.get('/_status', async (req: Request, res: Response) => {
  try {
    const status = gameInstanceController.getManagerStatus();
    
    res.json({
      success: true,
      data: status
    });
    
  } catch (error) {
    console.error('Failed to get manager status:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve manager status'
      }
    });
  }
});

// 设置进度更新事件监听器
gameInstanceController.bind(EnvironmentManagerEvents.PROGRESS_UPDATE, (progress: CreationProgress) => {
  // TODO: 实现 WebSocket 或 Server-Sent Events 来推送进度更新
  console.log('Progress update:', progress);
});

gameInstanceController.bind(EnvironmentManagerEvents.ENVIRONMENT_CREATED, (event: {
  requestId: string;
  environmentId: string;
  environment: any;
}) => {
  console.log('Environment created:', event);
});

gameInstanceController.bind(EnvironmentManagerEvents.ENVIRONMENT_CREATION_FAILED, (event: {
  requestId: string;
  error: any;
}) => {
  console.error('Environment creation failed:', event);
});

gameInstanceController.bind(EnvironmentManagerEvents.ENVIRONMENT_DESTROYED, (event: {
  environmentId: string;
  userId: string;
  destroyedAt: Date;
}) => {
  console.log('Environment destroyed:', event);
});

// 定期清理过期的进度跟踪
setInterval(() => {
  gameInstanceController.cleanupExpiredProgress();
}, 60 * 60 * 1000); // 每小时清理一次

export default router;