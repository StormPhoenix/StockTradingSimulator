# 股票价格模拟实现方案

## 1. 概述

本文档描述了在 `StockInstance` 的 `onTick` 函数中实现股价和成交量模拟逻辑的完整方案。该方案基于时间序列聚合系统，实现股票价格的随机游走模拟和成交量的生成，并将数据写入 `TimeSeriesManager`。

## 2. 设计目标

- 在 `StockInstance.onTick()` 中实现价格和成交量的模拟生成
- 基于交易所的游戏时间（24小时模拟）控制数据写入频率
- 检查交易时间段，仅在交易时间内写入数据
- 通过构造函数注入 `TimeSeriesManager`
- 在 `StockInstance.onBeginPlay()` 中初始化时间序列

## 3. 核心架构

### 3.1 组件关系

```
ExchangeInstance
  ├── TimeSeriesManager (成员变量)
  └── StockInstance[] (持有引用)
      └── 通过构造函数注入 TimeSeriesManager
      └── 通过构造函数注入 ExchangeInstance (用于获取游戏时间)
```

### 3.2 数据流向

```
GameLoop.onTick()
  ↓
ExchangeInstance.onTick(deltaTime)
  ↓
StockInstance.onTick(deltaTime)
  ├── 检查交易时间段
  ├── 检查游戏时间间隔
  ├── 生成新价格（随机游走）
  ├── 生成成交量
  └── 写入 TimeSeriesManager
      ├── 价格序列 (CONTINUOUS)
      └── 成交量序列 (DISCRETE)
```

## 4. 时间序列数据结构

### 4.1 序列组织

每个股票需要创建两个独立的时间序列：

1. **价格序列** (`${exchangeId}_${symbol}_price`)
   - 类型：`CONTINUOUS`
   - 数据点：`value` = 价格，`volume` = 0（或不设置）
   - 指标：OPEN, HIGH, LOW, CLOSE, VWAP

2. **成交量序列** (`${exchangeId}_${symbol}_volume`)
   - 类型：`DISCRETE`
   - 数据点：`value` = 成交量，`volume` = 成交量（用于VWAP计算）
   - 指标：VOLUME

### 4.2 数据点结构

```typescript
// 价格数据点
{
  timestamp: Date,  // 游戏时间
  value: number,    // 价格
  volume: 0         // 价格序列不需要volume
}

// 成交量数据点
{
  timestamp: Date,  // 游戏时间
  value: number,    // 成交量
  volume: number    // 成交量（用于VWAP计算）
}
```

### 4.3 CONTINUOUS vs DISCRETE

- **CONTINUOUS**：连续值，如价格，始终有效。缺失数据策略使用上一个值。
- **DISCRETE**：离散值，如成交量，事件计数。缺失数据策略使用0。

注意：当前聚合逻辑对两种类型使用相同的累加器，但保留类型定义以便后续扩展。

## 5. 交易时间段

### 5.1 A股交易时间

- **上午**：9:30 - 11:30
- **下午**：13:00 - 15:00
- **总计**：4小时交易时间

### 5.2 交易时间检查

在写入数据前必须检查当前游戏时间是否在交易时间段内。

## 6. 实现方案

### 6.1 ExchangeInstance 修改

#### 6.1.1 添加 TimeSeriesManager

```typescript
export class ExchangeInstance implements GameObject {
  // 新增：时间序列管理器
  private readonly timeSeriesManager: TimeSeriesManager;
  
  constructor(id: number, templateData: {...}) {
    // ...
    // 初始化 TimeSeriesManager
    this.timeSeriesManager = new TimeSeriesManager(this.id.toString());
  }
  
  /**
   * 获取时间序列管理器
   */
  public getTimeSeriesManager(): TimeSeriesManager {
    return this.timeSeriesManager;
  }
  
  /**
   * 获取当前游戏时间（简化版本，暂时返回系统时间）
   * TODO: 后续实现完整的游戏时间管理（24小时模拟、时间加速等）
   */
  public getSimulatedTime(): Date {
    // 暂时返回系统时间，后续实现游戏时间逻辑
    return new Date();
  }
  
  /**
   * 检查是否在交易时间段内
   * A股交易时间：9:30-11:30, 13:00-15:00
   */
  public isInTradingHours(): boolean {
    const gameTime = this.getSimulatedTime();
    const hour = gameTime.getHours();
    const minute = gameTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    const morningStart = 9 * 60 + 30;   // 9:30
    const morningEnd = 11 * 60 + 30;     // 11:30
    const afternoonStart = 13 * 60;      // 13:00
    const afternoonEnd = 15 * 60;        // 15:00
    
    return (timeValue >= morningStart && timeValue <= morningEnd) ||
           (timeValue >= afternoonStart && timeValue <= afternoonEnd);
  }
}
```

