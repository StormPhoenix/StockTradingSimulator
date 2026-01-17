# 游戏对象生命周期管理系统设计方案

## 概述

本文档描述了股票交易模拟器中游戏对象生命周期管理系统的完整设计方案。该系统基于主流游戏引擎的设计理念（如虚幻引擎的 FEngineLoop::Tick + AActor 模式），为运行时对象提供统一的生命周期管理。

## 开发顺序说明

**重要：必须严格按照以下顺序进行开发，确保系统的稳定性和可维护性**

### 第一阶段：核心生命周期系统
1. 实现 `GameObject` 接口和 `GameObjectState` 枚举
2. 实现 `GameObjectLifeCycleManager` 核心管理器
3. 实现容器设计和异常处理机制
4. 实现调试和监控功能
5. 编写单元测试验证生命周期管理的正确性

### 第二阶段：实例化对象设计
6. 实现 `StockInstance` 股票实例化类型
7. 实现 `AITraderInstance` AI交易者实例化类型
8. 编写实例化对象的单元测试

### 第三阶段：交易所系统
9. 实现 `ExchangeInstance` 交易所类型
10. 集成所有实例化对象到交易所
11. 实现市场环境模板的加载和实例化逻辑
12. 编写集成测试验证整个系统

### 第四阶段：系统集成和优化
13. 与现有前端和后端系统集成
14. 性能测试和优化
15. 完善错误处理和日志记录

---

## 第一阶段：核心生命周期系统设计

### 1.1 GameObject 接口设计

```typescript
// 生命周期状态枚举
enum GameObjectState {
  CREATED = 'created',        // 已创建，未初始化
  INITIALIZED = 'initialized', // 已初始化，准备开始
  ACTIVE = 'active',          // 运行中
  PAUSED = 'paused',          // 暂停状态
  DESTROYING = 'destroying',   // 销毁中
  DESTROYED = 'destroyed'     // 已销毁
}

// GameObject 基础接口
interface GameObject {
  readonly id: string;
  readonly type: string;
  state: GameObjectState;
  
  // 生命周期方法
  onBeginPlay(): Promise<void> | void;
  onTick(deltaTime: number): Promise<void> | void;
  onDestroy(): Promise<void> | void;
  
  // 状态管理
  pause(): void;
  resume(): void;
  
  // 异常处理
  onError?(error: Error): void;
}
```

### 1.2 容器设计

```typescript
interface GameObjectContainer {
  // 主要存储
  objects: Map<string, GameObject>;
  
  // 状态分组存储（便于快速访问）
  activeObjects: Set<string>;
  pausedObjects: Set<string>;
  destroyingObjects: Set<string>;
  
  // 类型分组存储（便于按类型管理）
  objectsByType: Map<string, Set<string>>;
}
```

### 1.3 生命周期管理器核心实现

