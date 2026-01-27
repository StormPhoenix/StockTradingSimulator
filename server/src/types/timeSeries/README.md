# Time Series Data Structure

时间序列数据结构，支持多粒度实时聚合和查询。

## 快速开始

### 1. 导入模块

```typescript
import {
  TimeSeriesManager,
  DataType,
  Metric,
  Granularity,
  WindowStatus,
  MissingDataStrategy,
} from '../server/types/timeSeries';

import {
  TestDataGenerator,
} from '../server/src/test';
```

### 2. 创建时间序列

```typescript
const manager = new TimeSeriesManager();

// 创建价格序列
const priceSeries: SeriesDefinition = {
  seriesId: 'AAPL-price',
  dataType: DataType.CONTINUOUS,
  granularityLevels: [
    Granularity.MIN_1,
    Granularity.MIN_5,
    Granularity.MIN_15,
    Granularity.MIN_30,
    Granularity.MIN_60,
  ],
  metrics: [Metric.OPEN, Metric.HIGH, Metric.LOW, Metric.CLOSE, Metric.VOLUME],
  missingDataStrategy: MissingDataStrategy.PREVIOUS_CLOSE,
};

manager.createSeries(priceSeries);
```

### 3. 添加数据点

```typescript
// 添加实时交易数据
const dataPoint: DataPoint = {
  timestamp: new Date(),
  value: 150.25,
  metadata: {
    volume: 1000,
    tradeId: '12345',
  },
};

manager.addDataPoint('AAPL-price', dataPoint);
```

### 4. 查询聚合数据

```typescript
// 查询 5 分钟 K 线数据
const startTime = new Date('2026-01-27T10:00:00Z');
const endTime = new Date('2026-01-27T10:30:00Z');

const aggregatedData = manager.queryAggregatedData({
  seriesId: 'AAPL-price',
  granularity: Granularity.MIN_5,
  startTime,
  endTime,
});

// 结果示例
// [
//   {
//     seriesId: 'AAPL-price',
//     granularity: Granularity.MIN_5,
//     startTime: new Date('2026-01-27T10:00:00Z'),
//     endTime: new Date('2026-01-27T10:05:00Z'),
//     open: 150.0,
//     high: 150.5,
//     low: 149.8,
//     close: 150.25,
//     volume: 5000,
//     vwap: 150.12,
//   },
//   ...
// ]
```

### 5. 使用测试数据生成器

```typescript
// 创建测试数据生成器
const generator = new TestDataGenerator({
  enabled: true,
  seriesId: 'AAPL-price',
  initialPrice: 150.0,
  enableDebugLog: true,
});

// 生成 10 个数据点
generator.generateAndInject(manager, 10, 1000);

// 生成指定时间范围的数据
const start = new Date('2026-01-27T10:00:00Z');
const end = new Date('2026-01-27T10:10:00Z');
generator.generateTimeRange(manager, start, end, 1000);

// 查询生成结果
const results = manager.queryAggregatedData({
  seriesId: 'AAPL-price',
  granularity: Granularity.MIN_1,
  startTime: start,
  endTime: end,
});

console.log(`Generated ${results.length} data points`);
```

### 6. 自动窗口管理

窗口会自动关闭和清除，无需手动管理：

```typescript
// 添加数据时，系统会自动：
// 1. 创建或更新所有粒度的活跃窗口
// 2. 窗口时间到达后自动关闭
// 3. 关闭后生成聚合数据点
// 4. 活跃窗口从内存中清除

// 手动触发清理（可选）
manager.cleanup();
```

## 支持的时间粒度

- `MIN_1`: 1 分钟
- `MIN_5`: 5 分钟
- `MIN_15`: 15 分钟
- `MIN_30`: 30 分钟
- `MIN_60`: 1 小时
- `MIN_120`: 2 小时
- `DAY_1`: 1 天
- `DAY_5`: 5 天
- `DAY_20`: 20 天
- `DAY_120`: 120 天
- `DAY_250`: 250 天

## 支持的指标

- `OPEN`: 开盘价（第一个值）
- `HIGH`: 最高价（最大值）
- `LOW`: 最低价（最小值）
- `CLOSE`: 收盘价（最后一个值）
- `VOLUME`: 成交量（总和）
- `VWAP`: 成交量加权平均价

## 数据类型

- `CONTINUOUS`: 连续值（如价格），使用前一个收盘价填充空缺
- `DISCRETE`: 离散值（如成交量），使用 0 填充空缺

## 性能特性

- 增量聚合：使用累加器，避免重复计算
- O(1) 窗口查找：使用 Map 数据结构
- 自动内存管理：窗口关闭后自动清除
- 支持并发：可管理 1000+ 时间序列

## 注意事项

1. 时间窗口严格对齐到自然边界（例如：1 分钟窗口对齐到 :00, :01, :02）
2. 已关闭的窗口不会接受新数据
3. 所有数据存储在内存中，窗口关闭后会自动清除
4. 测试数据生成器默认禁用，需手动启用
