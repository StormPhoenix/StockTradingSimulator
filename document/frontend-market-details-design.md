# 市场详情前端界面设计方案

## 1. 概述

本文档描述了市场详情前端界面的完整设计方案，包括页面结构、API接口、数据流、实时更新机制等。

## 2. 页面结构设计

### 2.1 整体布局（Tab 页签形式）

**重要说明：** `MarketInstanceDetails.vue` 将被**完全重构**为 **Tab 页签**形式。内容区域由**两个顶层页签**组成，用户通过点击页签在两种视图之间切换。

```
MarketInstanceDetails.vue
├── 页面头部（保留）
│   ├── 返回按钮
│   ├── 标题和描述
│   └── 操作按钮（刷新、导出、删除）
│
└── 内容区域：顶层 Tab 页签容器
    ├── 页签一：市场详情视图（默认）
    │   └── 内层页签容器
    │       ├── 市场总览页签（默认）
    │       └── 股票列表页签
    │
    └── 页签二：股票详情视图
        └── 股票详情组件
            ├── 股票选择/查询参数（?stock=SYMBOL）
            ├── 股票基本信息
            └── K线图表
```

### 2.2 页面切换逻辑

**顶层切换方式：** 使用 Tab 组件，两个页签为「市场详情视图」与「股票详情视图」。可选：进入「股票详情视图」时可通过路由查询参数 `?stock=SYMBOL` 指定当前展示的股票，或在该视图内提供股票选择器。

**逻辑流程：**
```
用户访问 /market-instances/:id
  ↓
内容区域显示两个顶层 Tab
  ├── 市场详情视图（默认选中）
  │   ├── 显示内层页签：市场总览 | 股票列表
  │   └── 建立 WebSocket 连接订阅市场总览数据
  │
  └── 股票详情视图（用户点击该页签时选中）
      ├── 显示股票详情组件（股票可由 ?stock= 或视图内选择器决定）
      └── 建立 WebSocket 连接订阅K线数据
```

**从股票列表跳转到股票详情：** 可切换至「股票详情视图」页签并带上 `?stock=SYMBOL`，或仅切换页签并在视图内选择股票。
```typescript
// 在股票列表的"查看"按钮点击事件中
const handleViewStock = (symbol: string) => {
  router.push({
    path: `/market-instances/${marketInstanceId}`,
    query: { stock: symbol }
  });
  // 并切换到「股票详情视图」页签（通过 Tab 的 activeName 或等价方式）
};
```

**从股票详情返回市场详情：** 用户点击「市场详情视图」页签即可返回；或保留返回按钮，清除 `stock` 查询参数并切回市场详情页签。

### 2.3 页签结构

**顶层页签（两个，Tab 形式）：**
- **市场详情视图** (`market`) - 默认页签，展示市场总览与股票列表
- **股票详情视图** (`stock`) - 展示单只股票详情与 K 线

**市场详情视图下的内层页签：**
- **市场总览** (`overview`) - 默认
- **股票列表** (`stocks`)

**移除的页签：**
- 交易员页签（可考虑后续在其他位置展示）
- 交易日志页签（可考虑后续在其他位置展示）

## 3. 市场总览页签设计

### 3.1 布局结构

```
市场总览页签
├── 核心指标卡片区（第一行）
│   ├── 参与人数卡片
│   ├── 总资金体量卡片
│   ├── 当前成交量卡片
│   └── 活跃股票数卡片（可选）
│
├── 成交量趋势图表区（第二行）
│   └── 成交量变化趋势折线图
│
└── 基本信息卡片区（第三行）
    └── 市场基本信息（保留现有的基本信息卡片）
```

### 3.2 核心指标卡片设计

#### 3.2.1 参与人数卡片

```typescript
{
  label: '参与人数',
  value: statistics.traderCount,
  icon: '👥',
  unit: '人',
  trend: null // 暂时不显示趋势
}
```

#### 3.2.2 总资金体量卡片

```typescript
{
  label: '总资金体量',
  value: statistics.totalCapital,
  icon: '💰',
  unit: '¥',
  format: 'currency',
  trend: null // 暂时不显示趋势
}
```

#### 3.2.3 当前成交量卡片

```typescript
{
  label: '当日成交量',
  value: statistics.todayVolume, // 从新接口获取
  icon: '📊',
  unit: '手',
  format: 'number',
  trend: 'up' | 'down' | 'stable' // 基于趋势数据计算
}
```

#### 3.2.4 活跃股票数卡片（可选）

```typescript
{
  label: '活跃股票',
  value: statistics.stockCount,
  icon: '📈',
  unit: '只',
  trend: null
}
```

### 3.3 成交量趋势图表设计

**图表类型：** 折线图（Line Chart）

**数据源：** 
- 从后端获取成交量历史数据（时间序列）
- 时间范围：当日（从开盘到当前时间）

**图表配置：**
- X轴：时间（HH:mm 格式）
- Y轴：成交量（手）
- 数据点：按时间顺序排列
- 样式：平滑曲线，支持hover显示具体数值

**数据更新：**
- 与市场总览数据同步更新（默认30秒）
- 支持手动刷新

## 4. 股票列表页签设计

### 4.1 表格列设计

```
股票列表表格
├── 代码 (symbol) - 宽度 100px
├── 公司名称 (companyName) - 自适应
├── 行业 (category) - 宽度 120px
├── 当前价格 (currentPrice) - 宽度 120px
│   └── 格式：¥XX.XX
├── 发行价 (issuePrice) - 宽度 120px
│   └── 格式：¥XX.XX
├── 当日涨幅 (dailyChangePercent) - 宽度 120px（新增）
│   └── 格式：+XX.XX% / -XX.XX%
│   └── 颜色：涨（绿色）、跌（红色）
├── 市值 (marketCap) - 宽度 150px
│   └── 格式：¥XX,XXX,XXX
└── 操作列 - 宽度 100px
    └── 查看按钮
```

### 4.2 排序功能

**默认排序：** 按当日涨幅降序排列（涨幅最大的在前）

**排序规则：**
1. 涨幅 = ((当前价格 - 发行价) / 发行价) * 100
2. 涨幅由后端计算并存储在 `StockInstance` 中
3. 前端获取数据时已包含 `dailyChangePercent` 字段

**可选扩展：**
- 支持点击表头切换排序（升序/降序）
- 支持按价格、市值等排序（后续扩展）