```typescript
class GameObjectLifeCycleManager {
  private container: GameObjectContainer;
  private tickInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  
  constructor() {
    this.container = {
      objects: new Map(),
      activeObjects: new Set(),
      pausedObjects: new Set(),
      destroyingObjects: new Set(),
      objectsByType: new Map()
    };
  }
  
  // 对象管理
  async addObject(gameObject: GameObject): Promise<void> {
    // 1. 添加到容器
    this.container.objects.set(gameObject.id, gameObject);
    gameObject.state = GameObjectState.CREATED;
    
    // 2. 安全执行初始化
    await this.safeExecute(
      () => gameObject.onBeginPlay(),
      gameObject.id,
      'onBeginPlay'
    );
    
    // 3. 更新状态为活跃
    if (gameObject.state !== GameObjectState.DESTROYED) {
      this.updateContainer(gameObject, GameObjectState.ACTIVE);
    }
  }
  
  async removeObject(id: string): Promise<void> {
    const gameObject = this.container.objects.get(id);
    if (!gameObject) return;
    
    // 1. 标记为销毁中
    this.updateContainer(gameObject, GameObjectState.DESTROYING);
    
    // 2. 安全执行销毁逻辑
    await this.safeExecute(
      () => gameObject.onDestroy(),
      id,
      'onDestroy'
    );
    
    // 3. 从容器中移除
    this.container.objects.delete(id);
    this.container.activeObjects.delete(id);
    this.container.pausedObjects.delete(id);
    this.container.destroyingObjects.delete(id);
    
    // 4. 从类型分组中移除
    const typeSet = this.container.objectsByType.get(gameObject.type);
    if (typeSet) {
      typeSet.delete(id);
      if (typeSet.size === 0) {
        this.container.objectsByType.delete(gameObject.type);
      }
    }
  }
  
  // 生命周期控制
  async startLifeCycle(): Promise<void> {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.tickInterval = setInterval(() => {
      this.tick().catch(error => {
        console.error('Lifecycle tick error:', error);
      });
    }, 16); // 60fps
    
    console.log('GameObjectLifeCycleManager started');
  }
  
  async stopLifeCycle(): Promise<void> {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    console.log('GameObjectLifeCycleManager stopped');
  }
  
  private async tick(): Promise<void> {
    const deltaTime = 16; // 固定 16ms (60fps)
    
    // 只处理活跃对象
    for (const objectId of this.container.activeObjects) {
      const gameObject = this.container.objects.get(objectId);
      if (gameObject) {
        await this.safeExecute(
          () => gameObject.onTick(deltaTime),
          objectId,
          'onTick'
        );
      }
    }
  }
  
  // 状态管理
  pauseObject(id: string): void {
    const gameObject = this.container.objects.get(id);
    if (gameObject && gameObject.state === GameObjectState.ACTIVE) {
      gameObject.pause();
      this.updateContainer(gameObject, GameObjectState.PAUSED);
    }
  }
  
  resumeObject(id: string): void {
    const gameObject = this.container.objects.get(id);
    if (gameObject && gameObject.state === GameObjectState.PAUSED) {
      gameObject.resume();
      this.updateContainer(gameObject, GameObjectState.ACTIVE);
    }
  }
  
  // 异常处理和安全性
  private async safeExecute<T>(
    operation: () => Promise<T> | T,
    objectId: string,
    operationName: string
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      console.error(`GameObject ${objectId} ${operationName} failed:`, error);
      
      // 获取对象并调用错误处理
      const gameObject = this.container.objects.get(objectId);
      if (gameObject?.onError) {
        try {
          gameObject.onError(error as Error);
        } catch (handlerError) {
          console.error(`GameObject ${objectId} error handler failed:`, handlerError);
        }
      }
      
      // 如果是关键操作失败，标记对象为错误状态
      if (operationName === 'onBeginPlay' || operationName === 'onDestroy') {
        this.markObjectAsErrored(objectId);
      }
      
      return null;
    }
  }
  
  private markObjectAsErrored(objectId: string): void {
    const gameObject = this.container.objects.get(objectId);
    if (gameObject) {
      gameObject.state = GameObjectState.DESTROYED;
      this.container.activeObjects.delete(objectId);
      this.container.pausedObjects.delete(objectId);
    }
  }
  
  private updateContainer(gameObject: GameObject, newState: GameObjectState): void {
    const { id, type } = gameObject;
    
    // 更新状态分组
    this.container.activeObjects.delete(id);
    this.container.pausedObjects.delete(id);
    this.container.destroyingObjects.delete(id);
    
    switch (newState) {
      case GameObjectState.ACTIVE:
        this.container.activeObjects.add(id);
        break;
      case GameObjectState.PAUSED:
        this.container.pausedObjects.add(id);
        break;
      case GameObjectState.DESTROYING:
        this.container.destroyingObjects.add(id);
        break;
    }
    
    // 更新类型分组
    if (!this.container.objectsByType.has(type)) {
      this.container.objectsByType.set(type, new Set());
    }
    this.container.objectsByType.get(type)!.add(id);
    
    gameObject.state = newState;
  }
  
  // 调试和监控功能
  getObjectList(): GameObject[] {
    return Array.from(this.container.objects.values());
  }
  
  getObjectsByState(state: GameObjectState): GameObject[] {
    return this.getObjectList().filter(obj => obj.state === state);
  }
  
  getObjectsByType(type: string): GameObject[] {
    const ids = this.container.objectsByType.get(type) || new Set();
    return Array.from(ids).map(id => this.container.objects.get(id)!).filter(Boolean);
  }
  
  getObjectStats(): GameObjectStats {
    const objects = this.getObjectList();
    const stats: GameObjectStats = {
      total: objects.length,
      active: this.container.activeObjects.size,
      paused: this.container.pausedObjects.size,
      destroying: this.container.destroyingObjects.size,
      destroyed: objects.filter(obj => obj.state === GameObjectState.DESTROYED).length,
      byType: {}
    };
    
    // 按类型统计
    for (const [type, ids] of this.container.objectsByType) {
      stats.byType[type] = ids.size;
    }
    
    return stats;
  }
  
  getObjectInfo(id: string): GameObject | null {
    return this.container.objects.get(id) || null;
  }
}

interface GameObjectStats {
  total: number;
  active: number;
  paused: number;
  destroying: number;
  destroyed: number;
  byType: Record<string, number>;
}
```

