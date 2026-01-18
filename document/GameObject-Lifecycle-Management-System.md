# GameObject 生命周期管理系统设计文档

## 1. 概述

本文档描述了基于 Unreal Engine FEngineLoop::Tick + AActor 设计模式的游戏对象生命周期管理系统。该系统为 AI 交易者、股票等业务对象提供统一的生命周期管理基础框架。

## 2. 设计目标

- 提供统一的游戏对象生命周期管理
- 支持高性能的批量对象处理
- 确保生命周期方法调用的顺序性和安全性
- 提供完善的调试和监控接口
- 支持错误隔离机制

## 3. 核心架构

### 3.1 GameObject 接口设计

```typescript
interface GameObject {
  readonly id: number;
  state: GameObjectState;
  
  // 生命周期方法（同步）
  onBeginPlay(): void;
  onTick(deltaTime: number): void;
  onDestroy(): void;
}

enum GameObjectState {
  READY = 'READY',           // 已创建，等待开始
  ACTIVE = 'ACTIVE',         // 活跃状态，参与 Tick
  PAUSED = 'PAUSED',         // 暂停状态，不参与 Tick
  DESTROYING = 'DESTROYING', // 销毁中，执行清理逻辑
  DESTROYED = 'DESTROYED'    // 已销毁，等待移除
}
```

**设计要点：**
- 不包含 `type` 字段，业务类型通过继承区分
- 所有生命周期方法为同步操作
- 状态转换严格按照 READY → ACTIVE → PAUSED → DESTROYING → DESTROYED 流程

### 3.2 ID 生成器接口

```typescript
interface IIdGenerator {
  generateId(): number;
}

class AutoIncrementIdGenerator implements IIdGenerator {
  private currentId: number = 0;
  
  generateId(): number {
    return ++this.currentId;
  }
}
```

**扩展性：**
- 支持自增 ID（默认实现）
- 可扩展为 UUID、雪花算法等其他 ID 生成策略

### 3.3 安全容器设计

```typescript
class SafeGameObjectContainer {
  private objects = new Map<number, GameObject>();
  private isIterating = false;
  private pendingAdditions = new Map<number, GameObject>();
  private pendingRemovals = new Set<number>();
  
  // 高效的安全遍历
  forEachSafe(callback: (obj: GameObject) => void) {
    this.isIterating = true;
    
    try {
      for (const obj of this.objects.values()) {
        callback(obj);
      }
    } finally {
      this.isIterating = false;
      this.processPendingOperations();
    }
  }
  
  // 添加对象
  add(obj: GameObject) {
    if (this.isIterating) {
      this.pendingAdditions.set(obj.id, obj);
    } else {
      this.objects.set(obj.id, obj);
    }
  }
  
  // 删除对象
  remove(id: number) {
    if (this.isIterating) {
      this.pendingRemovals.add(id);
    } else {
      this.objects.delete(id);
    }
  }
  
  private processPendingOperations() {
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
}
```

**安全机制：**
- 遍历期间延迟处理增删操作
- 无快照开销，保持高性能
- 通过状态标记控制操作时机

### 3.4 状态分组容器管理

```typescript
class GameObjectStateManager {
  private readyObjects = new SafeGameObjectContainer();
  private activeObjects = new SafeGameObjectContainer();
  private pausedObjects = new SafeGameObjectContainer();
  private destroyingObjects = new SafeGameObjectContainer();
  
  // 按状态获取容器
  getContainer(state: GameObjectState): SafeGameObjectContainer {
    switch (state) {
      case GameObjectState.READY: return this.readyObjects;
      case GameObjectState.ACTIVE: return this.activeObjects;
      case GameObjectState.PAUSED: return this.pausedObjects;
      case GameObjectState.DESTROYING: return this.destroyingObjects;
      default: throw new Error(`Invalid state: ${state}`);
    }
  }
  
  // 状态转换
  changeState(obj: GameObject, newState: GameObjectState) {
    const oldContainer = this.getContainer(obj.state);
    const newContainer = this.getContainer(newState);
    
    oldContainer.remove(obj.id);
    obj.state = newState;
    newContainer.add(obj);
  }
}
```

## 4. 游戏循环设计

### 4.1 主循环管理器

