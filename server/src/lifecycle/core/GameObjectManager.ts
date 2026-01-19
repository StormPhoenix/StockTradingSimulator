import { GameObject, GameObjectState, LifecycleError, ErrorCode, IIdGenerator, PendingRequest, PendingRequestType } from '../types';
import { GameLoop } from './GameLoop';
import { AutoIncrementIdGenerator } from './AutoIncrementIdGenerator';
import { ErrorIsolationManager } from './ErrorIsolationManager';

/**
 * 游戏对象管理器 - 简化版本
 * 
 * 采用单一容器设计：
 * 1. 使用一个 Map 存储所有对象，对象状态存储在 GameObject 内部
 * 2. 使用 PendingRequests 队列延迟处理对象的创建和销毁
 * 3. GameLoop Tick 分阶段处理：先处理队列，再执行对象逻辑
 */
export class GameObjectManager {
  // 简化的单一容器设计
  private objects = new Map<number, GameObject>();
  private pendingRequests: PendingRequest[] = [];
  private isProcessingTick = false;
  
  // 核心组件
  private gameLoop: GameLoop;
  private idGenerator: IIdGenerator;
  private errorManager: ErrorIsolationManager;

  /**
   * 构造函数
   * 
   * @param idGenerator ID生成器，可选，默认使用AutoIncrementIdGenerator
   * @param maxErrorsPerObject 每个对象的最大错误次数，默认为3
   */
  constructor(idGenerator?: IIdGenerator, maxErrorsPerObject: number = 3) {
    this.idGenerator = idGenerator || new AutoIncrementIdGenerator();
    this.errorManager = new ErrorIsolationManager(maxErrorsPerObject);
    
    // 创建简化的GameLoop，传入this作为管理器
    this.gameLoop = new GameLoop(this);
  }

  /**
   * 启动生命周期管理系统
   */
  start(): void {
    this.gameLoop.start();
  }

  /**
   * 停止生命周期管理系统
   */
  stop(): void {
    this.gameLoop.stop();
  }

  /**
   * 设置目标帧率
   */
  setFPS(fps: number): void {
    this.gameLoop.setFPS(fps);
  }

  /**
   * 检查系统是否正在运行
   */
  isRunning(): boolean {
    return this.gameLoop.isLoopRunning();
  }

  /**
   * 获取目标帧率
   */
  getTargetFPS(): number {
    return this.gameLoop.getTargetFPS();
  }

  /**
   * 获取实际帧率
   */
  getActualFPS(): number {
    return this.gameLoop.getActualFPS();
  }

  /**
   * 获取当前帧号
   */
  getFrameNumber(): number {
    return this.gameLoop.getFrameNumber();
  }