### 4.3 查看按钮设计

**按钮样式：**
- 类型：`primary` 或 `text`
- 图标：`View` 或 `Document`
- 文字：`查看`

**点击行为：**
- 跳转到股票详情页面
- 路由：`/market-instances/:id/stocks/:symbol`

## 5. 股票详情界面设计

### 5.1 路由设计

**路由路径：** `/market-instances/:id`（与市场详情页面相同）

**路由参数：**
- `id`: 市场实例ID

**查询参数：**
- `stock`: 股票代码（可选）
  - 如果提供：显示股票详情界面
  - 如果不提供：显示市场详情界面（默认）

**示例：**
- 市场详情：`/market-instances/123`
- 股票详情：`/market-instances/123?stock=AAPL`

### 5.2 页面结构

```
股票详情页面（StockDetail.vue）
├── 页面头部
│   ├── 返回按钮（返回市场详情页）
│   ├── 股票基本信息
│   │   ├── 代码、名称
│   │   ├── 行业
│   │   └── 当前价格、涨跌幅
│   └── 操作按钮（刷新）
│
├── 股票基本信息卡片区
│   ├── 当前价格卡片
│   ├── 涨跌幅卡片
│   ├── 市值卡片
│   └── 总股本卡片
│
├── K线图表区
│   ├── 图表工具栏
│   │   ├── 时间粒度选择（1分钟、5分钟、15分钟、1小时、1天）
│   │   ├── 时间范围选择（最近1天、1周、1月）
│   │   └── 刷新按钮
│   │
│   └── ECharts K线图表
│       ├── 主图：K线图（Candlestick）
│       └── 副图：成交量柱状图（可选）
│
└── 数据表格区（可选）
    └── K线数据表格
        ├── 时间
        ├── 开盘价
        ├── 最高价
        ├── 最低价
        ├── 收盘价
        └── 成交量
```

### 5.3 K线图表设计

**图表库：** ECharts

**图表类型：**
- 主图：K线图（Candlestick Chart）
- 副图：成交量柱状图（Bar Chart）

**图表配置：**
- 支持缩放（dataZoom）
- 支持十字光标（crosshair）
- 支持tooltip显示详细数据
- 支持图例切换

**数据格式：**
```typescript
/**
 * K线数据点（标准OHLCV格式）
 */
interface KLinePoint {
  /** 时间戳 */
  timestamp: Date;
  
  /** 开盘价 */
  open: number;
  
  /** 收盘价 */
  close: number;
  
  /** 最高价 */
  high: number;
  
  /** 最低价 */
  low: number;
  
  /** 成交量 */
  volume: number;
  
  /** 成交额（可选） */
  amount?: number;
  
  /** 换手率（百分比，可选） */
  turnoverRate?: number;
  
  /** 涨跌幅（百分比，可选） */
  changePercent?: number;
  
  /** 涨跌额（可选） */
  changeAmount?: number;
  
  /** 振幅（百分比，可选） */
  amplitude?: number;
}

/**
 * K线数据元数据
 */
interface KLineMetadata {
  /** 股票代码 */
  symbol: string;
  
  /** 股票名称 */
  name: string;
  
  /** 市场类型（1=上海，2=深圳） */
  market: number;
  
  /** 价格小数位数 */
  decimal: number;
  
  /** 前收盘价 */
  preClose: number;
  
  /** 前结算价（可选） */
  preSettlement?: number;
  
  /** 数据总数 */
  total: number;
}
```

**时间粒度：**
- 1分钟（MIN_1 = '1m'）
- 5分钟（MIN_5 = '5m'）
- 15分钟（MIN_15 = '15m'）
- 30分钟（MIN_30 = '30m'）
- 1小时（MIN_60 = '60m'）
- 1天（DAY_1 = '1d'）
- 1周（WEEK_1 = '1w'）
- 1月（MONTH_1 = '1M'）

**时间范围：**
- 最近1天
- 最近1周
- 最近1月
- 自定义范围（后续扩展）

### 5.4 实时更新机制

**更新方式：** WebSocket 实时推送

**WebSocket 连接：**
- 连接地址：`ws://host/api/v1/market-instances/:id/ws`
- 连接时机：进入市场详情页面时建立连接
- 断开时机：离开页面时断开连接

**推送消息类型：**
1. **市场总览更新** (`market_overview_update`)
   - 推送频率：30秒（可配置）
   - 数据内容：统计信息、成交量趋势数据
   
2. **K线数据更新** (`kline_update`)
   - 推送频率：3秒（可配置）
   - 数据内容：增量K线数据点
   - 条件：仅在查看股票详情时推送

**消息格式：**
```typescript
interface WebSocketMessage {
  type: 'market_overview_update' | 'kline_update' | 'error';
  timestamp: Date;
  data: any;
  error?: {
    code: string;
    message: string;
  };
}
```

**更新逻辑：**
1. 首次加载：通过 HTTP API 获取全量数据
2. WebSocket 连接：建立连接后开始接收推送
3. 增量更新：接收 WebSocket 推送的增量数据，更新图表
4. 切换粒度：断开当前订阅，重新订阅新粒度
5. 切换股票：断开当前订阅，订阅新股票

**性能优化：**
- 数据缓存：缓存已加载的数据，避免重复请求
- 防抖处理：避免频繁切换导致的重复订阅
- 连接复用：同一市场实例的多个订阅共享一个 WebSocket 连接

## 6. API接口设计

### 6.1 市场总览数据接口

#### 6.1.1 获取市场总览数据

**接口：** `GET /api/v1/market-instances/:id/overview`

**响应格式：**
```typescript
{
  success: boolean;
  data: {
    // 基础统计信息
    statistics: {
      traderCount: number;        // 参与人数
      stockCount: number;         // 股票数量
      totalCapital: number;       // 总资金体量
      averageCapitalPerTrader: number; // 平均资金
      todayVolume: number;        // 当日累计成交量（新增）
    };
    
    // 成交量趋势数据（新增）
    volumeTrend: Array<{
      timestamp: Date;            // 时间戳
      volume: number;             // 成交量
    }>;
    
    // 基本信息
    exchangeId: string;
    name: string;
    description: string;
    status: string;
    createdAt: Date;
    lastActiveAt: Date;
  };
}
```

**说明：**
- `todayVolume`: 当日累计成交量，当前返回0（待后续实现）
- `volumeTrend`: 成交量趋势数据，时间序列数组

