import { LifecycleError, ErrorCode } from '../types';

/**
 * 游戏主循环管理器 - 简化版本
 * 
 * 基于 Unreal Engine FEngineLoop::Tick 设计模式
 * 负责按帧率执行生命周期循环，委托给 GameObjectManager 处理具体逻辑
 */
export class GameLoop {
  private fps: number = 30;
  private tickInterval: number = 1000 / 30; // 毫秒
  private isRunning: boolean = false;
  private intervalId: NodeJS.Timeout | null = null;
  
  // 性能监控
  private startTime: number = 0;
  private frameNumber: number = 0;
  private lastTickTime: number = 0;
  private lastTickDuration: number = 0;
  private actualFPS: number = 0;
  private fpsCalculationWindow: number[] = [];
  private readonly fpsWindowSize = 10;

  // 简化：直接引用 GameObjectManager
  private manager: any; // 使用 any 避免循环依赖

  /**
   * 构造函数
   * 
   * @param manager GameObjectManager 实例
   */
  constructor(manager: any) {
    this.manager = manager;
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
   * 主循环 Tick 方法 - 简化版本
   * 委托给 GameObjectManager 处理具体逻辑
   */
  private tick(): void {
    const tickStartTime = Date.now();
    const deltaTime = (tickStartTime - this.lastTickTime) / 1000; // 转换为秒
    
    // 增加帧号
    this.frameNumber++;
    
    try {
      // 委托给 GameObjectManager 处理所有对象逻辑
      this.manager.tick(deltaTime);

      // 更新性能统计
      this.updatePerformanceStats(tickStartTime);

    } catch (error) {
      console.error(`Critical error in game loop tick (frame ${this.frameNumber}):`, error);
      // 游戏循环本身的错误不应该停止循环，但需要记录
    }

    this.lastTickTime = tickStartTime;
    this.lastTickDuration = Date.now() - tickStartTime;
  }

  /**
   * 更新性能统计
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
  // 公共访问方法 - 简化版本
  // ============================================================================

  /**
   * 检查循环是否正在运行
   */
  isLoopRunning(): boolean {
    return this.isRunning;
  }

  /**
   * 获取目标帧率
   */
  getTargetFPS(): number {
    return this.fps;
  }

  /**
   * 获取实际帧率
   */
  getActualFPS(): number {
    return this.actualFPS;
  }

  /**
   * 获取运行时长（毫秒）
   */
  getUptime(): number {
    if (!this.isRunning) {
      return 0;
    }
    return Date.now() - this.startTime;
  }

  /**
   * 获取当前帧号
   */
  getFrameNumber(): number {
    return this.frameNumber;
  }

  /**
   * 获取总帧数（兼容性方法）
   * @deprecated 使用 getFrameNumber() 替代
   */
  getTotalTicks(): number {
    return this.frameNumber;
  }

  /**
   * 获取上次Tick执行时长（毫秒）
   */
  getLastTickDuration(): number {
    return this.lastTickDuration;
  }

  /**
   * 获取性能统计信息
   */
  getPerformanceStats(): {
    fps: number;
    targetFPS: number;
    objectCount: number;
    tickDuration: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
    totalTicks: number;
    frameNumber: number;
  } {
    return {
      fps: this.actualFPS,
      targetFPS: this.fps,
      objectCount: this.manager.getTotalObjectCount(),
      tickDuration: this.lastTickDuration,
      memoryUsage: process.memoryUsage(),
      uptime: this.getUptime(),
      totalTicks: this.frameNumber,
      frameNumber: this.frameNumber
    };
  }

  /**
   * 获取循环状态信息
   */
  getLoopStatus(): {
    isRunning: boolean;
    fps: number;
    uptime: number;
    totalTicks: number;
    frameNumber: number;
  } {
    return {
      isRunning: this.isRunning,
      fps: this.fps,
      uptime: this.getUptime(),
      totalTicks: this.frameNumber,
      frameNumber: this.frameNumber
    };
  }
}