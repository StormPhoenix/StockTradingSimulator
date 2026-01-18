import { GameObject } from '../types';

/**
 * 安全游戏对象容器
 * 
 * 支持在遍历期间安全地进行增删操作，避免迭代器失效问题
 * 使用延迟操作机制，在遍历结束后统一处理待处理的增删操作
 */
export class SafeGameObjectContainer {
  private objects = new Map<number, GameObject>();
  private isIterating = false;
  private pendingAdditions = new Map<number, GameObject>();
  private pendingRemovals = new Set<number>();

  /**
   * 安全遍历所有对象
   * 在遍历期间的增删操作会被延迟到遍历结束后处理
   * 
   * @param callback 对每个对象执行的回调函数
   */
  forEachSafe(callback: (obj: GameObject) => void): void {
    this.isIterating = true;
    
    try {
      for (const obj of this.objects.values()) {
        // 检查对象是否仍然存在（可能在遍历过程中被标记删除）
        if (this.objects.has(obj.id) && !this.pendingRemovals.has(obj.id)) {
          callback(obj);
        }
      }
    } finally {
      this.isIterating = false;
      this.processPendingOperations();
    }
  }

  /**
   * 添加对象到容器
   * 如果正在遍历，操作会被延迟到遍历结束后执行
   * 
   * @param obj 要添加的游戏对象
   */
  add(obj: GameObject): void {
    if (this.isIterating) {
      this.pendingAdditions.set(obj.id, obj);
      // 如果对象之前被标记为删除，取消删除操作
      this.pendingRemovals.delete(obj.id);
    } else {
      this.objects.set(obj.id, obj);
    }
  }

  /**
   * 从容器中删除对象
   * 如果正在遍历，操作会被延迟到遍历结束后执行
   * 
   * @param id 要删除的对象ID
   */
  remove(id: number): void {
    if (this.isIterating) {
      this.pendingRemovals.add(id);
      // 如果对象之前被标记为添加，取消添加操作
      this.pendingAdditions.delete(id);
    } else {
      this.objects.delete(id);
    }
  }

  /**
   * 获取指定ID的对象
   * 
   * @param id 对象ID
   * @returns 游戏对象或undefined
   */
  get(id: number): GameObject | undefined {
    // 如果正在遍历期间，需要考虑待处理的操作
    if (this.isIterating) {
      if (this.pendingRemovals.has(id)) {
        return undefined;
      }
      return this.objects.get(id) || this.pendingAdditions.get(id);
    }
    
    return this.objects.get(id);
  }

  /**
   * 检查是否包含指定ID的对象
   * 
   * @param id 对象ID
   * @returns 是否包含该对象
   */
  has(id: number): boolean {
    if (this.isIterating) {
      if (this.pendingRemovals.has(id)) {
        return false;
      }
      return this.objects.has(id) || this.pendingAdditions.has(id);
    }
    
    return this.objects.has(id);
  }

  /**
   * 获取容器中对象的数量
   * 
   * @returns 对象数量
   */
  size(): number {
    if (this.isIterating) {
      return this.objects.size + this.pendingAdditions.size - this.pendingRemovals.size;
    }
    
    return this.objects.size;
  }

  /**
   * 获取所有对象的数组副本
   * 
   * @returns 对象数组
   */
  toArray(): GameObject[] {
    const result: GameObject[] = [];
    
    for (const obj of this.objects.values()) {
      if (!this.pendingRemovals.has(obj.id)) {
        result.push(obj);
      }
    }
    
    for (const obj of this.pendingAdditions.values()) {
      result.push(obj);
    }
    
    return result;
  }

  /**
   * 清空容器
   */
  clear(): void {
    if (this.isIterating) {
      // 如果正在遍历，标记所有对象为删除，清空待添加队列
      for (const id of this.objects.keys()) {
        this.pendingRemovals.add(id);
      }
      this.pendingAdditions.clear();
    } else {
      this.objects.clear();
    }
  }

  /**
   * 检查容器是否为空
   * 
   * @returns 是否为空
   */
  isEmpty(): boolean {
    return this.size() === 0;
  }

  /**
   * 处理待处理的增删操作
   * 在遍历结束后自动调用
   */
  private processPendingOperations(): void {
    // 处理删除操作
    for (const id of this.pendingRemovals) {
      this.objects.delete(id);
    }
    this.pendingRemovals.clear();
    
    // 处理添加操作
    for (const [id, obj] of this.pendingAdditions) {
      this.objects.set(id, obj);
    }
    this.pendingAdditions.clear();
  }

  /**
   * 获取当前是否正在遍历
   * 主要用于调试和测试
   * 
   * @returns 是否正在遍历
   */
  isCurrentlyIterating(): boolean {
    return this.isIterating;
  }

  /**
   * 获取待处理操作的统计信息
   * 主要用于调试和监控
   * 
   * @returns 待处理操作统计
   */
  getPendingOperationsStats(): {
    pendingAdditions: number;
    pendingRemovals: number;
  } {
    return {
      pendingAdditions: this.pendingAdditions.size,
      pendingRemovals: this.pendingRemovals.size
    };
  }
}