---

## 第二阶段：实例化对象设计

### 2.1 股票实例化类型设计

```typescript
interface StockRuntimeData {
  currentPrice: number;
  dailyVolume: number;
  priceHistory: Array<{
    timestamp: Date;
    price: number;
    volume: number;
  }>;
  orderBook: {
    buyOrders: Array<{ price: number; volume: number; traderId: string }>;
    sellOrders: Array<{ price: number; volume: number; traderId: string }>;
  };
  marketCap: number;
  dayChange: number;
  dayChangePercent: number;
}

class StockInstance implements GameObject {
  readonly id: string;
  readonly type = 'Stock';
  state: GameObjectState = GameObjectState.CREATED;
  
  // 模板数据（只读）
  readonly template: StockTemplate;
  
  // 运行时数据（可变）
  private runtimeData: StockRuntimeData;
  
  // 引用交易所
  private exchange: ExchangeInstance;
  
  constructor(template: StockTemplate, exchange: ExchangeInstance) {
    this.id = `stock_${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.template = template;
    this.exchange = exchange;
    
    // 初始化运行时数据
    this.runtimeData = {
      currentPrice: template.initialPrice,
      dailyVolume: 0,
      priceHistory: [],
      orderBook: {
        buyOrders: [],
        sellOrders: []
      },
      marketCap: template.initialPrice * template.totalShares,
      dayChange: 0,
      dayChangePercent: 0
    };
  }
  
  async onBeginPlay(): Promise<void> {
    console.log(`Stock ${this.template.symbol} (${this.id}) started trading at $${this.runtimeData.currentPrice}`);
    
    // 初始化价格历史
    this.runtimeData.priceHistory.push({
      timestamp: this.exchange.getCurrentMarketTime(),
      price: this.runtimeData.currentPrice,
      volume: 0
    });
  }
  
  async onTick(deltaTime: number): Promise<void> {
    if (this.state !== GameObjectState.ACTIVE) return;
    if (!this.exchange.isMarketCurrentlyOpen()) return;
    
    // 股票级别的tick处理
    await this.updatePriceMovement();
    await this.processOrderBook();
    this.updateStatistics();
  }
  
  async onDestroy(): Promise<void> {
    console.log(`Stock ${this.template.symbol} (${this.id}) stopped trading`);
    
    // 清理订单簿
    this.runtimeData.orderBook.buyOrders = [];
    this.runtimeData.orderBook.sellOrders = [];
  }
  
  pause(): void {
    this.state = GameObjectState.PAUSED;
  }
  
  resume(): void {
    this.state = GameObjectState.ACTIVE;
  }
  
  onError(error: Error): void {
    console.error(`Stock ${this.template.symbol} (${this.id}) error:`, error);
  }
  
  // 私有方法实现...
  private async updatePriceMovement(): Promise<void> {
    // 基于模板的波动率和市场因素更新价格
    const volatility = this.template.volatility;
    const randomFactor = (Math.random() - 0.5) * 2; // -1 到 1
    const priceChange = this.runtimeData.currentPrice * volatility * randomFactor * 0.01;
    
    const newPrice = Math.max(0.01, this.runtimeData.currentPrice + priceChange);
    this.updatePrice(newPrice, 0);
  }
  
  private async processOrderBook(): Promise<void> {
    // 处理订单匹配逻辑
  }
  
  private updateStatistics(): void {
    const firstPrice = this.runtimeData.priceHistory[0]?.price || this.template.initialPrice;
    this.runtimeData.dayChange = this.runtimeData.currentPrice - firstPrice;
    this.runtimeData.dayChangePercent = (this.runtimeData.dayChange / firstPrice) * 100;
    this.runtimeData.marketCap = this.runtimeData.currentPrice * this.template.totalShares;
  }
  
  // 公共接口
  getCurrentPrice(): number {
    return this.runtimeData.currentPrice;
  }
  
  getTemplate(): StockTemplate {
    return this.template;
  }
  
  getRuntimeData(): Readonly<StockRuntimeData> {
    return { ...this.runtimeData };
  }
  
  updatePrice(newPrice: number, volume: number): void {
    this.runtimeData.currentPrice = newPrice;
    this.runtimeData.dailyVolume += volume;
    
    this.runtimeData.priceHistory.push({
      timestamp: this.exchange.getCurrentMarketTime(),
      price: newPrice,
      volume: volume
    });
    
    // 保持历史记录在合理范围内
    if (this.runtimeData.priceHistory.length > 1000) {
      this.runtimeData.priceHistory = this.runtimeData.priceHistory.slice(-1000);
    }
  }
  
  addBuyOrder(price: number, volume: number, traderId: string): void {
    this.runtimeData.orderBook.buyOrders.push({ price, volume, traderId });
    this.runtimeData.orderBook.buyOrders.sort((a, b) => b.price - a.price); // 按价格降序
  }
  
  addSellOrder(price: number, volume: number, traderId: string): void {
    this.runtimeData.orderBook.sellOrders.push({ price, volume, traderId });
    this.runtimeData.orderBook.sellOrders.sort((a, b) => a.price - b.price); // 按价格升序
  }
}
```

### 2.2 AI交易者实例化类型设计

```typescript
interface TraderRuntimeData {
  cash: number;
  portfolio: Map<string, { shares: number; avgPrice: number }>;
  totalValue: number;
  dailyPnL: number;
  totalPnL: number;
  tradeHistory: Array<{
    timestamp: Date;
    stockSymbol: string;
    action: 'buy' | 'sell';
    shares: number;
    price: number;
    totalValue: number;
  }>;
  performance: {
    winRate: number;
    totalTrades: number;
    successfulTrades: number;
  };
}

