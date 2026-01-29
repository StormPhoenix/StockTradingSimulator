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
    console.log(`[AITraderInstance] AI Trader "${this.name}" (ID: ${this.id}) started`);
  }

  /**
   * GameObject 生命周期 - 每帧更新
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTick(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }
    // 交易逻辑待后续实现
  }

  /**
   * GameObject 生命周期 - 销毁
   */
  onDestroy(): void {
    this.isActive = false;
    console.log(`[AITraderInstance] AI Trader "${this.name}" (ID: ${this.id}) destroyed`);
  }
}