### 6.2 StockInstance 修改

#### 6.2.1 构造函数修改

```typescript
export class StockInstance implements GameObject {
  // 新增属性
  private readonly exchangeInstance: ExchangeInstance;  // 交易所实例引用
  private readonly timeSeriesManager: TimeSeriesManager; // 时间序列管理器（构造函数注入）
  private readonly priceSeriesId: string;                // 价格序列ID
  private readonly volumeSeriesId: string;                // 成交量序列ID
  
  // 股价模拟相关（固定值）
  private readonly priceVolatility: number = 0.01;       // 价格波动率 1%
  private readonly baseVolume: number = 1000;            // 基础成交量
  private readonly volumeVolatility: number = 0.5;       // 成交量波动率 50%
  
  // 数据写入频率控制（基于游戏时间）
  private lastPriceUpdateGameTime: number = 0;           // 上次价格更新的游戏时间（毫秒）
  private readonly priceUpdateInterval: number = 1000;    // 价格更新间隔（游戏时间毫秒，默认1秒）
  
  constructor(
    id: number,
    exchangeInstance: ExchangeInstance,  // 新增：交易所实例
    templateData: {
      templateId: string;
      symbol: string;
      companyName: string;
      category: string;
      issuePrice: number;
      totalShares: number;
    }
  ) {
    this.id = id;
    this.exchangeInstance = exchangeInstance;
    
    // 构造函数注入 TimeSeriesManager
    this.timeSeriesManager = exchangeInstance.getTimeSeriesManager();
    if (!this.timeSeriesManager) {
      throw new Error(`TimeSeriesManager is not initialized for StockInstance ${id}`);
    }
    
    // 生成序列ID
    const exchangeId = exchangeInstance.id.toString();
    this.priceSeriesId = `${exchangeId}_${templateData.symbol}_price`;
    this.volumeSeriesId = `${exchangeId}_${templateData.symbol}_volume`;
    
    // 原有初始化逻辑
    this.templateId = templateData.templateId;
    this.symbol = templateData.symbol;
    this.companyName = templateData.companyName;
    this.category = templateData.category;
    this.issuePrice = templateData.issuePrice;
    this.totalShares = templateData.totalShares;
    
    // 初始化当前价格为发行价
    this.currentPrice = templateData.issuePrice;
    this.createdAt = new Date();
    this.lastUpdateAt = new Date();
  }
}
```

#### 6.2.2 onBeginPlay() - 序列初始化

```typescript
onBeginPlay(): void {
  // 初始化当前价格为发行价
  this.currentPrice = this.issuePrice;
  this.lastUpdateAt = new Date();
  
  // 验证 TimeSeriesManager 已初始化
  if (!this.timeSeriesManager) {
    throw new Error(`TimeSeriesManager is not initialized for stock ${this.symbol}`);
  }
  
  // 创建价格序列
  this.timeSeriesManager.createSeries({
    seriesId: this.priceSeriesId,
    name: `${this.symbol} Price`,
    dataType: DataType.CONTINUOUS,
    metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE, Metric.VWAP],
    missingDataStrategy: MissingDataStrategy.USE_PREVIOUS
  });
  
  // 创建成交量序列
  this.timeSeriesManager.createSeries({
    seriesId: this.volumeSeriesId,
    name: `${this.symbol} Volume`,
    dataType: DataType.DISCRETE,
    metrics: [Metric.VOLUME],
    missingDataStrategy: MissingDataStrategy.USE_ZERO
  });
  
  // 写入初始数据点（如果当前在交易时间内）
  const initialGameTime = this.exchangeInstance.getSimulatedTime();
  if (this.exchangeInstance.isInTradingHours()) {
    const initialVolume = this.generateVolume();
    this.writeDataPoint(initialGameTime, this.currentPrice, initialVolume);
    this.lastPriceUpdateGameTime = initialGameTime.getTime();
  }
  
  // 记录初始价格历史
  this.addPriceHistory(this.currentPrice);
  
  console.log(`[StockInstance] Stock ${this.symbol} (${this.companyName}) initialized at $${this.currentPrice.toFixed(2)}`);
}
```

