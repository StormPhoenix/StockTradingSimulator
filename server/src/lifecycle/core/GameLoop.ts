import { IIdGenerator, GameObjectState, LifecycleError, ErrorCode } from '../types';
import { GameObjectStateManager } from './GameObjectStateManager';
import { ErrorIsolationManager } from './ErrorIsolationManager';

/**
 * 游戏主循环管理器
 * 
 * 基于 Unreal Engine FEngineLoop::Tick 设计模式
 * 负责按帧率执行生命周期循环，管理对象状态转换和生命周期方法调用
 */
export class GameLoop {
  private fps: number = 30;
  private tickInterval: number = 1000 / 30; // 毫秒
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // 性能监控
  private startTime: number = 0;
  private frameNumber: number = 0; // 当前帧号，从1开始，替代原来的totalTicks
  private lastTickTime: number = 0;
  private lastTickDuration: number = 0;
  private actualFPS: number = 0;
  private fpsCalculationWindow: number[] = [];
  private readonly fpsWindowSize = 10;

  // 核心组件
  private stateManager: GameObjectStateManager;
  private errorManager: ErrorIsolationManager;
  private idGenerator: IIdGenerator;

  /**
   * 构造函数
   * 
   * @param idGenerator ID生成器
   * @param maxErrorsPerObject 每个对象的最大错误次数，默认为3
   */
  constructor(idGenerator: IIdGenerator, maxErrorsPerObject: number = 3) {
    this.idGenerator = idGenerator;
    this.stateManager = new GameObjectStateManager();
    this.errorManager = new ErrorIsolationManager(maxErrorsPerObject);
  }

  /**
   * 启动游戏循环
   * 
   * @throws LifecycleError 如果循环已经在运行
   */
  start(): void {
    if (this.isRunning) {
      throw new LifecycleError(
        'Game loop is already running',
        ErrorCode.LOOP_ALREADY_RUNNING
      );
    }

    this.isRunning = true;
    this.startTime = Date.now();
    this.frameNumber = 0; // 重置帧号
    this.lastTickTime = Date.now();
    this.fpsCalculationWindow = [];

    // 启动定时器
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);