#### 6.1.2 获取成交量趋势数据

**接口：** `GET /api/v1/market-instances/:id/volume-trend`

**查询参数：**
- `startTime`: 开始时间（可选，默认当日开盘时间）
- `endTime`: 结束时间（可选，默认当前时间）
- `interval`: 时间间隔（可选，默认1分钟）

**响应格式：**
```typescript
{
  success: boolean;
  data: Array<{
    timestamp: Date;
    volume: number;  // 累计成交量（类似积分，累加值）
  }>;
}
```

**数据计算逻辑：**
1. 从 `TimeSeriesManager` 查询所有股票的成交量序列
2. 对每个股票，查询指定时间范围内的成交量聚合数据（使用 `MIN_1` 粒度）
3. 累加所有股票在每个时间窗口的成交量
4. 计算累计成交量（类似积分，从开始时间累加到当前时间点）
5. 返回时间序列数据，每个时间点的 `volume` 是累计值

**计算示例：**
```
假设有2只股票：AAPL 和 MSFT

时间点    AAPL成交量  MSFT成交量  总成交量增量  累计成交量
09:30     500         300         800           800
09:31     600         400         1000          1800
09:32     400         500         900           2700
09:33     700         300         1000          3700
...
```

**实现细节：**
- 使用 `TimeSeriesManager.queryAggregatedData()` 查询每个股票的成交量序列
- 查询粒度：`Granularity.MIN_1`（1分钟）
- 指标：`Metric.VOLUME`
- 累加逻辑：对每个时间窗口，累加所有股票的成交量
- 累计计算：从开始时间到每个时间点，累加所有窗口的成交量

### 6.2 股票列表接口

#### 6.2.1 获取股票列表（已存在，需要扩展）

**接口：** `GET /api/v1/market-instances/:id`（现有接口）

**响应扩展：**
在 `stocks` 数组中，每个股票对象需要添加：
```typescript
{
  // ... 现有字段
  dailyChangePercent: number;  // 当日涨幅（新增，由后端计算）
}
```

**后端实现要求：**
- `StockInstance` 需要计算并存储 `dailyChangePercent`
- 计算公式：`((currentPrice - issuePrice) / issuePrice) * 100`
- 在 `getStockDetails()` 方法中返回该字段

### 6.3 K线数据接口

#### 6.3.1 获取K线数据

**接口：** `GET /api/v1/market-instances/:id/stocks/:symbol/kline`

**查询参数：**
- `granularity`: 时间粒度（必填）
  - 可选值：`1m`, `5m`, `15m`, `30m`, `60m`, `1d`, `1w`, `1M`
  - 对应枚举：`KLineGranularity.MIN_1`, `MIN_5`, `MIN_15`, `MIN_30`, `MIN_60`, `DAY_1`, `WEEK_1`, `MONTH_1`
- `startTime`: 开始时间（可选，ISO 8601格式）
- `endTime`: 结束时间（可选，ISO 8601格式）
- `limit`: 数据点数量限制（可选，默认1000）

**响应格式：**
```typescript
{
  success: boolean;
  data: {
    /** 元数据 */
    metadata: KLineMetadata;
    
    /** K线数据点数组 */
    data: KLinePoint[];
    
    /** 数据粒度 */
    granularity: KLineGranularity;
    
    /** 是否完整数据 */
    isFull: boolean;
    
    /** 分页游标（可选，用于增量更新） */
    nextCursor?: string;
  };
}

/**
 * K线数据粒度枚举
 */
enum KLineGranularity {
  /** 1分钟 */
  MIN_1 = '1m',
  
  /** 5分钟 */
  MIN_5 = '5m',
  
  /** 15分钟 */
  MIN_15 = '15m',
  
  /** 30分钟 */
  MIN_30 = '30m',
  
  /** 60分钟（1小时） */
  MIN_60 = '60m',
  
  /** 日K线 */
  DAY_1 = '1d',
  
  /** 周K线 */
  WEEK_1 = '1w',
  
  /** 月K线 */
  MONTH_1 = '1M',
}
```

#### 6.3.2 WebSocket 订阅K线数据

**WebSocket 连接：** `ws://host/api/v1/market-instances/:id/ws`

**订阅消息：**
```typescript
{
  type: 'subscribe_kline',
  symbol: string,
  granularity: string
}
```

**取消订阅消息：**
```typescript
{
  type: 'unsubscribe_kline',
  symbol: string,
  granularity: string
}
```

**推送消息格式：**
```typescript
{
  type: 'kline_update',
  timestamp: Date,
  data: {
    symbol: string;
    granularity: KLineGranularity;
    data: KLinePoint[];  // 增量K线数据点数组
  };
}
```

**说明：**
- 通过 WebSocket 实时推送增量K线数据
- 推送频率：默认3秒（可配置）
- 如果没有新数据，不推送消息

## 7. 后端实现要求

### 7.1 ExchangeInstance 扩展

#### 7.1.1 添加成交量统计方法