#### 6.2.3 onTick() - 价格模拟和数据写入

```typescript
onTick(deltaTime: number): void {
  // 检查是否在交易时间段内
  if (!this.exchangeInstance.isInTradingHours()) {
    return; // 非交易时间，不更新价格
  }
  
  // 获取当前游戏时间
  const currentGameTime = this.exchangeInstance.getSimulatedTime();
  const currentGameTimeMs = currentGameTime.getTime();
  
  // 检查是否需要更新价格（基于游戏时间间隔）
  if (currentGameTimeMs - this.lastPriceUpdateGameTime >= this.priceUpdateInterval) {
    // 1. 生成新价格（随机游走）
    const newPrice = this.generateNextPrice();
    this.currentPrice = newPrice;
    
    // 2. 生成成交量
    const volume = this.generateVolume();
    
    // 3. 写入时间序列（使用游戏时间作为时间戳）
    this.writeDataPoint(currentGameTime, newPrice, volume);
    
    // 4. 更新历史记录
    this.addPriceHistory(newPrice);
    this.lastPriceUpdateGameTime = currentGameTimeMs;
    this.lastUpdateAt = new Date(); // 系统时间用于记录
  }
}
```

#### 6.2.4 辅助方法实现

```typescript
/**
 * 写入数据点到时间序列
 */
private writeDataPoint(timestamp: Date, price: number, volume: number): void {
  if (!this.timeSeriesManager) {
    throw new Error(`TimeSeriesManager is not initialized for stock ${this.symbol}`);
  }
  
  try {
    // 写入价格数据点
    this.timeSeriesManager.addDataPoint(this.priceSeriesId, {
      timestamp: new Date(timestamp), // 使用游戏时间
      value: price,
      volume: 0  // 价格序列不需要volume字段
    });
    
    // 写入成交量数据点
    this.timeSeriesManager.addDataPoint(this.volumeSeriesId, {
      timestamp: new Date(timestamp), // 使用游戏时间
      value: volume,
      volume: volume  // 成交量序列需要volume字段（用于VWAP计算）
    });
  } catch (error) {
    console.error(`[StockInstance] Failed to write data point for ${this.symbol}:`, error);
    // 不抛出异常，避免影响游戏循环
  }
}

/**
 * 生成下一个价格（随机游走模型）
 * 公式: newPrice = oldPrice * (1 + volatility * randomNormal)
 */
private generateNextPrice(): number {
  const randomNormal = this.generateNormalRandom();
  const change = this.priceVolatility * randomNormal;
  const newPrice = this.currentPrice * (1 + change);
  
  // 确保价格不为负（不设置上限，允许自由波动）
  return Math.max(0.01, newPrice);
}

/**
 * 生成成交量
 * 公式: volume = baseVolume * (1 + volumeVolatility * randomNormal)
 */
private generateVolume(): number {
  const randomNormal = this.generateNormalRandom();
  const change = this.volumeVolatility * randomNormal;
  const volume = this.baseVolume * (1 + change);
  return Math.max(1, Math.floor(volume)); // 至少1手
}

/**
 * 生成正态分布随机数（Box-Muller 变换）
 * @returns 均值为0、标准差为1的正态随机数
 */
private generateNormalRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
}
```

## 7. 关键设计决策

### 7.1 构造函数注入

- `TimeSeriesManager` 通过构造函数注入，确保依赖关系明确
- `ExchangeInstance` 也通过构造函数注入，用于获取游戏时间和交易时间段

### 7.2 游戏时间管理

- **当前实现**：暂时使用系统时间，`getSimulatedTime()` 返回 `new Date()`
- **后续扩展**：实现完整的24小时游戏时间模拟和时间加速功能

### 7.3 交易时间段检查

- 在 `onTick()` 开始时检查是否在交易时间内
- 非交易时间直接返回，不更新价格
- 交易时间：9:30-11:30, 13:00-15:00