    console.log(`Game loop started at ${this.fps} FPS`);
  }

  /**
   * 停止游戏循环
   * 
   * @throws LifecycleError 如果循环未在运行
   */
  stop(): void {
    if (!this.isRunning) {
      throw new LifecycleError(
        'Game loop is not running',
        ErrorCode.LOOP_NOT_RUNNING
      );
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log(`Game loop stopped after ${this.frameNumber} frames`);
  }

  /**
   * 设置目标帧率
   * 
   * @param fps 目标帧率 (1-120)
   * @throws LifecycleError 如果帧率超出有效范围
   */
  setFPS(fps: number): void {
    if (fps < 1 || fps > 120) {
      throw new LifecycleError(
        `FPS must be between 1 and 120, got ${fps}`,
        ErrorCode.INVALID_FPS
      );
    }

    this.fps = fps;
    this.tickInterval = 1000 / fps;

    // 如果循环正在运行，重启定时器
    if (this.isRunning && this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => {
        this.tick();
      }, this.tickInterval);
    }

    console.log(`FPS set to ${fps} (${this.tickInterval.toFixed(2)}ms interval)`);
  }

  /**
   * 主循环 Tick 方法
   * 执行所有对象的生命周期方法
   */
  private tick(): void {
    const tickStartTime = Date.now();
    const deltaTime = (tickStartTime - this.lastTickTime) / 1000; // 转换为秒
    
    // 增加帧号
    this.frameNumber++;
    
    try {
      // 1. 处理 READY -> ACTIVE 状态转换
      this.processReadyObjects();

      // 2. 处理 ACTIVE 对象的 onTick
      this.processActiveObjects(deltaTime);

      // 3. 处理 DESTROYING -> DESTROYED 状态转换
      this.processDestroyingObjects();

      // 4. 清理 DESTROYED 对象
      this.cleanupDestroyedObjects();

      // 5. 更新性能统计
      this.updatePerformanceStats(tickStartTime);

    } catch (error) {
      console.error(`Critical error in game loop tick (frame ${this.frameNumber}):`, error);
      // 游戏循环本身的错误不应该停止循环，但需要记录
    }

    this.lastTickTime = tickStartTime;
    this.lastTickDuration = Date.now() - tickStartTime;
  }

  /**
   * 处理 READY 状态的对象
   * 调用 onBeginPlay 并转换到 ACTIVE 状态
   */
  private processReadyObjects(): void {
    this.stateManager.forEachReady((obj) => {
      const success = this.errorManager.safeExecute(
        obj,
        'onBeginPlay',
        obj.onBeginPlay.bind(obj)
      );

      if (success) {
        // 只有在 onBeginPlay 成功执行时才转换状态
        try {
          this.stateManager.transitionState(obj, GameObjectState.ACTIVE);
        } catch (error) {
          console.error(`Failed to transition object ${obj.id} to ACTIVE:`, error);
        }
      }
    });
  }

  /**
   * 处理 ACTIVE 状态的对象
   * 调用 onTick 方法
   * 
   * @param deltaTime 时间间隔（秒）
   */
  private processActiveObjects(deltaTime: number): void {
    this.stateManager.forEachActive((obj) => {
      this.errorManager.safeExecute(
        obj,
        'onTick',
        obj.onTick.bind(obj),
        deltaTime
      );
    });
  }

  /**
   * 处理 DESTROYING 状态的对象
   * 调用 onDestroy 并转换到 DESTROYED 状态
   */
  private processDestroyingObjects(): void {
    this.stateManager.forEachDestroying((obj) => {
      const success = this.errorManager.safeExecute(
        obj,
        'onDestroy',
        obj.onDestroy.bind(obj)
      );

      // 无论 onDestroy 是否成功，都要转换到 DESTROYED 状态
      // 这样可以避免对象卡在 DESTROYING 状态
      try {
        this.stateManager.transitionState(obj, GameObjectState.DESTROYED);
      } catch (error) {
        console.error(`Failed to transition object ${obj.id} to DESTROYED:`, error);
      }
    });
  }

  /**
   * 清理已销毁的对象
   */
  private cleanupDestroyedObjects(): void {
    const destroyedObjects = this.stateManager.getObjectsByState(GameObjectState.DESTROYED);
    const destroyedIds = destroyedObjects.map(obj => obj.id);
    
    // 从状态管理器中移除
    for (const obj of destroyedObjects) {
      this.stateManager.removeObject(obj.id);
    }

    // 清理错误记录
    if (destroyedIds.length > 0) {
      this.errorManager.cleanupDestroyedObjects(destroyedIds);
    }
  }

  /**
   * 更新性能统计
   * 
   * @param tickStartTime Tick开始时间
   */
  private updatePerformanceStats(tickStartTime: number): void {
    // 计算实际FPS
    this.fpsCalculationWindow.push(tickStartTime);
    
    // 保持窗口大小
    if (this.fpsCalculationWindow.length > this.fpsWindowSize) {
      this.fpsCalculationWindow.shift();
    }

    // 计算平均FPS
    if (this.fpsCalculationWindow.length >= 2) {
      const timeSpan = this.fpsCalculationWindow[this.fpsCalculationWindow.length - 1] - 
                      this.fpsCalculationWindow[0];
      const tickCount = this.fpsCalculationWindow.length - 1;
      this.actualFPS = (tickCount * 1000) / timeSpan;
    }
  }

  // ============================================================================
  // 公共访问方法
  // ============================================================================

  /**
   * 获取状态管理器
   * 
   * @returns 状态管理器实例
   */
  getStateManager(): GameObjectStateManager {
    return this.stateManager;
  }

  /**
   * 获取错误管理器
   * 
   * @returns 错误管理器实例
   */
  getErrorManager(): ErrorIsolationManager {
    return this.errorManager;
  }

  /**
   * 获取ID生成器
   * 
   * @returns ID生成器实例
   */
  getIdGenerator(): IIdGenerator {
    return this.idGenerator;
  }

  /**
   * 检查循环是否正在运行
   * 
   * @returns 是否正在运行
   */
  isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取目标帧率
   * 
   * @returns 目标帧率
   */
  getTargetFPS(): number {
    return this.fps;
  }

  /**
   * 获取实际帧率
   * 
   * @returns 实际帧率
   */
  getActualFPS(): number {
    return this.actualFPS;
  }

  /**
   * 获取运行时长（毫秒）
   * 
   * @returns 运行时长
   */
  getUptime(): number {
    if (!this.isRunning) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * 获取当前帧号
   * 帧号从1开始，每次tick递增，替代原来的getTotalTicks()
   * 
   * @returns 当前帧号
   */
  getFrameNumber(): number {
    return this.frameNumber;
  }

  /**
   * 获取总帧数（兼容性方法）
   * 
   * @returns 总帧数
   * @deprecated 使用 getFrameNumber() 替代
   */
  getTotalTicks(): number {
    return this.frameNumber;
  }

  /**
   * 获取上次Tick执行时长（毫秒）
   * 
   * @returns Tick执行时长
   */
  getLastTickDuration(): number {
    return this.lastTickDuration;
  }

  /**
   * 获取性能统计信息
   * 
   * @returns 性能统计
   */
  getPerformanceStats(): {
    fps: number;
    targetFPS: number;
    objectCount: number;
    tickDuration: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    totalTicks: number; // 兼容性字段，实际返回frameNumber
    frameNumber: number;
  } {
    return {
      fps: this.actualFPS,
      targetFPS: this.fps,
      objectCount: this.stateManager.getTotalObjectCount(),
      tickDuration: this.lastTickDuration,
      memoryUsage: process.memoryUsage(),
      uptime: this.getUptime(),
      totalTicks: this.frameNumber, // 兼容性：返回frameNumber
      frameNumber: this.frameNumber
    };
  }

  /**
   * 获取循环状态信息
   * 
   * @returns 循环状态
   */
  getLoopStatus(): {
    isRunning: boolean;
    fps: number;
    uptime: number;
    totalTicks: number; // 兼容性字段，实际返回frameNumber
    frameNumber: number;
  } {
    return {
      isRunning: this.isRunning,
      fps: this.fps,
      uptime: this.getUptime(),
      totalTicks: this.frameNumber, // 兼容性：返回frameNumber
      frameNumber: this.frameNumber
    };
  }
}