interface TradingDecision {
  stockId: string;
  action: 'buy' | 'sell' | 'hold';
  shares: number;
  targetPrice?: number;
}

class AITraderInstance implements GameObject {
  readonly id: string;
  readonly type = 'AITrader';
  state: GameObjectState = GameObjectState.CREATED;
  
  // 模板数据（只读）
  readonly template: AITraderTemplate;
  
  // 运行时数据（可变）
  private runtimeData: TraderRuntimeData;
  
  // 引用交易所
  private exchange: ExchangeInstance;
  
  // 交易策略状态
  private lastDecisionTime: Date = new Date(0);
  private decisionCooldown: number = 5000; // 5秒决策间隔
  
  constructor(template: AITraderTemplate, exchange: ExchangeInstance) {
    this.id = `trader_${template.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.template = template;
    this.exchange = exchange;
    
    // 初始化运行时数据
    this.runtimeData = {
      cash: template.initialCash,
      portfolio: new Map(),
      totalValue: template.initialCash,
      dailyPnL: 0,
      totalPnL: 0,
      tradeHistory: [],
      performance: {
        winRate: 0,
        totalTrades: 0,
        successfulTrades: 0
      }
    };
  }
  
  async onBeginPlay(): Promise<void> {
    console.log(`AI Trader ${this.template.name} (${this.id}) started with $${this.runtimeData.cash}`);
    this.initializeTradingStrategy();
  }
  
  async onTick(deltaTime: number): Promise<void> {
    if (this.state !== GameObjectState.ACTIVE) return;
    if (!this.exchange.isMarketCurrentlyOpen()) return;
    
    // 更新投资组合价值
    this.updatePortfolioValue();
    
    // 检查是否需要做交易决策
    const currentTime = this.exchange.getCurrentMarketTime();
    if (currentTime.getTime() - this.lastDecisionTime.getTime() >= this.decisionCooldown) {
      await this.makeTradingDecision();
      this.lastDecisionTime = currentTime;
    }
  }
  
  async onDestroy(): Promise<void> {
    console.log(`AI Trader ${this.template.name} (${this.id}) stopped trading`);
    
    // 清算所有持仓（如果需要）
    await this.liquidateAllPositions();
    
    // 保存交易历史到数据库（如果需要）
    this.saveTradingHistory();
  }
  
  pause(): void {
    this.state = GameObjectState.PAUSED;
  }
  
  resume(): void {
    this.state = GameObjectState.ACTIVE;
  }
  
  onError(error: Error): void {
    console.error(`AI Trader ${this.template.name} (${this.id}) error:`, error);
  }
  
  // 私有方法实现...
  private initializeTradingStrategy(): void {
    // 根据模板的交易风格和风险偏好初始化策略参数
    switch (this.template.tradingStyle) {
      case 'aggressive':
        this.decisionCooldown = 2000; // 更频繁的交易
        break;
      case 'conservative':
        this.decisionCooldown = 10000; // 更谨慎的交易
        break;
      default:
        this.decisionCooldown = 5000;
    }
  }
  
  private updatePortfolioValue(): void {
    let totalValue = this.runtimeData.cash;
    
    for (const [stockId, position] of this.runtimeData.portfolio) {
      const stock = this.exchange.getStockInstance(stockId);
      if (stock) {
        totalValue += position.shares * stock.getCurrentPrice();
      }
    }
    
    const previousValue = this.runtimeData.totalValue;
    this.runtimeData.totalValue = totalValue;
    this.runtimeData.dailyPnL = totalValue - this.template.initialCash;
    this.runtimeData.totalPnL = totalValue - this.template.initialCash;
  }
  
  private async makeTradingDecision(): Promise<void> {
    const availableStocks = this.exchange.getAllStocks();
    
    for (const stock of availableStocks) {
      const decision = this.analyzeStock(stock);
      if (decision.action !== 'hold') {
        await this.executeTrade(decision);
      }
    }
  }
  
  private analyzeStock(stock: StockInstance): TradingDecision {
    // 基于AI交易者模板的策略进行分析
    const currentPrice = stock.getCurrentPrice();
    const template = stock.getTemplate();
    
    // 简单的策略示例：基于风险偏好和价格波动
    const riskFactor = this.getRiskFactor();
    const priceHistory = stock.getRuntimeData().priceHistory;
    
    if (priceHistory.length < 2) {
      return { stockId: stock.id, action: 'hold', shares: 0 };
    }
    
    const priceChange = (currentPrice - priceHistory[priceHistory.length - 2].price) / priceHistory[priceHistory.length - 2].price;
    
    // 买入逻辑
    if (priceChange < -0.02 && this.runtimeData.cash > currentPrice * 100) {
      const shares = Math.floor((this.runtimeData.cash * riskFactor) / currentPrice / 100) * 100;
      return { stockId: stock.id, action: 'buy', shares, targetPrice: currentPrice };
    }
    
    // 卖出逻辑
    const position = this.runtimeData.portfolio.get(stock.id);
    if (position && priceChange > 0.03) {
      return { stockId: stock.id, action: 'sell', shares: position.shares, targetPrice: currentPrice };
    }
    
    return { stockId: stock.id, action: 'hold', shares: 0 };
  }
  
  private getRiskFactor(): number {
    switch (this.template.riskProfile) {
      case 'aggressive': return 0.3;
      case 'moderate': return 0.2;
      case 'conservative': return 0.1;
      default: return 0.15;
    }
  }
  
  private async executeTrade(decision: TradingDecision): Promise<void> {
    const stock = this.exchange.getStockInstance(decision.stockId);
    if (!stock) return;
    
    const currentPrice = stock.getCurrentPrice();
    const totalCost = decision.shares * currentPrice;
    
    if (decision.action === 'buy' && this.runtimeData.cash >= totalCost) {
      // 执行买入
      this.runtimeData.cash -= totalCost;
      
      const existingPosition = this.runtimeData.portfolio.get(decision.stockId);
      if (existingPosition) {
        const totalShares = existingPosition.shares + decision.shares;
        const avgPrice = ((existingPosition.shares * existingPosition.avgPrice) + totalCost) / totalShares;
        this.runtimeData.portfolio.set(decision.stockId, { shares: totalShares, avgPrice });
      } else {
        this.runtimeData.portfolio.set(decision.stockId, { shares: decision.shares, avgPrice: currentPrice });
      }
      
      // 记录交易历史
      this.recordTrade('buy', stock.getTemplate().symbol, decision.shares, currentPrice, totalCost);
      
      // 向股票添加买单
      stock.addBuyOrder(currentPrice, decision.shares, this.id);
      
    } else if (decision.action === 'sell') {
      const position = this.runtimeData.portfolio.get(decision.stockId);
      if (position && position.shares >= decision.shares) {
        // 执行卖出
        const totalRevenue = decision.shares * currentPrice;
        this.runtimeData.cash += totalRevenue;
        
        if (position.shares === decision.shares) {
          this.runtimeData.portfolio.delete(decision.stockId);
        } else {
          position.shares -= decision.shares;
        }
        
        // 记录交易历史
        this.recordTrade('sell', stock.getTemplate().symbol, decision.shares, currentPrice, totalRevenue);
        
        // 向股票添加卖单
        stock.addSellOrder(currentPrice, decision.shares, this.id);
      }
    }
  }
  
  private recordTrade(action: 'buy' | 'sell', stockSymbol: string, shares: number, price: number, totalValue: number): void {
    this.runtimeData.tradeHistory.push({
      timestamp: this.exchange.getCurrentMarketTime(),
      stockSymbol,
      action,
      shares,
      price,
      totalValue
    });
    
    // 更新交易统计
    this.runtimeData.performance.totalTrades++;
    
    // 保持历史记录在合理范围内
    if (this.runtimeData.tradeHistory.length > 1000) {
      this.runtimeData.tradeHistory = this.runtimeData.tradeHistory.slice(-1000);
    }
  }
  
  private async liquidateAllPositions(): Promise<void> {
    for (const [stockId, position] of this.runtimeData.portfolio) {
      const stock = this.exchange.getStockInstance(stockId);
      if (stock) {
        const decision: TradingDecision = {
          stockId,
          action: 'sell',
          shares: position.shares,
          targetPrice: stock.getCurrentPrice()
        };
        await this.executeTrade(decision);
      }
    }
  }
  
  private saveTradingHistory(): void {
    // 保存到数据库或日志文件
    console.log(`Trader ${this.id} final stats:`, {
      totalValue: this.runtimeData.totalValue,
      totalPnL: this.runtimeData.totalPnL,
      totalTrades: this.runtimeData.performance.totalTrades
    });
  }
  
  // 公共接口
  getTemplate(): AITraderTemplate {
    return this.template;
  }
  
  getRuntimeData(): Readonly<TraderRuntimeData> {
    return {
      ...this.runtimeData,
      portfolio: new Map(this.runtimeData.portfolio)
    };
  }
  
  getCash(): number {
    return this.runtimeData.cash;
  }
  
  getTotalValue(): number {
    return this.runtimeData.totalValue;
  }
  
  getPortfolio(): Map<string, { shares: number; avgPrice: number }> {
    return new Map(this.runtimeData.portfolio);
  }
  
  getTradeHistory(): Array<any> {
    return [...this.runtimeData.tradeHistory];
  }
}
```

---

## 第三阶段：交易所系统设计

### 3.1 交易所配置和接口

```typescript
interface ExchangeConfig {
  marketEnvironmentId: string;
  tradingHours: {
    start: string; // "09:30"
    end: string;   // "15:00"
  };
  tickInterval: number; // tick间隔，毫秒
}
```

### 3.2 交易所实现

```typescript
class ExchangeInstance implements GameObject {
  readonly id: string;
  readonly type = 'Exchange';
  state: GameObjectState = GameObjectState.CREATED;
  
  private marketTemplate: MarketEnvironmentTemplate;
  private stockInstances: Map<string, StockInstance> = new Map();
  private traderInstances: Map<string, AITraderInstance> = new Map();
  private lifecycleManager: GameObjectLifeCycleManager;
  
  // 交易所运行时数据
  private currentTime: Date = new Date();
  private isMarketOpen: boolean = false;
  private tickCount: number = 0;
  
  constructor(
    private config: ExchangeConfig,
    lifecycleManager: GameObjectLifeCycleManager
  ) {
    this.id = `exchange_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.lifecycleManager = lifecycleManager;
  }
  