```typescript
class GameLoop {
  private fps: number = 60;
  private tickInterval: number;
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;
  private stateManager: GameObjectStateManager;
  private idGenerator: IIdGenerator;
  
  constructor(idGenerator: IIdGenerator = new AutoIncrementIdGenerator()) {
    this.stateManager = new GameObjectStateManager();
    this.idGenerator = idGenerator;
    this.updateTickInterval();
  }
  
  // 设置帧率
  setFPS(fps: number) {
    this.fps = fps;
    this.updateTickInterval();
    
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
  
  private updateTickInterval() {
    this.tickInterval = 1000 / this.fps;
  }
  
  // 启动游戏循环
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.tickInterval);
  }
  
  // 停止游戏循环
  stop() {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  // 主 Tick 循环
  private tick() {
    const deltaTime = this.tickInterval / 1000; // 转换为秒
    
    try {
      // 1. 处理新对象的 BeginPlay
      this.processBeginPlay();
      
      // 2. 处理活跃对象的 Tick
      this.processTick(deltaTime);
      
      // 3. 处理销毁对象的 Destroy
      this.processDestroy();
      
    } catch (error) {
      console.error('Game loop tick error:', error);
      // 错误隔离：继续下一帧
    }
  }
}
```

### 4.2 生命周期处理

```typescript
class GameLoop {
  // ... 其他代码 ...
  
  private processBeginPlay() {
    const readyContainer = this.stateManager.getContainer(GameObjectState.READY);
    
    readyContainer.forEachSafe((obj) => {
      try {
        obj.onBeginPlay();
        this.stateManager.changeState(obj, GameObjectState.ACTIVE);
      } catch (error) {
        console.error(`BeginPlay error for object ${obj.id}:`, error);
        // 错误隔离：将对象标记为销毁
        this.stateManager.changeState(obj, GameObjectState.DESTROYING);
      }
    });
  }
  
  private processTick(deltaTime: number) {
    const activeContainer = this.stateManager.getContainer(GameObjectState.ACTIVE);
    
    activeContainer.forEachSafe((obj) => {
      try {
        obj.onTick(deltaTime);
      } catch (error) {
        console.error(`Tick error for object ${obj.id}:`, error);
        // 错误隔离：将对象标记为销毁
        this.stateManager.changeState(obj, GameObjectState.DESTROYING);
      }
    });
  }
  
  private processDestroy() {
    const destroyingContainer = this.stateManager.getContainer(GameObjectState.DESTROYING);
    
    destroyingContainer.forEachSafe((obj) => {
      try {
        obj.onDestroy();
        obj.state = GameObjectState.DESTROYED;
        // 从容器中移除已销毁的对象
        destroyingContainer.remove(obj.id);
      } catch (error) {
        console.error(`Destroy error for object ${obj.id}:`, error);
        // 强制移除有问题的对象
        destroyingContainer.remove(obj.id);
      }
    });
  }
}
```

## 5. 对象管理接口

### 5.1 对象生命周期管理

```typescript
class GameObjectManager {
  private gameLoop: GameLoop;
  
  constructor(gameLoop: GameLoop) {
    this.gameLoop = gameLoop;
  }
  
  // 创建游戏对象
  createObject<T extends GameObject>(ObjectClass: new (id: number) => T): T {
    const id = this.gameLoop.generateId();
    const obj = new ObjectClass(id);
    obj.state = GameObjectState.READY;
    
    this.gameLoop.addObject(obj);
    return obj;
  }
  
  // 销毁游戏对象
  destroyObject(id: number) {
    const obj = this.gameLoop.getObject(id);
    if (obj && obj.state !== GameObjectState.DESTROYING && obj.state !== GameObjectState.DESTROYED) {
      this.gameLoop.changeObjectState(obj, GameObjectState.DESTROYING);
    }
  }
  
  // 暂停游戏对象
  pauseObject(id: number) {
    const obj = this.gameLoop.getObject(id);
    if (obj && obj.state === GameObjectState.ACTIVE) {
      this.gameLoop.changeObjectState(obj, GameObjectState.PAUSED);
    }
  }
  
  // 恢复游戏对象
  resumeObject(id: number) {
    const obj = this.gameLoop.getObject(id);
    if (obj && obj.state === GameObjectState.PAUSED) {
      this.gameLoop.changeObjectState(obj, GameObjectState.ACTIVE);
    }
  }
}
```