```typescript
/**
 * 获取当日累计成交量
 * 从时间序列管理器查询所有股票的成交量序列，累加计算
 */
public getTodayVolume(): number {
  if (!this.timeSeriesManager) {
    return 0;
  }
  
  // 获取当日开始时间（9:30）
  const today = new Date();
  const startTime = new Date(today);
  startTime.setHours(9, 30, 0, 0);
  const endTime = new Date();
  
  // 查询所有股票的成交量序列
  let totalVolume = 0;
  for (const stock of this.stocks.values()) {
    const volumeSeriesId = `${this.id}_${stock.symbol}_volume`;
    
    try {
      // 从时间序列管理器查询成交量数据
      const result = this.timeSeriesManager.queryAggregatedData({
        seriesId: volumeSeriesId,
        granularity: Granularity.MIN_1, // 使用1分钟粒度
        startTime: startTime,
        endTime: endTime,
        metrics: [Metric.VOLUME]
      });
      
      // 累加所有时间窗口的成交量
      for (const point of result.points) {
        totalVolume += point.metrics.volume || 0;
      }
    } catch (error) {
      // 如果序列不存在或查询失败，跳过
      console.warn(`Failed to query volume for ${stock.symbol}:`, error);
    }
  }
  
  return totalVolume;
}

/**
 * 获取成交量趋势数据
 * 从时间序列管理器获取成交量数据，计算累计成交量（类似积分）
 */
public getVolumeTrend(
  startTime?: Date, 
  endTime?: Date,
  interval: number = 60000 // 默认1分钟（毫秒）
): Array<{
  timestamp: Date;
  volume: number; // 累计成交量
}> {
  if (!this.timeSeriesManager) {
    return [];
  }
  
  // 默认时间范围：当日
  const today = new Date();
  const defaultStartTime = new Date(today);
  defaultStartTime.setHours(9, 30, 0, 0);
  const defaultEndTime = new Date();
  
  const start = startTime || defaultStartTime;
  const end = endTime || defaultEndTime;
  
  // 按时间间隔生成时间点
  const timePoints: Date[] = [];
  let currentTime = new Date(start);
  while (currentTime <= end) {
    timePoints.push(new Date(currentTime));
    currentTime = new Date(currentTime.getTime() + interval);
  }
  
  // 计算每个时间点的累计成交量
  const trendData: Array<{ timestamp: Date; volume: number }> = [];
  let cumulativeVolume = 0;
  
  for (const timePoint of timePoints) {
    // 查询到当前时间点的所有成交量
    let volumeAtTime = 0;
    
    for (const stock of this.stocks.values()) {
      const volumeSeriesId = `${this.id}_${stock.symbol}_volume`;
      
      try {
        const result = this.timeSeriesManager.queryAggregatedData({
          seriesId: volumeSeriesId,
          granularity: Granularity.MIN_1,
          startTime: start,
          endTime: timePoint,
          metrics: [Metric.VOLUME]
        });
        
        // 累加该股票到当前时间点的成交量
        for (const point of result.points) {
          volumeAtTime += point.metrics.volume || 0;
        }
      } catch (error) {
        // 跳过查询失败的股票
      }
    }
    
    // 累计成交量（类似积分）
    cumulativeVolume = volumeAtTime;
    
    trendData.push({
      timestamp: timePoint,
      volume: cumulativeVolume
    });
  }
  
  return trendData;
}
```

#### 7.1.2 扩展 getMarketInstanceSummary

```typescript
public getMarketInstanceSummary(): {
  // ... 现有字段
  statistics: {
    // ... 现有字段
    todayVolume: number;  // 新增
  };
}
```

### 7.2 StockInstance 扩展

#### 7.2.1 添加当日涨幅计算

```typescript
/**
 * 获取当日涨幅百分比
 */
public getDailyChangePercent(): number {
  return ((this.currentPrice - this.issuePrice) / this.issuePrice) * 100;
}
```

#### 7.2.2 扩展 getStockDetails

在 `ExchangeInstance.getStockDetails()` 中，添加 `dailyChangePercent` 字段：

```typescript
public getStockDetails(): Array<{
  // ... 现有字段
  dailyChangePercent: number;  // 新增
}> {
  return Array.from(this.stocks.values()).map(stock => ({
    // ... 现有字段
    dailyChangePercent: stock.getDailyChangePercent(),  // 新增
  }));
}
```

### 7.3 新增API路由

#### 7.3.1 市场总览接口

```typescript
// GET /api/v1/market-instances/:id/overview
router.get('/:id/overview', async (req, res) => {
  // 实现市场总览数据获取
  const exchangeInstance = getExchangeInstance(req.params.id);
  const summary = exchangeInstance.getMarketInstanceSummary();
  const todayVolume = exchangeInstance.getTodayVolume();
  
  res.json({
    success: true,
    data: {
      ...summary,
      statistics: {
        ...summary.statistics,
        todayVolume
      }
    }
  });
});
```

#### 7.3.2 成交量趋势接口

```typescript
// GET /api/v1/market-instances/:id/volume-trend
router.get('/:id/volume-trend', async (req, res) => {
  const exchangeInstance = getExchangeInstance(req.params.id);
  const startTime = req.query.startTime ? new Date(req.query.startTime) : undefined;
  const endTime = req.query.endTime ? new Date(req.query.endTime) : undefined;
  const interval = req.query.interval ? parseInt(req.query.interval) : 60000;
  
  const trendData = exchangeInstance.getVolumeTrend(startTime, endTime, interval);
  
  res.json({
    success: true,
    data: trendData
  });
});
```

#### 7.3.3 K线数据接口

