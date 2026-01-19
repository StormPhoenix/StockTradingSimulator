import { Request, Response } from 'express'
import {
  ApiResponse,
  GameObjectStatsResponse,
  LoopStatus,
  PerformanceStats,
  StartLoopRequest,
} from '@shared/lifecycle'
import { GameObjectManager } from '../lifecycle/core/gameObjectManager'
import { ErrorCode, LifecycleError } from '../lifecycle/types'

/**
 * 生命周期控制器
 *
 * 提供 RESTful API 接口用于调试和监控生命周期管理系统
 * 包括对象管理、性能监控和系统控制功能
 */
export class LifecycleController {
  private gameObjectManager: GameObjectManager

  constructor(gameObjectManager: GameObjectManager) {
    this.gameObjectManager = gameObjectManager
  }

  // ============================================================================
  // GameObject Statistics Endpoints
  // ============================================================================

  /**
   * GET /api/debug/gameobjects/stats
   * 获取游戏对象统计信息（不暴露具体对象详情）
   */
  getObjectStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const allObjects = this.gameObjectManager.getAllObjects()
      const objectsByState = this.gameObjectManager.getObjectCount()
      const errorManager = this.gameObjectManager.getErrorManager()

      // 按类型统计
      const byType: Record<string, number> = {}
      allObjects.forEach(obj => {
        const typeName = obj.constructor.name
        byType[typeName] = (byType[typeName] || 0) + 1
      })

      // 错误统计
      let objectsWithErrors = 0
      let totalErrors = 0
      allObjects.forEach(obj => {
        const errorCount = errorManager.getErrorCount(obj.id)
        if (errorCount > 0) {
          objectsWithErrors++
          totalErrors += errorCount
        }
      })

      const response: ApiResponse<GameObjectStatsResponse> = {
        success: true,
        data: {
          total: allObjects.length,
          byState: {
            ready: objectsByState.READY || 0,
            active: objectsByState.ACTIVE || 0,
            paused: objectsByState.PAUSED || 0,
            destroying: objectsByState.DESTROYING || 0,
            destroyed: objectsByState.DESTROYED || 0,
          },
          byType,
          errorStats: {
            objectsWithErrors,
            totalErrors,
          },
        },
        message: `Retrieved stats for ${allObjects.length} objects`,
      }

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve object stats')
    }
  }

  // ============================================================================
  // System Monitoring Endpoints
  // ============================================================================

  /**
   * GET /api/debug/performance
   * 获取系统性能统计
   */
  getPerformanceStats = async (req: Request, res: Response): Promise<void> => {
    try {
      const systemOverview = this.gameObjectManager.getSystemOverview()
      const perfStats = systemOverview.performance

      const stats: PerformanceStats = {
        fps: perfStats.actualFPS,
        targetFPS: systemOverview.fps,
        objectCount: systemOverview.totalObjects,
        tickDuration: perfStats.tickDuration,
        memoryUsage: {
          rss: process.memoryUsage().rss,
          heapTotal: process.memoryUsage().heapTotal,
          heapUsed: process.memoryUsage().heapUsed,
          external: process.memoryUsage().external,
          arrayBuffers: process.memoryUsage().arrayBuffers,
        },
      }

      const response: ApiResponse<PerformanceStats> = {
        success: true,
        data: stats,
        message: 'Performance stats retrieved',
      }

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve performance stats')
    }
  }

  /**
   * GET /api/debug/loop/status
   * 获取游戏循环状态
   */
  getLoopStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const overview = this.gameObjectManager.getSystemOverview()

      const status: LoopStatus = {
        isRunning: overview.isRunning,
        fps: overview.fps,
        uptime: overview.performance.uptime,
        totalTicks: overview.performance.totalTicks,
      }

      const response: ApiResponse<LoopStatus> = {
        success: true,
        data: status,
        message: 'Loop status retrieved',
      }

      res.json(response)
    } catch (error) {
      this.handleError(res, error, 'Failed to retrieve loop status')
    }
  }

  // ============================================================================
  // System Control Endpoints
  // ============================================================================

  /**
   * POST /api/debug/loop/start
   * 启动游戏循环
   */
  startLoop = async (req: Request, res: Response): Promise<void> => {
    try {
      const { fps }: StartLoopRequest = req.body || {}

      // 验证FPS参数
      if (fps !== undefined) {
        if (typeof fps !== 'number' || fps < 1 || fps > 120) {
          const response: ApiResponse<null> = {
            success: false,
            data: null,
            message: 'FPS must be a number between 1 and 120',
          }
          res.status(400).json(response)
          return
        }
        this.gameObjectManager.setFPS(fps)
      }

      this.gameObjectManager.start()

      const actualFPS = this.gameObjectManager.getTargetFPS()
      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: `Game loop started at ${actualFPS} FPS`,
      }

      res.json(response)
    } catch (error) {
      if (error instanceof LifecycleError && error.code === ErrorCode.LOOP_ALREADY_RUNNING) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          message: error.message,
        }
        res.status(400).json(response)
        return
      }
      this.handleError(res, error, 'Failed to start loop')
    }
  }

  /**
   * POST /api/debug/loop/stop
   * 停止游戏循环
   */
  stopLoop = async (req: Request, res: Response): Promise<void> => {
    try {
      this.gameObjectManager.stop()

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        message: 'Game loop stopped',
      }

      res.json(response)
    } catch (error) {
      if (error instanceof LifecycleError && error.code === ErrorCode.LOOP_NOT_RUNNING) {
        const response: ApiResponse<null> = {
          success: false,
          data: null,
          message: error.message,
        }
        res.status(400).json(response)
        return
      }
      this.handleError(res, error, 'Failed to stop loop')
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  /**
   * 统一错误处理
   */
  private handleError(res: Response, error: any, defaultMessage: string): void {
    console.error('LifecycleController error:', error)

    const response: ApiResponse<null> = {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : defaultMessage,
    }

    res.status(500).json(response)
  }
}