  async onBeginPlay(): Promise<void> {
    console.log(`Exchange ${this.id} starting...`);
    
    // 1. 加载市场环境模板
    this.marketTemplate = await this.loadMarketTemplate();
    
    // 2. 实例化股票
    await this.instantiateStocks();
    
    // 3. 实例化AI交易者
    await this.instantiateTraders();
    
    // 4. 将所有实例添加到生命周期管理器
    await this.registerInstancesToLifecycle();
    
    console.log(`Exchange ${this.id} started with ${this.stockInstances.size} stocks and ${this.traderInstances.size} traders`);
  }
  
  async onTick(deltaTime: number): Promise<void> {
    if (this.state !== GameObjectState.ACTIVE) return;
    
    this.tickCount++;
    this.updateMarketTime(deltaTime);
    this.updateMarketStatus();
    
    // 交易所级别的逻辑处理
    if (this.isMarketOpen) {
      await this.processMarketTick();
    }
  }
  
  async onDestroy(): Promise<void> {
    console.log(`Exchange ${this.id} shutting down...`);
    
    // 1. 销毁所有AI交易者实例
    for (const [traderId, trader] of this.traderInstances) {
      await this.lifecycleManager.removeObject(traderId);
    }
    
    // 2. 销毁所有股票实例
    for (const [stockId, stock] of this.stockInstances) {
      await this.lifecycleManager.removeObject(stockId);
    }
    
    // 3. 清理内部数据
    this.stockInstances.clear();
    this.traderInstances.clear();
    
    console.log(`Exchange ${this.id} destroyed`);
  }
  
