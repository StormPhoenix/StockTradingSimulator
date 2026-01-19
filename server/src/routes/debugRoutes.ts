import { Router } from 'express';
import { GameObjectDebugController } from '../controllers/gameObjectDebugController';
import { GameObjectManager } from '../lifecycle/core/gameObjectManager';

/**
 * 生命周期调试路由配置
 * 
 * 配置所有调试相关的 RESTful API 路由
 * 路径前缀: /api/debug
 */

/**
 * 创建调试路由
 * @param gameObjectManager GameObjectManager 实例
 * @returns Express Router 实例
 */
export function createDebugRoutes(gameObjectManager: GameObjectManager): Router {
  const router = Router();
  const controller = new GameObjectDebugController(gameObjectManager);

  // ============================================================================
  // GameObject Statistics Routes
  // ============================================================================

  /**
   * GET /gameobjects/stats
   * 获取游戏对象统计信息（不暴露具体对象详情）
   */
  router.get('/gameobjects/stats', controller.getObjectStats);

  // ============================================================================
  // System Monitoring Routes
  // ============================================================================

  /**
   * GET /performance
   * 获取系统性能统计
   */
  router.get('/performance', controller.getPerformanceStats);

  /**
   * GET /loop/status
   * 获取游戏循环状态
   */
  router.get('/loop/status', controller.getLoopStatus);

  // ============================================================================
  // System Control Routes
  // ============================================================================

  /**
   * POST /loop/start
   * 启动游戏循环
   */
  router.post('/loop/start', controller.startLoop);

  /**
   * POST /loop/stop
   * 停止游戏循环
   */
  router.post('/loop/stop', controller.stopLoop);

  return router;
}

/**
 * 默认导出路由创建函数
 */
export default createDebugRoutes;