## 6. 调试和监控接口

### 6.1 Web API 接口设计

```typescript
// 调试控制器
class GameObjectDebugController {
  
  // GET /api/debug/gameobjects - 获取所有对象列表
  async getAllObjects(req: Request, res: Response) {
    const objects = this.gameLoop.getAllObjects();
    const summary = {
      total: objects.length,
      byState: this.groupByState(objects),
      objects: objects.map(obj => ({
        id: obj.id,
        state: obj.state,
        type: obj.constructor.name
      }))
    };
    res.json(summary);
  }
  
  // GET /api/debug/gameobjects/:id - 获取特定对象详情
  async getObjectById(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    const obj = this.gameLoop.getObject(id);
    
    if (!obj) {
      return res.status(404).json({ error: 'Object not found' });
    }
    
    res.json({
      id: obj.id,
      state: obj.state,
      type: obj.constructor.name,
      // 可以添加更多调试信息
    });
  }
  
  // POST /api/debug/gameobjects/:id/pause - 暂停特定对象
  async pauseObject(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    try {
      this.gameObjectManager.pauseObject(id);
      res.json({ success: true, message: `Object ${id} paused` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // POST /api/debug/gameobjects/:id/resume - 恢复特定对象
  async resumeObject(req: Request, res: Response) {
    const id = parseInt(req.params.id);
    try {
      this.gameObjectManager.resumeObject(id);
      res.json({ success: true, message: `Object ${id} resumed` });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
  
  // GET /api/debug/performance - 获取性能统计
  async getPerformanceStats(req: Request, res: Response) {
    const stats = {
      fps: this.gameLoop.getCurrentFPS(),
      targetFPS: this.gameLoop.getTargetFPS(),
      objectCount: this.gameLoop.getTotalObjectCount(),
      tickDuration: this.gameLoop.getLastTickDuration(),
      memoryUsage: process.memoryUsage()
    };
    res.json(stats);
  }
  
  // GET /api/debug/loop/status - 获取游戏循环状态
  async getLoopStatus(req: Request, res: Response) {
    const status = {
      isRunning: this.gameLoop.isRunning(),
      fps: this.gameLoop.getTargetFPS(),
      uptime: this.gameLoop.getUptime(),
      totalTicks: this.gameLoop.getTotalTicks()
    };
    res.json(status);
  }
}
```

### 6.2 路由配置

```typescript
// 调试路由
const debugRouter = express.Router();

debugRouter.get('/gameobjects', debugController.getAllObjects.bind(debugController));
debugRouter.get('/gameobjects/:id', debugController.getObjectById.bind(debugController));
debugRouter.post('/gameobjects/:id/pause', debugController.pauseObject.bind(debugController));
debugRouter.post('/gameobjects/:id/resume', debugController.resumeObject.bind(debugController));
debugRouter.get('/performance', debugController.getPerformanceStats.bind(debugController));
debugRouter.get('/loop/status', debugController.getLoopStatus.bind(debugController));

app.use('/api/debug', debugRouter);
```

## 7. 错误隔离机制

### 7.1 错误处理策略

```typescript
class ErrorIsolationManager {
  private errorCounts = new Map<number, number>();
  private maxErrors = 3; // 最大错误次数
  
  handleObjectError(obj: GameObject, error: Error, phase: string) {
    const errorCount = this.errorCounts.get(obj.id) || 0;
    this.errorCounts.set(obj.id, errorCount + 1);
    
    console.error(`GameObject ${obj.id} error in ${phase}:`, error);
    
    // 错误次数超限，标记为销毁
    if (errorCount >= this.maxErrors) {
      console.warn(`GameObject ${obj.id} exceeded max errors, destroying`);
      this.gameLoop.changeObjectState(obj, GameObjectState.DESTROYING);
    }
  }
  
  clearErrorCount(objectId: number) {
    this.errorCounts.delete(objectId);
  }
}
```

## 8. 业务对象示例

### 8.1 AI 交易者实现

