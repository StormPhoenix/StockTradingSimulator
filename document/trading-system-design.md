# A股交易系统设计文档

## 文档信息

- **版本**: 1.0
- **创建日期**: 2026-01-26
- **状态**: 设计方案
- **适用场景**: 股票交易模拟系统，完全遵循A股交易规则

---

## 目录

- [1. 概述](#1-概述)
- [2. 核心组件设计](#2-核心组件设计)
- [3. TimeSeriesManager 设计](#3-timeseriesmanager-设计)
- [4. AITraderInstance 设计](#4-aitraderinstance-设计)
- [5. StockInstance 订单管理](#5-stockinstance-订单管理)
- [6. 成交历史持久化](#6-成交历史持久化)
- [7. ExchangeInstance 增强](#7-exchangeinstance-增强)
- [8. 数据库设计](#8-数据库设计)
- [9. 完整数据流](#9-完整数据流)
- [10. 实现要点](#10-实现要点)

---

## 1. 概述

### 1.1 设计目标

构建一个完全遵循A股交易规则的模拟交易系统，核心特性：
- 严格的订单撮合规则：价格优先、时间优先
- 完整的时间序列聚合支持（参考 `/document/time-series-aggregation-design.md`）
- 成交历史持久化到 MongoDB
- 支持多个AI交易者同时交易
- 实时K线数据生成和多周期查询

### 1.2 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                   ExchangeInstance                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  TimeSeriesManager                            │    │
│  │  - 管理所有股票的时间序列                       │    │
│  │  - 11个粒度的聚合窗口                          │    │
│  │  - 实时数据写入和查询                          │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Traders (Map<string, AITraderInstance>)        │    │
│  │  - 每个交易者持有对Exchange的引用               │    │
│  │  - 通过 onTick 提交交易意图                    │    │
│  └─────────────────────────────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Stocks (Map<string, StockInstance>)           │    │
│  │  - 每个股票维护订单簿和撮合逻辑                │    │
│  │  - 成交后写入 TimeSeriesManager                │    │
│  │  - 成交后写入 TradeHistory Model               │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↓
                  ┌───────────────┐
                  │   MongoDB     │
                  │ - TradeHistory│
                  │ - 其他配置   │
                  └───────────────┘
```

---

## 2. 核心组件设计

### 2.1 组件职责

| 组件 | 职责 | 关键特性 |
|-----|------|---------|
| **ExchangeInstance** | 交易所容器，管理交易者和股票 | TimeSeriesManager、统一订单提交接口 |
| **AITraderInstance** | AI交易者，生成交易决策 | 持有对Exchange的引用，通过构造函数注入 |
| **StockInstance** | 股票实例，维护订单簿 | 订单簿、撮合引擎、K线数据写入 |
| **TimeSeriesManager** | 时间序列聚合管理 | 多粒度聚合、实时写入、跨周期查询 |
| **TradeHistory Model** | 成交历史持久化 | MongoDB存储，支持多维度查询 |

### 2.2 设计原则

1. **解耦原则**：交易者通过Exchange接口提交订单，不直接访问其他组件
2. **单一职责**：每个组件只负责自己的核心功能
3. **数据一致性**：撮合成功后，原子性地更新订单簿、时间序列和历史记录
4. **可扩展性**：接口设计支持未来功能扩展（如更多聚合指标、更复杂的撮合规则）

---

## 3. TimeSeriesManager 设计

### 3.1 部署位置

**作为 ExchangeInstance 的成员变量**

```typescript
class ExchangeInstance {
  private readonly timeSeriesManager: TimeSeriesManager;

  constructor(...) {
    // ... 初始化 TimeSeriesManager
    this.timeSeriesManager = new TimeSeriesManager(this.id.toString());
  }
}
```

**原因**：
- 每个交易所管理独立的时间序列数据
- 避免跨交易所的数据混淆
- 便于生命周期管理（随交易所创建/销毁）

### 3.2 核心职责

| 功能 | 描述 | 调用时机 |
|-----|------|---------|
| **序列管理** | 创建/更新/删除股票的price/volume序列 | 交易所启动时、股票添加/移除时 |
| **数据写入** | 接收原始数据点，更新活跃窗口 | 每次成交后立即调用 |
| **聚合管理** | 维护11个粒度的聚合窗口 | 实时自动触发 |
| **数据查询** | 支持跨周期查询、自动粒度优化 | 交易者查询历史K线时 |
| **数据剔除** | 定期清理原始数据（<1m） | 定时任务触发 |

### 3.3 核心接口

```typescript
interface TimeSeriesManager {
  // ========== 序列管理 ==========
  /**
   * 创建时间序列
   * @param seriesDefinition 序列定义
   * @returns 序列ID
   */
  createSeries(seriesDefinition: SeriesDefinition): string;

  /**
   * 更新序列配置
   * @param seriesId 序列ID
   * @param updates 更新内容
   */
  updateSeries(seriesId: string, updates: Partial<SeriesDefinition>): void;

  /**
   * 删除序列
   * @param seriesId 序列ID
   * @param deleteData 是否删除数据（默认true）
   */
  deleteSeries(seriesId: string, deleteData?: boolean): void;

  // ========== 数据写入 ==========
  /**
   * 添加单个数据点
   * @param seriesId 序列ID
   * @param dataPoint 数据点
   */
  addDataPoint(seriesId: string, dataPoint: DataPoint): void;

  /**
   * 批量添加数据点
   * @param seriesId 序列ID
   * @param dataPoints 数据点数组
   */
  addDataPointBatch(seriesId: string, dataPoints: DataPoint[]): void;

  // ========== 数据查询 ==========
  /**
   * 查询聚合数据
   * @param options 查询选项
   * @returns 聚合数据结果
   */
  queryAggregatedData(options: QueryOptions): AggregatedDataResult;

  // ========== 聚合管理 ==========
  /**
   * 手动触发预聚合
   * @param options 聚合选项
   */
  preaggregate(options: PreaggregateOptions): void;

  /**
   * 获取聚合状态
   * @param seriesId 序列ID
   * @returns 聚合状态数组
   */
  getAggregationStatus(seriesId: string): AggregationStatus[];

  // ========== 数据剔除 ==========
  /**
   * 调度数据剔除任务
   * @param task 剔除任务
   * @returns 任务ID
   */
  schedulePurge(task: PurgeTask): string;

  /**
   * 执行剔除任务
   * @param taskId 任务ID
   * @returns 剔除结果
   */
  executePurge(taskId: string): PurgeResult;
}
```

### 3.4 序列定义

每个股票需要创建两个时间序列：

```typescript
interface SeriesDefinition {
  seriesId: string;                    // 序列ID，如 "EXCH1_AAPL_price"
  name: string;                        // 显示名称，如 "AAPL Price"
  seriesType: 'CONTINUOUS' | 'DISCRETE';
  missingDataStrategy: 'PREVIOUS_CLOSE' | 'ZERO';
  metrics: string[];                   // 需要计算的指标
  relatedSeries?: Record<string, string>; // 关联序列（用于VWAP等）
}

// 示例：创建AAPL的价格序列
const priceSeries: SeriesDefinition = {
  seriesId: `${exchangeId}_AAPL_price`,
  name: 'AAPL Price',
  seriesType: 'CONTINUOUS',
  missingDataStrategy: 'PREVIOUS_CLOSE',
  metrics: ['open', 'high', 'low', 'close', 'vwap'],
  relatedSeries: {
    vwap: `${exchangeId}_AAPL_volume`
  }
};

// 示例：创建AAPL的成交量序列
const volumeSeries: SeriesDefinition = {
  seriesId: `${exchangeId}_AAPL_volume`,
  name: 'AAPL Volume',
  seriesType: 'DISCRETE',
  missingDataStrategy: 'ZERO',
  metrics: ['sum', 'count']
};
```

### 3.5 数据写入时机

**每次成交后立即写入**

```typescript
// 在 StockInstance.matchOrders() 中撮合成功后
interface Trade {
  symbol: string;
  price: number;
  quantity: number;
  timestamp: Date;
}

function onTrade(trade: Trade) {
  const exchangeId = this.exchange.id.toString();

  // 写入价格序列
  this.exchange.timeSeriesManager.addDataPoint(
    `${exchangeId}_${trade.symbol}_price`,
    {
      timestamp: trade.timestamp.getTime(),
      value: trade.price,
      metadata: { symbol: trade.symbol }
    }
  );

  // 写入成交量序列
  this.exchange.timeSeriesManager.addDataPoint(
    `${exchangeId}_${trade.symbol}_volume`,
    {
      timestamp: trade.timestamp.getTime(),
      value: trade.quantity,
      metadata: { symbol: trade.symbol }
    }
  );
}
```

### 3.6 聚合粒度

支持的11个预定义粒度（参考时间序列聚合文档）：

| ID | 粒度 | 描述 | 常见用途 |
|----|------|------|---------|
| 0  | 1m   | 1 分钟 | 短期交易、实时监控 |
| 1  | 5m   | 5 分钟 | 日内交易分析 |
| 2  | 15m  | 15 分钟 | 短期趋势分析 |
| 3  | 30m  | 30 分钟 | 中期趋势分析 |
| 4  | 60m  | 1 小时 | 日内波段操作 |
| 5  | 120m | 2 小时 | 日内趋势 |
| 6  | 1d   | 1 天 | 中长期分析 |
| 7  | 5d   | 5 天 | 中期策略 |
| 8  | 20d  | 20 天 | 中长期策略 |
| 9  | 120d | 120 天 | 长期趋势 |
| 10 | 250d | 250 天 | 年度分析 |

### 3.7 查询示例

```typescript
// 查询AAPL的5分钟K线数据
const result = exchange.timeSeriesManager.queryAggregatedData({
  seriesId: 'EXCH1_AAPL_price',
  granularity: { value: 5, unit: 'm' },
  startTime: new Date('2024-01-26T09:30:00Z').getTime(),
  endTime: new Date('2024-01-26T15:00:00Z').getTime(),
  metrics: ['open', 'high', 'low', 'close', 'vwap'],
  fillMissingData: true,
  optimizeGranularity: true
});

// 返回结果
// {
//   seriesId: 'EXCH1_AAPL_price',
//   granularity: { value: 5, unit: 'm' },
//   points: [
//     {
//       startTime: 1643184000000,
//       endTime: 1643184300000,
//       dataCount: 500,
//       metrics: {
//         open: 100.5,
//         high: 105.2,
//         low: 99.8,
//         close: 103.1,
//         vwap: 102.5
//       }
//     },
//     ...
//   ]
// }
```

---

## 4. AITraderInstance 设计

### 4.1 构造函数修改

**添加 exchange 参数**

```typescript
export class AITraderInstance implements GameObject {
  public readonly id: number;
  public state: GameObjectState = GameObjectState.READY;

  // 模板数据
  public readonly templateId: string;
  public readonly name: string;
  public readonly riskProfile: 'conservative' | 'moderate' | 'aggressive';

  // 新增：交易所引用
  private readonly exchange: ExchangeInstance;

  // 运行时状态
  private isActive: boolean = false;

  // 交易行为配置 - 基于 onTick 的时间累积
  private readonly tradingIntervalMs: number = 5000;
  private accumulatedTime: number = 0;
  private lastTradingTime: number = 0;

  constructor(
    id: number,
    exchange: ExchangeInstance,  // 新增参数
    templateData: {
      templateId: string;
      name: string;
      riskProfile: 'conservative' | 'moderate' | 'aggressive';
      initialCapital: number;
    }
  ) {
    this.id = id;
    this.exchange = exchange;  // 保存交易所引用
    this.templateId = templateData.templateId;
    this.name = templateData.name;
    this.riskProfile = templateData.riskProfile;
  }

  // ... 其他方法保持不变
}
```

### 4.2 交易决策接口

**通过交易所接口提交订单**

```typescript
export class AITraderInstance implements GameObject {
  // ... 其他代码

  /**
   * 提交限价买单
   */
  private submitLimitBuyOrder(
    symbol: string,
    price: number,
    quantity: number
  ): string {
    return this.exchange.submitOrder({
      traderId: this.id.toString(),
      traderName: this.name,
      type: 'limit',
      side: 'buy',
      symbol,
      price,
      quantity,
      timestamp: new Date()
    });
  }

  /**
   * 提交限价卖单
   */
  private submitLimitSellOrder(
    symbol: string,
    price: number,
    quantity: number
  ): string {
    return this.exchange.submitOrder({
      traderId: this.id.toString(),
      traderName: this.name,
      type: 'limit',
      side: 'sell',
      symbol,
      price,
      quantity,
      timestamp: new Date()
    });
  }

  /**
   * 提交市价买单
   */
  private submitMarketBuyOrder(
    symbol: string,
    quantity: number
  ): string {
    return this.exchange.submitOrder({
      traderId: this.id.toString(),
      traderName: this.name,
      type: 'market',
      side: 'buy',
      symbol,
      price: 0,  // 市价单价格为0
      quantity,
      timestamp: new Date()
    });
  }

  /**
   * 提交市价卖单
   */
  private submitMarketSellOrder(
    symbol: string,
    quantity: number
  ): string {
    return this.exchange.submitOrder({
      traderId: this.id.toString(),
      traderName: this.name,
      type: 'market',
      side: 'sell',
      symbol,
      price: 0,  // 市价单价格为0
      quantity,
      timestamp: new Date()
    });
  }
}
```

### 4.3 onTick 交易逻辑示例

```typescript
export class AITraderInstance implements GameObject {
  // ... 其他代码

  onTick(deltaTime: number): void {
    if (!this.isActive || this.state !== GameObjectState.ACTIVE) {
      return;
    }

    this.accumulatedTime += deltaTime * 1000;

    // 检查是否到了交易时间
    if (this.accumulatedTime - this.lastTradingTime >= this.tradingIntervalMs) {
      this.makeTradingDecision();
      this.lastTradingTime = this.accumulatedTime;
    }
  }

  /**
   * 交易决策逻辑
   */
  private makeTradingDecision(): void {
    // 获取可用股票列表
    const stocks = this.exchange.getAvailableStocks();
    if (stocks.length === 0) {
      return;
    }

    // 简单的交易策略：随机选择股票和方向
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const isBuy = Math.random() > 0.5;

    // 根据风险偏好决定交易数量
    const quantity = this.calculateQuantityByRisk(randomStock);

    if (isBuy) {
      // 提交买单
      this.submitLimitBuyOrder(
        randomStock.symbol,
        randomStock.getCurrentPrice() * 1.01,  // 稍高于当前价格
        quantity
      );
      console.log(`[AITraderInstance] ${this.name} submitted BUY order for ${randomStock.symbol}: ${quantity} shares`);
    } else {
      // 提交卖单（简化版：假设有持仓）
      this.submitLimitSellOrder(
        randomStock.symbol,
        randomStock.getCurrentPrice() * 0.99,  // 稍低于当前价格
        quantity
      );
      console.log(`[AITraderInstance] ${this.name} submitted SELL order for ${randomStock.symbol}: ${quantity} shares`);
    }
  }

  /**
   * 根据风险偏好计算交易数量
   */
  private calculateQuantityByRisk(stock: StockInstance): number {
    const baseQuantity = 100; // 基础数量

    switch (this.riskProfile) {
      case 'conservative':
        return baseQuantity;
      case 'moderate':
        return baseQuantity * 2;
      case 'aggressive':
        return baseQuantity * 5;
      default:
        return baseQuantity;
    }
  }
}
```

### 4.4 设计优势

| 优势 | 说明 |
|-----|------|
| **解耦** | 交易者不需要直接访问股票实例，通过交易所接口统一管理 |
| **简化** | 交易所提供统一的订单提交接口，隐藏内部复杂性 |
| **可测试** | 可以轻松mock交易所接口进行单元测试 |
| **可扩展** | 未来可以添加更多交易所功能（如获取历史数据、市场统计等） |

---

## 5. StockInstance 订单管理

### 5.1 订单簿设计

**数据结构**

```typescript
interface Order {
  orderId: string;              // 订单ID
  traderId: string;             // 交易员ID
  traderName: string;           // 交易员名称
  type: 'limit' | 'market';     // 订单类型
  side: 'buy' | 'sell';         // 买卖方向
  symbol: string;               // 股票代码
  price: number;                // 价格（市价单为0）
  quantity: number;             // 数量
  filledQuantity: number;       // 已成交数量
  timestamp: Date;              // 提交时间
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
}
```

**优先队列**

```typescript
interface OrderBook {
  // 买单队列：按价格降序，时间升序
  buyOrders: Order[];

  // 卖单队列：按价格升序，时间升序
  sellOrders: Order[];
}
```

### 5.2 StockInstance 增强

```typescript
export class StockInstance implements GameObject {
  public readonly id: number;
  public state: GameObjectState = GameObjectState.READY;

  // 模板数据
  public readonly templateId: string;
  public readonly symbol: string;
  public readonly companyName: string;
  public readonly category: string;
  public readonly issuePrice: number;
  public readonly totalShares: number;

  // 新增：交易所引用
  private readonly exchange: ExchangeInstance;

  // 新增：订单簿
  private orderBook: OrderBook = {
    buyOrders: [],
    sellOrders: []
  };

  // 新增：撮合引擎
  private matchEngine: MatchEngine;

  // 原有字段
  private currentPrice: number;
  private readonly createdAt: Date;
  private lastUpdateAt: Date;

  constructor(
    id: number,
    exchange: ExchangeInstance,  // 新增参数
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
    this.exchange = exchange;  // 保存交易所引用
    this.templateId = templateData.templateId;
    this.symbol = templateData.symbol;
    this.companyName = templateData.companyName;
    this.category = templateData.category;
    this.issuePrice = templateData.issuePrice;
    this.totalShares = templateData.totalShares;

    this.currentPrice = templateData.issuePrice;
    this.createdAt = new Date();
    this.lastUpdateAt = new Date();

    // 初始化撮合引擎
    this.matchEngine = new MatchEngine(this);
  }

  // ... 其他原有方法

  /**
   * 接收订单
   */
  public receiveOrder(order: Order): string {
    // 验证订单
    if (!this.validateOrder(order)) {
      throw new Error('Invalid order');
    }

    // 添加到订单簿
    this.addToOrderBook(order);

    // 尝试撮合
    const trades = this.matchEngine.match();

    // 处理成交
    trades.forEach(trade => this.handleTrade(trade));

    return order.orderId;
  }

  /**
   * 验证订单
   */
  private validateOrder(order: Order): boolean {
    if (order.symbol !== this.symbol) {
      return false;
    }

    if (order.quantity <= 0) {
      return false;
    }

    if (order.type === 'limit' && order.price <= 0) {
      return false;
    }

    return true;
  }

  /**
   * 添加到订单簿
   */
  private addToOrderBook(order: Order): void {
    if (order.side === 'buy') {
      // 买单：按价格降序，时间升序
      this.orderBook.buyOrders.push(order);
      this.sortBuyOrders();
    } else {
      // 卖单：按价格升序，时间升序
      this.orderBook.sellOrders.push(order);
      this.sortSellOrders();
    }
  }

  /**
   * 排序买单
   */
  private sortBuyOrders(): void {
    this.orderBook.buyOrders.sort((a, b) => {
      // 价格降序
      if (b.price !== a.price) {
        return b.price - a.price;
      }
      // 时间升序
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * 排序卖单
   */
  private sortSellOrders(): void {
    this.orderBook.sellOrders.sort((a, b) => {
      // 价格升序
      if (a.price !== b.price) {
        return a.price - b.price;
      }
      // 时间升序
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }

  /**
   * 处理成交
   */
  private handleTrade(trade: Trade): void {
    // 1. 写入 TimeSeriesManager
    this.exchange.timeSeriesManager.addDataPoint(
      `${this.exchange.id.toString()}_${this.symbol}_price`,
      {
        timestamp: trade.timestamp.getTime(),
        value: trade.price,
        metadata: { symbol: this.symbol }
      }
    );

    this.exchange.timeSeriesManager.addDataPoint(
      `${this.exchange.id.toString()}_${this.symbol}_volume`,
      {
        timestamp: trade.timestamp.getTime(),
        value: trade.quantity,
        metadata: { symbol: this.symbol }
      }
    );

    // 2. 写入 TradeHistory Model
    this.exchange.recordTrade(trade);

    // 3. 更新当前价格
    this.currentPrice = trade.price;

    console.log(`[StockInstance] Trade executed: ${this.symbol} ${trade.quantity} shares @ $${trade.price.toFixed(2)}`);
  }
}
```

### 5.3 撮合引擎设计

```typescript
class MatchEngine {
  private readonly stock: StockInstance;

  constructor(stock: StockInstance) {
    this.stock = stock;
  }

  /**
   * 执行撮合
   * @returns 成交列表
   */
  public match(): Trade[] {
    const trades: Trade[] = [];
    const orderBook = this.stock['orderBook'];

    // 持续撮合直到无法成交
    while (this.canMatch()) {
      const bestBuy = orderBook.buyOrders[0];  // 最高价买单
      const bestSell = orderBook.sellOrders[0]; // 最低价卖单

      // 检查是否可以撮合（买单价格 >= 卖单价格）
      if (bestBuy.price < bestSell.price) {
        break;
      }

      // 确定成交价格（使用买方价格）
      const tradePrice = bestBuy.price;

      // 确定成交数量（取较小值）
      const buyRemain = bestBuy.quantity - bestBuy.filledQuantity;
      const sellRemain = bestSell.quantity - bestSell.filledQuantity;
      const tradeQuantity = Math.min(buyRemain, sellRemain);

      // 执行撮合
      this.executeTrade(bestBuy, bestSell, tradePrice, tradeQuantity);

      // 记录成交
      trades.push({
        tradeId: this.generateTradeId(),
        exchangeId: this.stock['exchange'].id.toString(),
        timestamp: new Date(),
        symbol: this.stock.symbol,
        stockName: this.stock.companyName,
        buyerId: bestBuy.traderId,
        buyerName: bestBuy.traderName,
        sellerId: bestSell.traderId,
        sellerName: bestSell.traderName,
        price: tradePrice,
        quantity: tradeQuantity,
        amount: tradePrice * tradeQuantity,
        tradeType: 'buy',
        buyerOrderId: bestBuy.orderId,
        sellerOrderId: bestSell.orderId
      });

      // 移除完全成交的订单
      this.removeFullyFilledOrders();
    }

    return trades;
  }

  /**
   * 检查是否可以撮合
   */
  private canMatch(): boolean {
    const orderBook = this.stock['orderBook'];
    return orderBook.buyOrders.length > 0 && orderBook.sellOrders.length > 0;
  }

  /**
   * 执行撮合
   */
  private executeTrade(
    buyOrder: Order,
    sellOrder: Order,
    price: number,
    quantity: number
  ): void {
    // 更新买单成交数量
    buyOrder.filledQuantity += quantity;
    if (buyOrder.filledQuantity === buyOrder.quantity) {
      buyOrder.status = 'filled';
    } else {
      buyOrder.status = 'partial';
    }

    // 更新卖单成交数量
    sellOrder.filledQuantity += quantity;
    if (sellOrder.filledQuantity === sellOrder.quantity) {
      sellOrder.status = 'filled';
    } else {
      sellOrder.status = 'partial';
    }
  }

  /**
   * 移除完全成交的订单
   */
  private removeFullyFilledOrders(): void {
    const orderBook = this.stock['orderBook'];

    orderBook.buyOrders = orderBook.buyOrders.filter(order => order.status !== 'filled');
    orderBook.sellOrders = orderBook.sellOrders.filter(order => order.status !== 'filled');
  }

  /**
   * 生成交易ID
   */
  private generateTradeId(): string {
    return `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 6. 成交历史持久化

### 6.1 数据库模型：TradeHistory

```typescript
import mongoose, { Document, Model } from 'mongoose';
import { BaseSchema, registerModel } from './index';

// ========== 类型定义 ==========

export interface ITradeHistory {
  tradeId: string;              // 交易唯一ID
  exchangeId: string;           // 所属交易所ID
  timestamp: Date;              // 成交时间
  symbol: string;               // 股票代码
  stockName: string;            // 股票名称

  // 买卖双方
  buyerId: string;              // 买方交易员ID
  buyerName: string;           // 买方名称
  sellerId: string;            // 卖方交易员ID（市价卖单为null）
  sellerName: string;          // 卖方名称（市价卖单为null）

  // 交易详情
  price: number;               // 成交价格
  quantity: number;            // 成交数量
  amount: number;             // 成交金额
  tradeType: 'buy' | 'sell';   // 交易类型（从买方视角）

  // 订单信息
  buyerOrderId: string;        // 买方订单ID
  sellerOrderId?: string;      // 卖方订单ID（市价卖单为null）

  createdAt: Date;
  updatedAt: Date;
}

// Document 接口
export interface ITradeHistoryDocument extends ITradeHistory, Document {
  getFormattedAmount(): string;
  getFormattedPrice(): string;
}

// Model 接口
export interface ITradeHistoryModel extends Model<ITradeHistoryDocument> {
  findByExchange(exchangeId: string, limit?: number): Promise<ITradeHistoryDocument[]>;
  findByTrader(traderId: string, limit?: number): Promise<ITradeHistoryDocument[]>;
  findBySymbol(symbol: string, startTime?: Date, endTime?: Date): Promise<ITradeHistoryDocument[]>;
  findByDateRange(startTime: Date, endTime: Date, exchangeId?: string): Promise<ITradeHistoryDocument[]>;
}

// ========== Schema 定义 ==========

const tradeHistorySchema = new BaseSchema<ITradeHistoryDocument>({
  // 交易ID
  tradeId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // 交易所ID
  exchangeId: {
    type: String,
    required: true,
    index: true
  },

  // 成交时间
  timestamp: {
    type: Date,
    required: true,
    index: true
  },

  // 股票信息
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
    index: true
  },
  stockName: {
    type: String,
    required: true,
    trim: true
  },

  // 买方信息
  buyerId: {
    type: String,
    required: true,
    index: true
  },
  buyerName: {
    type: String,
    required: true,
    trim: true
  },

  // 卖方信息
  sellerId: {
    type: String,
    required: true,
    index: true
  },
  sellerName: {
    type: String,
    required: true,
    trim: true
  },

  // 交易详情
  price: {
    type: Number,
    required: true,
    min: 0.01,
    set: (v: number) => Math.round(v * 100) / 100  // 保留2位小数
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    validate: {
      validator: Number.isInteger,
      message: '成交数量必须为整数'
    }
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
    set: (v: number) => Math.round(v * 100) / 100  // 保留2位小数
  },
  tradeType: {
    type: String,
    required: true,
    enum: ['buy', 'sell']
  },

  // 订单信息
  buyerOrderId: {
    type: String,
    required: true
  },
  sellerOrderId: {
    type: String
  }
}, {
  timestamps: true,
  collection: 'trade_history'
});

// ========== 复合索引 ==========

// 交易所 + 时间：支持按交易所查询历史
tradeHistorySchema.index({ exchangeId: 1, timestamp: -1 });

// 交易员 + 时间：支持按交易员查询
tradeHistorySchema.index({ buyerId: 1, timestamp: -1 });
tradeHistorySchema.index({ sellerId: 1, timestamp: -1 });

// 股票 + 时间：支持按股票查询
tradeHistorySchema.index({ symbol: 1, timestamp: -1 });

// 交易所 + 时间范围：支持按时间范围查询
tradeHistorySchema.index({ exchangeId: 1, timestamp: 1 });

// ========== 实例方法 ==========

tradeHistorySchema.methods.getFormattedAmount = function(this: ITradeHistoryDocument): string {
  return `$${this.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

tradeHistorySchema.methods.getFormattedPrice = function(this: ITradeHistoryDocument): string {
  return `$${this.price.toFixed(2)}`;
};

// ========== 静态方法 ==========

/**
 * 按交易所查询
 */
tradeHistorySchema.statics.findByExchange = function(
  this: ITradeHistoryModel,
  exchangeId: string,
  limit: number = 100
): Promise<ITradeHistoryDocument[]> {
  return this.find({ exchangeId })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

/**
 * 按交易员查询
 */
tradeHistorySchema.statics.findByTrader = function(
  this: ITradeHistoryModel,
  traderId: string,
  limit: number = 100
): Promise<ITradeHistoryDocument[]> {
  return this.find({
    $or: [
      { buyerId: traderId },
      { sellerId: traderId }
    ]
  })
    .sort({ timestamp: -1 })
    .limit(limit)
    .exec();
};

/**
 * 按股票查询
 */
tradeHistorySchema.statics.findBySymbol = function(
  this: ITradeHistoryModel,
  symbol: string,
  startTime?: Date,
  endTime?: Date
): Promise<ITradeHistoryDocument[]> {
  const query: any = { symbol: symbol.toUpperCase() };

  if (startTime || endTime) {
    query.timestamp = {};
    if (startTime) query.timestamp.$gte = startTime;
    if (endTime) query.timestamp.$lte = endTime;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(1000)
    .exec();
};

/**
 * 按时间范围查询
 */
tradeHistorySchema.statics.findByDateRange = function(
  this: ITradeHistoryModel,
  startTime: Date,
  endTime: Date,
  exchangeId?: string
): Promise<ITradeHistoryDocument[]> {
  const query: any = {
    timestamp: { $gte: startTime, $lte: endTime }
  };

  if (exchangeId) {
    query.exchangeId = exchangeId;
  }

  return this.find(query)
    .sort({ timestamp: -1 })
    .limit(10000)
    .exec();
};

// ========== 中间件 ==========

tradeHistorySchema.pre('save', function(this: ITradeHistoryDocument, next) {
  // 确保symbol是大写
  if (this.symbol) {
    this.symbol = this.symbol.toUpperCase();
  }

  // 确保amount = price * quantity
  if (this.price && this.quantity) {
    this.amount = Math.round(this.price * this.quantity * 100) / 100;
  }

  next();
});

// ========== 注册模型 ==========

const TradeHistory = registerModel<ITradeHistoryDocument>('TradeHistory', tradeHistorySchema) as ITradeHistoryModel;

export default TradeHistory;
```

### 6.2 使用示例

```typescript
// 在 ExchangeInstance 中
import TradeHistory from '../models/tradeHistory';

export class ExchangeInstance {
  // ... 其他代码

  /**
   * 记录成交
   */
  public recordTrade(trade: Trade): void {
    TradeHistory.create({
      tradeId: trade.tradeId,
      exchangeId: this.id.toString(),
      timestamp: trade.timestamp,
      symbol: trade.symbol,
      stockName: trade.stockName,
      buyerId: trade.buyerId,
      buyerName: trade.buyerName,
      sellerId: trade.sellerId,
      sellerName: trade.sellerName,
      price: trade.price,
      quantity: trade.quantity,
      amount: trade.amount,
      tradeType: trade.tradeType,
      buyerOrderId: trade.buyerOrderId,
      sellerOrderId: trade.sellerOrderId
    }).catch(err => {
      console.error('[ExchangeInstance] Failed to record trade:', err);
    });
  }

  /**
   * 查询成交历史
   */
  public getTradeHistory(options: {
    limit?: number;
    traderId?: string;
    symbol?: string;
    startTime?: Date;
    endTime?: Date;
  }): Promise<any[]> {
    if (options.traderId) {
      return TradeHistory.findByTrader(options.traderId, options.limit);
    } else if (options.symbol) {
      return TradeHistory.findBySymbol(
        options.symbol,
        options.startTime,
        options.endTime
      );
    } else if (options.startTime && options.endTime) {
      return TradeHistory.findByDateRange(
        options.startTime,
        options.endTime,
        this.id.toString()
      );
    } else {
      return TradeHistory.findByExchange(this.id.toString(), options.limit);
    }
  }
}
```

### 6.3 存储策略

| 策略项 | 说明 |
|-------|------|
| **实时写入** | 每次撮合成功后立即写入 MongoDB |
| **索引优化** | 支持按交易所、交易员、股票、时间等多维度查询 |
| **数据保留** | 永久保留，支持历史查询和分析 |
| **错误处理** | 写入失败时记录错误日志，不影响撮合流程 |

---

## 7. ExchangeInstance 增强

### 7.1 成员变量

```typescript
export class ExchangeInstance implements GameObject {
  public readonly id: number;
  public state: GameObjectState = GameObjectState.READY;

  // 模板数据
  public readonly templateId: string;
  public readonly name: string;
  public readonly description: string;
  public readonly createdAt: Date;

  // 运行时状态
  private traders: Map<string, AITraderInstance> = new Map();
  private stocks: Map<string, StockInstance> = new Map();
  private isActive: boolean = false;
  private lastActiveAt: Date = new Date();

  // 新增：时间序列管理器
  private readonly timeSeriesManager: TimeSeriesManager;

  // 新增：成交历史模型引用
  private tradeHistoryModel: ITradeHistoryModel;

  // 新增：当前模拟时间
  private simulatedTime: Date;
  private timeAcceleration: number = 1.0; // 时间加速倍数

  constructor(
    id: number,
    templateData: {
      templateId: string;
      name: string;
      description: string;
    }
  ) {
    this.id = id;
    this.templateId = templateData.templateId;
    this.name = templateData.name;
    this.description = templateData.description;
    this.createdAt = new Date();

    // 初始化时间序列管理器
    this.timeSeriesManager = new TimeSeriesManager(this.id.toString());

    // 引入TradeHistory模型
    this.tradeHistoryModel = require('../models/tradeHistory').default;

    // 初始化模拟时间
    this.simulatedTime = new Date();
  }

  // ... 其他方法
}
```

### 7.2 订单提交接口

```typescript
export class ExchangeInstance implements GameObject {
  // ... 其他代码

  /**
   * 统一订单提交接口
   */
  public submitOrder(orderRequest: {
    traderId: string;
    traderName: string;
    type: 'limit' | 'market';
    side: 'buy' | 'sell';
    symbol: string;
    price: number;
    quantity: number;
    timestamp: Date;
  }): string {
    // 1. 查找股票实例
    const stock = this.stocks.get(orderRequest.symbol);
    if (!stock) {
      throw new Error(`Stock ${orderRequest.symbol} not found`);
    }

    // 2. 验证订单
    if (orderRequest.quantity <= 0) {
      throw new Error('Order quantity must be positive');
    }

    if (orderRequest.type === 'limit' && orderRequest.price <= 0) {
      throw new Error('Limit order price must be positive');
    }

    // 3. 生成订单ID
    const orderId = this.generateOrderId();

    // 4. 创建订单对象
    const order: Order = {
      orderId,
      traderId: orderRequest.traderId,
      traderName: orderRequest.traderName,
      type: orderRequest.type,
      side: orderRequest.side,
      symbol: orderRequest.symbol,
      price: orderRequest.price,
      quantity: orderRequest.quantity,
      filledQuantity: 0,
      timestamp: orderRequest.timestamp,
      status: 'pending'
    };

    // 5. 提交到股票实例
    stock.receiveOrder(order);

    console.log(`[ExchangeInstance] Order ${orderId} submitted for ${orderRequest.symbol}`);

    return orderId;
  }

  /**
   * 生成订单ID
   */
  private generateOrderId(): string {
    return `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### 7.3 时间管理

```typescript
export class ExchangeInstance implements GameObject {
  // ... 其他代码

  onTick(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }

    this.lastActiveAt = new Date();

    // 更新模拟时间（考虑加速倍数）
    this.updateSimulatedTime(deltaTime);

    // 更新所有活跃的交易员
    for (const trader of this.traders.values()) {
      if (trader.state === GameObjectState.ACTIVE) {
        trader.onTick(deltaTime);
      }
    }

    // 更新所有活跃的股票
    for (const stock of this.stocks.values()) {
      if (stock.state === GameObjectState.ACTIVE) {
        stock.onTick(deltaTime);
      }
    }
  }

  /**
   * 更新模拟时间
   */
  private updateSimulatedTime(deltaTime: number): void {
    // deltaTime 以秒为单位，转换为毫秒
    const elapsedMs = deltaTime * 1000 * this.timeAcceleration;
    this.simulatedTime = new Date(this.simulatedTime.getTime() + elapsedMs);
  }

  /**
   * 获取当前模拟时间
   */
  public getSimulatedTime(): Date {
    return new Date(this.simulatedTime);
  }

  /**
   * 设置时间加速倍数
   */
  public setTimeAcceleration(acceleration: number): void {
    if (acceleration <= 0) {
      throw new Error('Time acceleration must be positive');
    }
    this.timeAcceleration = acceleration;
    console.log(`[ExchangeInstance] Time acceleration set to ${acceleration}x`);
  }

  /**
   * 检查是否在交易时间
   * A股交易时间：9:30-11:30, 13:00-15:00
   */
  public isInTradingHours(): boolean {
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;

    const morningStart = 9 * 60 + 30;   // 9:30
    const morningEnd = 11 * 60 + 30;    // 11:30
    const afternoonStart = 13 * 60;     // 13:00
    const afternoonEnd = 15 * 60;       // 15:00

    return (timeValue >= morningStart && timeValue <= morningEnd) ||
           (timeValue >= afternoonStart && timeValue <= afternoonEnd);
  }
}
```

### 7.4 初始化时间序列

```typescript
export class ExchangeInstance implements GameObject {
  // ... 其他代码

  onBeginPlay(): void {
    this.isActive = true;
    this.lastActiveAt = new Date();

    console.log(`[ExchangeInstance] Exchange "${this.name}" (ID: ${this.id}) started with ${this.traders.size} traders and ${this.stocks.size} stocks`);

    // 初始化时间序列
    this.initializeTimeSeries();

    // 激活所有交易员
    for (const trader of this.traders.values()) {
      if (trader.state === GameObjectState.READY) {
        trader.onBeginPlay();
        trader.state = GameObjectState.ACTIVE;
      }
    }

    // 激活所有股票
    for (const stock of this.stocks.values()) {
      if (stock.state === GameObjectState.READY) {
        stock.onBeginPlay();
        stock.state = GameObjectState.ACTIVE;
      }
    }
  }

  /**
   * 初始化时间序列
   */
  private initializeTimeSeries(): void {
    const exchangeId = this.id.toString();

    for (const stock of this.stocks.values()) {
      // 创建价格序列
      this.timeSeriesManager.createSeries({
        seriesId: `${exchangeId}_${stock.symbol}_price`,
        name: `${stock.symbol} Price`,
        seriesType: 'CONTINUOUS',
        missingDataStrategy: 'PREVIOUS_CLOSE',
        metrics: ['open', 'high', 'low', 'close', 'vwap'],
        relatedSeries: {
          vwap: `${exchangeId}_${stock.symbol}_volume`
        }
      });

      // 创建成交量序列
      this.timeSeriesManager.createSeries({
        seriesId: `${exchangeId}_${stock.symbol}_volume`,
        name: `${stock.symbol} Volume`,
        seriesType: 'DISCRETE',
        missingDataStrategy: 'ZERO',
        metrics: ['sum', 'count']
      });

      console.log(`[ExchangeInstance] Time series initialized for ${stock.symbol}`);
    }
  }
}
```

---

## 8. 数据库设计

### 8.1 数据库模型概览

| 模型 | 用途 | 文件位置 |
|-----|------|---------|
| **StockTemplate** | 股票模板（静态信息） | `server/src/models/stockTemplate.ts` |
| **MarketTemplate** | 市场环境模板 | `server/src/models/marketTemplate.ts` |
| **TradeHistory** | 成交历史（新增） | `server/src/models/tradeHistory.ts` |

### 8.2 数据关系图

```
StockTemplate (模板)
  ├── symbol: string (股票代码)
  ├── name: string (公司名称)
  ├── issuePrice: number (发行价)
  └── totalShares: number (总股本)
        ↓
    StockInstance (运行时)
        ├── orderBook: OrderBook (订单簿)
        ├── matchEngine: MatchEngine (撮合引擎)
        └── onTrade() → 写入 TradeHistory 和 TimeSeriesManager

TradeHistory (新增)
  ├── tradeId: string (交易ID)
  ├── exchangeId: string (交易所ID)
  ├── symbol: string (股票代码)
  ├── buyerId: string (买方ID)
  ├── sellerId: string (卖方ID)
  ├── price: number (成交价)
  ├── quantity: number (成交数量)
  └── timestamp: Date (成交时间)

TimeSeriesManager
  ├── series: Map<string, SeriesDefinition> (序列定义)
  ├── activeWindows: Map<string, ActiveWindow> (活跃窗口)
  └── aggregatedData: Map<string, AggregatedPoint[]> (聚合数据)
```

### 8.3 索引设计

#### TradeHistory 索引

```typescript
// 单字段索引
tradeHistorySchema.index({ tradeId: 1 }, { unique: true });           // 唯一
tradeHistorySchema.index({ exchangeId: 1 });
tradeHistorySchema.index({ symbol: 1 });
tradeHistorySchema.index({ buyerId: 1 });
tradeHistorySchema.index({ sellerId: 1 });
tradeHistorySchema.index({ timestamp: -1 });

// 复合索引
tradeHistorySchema.index({ exchangeId: 1, timestamp: -1 });          // 交易所查询
tradeHistorySchema.index({ buyerId: 1, timestamp: -1 });            // 交易员查询
tradeHistorySchema.index({ sellerId: 1, timestamp: -1 });           // 交易员查询
tradeHistorySchema.index({ symbol: 1, timestamp: -1 });             // 股票查询
tradeHistorySchema.index({ exchangeId: 1, timestamp: 1 });           // 时间范围查询
```

### 8.4 数据保留策略

| 数据类型 | 保留策略 | 说明 |
|---------|---------|------|
| **原始数据点** | 临时 | 1m聚合完成后 + 60秒缓冲可删除 |
| **1m聚合数据** | 永久 | 作为细粒度查询基础 |
| **5m及以上聚合数据** | 永久 | 优化历史数据查询性能 |
| **TradeHistory** | 永久 | 完整的成交历史记录 |

---

## 9. 完整数据流

### 9.1 订单提交和撮合流程

```
┌─────────────────┐
│ AITraderInstance│
│  .makeDecision()│
└────────┬────────┘
         │
         │ submitOrder()
         ↓
┌─────────────────┐
│ ExchangeInstance│
│  .submitOrder() │
└────────┬────────┘
         │
         │ receiveOrder()
         ↓
┌─────────────────┐
│ StockInstance   │
│  .receiveOrder() │
└────────┬────────┘
         │
         │ match()
         ↓
┌─────────────────┐
│  MatchEngine    │
│   .match()     │
└────────┬────────┘
         │
         │ handleTrade()
         ↓
    ┌────┴────┐
    │         │
    ↓         ↓
┌────────┐ ┌──────────┐
│TimeSeri│ │ TradeHist│
│Manager │ │  ory DB  │
└────────┘ └──────────┘
```

### 9.2 时间序列数据流

```
撮合成功
  ↓
StockInstance.handleTrade()
  ↓
├─→ TimeSeriesManager.addDataPoint(price)
│      ↓
│      更新11个粒度的活跃窗口
│      ↓
│      增量聚合指标（open, high, low, close, vwap）
│
└─→ TimeSeriesManager.addDataPoint(volume)
       ↓
       更新11个粒度的活跃窗口
       ↓
       增量聚合指标（sum, count）
```

### 9.3 查询数据流

```
交易员查询K线
  ↓
ExchangeInstance.queryKLine()
  ↓
TimeSeriesManager.queryAggregatedData()
  ↓
分析查询范围和粒度
  ↓
选择查询路径：
  ├─ 活跃窗口（内存）< 1ms
  ├─ 热数据（最近30天）~10ms
  └─ 冷数据（30天前）~50ms
  ↓
合并查询结果
  ↓
填充 gaps（根据配置）
  ↓
返回K线数据
  ↓
总查询时间: < 100ms
```

---

## 10. 实现要点

### 10.1 A股交易规则实现

| 规则 | 实现方式 |
|-----|---------|
| **订单撮合** | 价格优先、时间优先 |
| **订单有效期** | 仅当日有效，交易结束后自动清除 |
| **交易时间** | 9:30-11:30, 13:00-15:00 |
| **时间模拟** | 24小时模拟时间，支持加速 |
| **数据写入** | 每次成交后立即写入 |

### 10.2 性能优化

| 优化点 | 实现方式 |
|-------|---------|
| **撮合性能** | 使用优先队列，O(log n) 插入和删除 |
| **聚合性能** | 增量聚合，避免全量重算 |
| **查询性能** | 多层缓存，自动粒度优化 |
| **写入性能** | 异步写入MongoDB，不阻塞撮合 |

### 10.3 数据一致性

| 一致性要求 | 实现方式 |
|-----------|---------|
| **订单状态** | 原子性更新订单簿和订单状态 |
| **成交记录** | 撮合成功后立即写入TradeHistory |
| **时间序列** | 撮合成功后立即写入TimeSeriesManager |
| **错误处理** | 写入失败时记录日志，不回滚撮合 |

### 10.4 扩展性设计

| 扩展点 | 说明 |
|-------|------|
| **聚合指标** | 支持动态注册自定义指标 |
| **撮合规则** | MatchEngine可替换，支持复杂规则 |
| **订单类型** | 易于添加止损单、冰山单等 |
| **市场类型** | 支持扩展到期货、外汇等市场 |

---

## 附录

### A. 文件组织结构

```
server/src/
├── models/
│   ├── stockTemplate.ts                    # 股票模板（已有）
│   ├── marketTemplate.ts                   # 市场环境模板（已有）
│   ├── tradeHistory.ts                     # 成交历史（新增）
│   ├── runtime/
│   │   ├── aiTraderInstance.ts             # AI交易者（修改构造函数）
│   │   ├── exchangeInstance.ts             # 交易所（添加TimeSeriesManager）
│   │   ├── stockInstance.ts                # 股票（添加订单簿和撮合）
│   │   └── timeSeries/                    # 时间序列模块（新增）
│   │       ├── timeSeriesManager.ts        # 时间序列管理器
│   │       ├── types.ts                    # 类型定义
│   │       ├── aggregators.ts              # 累加器实现
│   │       └── windows.ts                  # 窗口管理
│   └── index.ts                           # 模型导出（已有）
└── ...
```

### B. 关键接口定义

```typescript
// 订单接口
interface Order {
  orderId: string;
  traderId: string;
  traderName: string;
  type: 'limit' | 'market';
  side: 'buy' | 'sell';
  symbol: string;
  price: number;
  quantity: number;
  filledQuantity: number;
  timestamp: Date;
  status: 'pending' | 'partial' | 'filled' | 'cancelled';
}

// 订单簿接口
interface OrderBook {
  buyOrders: Order[];
  sellOrders: Order[];
}

// 成交接口
interface Trade {
  tradeId: string;
  exchangeId: string;
  timestamp: Date;
  symbol: string;
  stockName: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  price: number;
  quantity: number;
  amount: number;
  tradeType: 'buy' | 'sell';
  buyerOrderId: string;
  sellerOrderId?: string;
}
```

### C. 配置示例

```typescript
// 时间序列配置
const TIME_SERIES_CONFIG = {
  granularities: [
    { value: 1, unit: 'm' },
    { value: 5, unit: 'm' },
    { value: 15, unit: 'm' },
    { value: 30, unit: 'm' },
    { value: 60, unit: 'm' },
    { value: 120, unit: 'm' },
    { value: 1, unit: 'd' },
    { value: 5, unit: 'd' },
    { value: 20, unit: 'd' },
    { value: 120, unit: 'd' },
    { value: 250, unit: 'd' }
  ],
  metrics: {
    CONTINUOUS: ['open', 'high', 'low', 'close', 'vwap'],
    DISCRETE: ['sum', 'count']
  }
};

// 撮合配置
const MATCH_CONFIG = {
  defaultPrice: 0,           // 市价单默认价格
  minTradeQuantity: 1,       // 最小交易数量
  maxTradeQuantity: 1000000, // 最大交易数量
  pricePrecision: 2         // 价格精度（小数位数）
};
```

---

## 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|-----|------|---------|------|
| 1.0 | 2026-01-26 | 初始版本 | - |

---

## 许可证

本文档为内部设计文档，未经授权不得外传。
