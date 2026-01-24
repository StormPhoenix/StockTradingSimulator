/**
 * 游戏实例 API 路由
 * 
 * 提供游戏实例创建、管理、监控的 RESTful API 端点
 */

/// <reference path="../types/express.d.ts" />
import { Router, Request, Response } from 'express';
import gameInstanceController from '../controllers/gameInstanceController';

const router = Router();

/**
 * 获取环境列表
 * GET /api/v1/environments
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    const environments = gameInstanceController.getEnvironments(userId);
    
    const response = {
      success: true,
      data: {
        environments: environments,
        meta: {
          total: environments.length,
          active: environments.filter(env => env.status === 'ACTIVE').length,
          creating: environments.filter(env => env.status === 'CREATING').length
        }
      }
    };
    
    res.json(response);
    
  } catch (error) {
    console.error('Failed to get environments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve environments'
      }
    });
  }
});

/**
 * 创建新环境
 * POST /api/v1/environments
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
        progressUrl: `/api/v1/environments/progress/${requestId}`
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
 * 获取环境详情
 * GET /api/v1/environments/:environmentId
 */
router.get('/:environmentId', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    const environment = gameInstanceController.getEnvironmentDetails(environmentId, userId);
    
    if (!environment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENVIRONMENT_NOT_FOUND',
          message: 'Environment not found'
        }
      });
    }
    
    res.json({
      success: true,
      data: environment
    });
    
  } catch (error) {
    console.error('Failed to get environment details:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve environment details'
      }
    });
  }
});

/**
 * 销毁环境
 * DELETE /api/v1/environments/:environmentId
 */
router.delete('/:environmentId', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    await gameInstanceController.destroyEnvironment(environmentId, userId);
    
    res.json({
      success: true,
      data: {
        message: 'Environment destroyed successfully',
        destroyedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Failed to destroy environment:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ENVIRONMENT_NOT_FOUND',
          message: 'Environment not found'
        }
      });
    } else if (error instanceof Error && error.message.includes('busy')) {
      res.status(409).json({
        success: false,
        error: {
          code: 'ENVIRONMENT_BUSY',
          message: 'Cannot destroy environment while creation is in progress'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to destroy environment'
        }
      });
    }
  }
});

/**
 * 获取创建进度
 * GET /api/v1/environments/progress/:requestId
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
 * 导出环境状态
 * GET /api/v1/environments/:environmentId/export
 */
router.get('/:environmentId/export', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const { format = 'json' } = req.query;
    
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    // 导出环境状态
    const exportData = await gameInstanceController.exportEnvironmentState(environmentId, userId);
    
    if (format === 'json') {
      res.json({
        success: true,
        data: exportData
      });
    } else {
      // 支持文件下载
      const filename = `environment-${environmentId}-${new Date().toISOString().split('T')[0]}.json`;
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.json(exportData);
    }
    
  } catch (error) {
    console.error('Failed to export environment:', error);
    
    if (error instanceof Error && error.message.includes('not found')) {
      res.status(404).json({
        success: false,
        error: {
          code: 'ENVIRONMENT_NOT_FOUND',
          message: 'Environment not found'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: {
          code: 'EXPORT_ERROR',
          message: 'Failed to export environment state'
        }
      });
    }
  }
});

/**
 * 获取交易日志
 * GET /api/v1/environments/:environmentId/logs
 */
router.get('/:environmentId/logs', async (req: Request, res: Response) => {
  try {
    const environmentId = req.params.environmentId as string;
    const { limit = 50, traderId } = req.query;
    
    // TODO: 从认证中间件获取用户ID
    const userId = req.user?.id || 'default-user';
    
    // 验证环境存在
    const environment = gameInstanceController.getEnvironmentDetails(environmentId, userId);
    
    if (!environment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'ENVIRONMENT_NOT_FOUND',
          message: 'Environment not found'
        }
      });
    }
    
    // TODO: 实现实际的日志获取逻辑
    const logs: any[] = []; // 从实际的 GameObject 实例获取日志
    
    res.json({
      success: true,
      data: logs,
      meta: {
        total: logs.length,
        limit: parseInt(limit as string),
        environmentId
      }
    });
    
  } catch (error) {
    console.error('Failed to get trading logs:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve trading logs'
      }
    });
  }
});

/**
 * 获取管理器状态 (调试端点)
 * GET /api/v1/environments/_status
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
gameInstanceController.on('progressUpdate', (progress) => {
  // TODO: 实现 WebSocket 或 Server-Sent Events 来推送进度更新
  console.log('Progress update:', progress);
});

gameInstanceController.on('environmentCreated', (event) => {
  console.log('Environment created:', event);
});

gameInstanceController.on('environmentCreationFailed', (event) => {
  console.error('Environment creation failed:', event);
});

gameInstanceController.on('environmentDestroyed', (event) => {
  console.log('Environment destroyed:', event);
});

// 定期清理过期的进度跟踪
setInterval(() => {
  gameInstanceController.cleanupExpiredProgress();
}, 60 * 60 * 1000); // 每小时清理一次

export default router;