```typescript
class AITrader implements GameObject {
  readonly id: number;
  state: GameObjectState = GameObjectState.READY;
  
  private strategy: TradingStrategy;
  private portfolio: Portfolio;
  
  constructor(id: number, strategy: TradingStrategy) {
    this.id = id;
    this.strategy = strategy;
    this.portfolio = new Portfolio();
  }
  
  onBeginPlay(): void {
    console.log(`AI Trader ${this.id} started`);
    this.strategy.initialize();
  }
  
  onTick(deltaTime: number): void {
    // 执行交易策略
    this.strategy.execute(deltaTime);
    
    // 更新投资组合
    this.portfolio.update();
  }
  
  onDestroy(): void {
    console.log(`AI Trader ${this.id} destroyed`);
    this.strategy.cleanup();
    this.portfolio.liquidate();
  }
}
```

### 8.2 股票对象实现

```typescript
class Stock implements GameObject {
  readonly id: number;
  state: GameObjectState = GameObjectState.READY;
  
  private symbol: string;
  private price: number;
  private priceHistory: number[] = [];
  
  constructor(id: number, symbol: string, initialPrice: number) {
    this.id = id;
    this.symbol = symbol;
    this.price = initialPrice;
  }
  
  onBeginPlay(): void {
    console.log(`Stock ${this.symbol} (${this.id}) started trading`);
  }
  
  onTick(deltaTime: number): void {
    // 更新股价
    this.updatePrice(deltaTime);
    
    // 记录价格历史
    this.priceHistory.push(this.price);
    
    // 限制历史记录长度
    if (this.priceHistory.length > 1000) {
      this.priceHistory.shift();
    }
  }
  
  onDestroy(): void {
    console.log(`Stock ${this.symbol} (${this.id}) delisted`);
  }
  
  private updatePrice(deltaTime: number): void {
    // 简单的价格波动模拟
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility * this.price * deltaTime;
    this.price = Math.max(0.01, this.price + change);
  }
}
```

## 9. 使用示例

### 9.1 系统初始化

```typescript
// 创建系统组件
const idGenerator = new AutoIncrementIdGenerator();
const gameLoop = new GameLoop(idGenerator);
const gameObjectManager = new GameObjectManager(gameLoop);

// 设置帧率
gameLoop.setFPS(30); // 30 FPS 适合交易系统

// 启动游戏循环
gameLoop.start();

// 创建业务对象
const trader1 = gameObjectManager.createObject(AITrader);
const stock1 = gameObjectManager.createObject(Stock);

// 系统会自动管理这些对象的生命周期
```

### 9.2 运行时管理

```typescript
// 暂停特定交易者
gameObjectManager.pauseObject(trader1.id);

// 恢复交易者
gameObjectManager.resumeObject(trader1.id);

// 销毁股票对象
gameObjectManager.destroyObject(stock1.id);

// 停止整个系统
gameLoop.stop();
```

## 10. 性能考虑

### 10.1 优化策略

- **容器优化**：使用 Map 而非数组，提供 O(1) 查找性能
- **状态分组**：按状态分组存储，减少无效遍历
- **安全迭代**：延迟处理增删操作，避免快照开销
- **错误隔离**：单个对象错误不影响整体系统运行

### 10.2 内存管理

- 及时清理已销毁对象
- 限制历史数据长度
- 定期垃圾回收提示

## 11. 扩展性设计

### 11.1 支持的扩展点

- **ID 生成策略**：通过 IIdGenerator 接口扩展
- **业务对象类型**：通过继承 GameObject 接口扩展
- **调试接口**：通过 Web API 扩展监控功能
- **错误处理**：通过 ErrorIsolationManager 扩展错误策略

### 11.2 未来可能的扩展

- 对象序列化和持久化
- 分布式对象管理
- 更复杂的依赖关系管理
- 性能分析和优化工具

## 12. 总结

本设计文档描述了一个高性能、可扩展的游戏对象生命周期管理系统。该系统参考了 Unreal Engine 的设计理念，提供了：

- 统一的对象生命周期管理
- 高效的容器和迭代机制
- 完善的错误隔离和调试功能
- 良好的扩展性和可维护性

该系统为后续开发 AI 交易者、股票等业务对象提供了坚实的基础框架。