import { GameObject, GameObjectState, isValidStateTransition } from '../types';
import { SafeGameObjectContainer } from './SafeGameObjectContainer';

/**
 * 游戏对象状态管理器
 * 
 * 按状态分组管理游戏对象，提高遍历效率
 * 负责状态转换的验证和对象在不同状态容器间的移动
 */
export class GameObjectStateManager {
  private readyObjects = new SafeGameObjectContainer();
  private activeObjects = new SafeGameObjectContainer();
  private pausedObjects = new SafeGameObjectContainer();
  private destroyingObjects = new SafeGameObjectContainer();
  private destroyedObjects = new SafeGameObjectContainer();

  /**
   * 添加对象到对应状态的容器中
   * 
   * @param obj 游戏对象
   */
  addObject(obj: GameObject): void {
    const container = this.getContainerByState(obj.state);
    container.add(obj);
  }

  /**
   * 从所有容器中移除对象
   * 
   * @param objectId 对象ID
   */
  removeObject(objectId: number): void {
    this.readyObjects.remove(objectId);
    this.activeObjects.remove(objectId);
    this.pausedObjects.remove(objectId);
    this.destroyingObjects.remove(objectId);
    this.destroyedObjects.remove(objectId);
  }

  /**
   * 转换对象状态
   * 验证状态转换的有效性，并将对象移动到新的状态容器
   * 
   * @param obj 游戏对象
   * @param newState 新状态
   * @throws Error 如果状态转换无效
   */
  transitionState(obj: GameObject, newState: GameObjectState): void {
    const oldState = obj.state;
    
    // 验证状态转换是否有效
    if (!isValidStateTransition(oldState, newState)) {
      throw new Error(
        `Invalid state transition from ${oldState} to ${newState} for object ${obj.id}`
      );
    }

    // 从旧状态容器中移除
    const oldContainer = this.getContainerByState(oldState);
    oldContainer.remove(obj.id);

    // 更新对象状态
    obj.state = newState;

    // 添加到新状态容器
    const newContainer = this.getContainerByState(newState);
    newContainer.add(obj);
  }

  /**
   * 获取指定状态的对象容器
   * 
   * @param state 对象状态
   * @returns 对应的容器
   */
  getContainerByState(state: GameObjectState): SafeGameObjectContainer {
    switch (state) {
      case GameObjectState.READY:
        return this.readyObjects;
      case GameObjectState.ACTIVE:
        return this.activeObjects;
      case GameObjectState.PAUSED:
        return this.pausedObjects;
      case GameObjectState.DESTROYING:
        return this.destroyingObjects;
      case GameObjectState.DESTROYED:
        return this.destroyedObjects;
      default:
        throw new Error(`Unknown game object state: ${state}`);
    }
  }

  /**
   * 安全遍历指定状态的所有对象
   * 
   * @param state 对象状态
   * @param callback 对每个对象执行的回调函数
   */
  forEachInState(state: GameObjectState, callback: (obj: GameObject) => void): void {
    const container = this.getContainerByState(state);
    container.forEachSafe(callback);
  }

  /**
   * 安全遍历READY状态的对象
   * 
   * @param callback 回调函数
   */
  forEachReady(callback: (obj: GameObject) => void): void {
    this.readyObjects.forEachSafe(callback);
  }

  /**
   * 安全遍历ACTIVE状态的对象
   * 
   * @param callback 回调函数
   */
  forEachActive(callback: (obj: GameObject) => void): void {
    this.activeObjects.forEachSafe(callback);
  }

  /**
   * 安全遍历PAUSED状态的对象
   * 
   * @param callback 回调函数
   */
  forEachPaused(callback: (obj: GameObject) => void): void {
    this.pausedObjects.forEachSafe(callback);
  }

  /**
   * 安全遍历DESTROYING状态的对象
   * 
   * @param callback 回调函数
   */
  forEachDestroying(callback: (obj: GameObject) => void): void {
    this.destroyingObjects.forEachSafe(callback);
  }