```typescript
// GET /api/v1/market-instances/:id/stocks/:symbol/kline
router.get('/:id/stocks/:symbol/kline', async (req, res) => {
  const { id, symbol } = req.params;
  const { granularity, startTime, endTime, limit } = req.query;
  
  const exchangeInstance = getExchangeInstance(id);
  const stock = exchangeInstance.getStock(symbol);
  
  if (!stock) {
    return res.status(404).json({
      success: false,
      error: 'Stock not found'
    });
  }
  
  // 从时间序列管理器查询K线数据
  const priceSeriesId = `${id}_${symbol}_price`;
  const volumeSeriesId = `${id}_${symbol}_volume`;
  
  // 转换粒度：KLineGranularity -> TimeSeries Granularity
  const timeSeriesGranularity = convertKLineGranularityToTimeSeries(granularity);
  
  // 查询价格序列（OHLC）
  const priceResult = exchangeInstance.timeSeriesManager.queryAggregatedData({
    seriesId: priceSeriesId,
    granularity: timeSeriesGranularity,
    startTime: startTime ? new Date(startTime) : undefined,
    endTime: endTime ? new Date(endTime) : undefined,
    metrics: ['open', 'high', 'low', 'close']
  });
  
  // 查询成交量序列
  const volumeResult = exchangeInstance.timeSeriesManager.queryAggregatedData({
    seriesId: volumeSeriesId,
    granularity: timeSeriesGranularity,
    startTime: startTime ? new Date(startTime) : undefined,
    endTime: endTime ? new Date(endTime) : undefined,
    metrics: ['volume']
  });
  
  // 合并数据为K线格式
  const klineData: KLinePoint[] = mergePriceAndVolume(priceResult, volumeResult, stock);
  
  // 构建元数据
  const metadata: KLineMetadata = {
    symbol: stock.symbol,
    name: stock.companyName,
    market: 1, // 默认上海市场，实际应从配置获取
    decimal: 2,
    preClose: stock.issuePrice, // 使用发行价作为前收盘价
    total: klineData.length
  };
  
  res.json({
    success: true,
    data: {
      metadata,
      data: klineData,
      granularity: granularity as KLineGranularity,
      isFull: true
    }
  });
});

/**
 * 粒度转换函数
 */
function convertKLineGranularityToTimeSeries(
  klineGranularity: string
): Granularity {
  const mapping: Record<string, Granularity> = {
    '1m': Granularity.MIN_1,
    '5m': Granularity.MIN_5,
    '15m': Granularity.MIN_15,
    '30m': Granularity.MIN_30,
    '60m': Granularity.MIN_60,
    '1d': Granularity.DAY_1,
    '1w': Granularity.WEEK_1,
    '1M': Granularity.MONTH_1,
  };
  return mapping[klineGranularity] || Granularity.MIN_5;
}

/**
 * 合并价格和成交量数据为K线格式
 */
function mergePriceAndVolume(
  priceResult: AggregatedDataResult,
  volumeResult: AggregatedDataResult,
  stock: StockInstance
): KLinePoint[] {
  // 创建时间窗口映射
  const priceMap = new Map<number, AggregatedPoint>();
  const volumeMap = new Map<number, AggregatedPoint>();
  
  // 索引价格数据
  for (const point of priceResult.points) {
    priceMap.set(point.startTime, point);
  }
  
  // 索引成交量数据
  for (const point of volumeResult.points) {
    volumeMap.set(point.startTime, point);
  }
  
  // 合并数据
  const klinePoints: KLinePoint[] = [];
  const allTimeWindows = new Set([...priceMap.keys(), ...volumeMap.keys()]);
  
  for (const timeWindow of Array.from(allTimeWindows).sort()) {
    const pricePoint = priceMap.get(timeWindow);
    const volumePoint = volumeMap.get(timeWindow);
    
    if (!pricePoint) {
      continue; // 必须有价格数据
    }
    
    const klinePoint: KLinePoint = {
      timestamp: new Date(timeWindow),
      open: pricePoint.metrics.open || 0,
      close: pricePoint.metrics.close || 0,
      high: pricePoint.metrics.high || 0,
      low: pricePoint.metrics.low || 0,
      volume: volumePoint?.metrics.volume || 0,
      // 可选字段可以根据需要计算或从其他数据源获取
    };
    
    // 计算涨跌幅（如果有前收盘价）
    if (stock.issuePrice > 0) {
      klinePoint.changePercent = ((klinePoint.close - stock.issuePrice) / stock.issuePrice) * 100;
      klinePoint.changeAmount = klinePoint.close - stock.issuePrice;
    }
    
    // 计算振幅
    if (klinePoint.high > 0 && klinePoint.low > 0) {
      klinePoint.amplitude = ((klinePoint.high - klinePoint.low) / klinePoint.low) * 100;
    }
    
    klinePoints.push(klinePoint);
  }
  
  return klinePoints;
}
```

#### 7.3.4 WebSocket 连接处理

**WebSocket 路由：** `ws://host/api/v1/market-instances/:id/ws`

**实现要点：**
1. 使用 WebSocket 库（如 `ws` 或 `socket.io`）
2. 管理每个市场实例的连接
3. 支持多个订阅（市场总览、多个股票的K线）
4. 定时推送更新数据

**消息处理：**
```typescript
// 订阅消息格式
interface SubscribeMessage {
  type: 'subscribe_market_overview' | 'subscribe_kline';
  symbol?: string;        // K线订阅时需要
  granularity?: string;   // K线订阅时需要
}

// 取消订阅消息格式
interface UnsubscribeMessage {
  type: 'unsubscribe_kline';
  symbol: string;
  granularity: string;
}

// 推送消息格式
interface PushMessage {
  type: 'market_overview_update' | 'kline_update';
  timestamp: Date;
  data: any;
}
```

**推送逻辑：**
```typescript
// 市场总览推送（每30秒）
setInterval(() => {
  const overviewData = getMarketOverviewData(marketInstanceId);
  broadcastToSubscribers('market_overview', {
    type: 'market_overview_update',
    timestamp: new Date(),
    data: overviewData
  });
}, 30000);

// K线数据推送（每3秒，可配置）
setInterval(() => {
  const klineSubscriptions = getKLineSubscriptions(marketInstanceId);
  for (const sub of klineSubscriptions) {
    const klineData = getIncrementalKLineData(
      marketInstanceId,
      sub.symbol,
      sub.granularity,
      sub.lastTimestamp
    );
    
    if (klineData.length > 0) {
      sendToClient(sub.clientId, {
        type: 'kline_update',
        timestamp: new Date(),
        data: {
          symbol: sub.symbol,
          granularity: sub.granularity,
          data: klineData
        }
      });
      sub.lastTimestamp = new Date();
    }
  }
}, 3000);
```

## 8. 前端实现设计

### 8.1 组件结构

```
app/src/components/runtime/
├── MarketInstanceDetails.vue（重构）
│   ├── 市场总览页签组件
│   │   ├── OverviewTab.vue（新建）
│   │   │   ├── StatisticsCards.vue（新建）
│   │   │   └── VolumeTrendChart.vue（新建）
│   │   │
│   └── 股票列表页签组件
│       └── StocksTab.vue（新建）
│
└── StockDetail.vue（新建）
    ├── StockInfoCard.vue（新建）
    └── KLineChart.vue（新建）
```

### 8.2 状态管理

#### 8.2.1 市场详情状态

```typescript
interface MarketDetailsState {
  // 市场总览数据
  overview: {
    statistics: MarketStatistics;
    volumeTrend: VolumeTrendData[];
    isLoading: boolean;
    lastUpdateTime: Date | null;
  };
  
  // 股票列表数据
  stocks: {
    list: StockInfo[];
    isLoading: boolean;
    sortBy: 'dailyChangePercent' | 'price' | 'marketCap';
    sortOrder: 'asc' | 'desc';
  };
}
```

#### 8.2.2 股票详情状态

```typescript
interface StockDetailState {
  stockInfo: StockInfo | null;
  klineData: KLinePoint[];  // 使用KLinePoint类型
  metadata: KLineMetadata | null;  // K线元数据
  granularity: KLineGranularity;  // 使用KLineGranularity枚举
  timeRange: TimeRange;
  isLoading: boolean;
  isUpdating: boolean;
  lastUpdateTime: Date | null;
  updateInterval: number; // 更新间隔（毫秒）
}
```

### 8.3 API服务扩展

#### 8.3.1 MarketInstanceService 扩展