  /**
   * 创建游戏对象 - 简化版本
   * 对象创建后会被添加到 PendingRequests 队列，在下一个 Tick 中处理
   */
  createObject<T extends GameObject>(
    ObjectClass: new (id: number, ...args: any[]) => T,
    ...args: any[]
  ): T {
    try {
      // 生成唯一ID
      const id = this.idGenerator.generateId();
      
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

      // 设置初始状态为 READY
      obj.state = GameObjectState.READY;

      // 添加到 PendingRequests 队列，而不是直接加入容器
      this.pendingRequests.push({
        type: PendingRequestType.CREATE,
        objectId: id,
        object: obj,
        timestamp: Date.now()
      });

      console.log(`Queued GameObject ${id} (${ObjectClass.name}) for creation`);
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
   * 销毁游戏对象 - 简化版本
   * 标记对象状态为 DESTROYING，并添加到 PendingRequests 队列
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

    // 标记对象状态为 DESTROYING
    obj.state = GameObjectState.DESTROYING;

    // 添加到 PendingRequests 队列
    this.pendingRequests.push({
      type: PendingRequestType.DESTROY,
      objectId: id,
      timestamp: Date.now()
    });

    console.log(`Queued GameObject ${id} for destruction`);
  }

  /**
   * 暂停游戏对象 - 直接修改对象状态
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

    obj.state = GameObjectState.PAUSED;
    console.log(`Paused GameObject ${id}`);
  }

  /**
   * 恢复游戏对象 - 直接修改对象状态
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

    obj.state = GameObjectState.ACTIVE;
    console.log(`Resumed GameObject ${id}`);
  }

  /**
   * 获取指定ID的游戏对象 - 简化版本
   * 直接从单一容器中查找，O(1) 复杂度
   */
  getObject(id: number): GameObject | undefined {
    return this.objects.get(id);
  }

  /**
   * 获取所有游戏对象 - 简化版本
   */
  getAllObjects(): GameObject[] {
    return Array.from(this.objects.values());
  }

  /**
   * 获取指定状态的游戏对象 - 需要过滤
   * 注意：这个方法需要遍历所有对象，复杂度为 O(n)
   */
  getObjectsByState(state: GameObjectState): GameObject[] {
    const result: GameObject[] = [];
    for (const obj of this.objects.values()) {
      if (obj.state === state) {
        result.push(obj);
      }
    }
    return result;
  }

  /**
   * 获取对象数量统计 - 需要遍历计算
   */
  getObjectCount(): Record<GameObjectState, number> {
    const stats: Record<GameObjectState, number> = {
      [GameObjectState.READY]: 0,
      [GameObjectState.ACTIVE]: 0,
      [GameObjectState.PAUSED]: 0,
      [GameObjectState.DESTROYING]: 0,
      [GameObjectState.DESTROYED]: 0
    };

    for (const obj of this.objects.values()) {
      stats[obj.state]++;
    }

    return stats;
  }

  /**
   * 获取总对象数量 - O(1) 复杂度
   */
  getTotalObjectCount(): number {
    return this.objects.size;
  }

  /**
   * 获取活跃对象数量（READY + ACTIVE + PAUSED）
   */
  getActiveObjectCount(): number {
    let count = 0;
    for (const obj of this.objects.values()) {
      if (obj.state === GameObjectState.READY || 
          obj.state === GameObjectState.ACTIVE || 
          obj.state === GameObjectState.PAUSED) {
        count++;
      }
    }
    return count;
  }

  /**
   * 核心 Tick 方法 - 分阶段处理
   * 由 GameLoop 调用，按照简化方案分为多个阶段
   */
  tick(deltaTime: number): void {
    this.isProcessingTick = true;
    
    try {
      // 阶段1: 处理 PendingRequests 队列
      this.processPendingRequests();
      
      // 阶段2: 执行 ACTIVE 对象的 onTick
      this.tickActiveObjects(deltaTime);
      
    } finally {
      this.isProcessingTick = false;
    }
  }

  /**
   * 处理 PendingRequests 队列
   * 处理对象的创建和销毁请求
   */
  private processPendingRequests(): void {
    // 复制当前队列并清空，避免在处理过程中队列被修改
    const requests = [...this.pendingRequests];
    this.pendingRequests.length = 0;

    for (const request of requests) {
      try {
        if (request.type === PendingRequestType.CREATE && request.object) {
          // 处理对象创建
          this.processCreateRequest(request);
        } else if (request.type === PendingRequestType.DESTROY) {
          // 处理对象销毁
          this.processDestroyRequest(request);
        }
      } catch (error) {
        console.error(`Error processing request for object ${request.objectId}:`, error);
        // 错误隔离：单个请求的错误不应该影响其他请求的处理
      }
    }
  }

  /**
   * 处理对象创建请求
   */
  private processCreateRequest(request: PendingRequest): void {
    const obj = request.object!;
    
    // 调用 onBeginPlay
    const success = this.errorManager.safeExecute(
      obj,
      'onBeginPlay',
      obj.onBeginPlay.bind(obj)
    );

    if (success) {
      // onBeginPlay 成功，转换状态并加入容器
      obj.state = GameObjectState.ACTIVE;
      this.objects.set(obj.id, obj);
      console.log(`GameObject ${obj.id} created and activated`);
    } else {
      // onBeginPlay 失败，直接销毁对象
      console.error(`GameObject ${obj.id} onBeginPlay failed, destroying object`);
      obj.state = GameObjectState.DESTROYED;
    }
  }

  /**
   * 处理对象销毁请求
   */
  private processDestroyRequest(request: PendingRequest): void {
    const obj = this.objects.get(request.objectId);
    if (!obj) {
      return; // 对象已经被移除
    }

    // 调用 onDestroy
    this.errorManager.safeExecute(
      obj,
      'onDestroy',
      obj.onDestroy.bind(obj)
    );

    // 无论 onDestroy 是否成功，都要移除对象
    obj.state = GameObjectState.DESTROYED;
    this.objects.delete(obj.id);
    
    // 清理错误记录
    this.errorManager.cleanupDestroyedObjects([obj.id]);
    
    console.log(`GameObject ${obj.id} destroyed and removed`);
  }

  /**
   * 执行 ACTIVE 状态对象的 onTick
   */
  private tickActiveObjects(deltaTime: number): void {
    for (const obj of this.objects.values()) {
      if (obj.state === GameObjectState.ACTIVE) {
        this.errorManager.safeExecute(
          obj,
          'onTick',
          obj.onTick.bind(obj),
          deltaTime
        );
      }
    }
  }

  /**
   * 获取错误管理器
   */
  getErrorManager(): ErrorIsolationManager {
    return this.errorManager;
  }

  /**
   * 获取ID生成器
   */
  getIdGenerator(): IIdGenerator {
    return this.idGenerator;
  }

  /**
   * 获取待处理请求数量（用于调试）
   */
  getPendingRequestCount(): number {
    return this.pendingRequests.length;
  }

  /**
   * 获取待处理请求详情（用于调试）
   */
  getPendingRequests(): PendingRequest[] {
    return [...this.pendingRequests]; // 返回副本
  }

  /**
   * 批量创建对象
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
   */
  destroyObjectsByState(state: GameObjectState): number {
    const objects = this.getObjectsByState(state);
    const ids = objects.map(obj => obj.id);
    return this.destroyObjects(ids);
  }

  /**
   * 清理所有对象
   */
  destroyAllObjects(): number {
    const allObjects = this.getAllObjects();
    const activeObjects = allObjects.filter(obj => obj.state !== GameObjectState.DESTROYED);
    const ids = activeObjects.map(obj => obj.id);
    return this.destroyObjects(ids);
  }

  /**
   * 获取对象详细信息（包含错误统计）
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

    const errorHistory = this.errorManager.getErrorHistory(id);

    return {
      id: obj.id,
      state: obj.state,
      type: obj.constructor.name,
      errorCount: this.errorManager.getErrorCount(id),
      errorHistory: errorHistory.map(record => ({
        timestamp: record.timestamp,
        error: record.error,
        phase: record.phase
      }))
    };
  }

  /**
   * 验证对象是否正确实现了GameObject接口
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
   */
  getSystemOverview(): {
    isRunning: boolean;
    fps: number;
    totalObjects: number;
    objectsByState: Record<GameObjectState, number>;
    pendingRequests: number;
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
    const errorStats = this.errorManager.getErrorStatistics();

    return {
      isRunning: loopStatus.isRunning,
      fps: loopStatus.fps,
      totalObjects: this.getTotalObjectCount(),
      objectsByState: this.getObjectCount(),
      pendingRequests: this.getPendingRequestCount(),
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