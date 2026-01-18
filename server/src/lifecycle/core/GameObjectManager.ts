import { GameObject, GameObjectState, LifecycleError, ErrorCode, IIdGenerator } from '../types';
import { GameLoop } from './GameLoop';
import { AutoIncrementIdGenerator } from './AutoIncrementIdGenerator';

/**
 * 游戏对象管理器
 * 
 * 提供游戏对象的创建、销毁、暂停、恢复等管理功能
 * 作为外部系统与生命周期管理系统的主要接口
 * 
 * GameLoop 作为内部实现细节，不对外暴露
 */
export class GameObjectManager {
  private gameLoop: GameLoop;

  /**
   * 构造函数
   * 
   * @param idGenerator ID生成器，可选，默认使用AutoIncrementIdGenerator
   * @param maxErrorsPerObject 每个对象的最大错误次数，默认为3
   */
  constructor(idGenerator?: IIdGenerator, maxErrorsPerObject: number = 3) {
    // 如果没有提供ID生成器，使用默认的自增ID生成器
    const generator = idGenerator || new AutoIncrementIdGenerator();
    
    // 创建内部GameLoop实例
    this.gameLoop = new GameLoop(generator, maxErrorsPerObject);
  }

  /**
   * 启动生命周期管理系统
   * 
   * @throws LifecycleError 如果系统已经在运行
   */
  start(): void {
    this.gameLoop.start();
  }

  /**
   * 停止生命周期管理系统
   * 
   * @throws LifecycleError 如果系统未在运行
   */
  stop(): void {
    this.gameLoop.stop();
  }

  /**
   * 设置目标帧率
   * 
   * @param fps 目标帧率 (1-120)
   * @throws LifecycleError 如果帧率超出有效范围
   */
  setFPS(fps: number): void {
    this.gameLoop.setFPS(fps);
  }

  /**
   * 检查系统是否正在运行
   * 
   * @returns 是否正在运行
   */
  isRunning(): boolean {
    return this.gameLoop.isLoopRunning();
  }

  /**
   * 获取目标帧率
   * 
   * @returns 目标帧率
   */
  getTargetFPS(): number {
    return this.gameLoop.getTargetFPS();
  }

  /**
   * 获取实际帧率
   * 
   * @returns 实际帧率
   */
  getActualFPS(): number {
    return this.gameLoop.getActualFPS();
  }

  /**
   * 获取当前帧号
   * 帧号从1开始，每次tick递增
   * 
   * @returns 当前帧号
   */
  getFrameNumber(): number {
    return this.gameLoop.getFrameNumber();
  }

  /**
   * 创建游戏对象
   * 使用泛型支持类型安全的对象创建
   * 
   * @param ObjectClass 对象类构造函数
   * @param args 构造函数参数
   * @returns 创建的对象实例
   * @throws LifecycleError 如果对象创建失败
   */
  createObject<T extends GameObject>(
    ObjectClass: new (id: number, ...args: any[]) => T,
    ...args: any[]
  ): T {
    try {
      // 生成唯一ID
      const id = this.gameLoop.getIdGenerator().generateId();
      
      // 创建对象实例
      const obj = new ObjectClass(id, ...args);
      
      // 验证对象是否正确实现了GameObject接口
      if (!this.isValidGameObject(obj)) {
        throw new LifecycleError(
          `Object does not properly implement GameObject interface`,
          ErrorCode.OBJECT_CREATION_FAILED,
          id
        );
      }

      // 设置初始状态
      obj.state = GameObjectState.READY;

      // 添加到状态管理器
      this.gameLoop.getStateManager().addObject(obj);

      console.log(`Created GameObject ${id} (${ObjectClass.name})`);
      return obj;

    } catch (error) {
      const err = error instanceof LifecycleError ? error : 
        new LifecycleError(
          `Failed to create object: ${error instanceof Error ? error.message : String(error)}`,
          ErrorCode.OBJECT_CREATION_FAILED
        );
      
      console.error('Object creation failed:', err.message);
      throw err;
    }
  }