```typescript
class MarketInstanceService {
  // 获取市场总览数据
  async getOverview(marketInstanceId: string): Promise<MarketOverview>;
  
  // 获取成交量趋势数据
  async getVolumeTrend(
    marketInstanceId: string,
    options?: VolumeTrendOptions
  ): Promise<VolumeTrendData[]>;
  
  // 获取K线数据
  async getKLineData(
    marketInstanceId: string,
    symbol: string,
    options: KLineOptions
  ): Promise<{
    metadata: KLineMetadata;
    data: KLinePoint[];
    granularity: KLineGranularity;
    isFull: boolean;
  }>;
  
  // 获取增量K线数据
  async getIncrementalKLineData(
    marketInstanceId: string,
    symbol: string,
    granularity: KLineGranularity,
    lastTimestamp: Date
  ): Promise<KLinePoint[]>;
}
```

### 8.4 WebSocket 实时更新机制

#### 8.4.1 WebSocket 服务设计

**连接管理：**
```typescript
// app/src/services/websocket.ts
class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  
  // 连接WebSocket
  connect(marketInstanceId: string): void;
  
  // 断开连接
  disconnect(): void;
  
  // 订阅市场总览更新
  subscribeMarketOverview(): void;
  
  // 订阅K线数据更新
  subscribeKLine(symbol: string, granularity: string): void;
  
  // 取消订阅
  unsubscribeKLine(symbol: string, granularity: string): void;
  
  // 消息处理
  onMessage(callback: (message: WebSocketMessage) => void): void;
  
  // 错误处理
  onError(callback: (error: Error) => void): void;
}
```

#### 8.4.2 配置管理

**配置文件：** `app/src/config/frontend.yml`

```yaml
# 前端更新配置
websocket:
  # WebSocket 服务器地址（相对路径）
  endpoint: '/api/v1/market-instances'
  
  # 重连配置
  reconnect:
    maxAttempts: 5
    delay: 1000  # 毫秒
    backoff: 2   # 退避倍数
  
  # 推送频率配置（后端配置，前端仅作参考）
  pushIntervals:
    marketOverview: 30000  # 30秒
    kline: 3000            # 3秒（默认）
```

#### 8.4.3 更新逻辑实现

**市场总览页签：**
```typescript
// 使用 WebSocket 接收推送
const wsService = new WebSocketService();

const setupWebSocket = () => {
  wsService.connect(marketInstanceId.value);
  
  // 订阅市场总览更新
  wsService.subscribeMarketOverview();
  
  // 处理推送消息
  wsService.onMessage((message) => {
    if (message.type === 'market_overview_update') {
      updateOverviewData(message.data);
    }
  });
  
  // 错误处理
  wsService.onError((error) => {
    console.error('WebSocket error:', error);
    ElMessage.warning('实时更新连接断开，正在重连...');
  });
};

const cleanupWebSocket = () => {
  wsService.disconnect();
};
```

**K线图表：**
```typescript
// 使用 WebSocket 接收推送
const wsService = new WebSocketService();

const setupKLineWebSocket = () => {
  if (!wsService.isConnected()) {
    wsService.connect(marketInstanceId.value);
  }
  
  // 订阅K线数据更新
  wsService.subscribeKLine(symbol.value, granularity.value);
  
  // 处理推送消息
  wsService.onMessage((message) => {
    if (message.type === 'kline_update' && 
        message.data.symbol === symbol.value) {
      updateKLineData(message.data.data);
    }
  });
};

const cleanupKLineWebSocket = () => {
  wsService.unsubscribeKLine(symbol.value, granularity.value);
};
```

#### 8.4.4 路由参数处理

**MarketInstanceDetails.vue：**
```typescript
import { useRoute } from 'vue-router';

const route = useRoute();
const stockSymbol = computed(() => route.query.stock as string | undefined);

// 监听路由参数变化
watch(() => route.query.stock, (newSymbol) => {
  if (newSymbol) {
    // 显示股票详情界面
    showStockDetail(newSymbol);
  } else {
    // 显示市场详情界面
    showMarketOverview();
  }
});
```

### 8.5 ECharts集成

#### 8.5.1 安装依赖

```bash
npm install echarts vue-echarts
```

#### 8.5.2 K线图表组件

```typescript
// KLineChart.vue
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { CandlestickChart, BarChart } from 'echarts/charts';
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components';
import VChart from 'vue-echarts';

use([
  CanvasRenderer,
  CandlestickChart,
  BarChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
]);
```

#### 8.5.3 图表配置

```typescript
const chartOption = computed(() => {
  return {
    title: {
      text: `${stockInfo.value?.symbol} K线图`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: [
      {
        left: '10%',
        right: '8%',
        top: '15%',
        height: '50%'
      },
      {
        left: '10%',
        right: '8%',
        top: '70%',
        height: '15%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: klineData.value.map(d => formatTime(d.timestamp)),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      },
      {
        type: 'category',
        gridIndex: 1,
        data: klineData.value.map(d => formatTime(d.timestamp)),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax'
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: {
          show: true
        }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 70,
        end: 100
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '90%',
        start: 70,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        // ECharts K线数据格式：[开盘价, 收盘价, 最低价, 最高价]
        data: klineData.value.map((d: KLinePoint) => [
          d.open,
          d.close,
          d.low,
          d.high
        ]),
        itemStyle: {
          color: '#26a69a',      // 上涨颜色（收盘价 >= 开盘价）
          color0: '#ef5350',     // 下跌颜色（收盘价 < 开盘价）
          borderColor: '#26a69a',
          borderColor0: '#ef5350'
        }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: klineData.value.map((d: KLinePoint) => d.volume),
        itemStyle: {
          color: (params: any) => {
            const dataIndex = params.dataIndex;
            const kline: KLinePoint = klineData.value[dataIndex];
            // 根据涨跌设置成交量柱状图颜色
            return kline.close >= kline.open ? '#26a69a' : '#ef5350';
          }
        }
      }
    ]
  };
});
```

## 9. 数据流设计

### 9.1 市场总览数据流

```
用户打开页面
  ↓
MarketInstanceDetails.vue 挂载
  ↓
调用 MarketInstanceService.getOverview()
  ↓
后端返回市场总览数据
  ↓
更新状态，渲染页面
  ↓
启动自动更新定时器（30秒）
  ↓
定时刷新数据
```

### 9.2 股票列表数据流