  pause(): void {
    this.state = GameObjectState.PAUSED;
    // 暂停所有子对象
    for (const trader of this.traderInstances.values()) {
      trader.pause();
    }
    for (const stock of this.stockInstances.values()) {
      stock.pause();
    }
  }
  
  resume(): void {
    this.state = GameObjectState.ACTIVE;
    // 恢复所有子对象
    for (const trader of this.traderInstances.values()) {
      trader.resume();
    }
    for (const stock of this.stockInstances.values()) {
      stock.resume();
    }
  }
  
  onError(error: Error): void {
    console.error(`Exchange ${this.id} error:`, error);
    // 交易所错误处理逻辑
  }
  
  // 私有方法
  private async loadMarketTemplate(): Promise<MarketEnvironmentTemplate> {
    // 从数据库加载市场环境模板
    // 这里应该调用相应的服务
    throw new Error("Method not implemented");
  }
  
  private async instantiateStocks(): Promise<void> {
    for (const stockTemplate of this.marketTemplate.stockTemplates) {
      const stockInstance = new StockInstance(stockTemplate, this);
      this.stockInstances.set(stockInstance.id, stockInstance);
    }
  }
  
  private async instantiateTraders(): Promise<void> {
    for (const traderTemplate of this.marketTemplate.traderTemplates) {
      const traderInstance = new AITraderInstance(traderTemplate, this);
      this.traderInstances.set(traderInstance.id, traderInstance);
    }
  }
  