  /**
   * 销毁游戏对象
   * 将对象状态转换为DESTROYING，在下一个循环中执行销毁逻辑
   * 
   * @param id 对象ID
   * @throws LifecycleError 如果对象不存在或已在销毁过程中
   */
  destroyObject(id: number): void {
    const obj = this.getObject(id);
    if (!obj) {
      throw new LifecycleError(
        `Object with id ${id} not found`,
        ErrorCode.OBJECT_NOT_FOUND,
        id
      );
    }

    // 检查对象是否已经在销毁过程中
    if (obj.state === GameObjectState.DESTROYING || obj.state === GameObjectState.DESTROYED) {
      throw new LifecycleError(
        `Object ${id} is already being destroyed`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }

    try {
      this.gameLoop.getStateManager().transitionState(obj, GameObjectState.DESTROYING);
      console.log(`Marked GameObject ${id} for destruction`);
    } catch (error) {
      throw new LifecycleError(
        `Failed to destroy object ${id}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }
  }

  /**
   * 暂停游戏对象
   * 将ACTIVE状态的对象转换为PAUSED状态
   * 
   * @param id 对象ID
   * @throws LifecycleError 如果对象不存在或状态不允许暂停
   */
  pauseObject(id: number): void {
    const obj = this.getObject(id);
    if (!obj) {
      throw new LifecycleError(
        `Object with id ${id} not found`,
        ErrorCode.OBJECT_NOT_FOUND,
        id
      );
    }

    if (obj.state !== GameObjectState.ACTIVE) {
      throw new LifecycleError(
        `Object ${id} is not in ACTIVE state (current: ${obj.state})`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }

    try {
      this.gameLoop.getStateManager().transitionState(obj, GameObjectState.PAUSED);
      console.log(`Paused GameObject ${id}`);
    } catch (error) {
      throw new LifecycleError(
        `Failed to pause object ${id}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }
  }

  /**
   * 恢复游戏对象
   * 将PAUSED状态的对象转换为ACTIVE状态
   * 
   * @param id 对象ID
   * @throws LifecycleError 如果对象不存在或状态不允许恢复
   */
  resumeObject(id: number): void {
    const obj = this.getObject(id);
    if (!obj) {
      throw new LifecycleError(
        `Object with id ${id} not found`,
        ErrorCode.OBJECT_NOT_FOUND,
        id
      );
    }

    if (obj.state !== GameObjectState.PAUSED) {
      throw new LifecycleError(
        `Object ${id} is not in PAUSED state (current: ${obj.state})`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }

    try {
      this.gameLoop.getStateManager().transitionState(obj, GameObjectState.ACTIVE);
      console.log(`Resumed GameObject ${id}`);
    } catch (error) {
      throw new LifecycleError(
        `Failed to resume object ${id}: ${error instanceof Error ? error.message : String(error)}`,
        ErrorCode.INVALID_STATE_TRANSITION,
        id
      );
    }
  }

  /**
   * 获取指定ID的游戏对象
   * 
   * @param id 对象ID
   * @returns 游戏对象或undefined
   */
  getObject(id: number): GameObject | undefined {
    return this.gameLoop.getStateManager().getObject(id);
  }

  /**
   * 获取所有游戏对象
   * 
   * @returns 所有对象的数组
   */
  getAllObjects(): GameObject[] {
    return this.gameLoop.getStateManager().getAllObjects();
  }

  /**
   * 获取指定状态的游戏对象
   * 
   * @param state 对象状态
   * @returns 该状态的对象数组
   */
  getObjectsByState(state: GameObjectState): GameObject[] {
    return this.gameLoop.getStateManager().getObjectsByState(state);
  }

  /**
   * 获取对象数量统计
   * 
   * @returns 各状态的对象数量
   */
  getObjectCount(): Record<GameObjectState, number> {
    return this.gameLoop.getStateManager().getStateStatistics();
  }

  /**
   * 获取总对象数量
   * 
   * @returns 总对象数量
   */
  getTotalObjectCount(): number {
    return this.gameLoop.getStateManager().getTotalObjectCount();
  }

  /**
   * 获取活跃对象数量（READY + ACTIVE + PAUSED）
   * 
   * @returns 活跃对象数量
   */
  getActiveObjectCount(): number {
    const stats = this.getObjectCount();
    return stats[GameObjectState.READY] + 
           stats[GameObjectState.ACTIVE] + 
           stats[GameObjectState.PAUSED];
  }

  /**
   * 批量创建对象
   * 
   * @param ObjectClass 对象类构造函数
   * @param count 创建数量
   * @param argsGenerator 参数生成函数，接收索引返回构造参数
   * @returns 创建的对象数组
   */
  createObjects<T extends GameObject>(
    ObjectClass: new (id: number, ...args: any[]) => T,
    count: number,
    argsGenerator?: (index: number) => any[]
  ): T[] {
    const objects: T[] = [];
    
    for (let i = 0; i < count; i++) {
      const args = argsGenerator ? argsGenerator(i) : [];
      const obj = this.createObject(ObjectClass, ...args);
      objects.push(obj);
    }

    console.log(`Batch created ${count} objects of type ${ObjectClass.name}`);
    return objects;
  }

  /**
   * 批量销毁对象
   * 
   * @param ids 对象ID数组
   * @returns 成功销毁的对象数量
   */
  destroyObjects(ids: number[]): number {
    let successCount = 0;
    
    for (const id of ids) {
      try {
        this.destroyObject(id);
        successCount++;
      } catch (error) {
        console.error(`Failed to destroy object ${id}:`, error);
      }
    }

    console.log(`Batch destroyed ${successCount}/${ids.length} objects`);
    return successCount;
  }

  /**
   * 销毁指定状态的所有对象
   * 
   * @param state 要销毁的对象状态
   * @returns 销毁的对象数量
   */
  destroyObjectsByState(state: GameObjectState): number {
    const objects = this.getObjectsByState(state);
    const ids = objects.map(obj => obj.id);
    return this.destroyObjects(ids);
  }

  /**
   * 清理所有对象
   * 销毁所有非DESTROYED状态的对象
   * 
   * @returns 销毁的对象数量
   */
  destroyAllObjects(): number {
    const allObjects = this.getAllObjects();
    const activeObjects = allObjects.filter(obj => obj.state !== GameObjectState.DESTROYED);
    const ids = activeObjects.map(obj => obj.id);
    return this.destroyObjects(ids);
  }

  /**
   * 获取对象详细信息（包含错误统计）
   * 
   * @param id 对象ID
   * @returns 对象详细信息
   */
  getObjectInfo(id: number): {
    id: number;
    state: GameObjectState;
    type: string;
    errorCount: number;
    errorHistory: Array<{
      timestamp: Date;
      error: string;
      phase: string;
    }>;
  } | undefined {
    const obj = this.getObject(id);
    if (!obj) {
      return undefined;
    }

    const errorManager = this.gameLoop.getErrorManager();
    const errorHistory = errorManager.getErrorHistory(id);

    return {
      id: obj.id,
      state: obj.state,
      type: obj.constructor.name,
      errorCount: errorManager.getErrorCount(id),
      errorHistory: errorHistory.map(record => ({
        timestamp: record.timestamp,
        error: record.error,
        phase: record.phase
      }))
    };
  }

  /**
   * 验证对象是否正确实现了GameObject接口
   * 
   * @param obj 要验证的对象
   * @returns 是否为有效的GameObject
   */
  private isValidGameObject(obj: any): obj is GameObject {
    return obj &&
           typeof obj.id === 'number' &&
           obj.id > 0 &&
           typeof obj.state === 'string' &&
           Object.values(GameObjectState).includes(obj.state) &&
           typeof obj.onBeginPlay === 'function' &&
           typeof obj.onTick === 'function' &&
           typeof obj.onDestroy === 'function';
  }

  /**
   * 获取系统状态概览
   * 
   * @returns 系统状态信息
   */
  getSystemOverview(): {
    isRunning: boolean;
    fps: number;
    totalObjects: number;
    objectsByState: Record<GameObjectState, number>;
    errorStatistics: {
      totalObjects: number;
      objectsWithErrors: number;
      totalErrors: number;
      objectsNearLimit: number;
    };
    performance: {
      actualFPS: number;
      tickDuration: number;
      uptime: number;
      totalTicks: number;
      frameNumber: number;
    };
  } {
    const loopStatus = this.gameLoop.getLoopStatus();
    const perfStats = this.gameLoop.getPerformanceStats();
    const errorStats = this.gameLoop.getErrorManager().getErrorStatistics();

    return {
      isRunning: loopStatus.isRunning,
      fps: loopStatus.fps,
      totalObjects: this.getTotalObjectCount(),
      objectsByState: this.getObjectCount(),
      errorStatistics: errorStats,
      performance: {
        actualFPS: perfStats.fps,
        tickDuration: perfStats.tickDuration,
        uptime: perfStats.uptime,
        totalTicks: perfStats.totalTicks,
        frameNumber: perfStats.frameNumber
      }
    };
  }
}