```
用户切换到股票列表页签
  ↓
调用 MarketInstanceService.getDetails()
  ↓
后端返回股票列表（包含 dailyChangePercent）
  ↓
前端按 dailyChangePercent 降序排序
  ↓
渲染表格
```

### 9.3 K线数据流

```
用户进入股票详情页面（通过查询参数 ?stock=SYMBOL）
  ↓
调用 MarketInstanceService.getKLineData()（全量，HTTP）
  ↓
后端返回K线数据
  ↓
渲染ECharts图表
  ↓
建立 WebSocket 连接
  ↓
发送订阅消息（subscribe_kline）
  ↓
后端通过 WebSocket 推送增量数据（每3秒）
  ↓
接收推送消息，更新图表数据
  ↓
用户切换股票或离开页面
  ↓
发送取消订阅消息（unsubscribe_kline）
  ↓
断开 WebSocket 连接
```

## 10. 配置管理

### 10.1 前端配置文件

**文件位置：** `app/src/config/frontend.yml`

```yaml
# WebSocket 配置
websocket:
  # WebSocket 服务器地址（相对路径）
  endpoint: '/api/v1/market-instances'
  
  # 重连配置
  reconnect:
    maxAttempts: 5
    delay: 1000  # 毫秒
    backoff: 2   # 退避倍数
  
  # 推送频率配置（后端配置，前端仅作参考）
  pushIntervals:
    marketOverview: 30000  # 30秒
    kline: 3000            # 3秒（默认）

# 图表配置
charts:
  # K线图表默认时间粒度
  defaultGranularity: MIN_5
  
  # K线图表默认时间范围（天）
  defaultTimeRange: 1
  
  # 数据点数量限制
  maxDataPoints: 1000
```

### 10.2 后端配置文件

**文件位置：** `server/config/websocket.yml`

```yaml
# WebSocket 推送配置
pushIntervals:
  # 市场总览推送间隔（毫秒）
  marketOverview: 30000  # 30秒
  
  # K线数据推送间隔（毫秒）
  kline: 3000            # 3秒

# WebSocket 连接配置
connection:
  # 最大连接数
  maxConnections: 1000
  
  # 心跳间隔（毫秒）
  heartbeatInterval: 30000  # 30秒
  
  # 连接超时（毫秒）
  timeout: 60000  # 60秒
```

### 10.2 配置加载

```typescript
// app/src/config/index.ts
import yaml from 'js-yaml';
import fs from 'fs';

let frontendConfig: FrontendConfig | null = null;

export const loadFrontendConfig = (): FrontendConfig => {
  if (frontendConfig) {
    return frontendConfig;
  }
  
  try {
    const configPath = path.join(__dirname, './frontend.yml');
    const configContent = fs.readFileSync(configPath, 'utf-8');
    frontendConfig = yaml.load(configContent) as FrontendConfig;
    return frontendConfig;
  } catch (error) {
    console.warn('Failed to load frontend config, using defaults');
    return getDefaultConfig();
  }
};
```

## 11. 错误处理

### 11.1 API错误处理

```typescript
try {
  const data = await MarketInstanceService.getOverview(id);
  // 处理数据
} catch (error) {
  if (error.response?.status === 404) {
    ElMessage.error('市场实例不存在');
  } else if (error.response?.status === 500) {
    ElMessage.error('服务器错误，请稍后重试');
  } else {
    ElMessage.error('获取数据失败');
  }
}
```

### 11.2 图表错误处理

```typescript
// 数据为空时显示空状态
if (klineData.value.length === 0) {
  // 显示空状态提示
  return;
}

// 数据格式错误时显示错误提示
if (!isValidKLineData(klineData.value)) {
  ElMessage.error('K线数据格式错误');
  return;
}
```

## 12. 性能优化

### 12.1 数据缓存

```typescript
// 缓存市场总览数据
const overviewCache = new Map<string, {
  data: MarketOverview;
  timestamp: Date;
}>();

// 缓存K线数据
const klineCache = new Map<string, {
  metadata: KLineMetadata;
  data: KLinePoint[];
  timestamp: Date;
}>();
```

### 12.2 防抖处理

```typescript
import { debounce } from 'lodash-es';

// 防抖处理时间粒度切换
const handleGranularityChange = debounce((granularity: Granularity) => {
  loadKLineData(granularity);
}, 300);
```

### 12.3 虚拟滚动

```typescript
// 股票列表使用虚拟滚动（如果数据量大）
import { ElVirtualList } from 'element-plus';
```

## 13. 实现检查清单

### 13.1 后端实现

- [ ] 在 `ExchangeInstance` 中添加 `getTodayVolume()` 方法
  - [ ] 从 `TimeSeriesManager` 查询所有股票的成交量序列
  - [ ] 累加计算当日累计成交量
- [ ] 在 `ExchangeInstance` 中添加 `getVolumeTrend()` 方法
  - [ ] 从 `TimeSeriesManager` 查询成交量数据
  - [ ] 实现累计成交量计算（类似积分）
  - [ ] 按时间间隔生成趋势数据点
- [ ] 扩展 `getMarketInstanceSummary()` 添加 `todayVolume` 字段
- [ ] 在 `StockInstance` 中添加 `getDailyChangePercent()` 方法
- [ ] 扩展 `getStockDetails()` 添加 `dailyChangePercent` 字段
- [ ] 实现市场总览API路由 (`GET /api/v1/market-instances/:id/overview`)
- [ ] 实现成交量趋势API路由 (`GET /api/v1/market-instances/:id/volume-trend`)
- [ ] 实现K线数据API路由 (`GET /api/v1/market-instances/:id/stocks/:symbol/kline`)
  - [ ] 从时间序列管理器查询价格和成交量序列
  - [ ] 合并数据为K线格式（KLinePoint）
  - [ ] 构建元数据（KLineMetadata）
  - [ ] 支持粒度转换（KLineGranularity 到 TimeSeries Granularity）
  - [ ] 实现数据解析和转换函数
- [ ] 实现 WebSocket 服务器
  - [ ] 安装 WebSocket 库（如 `ws`）
  - [ ] 创建 WebSocket 路由处理器
  - [ ] 实现连接管理
  - [ ] 实现订阅/取消订阅逻辑
  - [ ] 实现定时推送机制
  - [ ] 实现心跳机制
  - [ ] 实现错误处理和重连支持
- [ ] 创建 WebSocket 配置文件 (`server/config/websocket.yml`)

