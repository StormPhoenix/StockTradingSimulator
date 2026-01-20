/**
 * AI 交易员运行时实例
 * 
 * 继承 GameObject，实现交易员的简单行为模拟
 */

import { GameObject, GameObjectState } from '../../lifecycle/types';

/**
 * AI 交易员实例类
 */
export class AITraderInstance implements GameObject {
  public readonly id: number;
  public state: GameObjectState = GameObjectState.READY;

  // 模板数据
  public readonly templateId: string;
  public readonly name: string;
  public readonly riskProfile: 'conservative' | 'moderate' | 'aggressive';

  // 运行时状态
  private isActive: boolean = false;

  // 交易行为配置 - 基于 onTick 的时间累积
  private readonly tradingIntervalMs: number = 5000; // 固定5秒间隔
  private accumulatedTime: number = 0; // 累积时间（毫秒）
  private lastTradingTime: number = 0; // 上次交易时间

  constructor(
    id: number,
    templateData: {
      templateId: string;
      name: string;
      riskProfile: 'conservative' | 'moderate' | 'aggressive';
      initialCapital: number;
    }
  ) {
    this.id = id;
    this.templateId = templateData.templateId;
    this.name = templateData.name;
    this.riskProfile = templateData.riskProfile;
  }

  /**
   * GameObject 生命周期 - 开始播放
   */
  onBeginPlay(): void {
    this.isActive = true;
    this.accumulatedTime = 0;
    this.lastTradingTime = 0;
    console.log(`[AITraderInstance] AI Trader "${this.name}" (ID: ${this.id}) started`);
  }

  /**
   * GameObject 生命周期 - 每帧更新
   */
  onTick(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }

    // 累积时间（deltaTime 通常以秒为单位，转换为毫秒）
    this.accumulatedTime += deltaTime * 1000;

    // 检查是否到了交易时间
    if (this.accumulatedTime - this.lastTradingTime >= this.tradingIntervalMs) {
      if (this.state === GameObjectState.ACTIVE) {
        // 简单的打印逻辑
        console.log(`[AITraderInstance] Trader "${this.name}" (ID: ${this.id}) is thinking... (Risk: ${this.riskProfile})`);
        this.lastTradingTime = this.accumulatedTime;
      }
    }
  }

  /**
   * GameObject 生命周期 - 销毁
   */
  onDestroy(): void {
    this.isActive = false;
    console.log(`[AITraderInstance] AI Trader "${this.name}" (ID: ${this.id}) destroyed`);
    
    // 重置时间累积器
    this.accumulatedTime = 0;
    this.lastTradingTime = 0;
  }



  /**
   * 暂停交易
   */
  public pauseTrading(): void {
    this.isActive = false;
    console.log(`[AITraderInstance] Trading paused for "${this.name}"`);
  }

  /**
   * 恢复交易
   */
  public resumeTrading(): void {
    if (this.state === GameObjectState.ACTIVE) {
      this.isActive = true;
      // 重置时间累积器，避免立即触发交易
      this.lastTradingTime = this.accumulatedTime;
      console.log(`[AITraderInstance] Trading resumed for "${this.name}"`);
    }
  }
}