  /**
   * 获取指定ID的对象，无论其状态如何
   * 
   * @param objectId 对象ID
   * @returns 游戏对象或undefined
   */
  getObject(objectId: number): GameObject | undefined {
    return this.readyObjects.get(objectId) ||
           this.activeObjects.get(objectId) ||
           this.pausedObjects.get(objectId) ||
           this.destroyingObjects.get(objectId) ||
           this.destroyedObjects.get(objectId);
  }

  /**
   * 检查是否包含指定ID的对象
   * 
   * @param objectId 对象ID
   * @returns 是否包含该对象
   */
  hasObject(objectId: number): boolean {
    return this.readyObjects.has(objectId) ||
           this.activeObjects.has(objectId) ||
           this.pausedObjects.has(objectId) ||
           this.destroyingObjects.has(objectId) ||
           this.destroyedObjects.has(objectId);
  }

  /**
   * 获取所有对象的数组
   * 
   * @returns 所有对象的数组
   */
  getAllObjects(): GameObject[] {
    return [
      ...this.readyObjects.toArray(),
      ...this.activeObjects.toArray(),
      ...this.pausedObjects.toArray(),
      ...this.destroyingObjects.toArray(),
      ...this.destroyedObjects.toArray()
    ];
  }

  /**
   * 获取指定状态的对象数组
   * 
   * @param state 对象状态
   * @returns 该状态的对象数组
   */
  getObjectsByState(state: GameObjectState): GameObject[] {
    const container = this.getContainerByState(state);
    return container.toArray();
  }

  /**
   * 获取各状态的对象数量统计
   * 
   * @returns 状态统计对象
   */
  getStateStatistics(): Record<GameObjectState, number> {
    return {
      [GameObjectState.READY]: this.readyObjects.size(),
      [GameObjectState.ACTIVE]: this.activeObjects.size(),
      [GameObjectState.PAUSED]: this.pausedObjects.size(),
      [GameObjectState.DESTROYING]: this.destroyingObjects.size(),
      [GameObjectState.DESTROYED]: this.destroyedObjects.size()
    };
  }

  /**
   * 获取总对象数量
   * 
   * @returns 总对象数量
   */
  getTotalObjectCount(): number {
    return this.readyObjects.size() +
           this.activeObjects.size() +
           this.pausedObjects.size() +
           this.destroyingObjects.size() +
           this.destroyedObjects.size();
  }

  /**
   * 清理已销毁的对象
   * 从DESTROYED状态容器中移除所有对象
   * 
   * @returns 清理的对象数量
   */
  cleanupDestroyedObjects(): number {
    const count = this.destroyedObjects.size();
    this.destroyedObjects.clear();
    return count;
  }

  /**
   * 清空所有容器
   * 主要用于系统重置或测试
   */
  clear(): void {
    this.readyObjects.clear();
    this.activeObjects.clear();
    this.pausedObjects.clear();
    this.destroyingObjects.clear();
    this.destroyedObjects.clear();
  }

  /**
   * 获取系统状态信息
   * 用于调试和监控
   * 
   * @returns 系统状态信息
   */
  getSystemInfo(): {
    totalObjects: number;
    stateStatistics: Record<GameObjectState, number>;
    pendingOperations: Record<string, { pendingAdditions: number; pendingRemovals: number }>;
  } {
    return {
      totalObjects: this.getTotalObjectCount(),
      stateStatistics: this.getStateStatistics(),
      pendingOperations: {
        ready: this.readyObjects.getPendingOperationsStats(),
        active: this.activeObjects.getPendingOperationsStats(),
        paused: this.pausedObjects.getPendingOperationsStats(),
        destroying: this.destroyingObjects.getPendingOperationsStats(),
        destroyed: this.destroyedObjects.getPendingOperationsStats()
      }
    };
  }
}