  private async registerInstancesToLifecycle(): Promise<void> {
    // 注册股票实例
    for (const stock of this.stockInstances.values()) {
      await this.lifecycleManager.addObject(stock);
    }
    
    // 注册交易者实例
    for (const trader of this.traderInstances.values()) {
      await this.lifecycleManager.addObject(trader);
    }
  }
  
  private updateMarketTime(deltaTime: number): void {
    // 更新市场时间（可以是加速的虚拟时间）
    this.currentTime = new Date(this.currentTime.getTime() + deltaTime);
  }
  
  private updateMarketStatus(): void {
    const hour = this.currentTime.getHours();
    const minute = this.currentTime.getMinutes();
    const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    this.isMarketOpen = currentTimeStr >= this.config.tradingHours.start && 
                       currentTimeStr <= this.config.tradingHours.end;
  }
  
  private async processMarketTick(): Promise<void> {
    // 交易所级别的市场处理逻辑
    // 例如：处理订单匹配、价格更新等
  }
  
  // 公共接口
  getStockInstance(stockId: string): StockInstance | undefined {
    return this.stockInstances.get(stockId);
  }
  
  getTraderInstance(traderId: string): AITraderInstance | undefined {
    return this.traderInstances.get(traderId);
  }
  
  getAllStocks(): StockInstance[] {
    return Array.from(this.stockInstances.values());
  }
  
