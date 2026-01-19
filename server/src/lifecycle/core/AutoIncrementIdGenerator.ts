import { IIdGenerator } from '../types';

/**
 * 自增ID生成器实现
 * 
 * 提供简单高效的自增ID生成策略，适合大多数场景
 * 支持未来扩展为其他ID生成策略（UUID、雪花算法等）
 */
export class AutoIncrementIdGenerator implements IIdGenerator {
  private currentId: number = 0;

  /**
   * 生成下一个唯一ID
   * @returns 唯一的正整数ID
   */
  generateId(): number {
    return ++this.currentId;
  }

  /**
   * 获取当前ID值（不生成新ID）
   * @returns 当前ID值
   */
  getCurrentId(): number {
    return this.currentId;
  }

  /**
   * 重置ID生成器（主要用于测试）
   * @param startId 起始ID值，默认为0
   */
  reset(startId: number = 0): void {
    this.currentId = startId;
  }

  /**
   * 设置下一个ID值（用于从持久化状态恢复）
   * @param nextId 下一个要生成的ID值
   */
  setNextId(nextId: number): void {
    if (nextId <= 0) {
      throw new Error('Next ID must be a positive integer');
    }
    this.currentId = nextId - 1;
  }
}