### 7.4 数据写入频率

- 基于游戏时间间隔判断（默认1秒）
- 使用 `lastPriceUpdateGameTime` 记录上次更新时间
- 确保数据点按时间顺序写入

### 7.5 错误处理

- `TimeSeriesManager` 未初始化时在构造函数和 `onBeginPlay` 中抛出异常
- 写入数据点失败时记录错误但不中断游戏循环
- 使用 try-catch 包裹写入逻辑，确保稳定性

### 7.6 价格模拟参数

- **价格波动率**：固定 1%（0.01）
- **基础成交量**：固定 1000
- **成交量波动率**：固定 50%（0.5）
- **价格边界**：不设置上限，只确保价格不为负

## 8. 序列初始化时机

### 8.1 初始化流程

1. `ExchangeInstance.onBeginPlay()` 中创建 `TimeSeriesManager`（如果尚未创建）
2. `StockInstance.onBeginPlay()` 中：
   - 创建价格序列和成交量序列
   - 如果当前在交易时间内，写入初始数据点
   - 初始化 `lastPriceUpdateGameTime`

### 8.2 序列ID格式

- 价格序列：`${exchangeId}_${symbol}_price`
- 成交量序列：`${exchangeId}_${symbol}_volume`

示例：
- `1_AAPL_price`
- `1_AAPL_volume`

## 9. 数据点时间戳

### 9.1 时间戳来源

- 使用游戏时间（`exchangeInstance.getSimulatedTime()`）作为数据点时间戳
- 确保时间序列数据反映模拟的24小时交易周期

### 9.2 时间顺序保证

- `TimeSeriesManager` 会验证时间顺序，不允许逆时添加
- 通过 `lastPriceUpdateGameTime` 确保数据点按顺序写入

## 10. 测试考虑

### 10.1 单元测试

- 测试价格生成逻辑（随机游走）
- 测试成交量生成逻辑
- 测试交易时间段检查
- 测试数据写入频率控制

### 10.2 集成测试

- 测试序列创建和初始化
- 测试数据点写入和聚合
- 测试时间序列查询

### 10.3 边界情况

- 交易时间段边界（9:30, 11:30, 13:00, 15:00）
- 价格接近0的情况
- `TimeSeriesManager` 未初始化的情况

## 11. 后续扩展

### 11.1 游戏时间管理

- 实现完整的24小时游戏时间模拟
- 支持时间加速功能
- 支持暂停/恢复功能

### 11.2 价格模拟算法

- 支持更复杂的价格模型（几何布朗运动、均值回归等）
- 支持不同股票类别的波动率配置
- 支持市场事件影响价格

### 11.3 成交量模拟

- 支持基于价格变化的成交量调整
- 支持不同时段的成交量模式
- 支持市场情绪影响成交量

## 12. 实现检查清单

- [ ] 修改 `ExchangeInstance` 添加 `TimeSeriesManager`
- [ ] 修改 `ExchangeInstance` 添加 `getSimulatedTime()` 和 `isInTradingHours()`
- [ ] 修改 `StockInstance` 构造函数，注入 `ExchangeInstance` 和 `TimeSeriesManager`
- [ ] 在 `StockInstance.onBeginPlay()` 中创建时间序列
- [ ] 在 `StockInstance.onTick()` 中实现价格模拟逻辑
- [ ] 实现交易时间段检查
- [ ] 实现数据写入频率控制（基于游戏时间）
- [ ] 实现价格和成交量生成方法
- [ ] 添加错误处理和日志
- [ ] 编写单元测试
- [ ] 编写集成测试

## 13. 注意事项

1. **时间序列顺序**：确保数据点按时间顺序写入，`TimeSeriesManager` 会验证时间顺序
2. **交易时间段**：必须在交易时间内才写入数据，避免非交易时间的数据污染
3. **错误隔离**：写入失败不应影响游戏循环，使用 try-catch 包裹
4. **性能考虑**：数据写入频率（1秒）需要平衡数据详细度和性能
5. **游戏时间**：当前使用系统时间作为临时方案，后续需要实现完整的游戏时间管理

---

**文档版本**：1.0  
**创建日期**：2026-01-27  
**最后更新**：2026-01-27