  getAllTraders(): AITraderInstance[] {
    return Array.from(this.traderInstances.values());
  }
  
  isMarketCurrentlyOpen(): boolean {
    return this.isMarketOpen;
  }
  
  getCurrentMarketTime(): Date {
    return new Date(this.currentTime);
  }
}
```

### 3.3 使用示例

```typescript
// 创建游戏会话
async function createGameSession(marketEnvironmentId: string): Promise<ExchangeInstance> {
  const lifecycleManager = new GameObjectLifeCycleManager();
  
  // 创建交易所实例
  const exchangeConfig: ExchangeConfig = {
    marketEnvironmentId,
    tradingHours: { start: "09:30", end: "15:00" },
    tickInterval: 16 // 60fps
  };
  
  const exchange = new ExchangeInstance(exchangeConfig, lifecycleManager);
  
  // 将交易所添加到生命周期管理
  await lifecycleManager.addObject(exchange);
  
  // 启动生命周期
  await lifecycleManager.startLifeCycle();
  
  return exchange;
}

// 停止游戏会话
async function stopGameSession(exchange: ExchangeInstance, lifecycleManager: GameObjectLifeCycleManager): Promise<void> {
  // 停止生命周期
  await lifecycleManager.stopLifeCycle();
  
  // 销毁交易所（会自动销毁所有子对象）
  await lifecycleManager.removeObject(exchange.id);
}
```

---

## 第四阶段：系统集成和测试

### 4.1 单元测试要求

1. **生命周期管理器测试**
   - 对象添加和移除
   - 状态转换
   - 异常处理
   - 容器管理

2. **实例化对象测试**
   - 股票价格更新逻辑
   - AI交易者决策逻辑
   - 错误处理机制

3. **交易所集成测试**
   - 市场开闭逻辑
   - 对象实例化流程
   - 生命周期集成

### 4.2 性能考虑

1. **内存管理**
   - 及时清理销毁的对象
   - 限制历史数据大小
   - 避免内存泄漏

2. **CPU优化**
   - 合理的tick频率
   - 避免不必要的计算
   - 异步操作处理

### 4.3 监控和调试

1. **运行时监控**
   - 对象数量统计
   - 性能指标监控
   - 错误日志记录

2. **调试工具**
   - 对象状态查看
   - 生命周期追踪
   - 交易历史查询

---

## 总结

本设计方案提供了完整的游戏对象生命周期管理系统，具有以下特点：

1. **统一的生命周期管理**：所有运行时对象都遵循相同的生命周期规范
2. **层次化的对象管理**：交易所管理股票和交易者实例，形成清晰的层次结构
3. **模板与实例分离**：实例包含模板数据（只读）和运行时数据（可变）
4. **异常处理和安全性**：单个对象的错误不会影响其他对象的运行
5. **调试和监控支持**：提供完整的运行时查看和统计功能

**重要提醒：请严格按照文档开头的开发顺序进行实现，确保系统的稳定性和可维护性。**