### 13.2 前端实现

- [ ] 重构 `MarketInstanceDetails.vue`，只保留两个页签
- [ ] 实现路由参数处理（查询参数 `?stock=SYMBOL`）
- [ ] 创建 `OverviewTab.vue` 组件
- [ ] 创建 `StatisticsCards.vue` 组件
- [ ] 创建 `VolumeTrendChart.vue` 组件
- [ ] 创建 `StocksTab.vue` 组件
- [ ] 创建 `StockDetail.vue` 组件（在同一页面内切换显示）
- [ ] 创建 `KLineChart.vue` 组件
- [ ] 扩展 `MarketInstanceService` API方法
- [ ] 创建 `WebSocketService` 类
- [ ] 实现 WebSocket 连接管理
- [ ] 实现订阅/取消订阅逻辑
- [ ] 实现消息处理逻辑
- [ ] 集成ECharts图表库
- [ ] 实现配置管理
- [ ] 添加错误处理和重连机制
- [ ] 添加加载状态
- [ ] 实现路由配置

## 14. 关键技术细节

### 14.1 成交量趋势计算详细说明

**计算步骤：**

1. **获取所有股票列表**
   ```typescript
   const stocks = exchangeInstance.getAvailableStocks();
   ```

2. **对每个股票查询成交量序列**
   ```typescript
   for (const stock of stocks) {
     const volumeSeriesId = `${exchangeId}_${stock.symbol}_volume`;
     const result = timeSeriesManager.queryAggregatedData({
       seriesId: volumeSeriesId,
       granularity: Granularity.MIN_1,
       startTime: startTime,
       endTime: endTime,
       metrics: [Metric.VOLUME]
     });
   }
   ```

3. **按时间窗口累加成交量**
   ```typescript
   // 创建时间窗口映射
   const volumeByTimeWindow = new Map<string, number>();
   
   for (const stockResult of allStockResults) {
     for (const point of stockResult.points) {
       const windowKey = point.startTime.toString();
       const currentVolume = volumeByTimeWindow.get(windowKey) || 0;
       volumeByTimeWindow.set(windowKey, currentVolume + point.metrics.volume);
     }
   }
   ```

4. **计算累计成交量（积分）**
   ```typescript
   let cumulativeVolume = 0;
   const trendData = [];
   
   for (const [timeWindow, volume] of sortedTimeWindows) {
     cumulativeVolume += volume; // 累加（积分）
     trendData.push({
       timestamp: new Date(timeWindow),
       volume: cumulativeVolume
     });
   }
   ```

### 14.2 WebSocket 连接管理

**连接生命周期：**
```
页面挂载
  ↓
建立 WebSocket 连接
  ↓
发送订阅消息
  ↓
接收推送消息
  ↓
页面卸载
  ↓
发送取消订阅消息
  ↓
断开 WebSocket 连接
```

**连接复用：**
- 同一市场实例的多个订阅共享一个 WebSocket 连接
- 通过消息类型区分不同的订阅

**重连机制：**
```typescript
class WebSocketService {
  private reconnectTimer: NodeJS.Timeout | null = null;
  
  private handleDisconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(this.backoff, this.reconnectAttempts - 1);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    } else {
      // 达到最大重连次数，降级到轮询
      this.fallbackToPolling();
    }
  }
  
  private fallbackToPolling() {
    // 回退到 HTTP 轮询方式
    console.warn('WebSocket unavailable, falling back to polling');
  }
}
```

### 14.3 路由参数处理

**Vue Router 配置：**
```typescript
// router/index.ts
{
  path: '/market-instances/:id',
  component: MarketInstanceDetails,
  props: (route) => ({
    id: route.params.id,
    stock: route.query.stock // 传递查询参数
  })
}
```

**组件内处理：**
```typescript
// MarketInstanceDetails.vue
const route = useRoute();
const stockSymbol = computed(() => route.query.stock as string | undefined);

// 监听查询参数变化
watch(stockSymbol, (newSymbol, oldSymbol) => {
  if (oldSymbol && newSymbol !== oldSymbol) {
    // 切换股票，取消旧订阅，订阅新股票
    wsService.unsubscribeKLine(oldSymbol, granularity.value);
  }
  
  if (newSymbol) {
    // 显示股票详情
    showStockDetail(newSymbol);
    wsService.subscribeKLine(newSymbol, granularity.value);
  } else {
    // 显示市场详情
    showMarketOverview();
    wsService.subscribeMarketOverview();
  }
});
```

## 15. 注意事项

1. **成交量数据**：
   - 从时间序列管理器查询所有股票的成交量序列
   - 计算累计成交量（类似积分，累加值）
   - 当前如果没有交易数据，返回0

2. **K线数据格式**：
   - 已基于实际数据格式分析完成定义
   - 使用标准OHLCV格式（开盘价、最高价、最低价、收盘价、成交量）
   - 支持可选字段：成交额、换手率、涨跌幅、涨跌额、振幅
   - 包含元数据：股票代码、名称、市场类型、前收盘价等

3. **路由设计**：
   - 股票详情通过查询参数 `?stock=SYMBOL` 切换
   - 保持在同一路由下，避免页面跳转
   - 需要处理浏览器前进/后退按钮
   - 使用 `router.push()` 更新查询参数，而不是直接修改 URL

4. **WebSocket 实时更新**：
   - 注意连接管理，避免内存泄漏
   - 实现自动重连机制（指数退避）
   - 处理网络断开和恢复
   - 注意性能影响，避免过于频繁的推送
   - 实现连接复用，避免同一市场实例多个连接

5. **数据缓存**：合理使用缓存，避免重复请求

6. **错误处理**：
   - WebSocket 连接失败时的降级方案（可回退到 HTTP 轮询）
   - 完善的错误提示和重连提示
   - 处理 WebSocket 消息格式错误

7. **响应式设计**：确保在不同屏幕尺寸下正常显示

8. **浏览器兼容性**：确保主流浏览器正常支持 WebSocket

9. **时间序列查询性能**：
   - 成交量趋势计算可能涉及大量数据查询
   - 考虑使用缓存优化查询性能
   - 考虑异步计算，避免阻塞主线程

10. **WebSocket 消息格式**：
    - 统一的消息格式定义
    - 消息类型枚举
    - 数据验证和错误处理

---

**文档版本**：1.0  
**创建日期**：2026-01-27  
**最后更新**：2026-01-27
