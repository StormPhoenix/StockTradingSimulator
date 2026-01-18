import { GameObject, GameObjectState } from '../../../src/lifecycle/types';

/**
 * 测试用游戏对象
 * 用于验证生命周期管理系统的基本功能
 */
export class TestGameObject implements GameObject {
  readonly id: number;
  state: GameObjectState = GameObjectState.READY;
  
  private name: string;
  private tickCount: number = 0;
  private isBeginPlayCalled: boolean = false;
  private isDestroyCalled: boolean = false;

  constructor(id: number, name: string = 'TestObject') {
    this.id = id;
    this.name = name;
  }

  onBeginPlay(): void {
    this.isBeginPlayCalled = true;
    console.log(`TestGameObject ${this.id} (${this.name}) - onBeginPlay called`);
  }

  onTick(deltaTime: number): void {
    this.tickCount++;
    if (this.tickCount % 30 === 0) { // 每30次tick打印一次
      console.log(`TestGameObject ${this.id} (${this.name}) - tick ${this.tickCount}, deltaTime: ${deltaTime.toFixed(3)}s`);
    }
  }

  onDestroy(): void {
    this.isDestroyCalled = true;
    console.log(`TestGameObject ${this.id} (${this.name}) - onDestroy called, total ticks: ${this.tickCount}`);
  }

  // 测试用的getter方法
  getTickCount(): number {
    return this.tickCount;
  }

  isBeginPlayExecuted(): boolean {
    return this.isBeginPlayCalled;
  }

  isDestroyExecuted(): boolean {
    return this.isDestroyCalled;
  }

  getName(): string {
    return this.name;
  }
}