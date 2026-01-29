# K线数据结构设计文档

## 1. 概述

本文档基于项目根目录下 `Trend/` 文件夹中的实际K线数据格式，分析并推导出K线数据结构设计。

## 2. 数据文件分析

### 2.1 文件类型

| 文件名 | 数据类型 | 描述 |
|--------|---------|------|
| `5-day.json` | 五日线实时数据 | 最近5个交易日的分钟级实时数据 |
| `fenshi.json` | 分时数据 | 单日分时数据（分钟级） |
| `kline-day.json` | 日K线 | 日K线数据 |
| `kline-week.json` | 周K线 | 周K线数据 |
| `kline-month.json` | 月K线 | 月K线数据 |

### 2.2 通用响应结构

所有文件都遵循相同的响应结构：

```typescript
interface KLineResponse {
  rc: number;        // 返回码（0表示成功）
  rt: number;        // 响应时间
  svr: number;       // 服务器ID
  lt: number;        // 未知字段
  full: number;      // 是否完整数据（0/1）
  dlmkts: string;    // 未知字段
  data: KLineData;   // 数据内容
}
```

### 2.3 数据内容结构

#### 2.3.1 实时数据（5-day.json, fenshi.json）

```typescript
interface TrendData {
  code: string;              // 股票代码
  market: number;            // 市场类型（1=上海，2=深圳）
  type?: number;             // 数据类型
  status: number;            // 状态码
  name: string;              // 股票名称
  decimal: number;           // 价格小数位数
  preSettlement: number;     // 前结算价
  preClose: number;          // 前收盘价
  beticks: string;           // 交易时间段（用|分隔）
  trendsTotal: number;       // 趋势数据总数
  time: number;              // 时间戳
  kind: number;              // 数据类型
  prePrice: number;          // 前价格
  hisPrePrices?: Array<{     // 历史前收盘价（可选）
    date: number;            // 日期（YYYYMMDD格式）
    prePrice: number;         // 前收盘价
  }>;
  trends: string[];          // 趋势数据数组（CSV格式字符串）
}
```

**趋势数据格式（trends数组中的字符串）：**

对于 `5-day.json`（五日线实时数据）：
```
"日期时间,未知字段,当前价,最高价,最低价,成交量,成交额,平均价"
例如："2026-01-23 09:30,0.00,115.05,115.05,115.05,1075,12363618.00,115.050"
```

对于 `fenshi.json`（分时数据）：
```
"日期时间,开盘价,当前价,最高价,最低价,成交量,成交额,平均价"
例如："2026-01-29 09:30,46.00,46.00,46.00,46.00,499,2295400.00,46.000"
```

#### 2.3.2 K线数据（kline-day.json, kline-week.json, kline-month.json）

```typescript
interface KLineData {
  code: string;              // 股票代码
  market: number;            // 市场类型（1=上海，2=深圳）
  name: string;              // 股票名称
  decimal: number;           // 价格小数位数
  dktotal: number;           // K线数据总数
  preKPrice: number;         // 前K线价格
  prePrice: number;          // 前收盘价
  qtMiscType: number;        // 未知类型
  version: number;           // 版本号
  klines: string[];          // K线数据数组（CSV格式字符串）
}
```

**K线数据格式（klines数组中的字符串）：**
```
"日期,开盘价,收盘价,最高价,最低价,成交量,成交额,换手率,涨跌幅,涨跌额,振幅"
例如："2016-06-15,4.70,6.10,6.10,4.70,673,561061.00,39.55,72.32,2.56,0.05"
```

## 3. 数据结构设计

### 3.1 核心K线数据点

基于分析，我们定义以下核心数据结构：

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
  
  /** 成交额 */
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
```

### 3.2 分时数据点

```typescript
/**
 * 分时数据点（实时价格数据）
 */
interface TimeSharePoint {
  /** 时间戳 */
  timestamp: Date;
  
  /** 当前价 */
  price: number;
  
  /** 开盘价（仅分时数据有） */
  open?: number;
  
  /** 最高价 */
  high: number;
  
  /** 最低价 */
  low: number;
  
  /** 成交量 */
  volume: number;
  
  /** 成交额 */
  amount: number;
  
  /** 平均价（VWAP） */
  averagePrice: number;
}
```

### 3.3 元数据

```typescript
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

### 3.4 完整K线数据响应

```typescript
/**
 * K线数据查询响应
 */
interface KLineResponse {
  /** 元数据 */
  metadata: KLineMetadata;
  
  /** K线数据点数组 */
  data: KLinePoint[];
  
  /** 数据粒度 */
  granularity: KLineGranularity;
  
  /** 是否完整数据 */
  isFull: boolean;
}
```

### 3.5 分时数据响应

```typescript
/**
 * 分时数据查询响应
 */
interface TimeShareResponse {
  /** 元数据 */
  metadata: KLineMetadata;
  
  /** 分时数据点数组 */
  data: TimeSharePoint[];
  
  /** 历史前收盘价（可选） */
  hisPrePrices?: Array<{
    date: Date;
    prePrice: number;
  }>;
}
```

## 4. 数据粒度枚举

```typescript
/**
 * K线数据粒度
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
  DAY = '1d',
  
  /** 周K线 */
  WEEK = '1w',
  
  /** 月K线 */
  MONTH = '1M',
}
```

## 5. 数据解析示例

### 5.1 解析日K线数据

```typescript
function parseDayKLine(csvString: string): KLinePoint {
  // 格式："日期,开盘价,收盘价,最高价,最低价,成交量,成交额,换手率,涨跌幅,涨跌额,振幅"
  const parts = csvString.split(',');
  
  return {
    timestamp: new Date(parts[0]),
    open: parseFloat(parts[1]),
    close: parseFloat(parts[2]),
    high: parseFloat(parts[3]),
    low: parseFloat(parts[4]),
    volume: parseInt(parts[5]),
    amount: parseFloat(parts[6]),
    turnoverRate: parseFloat(parts[7]),
    changePercent: parseFloat(parts[8]),
    changeAmount: parseFloat(parts[9]),
    amplitude: parseFloat(parts[10]),
  };
}
```

### 5.2 解析分时数据

```typescript
function parseTimeShare(csvString: string): TimeSharePoint {
  // 格式："日期时间,开盘价,当前价,最高价,最低价,成交量,成交额,平均价"
  const parts = csvString.split(',');
  
  return {
    timestamp: new Date(parts[0]),
    open: parseFloat(parts[1]),
    price: parseFloat(parts[2]),
    high: parseFloat(parts[3]),
    low: parseFloat(parts[4]),
    volume: parseInt(parts[5]),
    amount: parseFloat(parts[6]),
    averagePrice: parseFloat(parts[7]),
  };
}
```

## 6. API接口设计建议

### 6.1 查询K线数据

```typescript
/**
 * 查询K线数据
 */
interface QueryKLineRequest {
  /** 股票代码 */
  symbol: string;
  
  /** 数据粒度 */
  granularity: KLineGranularity;
  
  /** 开始时间（可选） */
  startTime?: Date;
  
  /** 结束时间（可选） */
  endTime?: Date;
  
  /** 数据点数量限制（可选） */
  limit?: number;
}

interface QueryKLineResponse {
  success: boolean;
  data: KLineResponse;
}
```

### 6.2 查询分时数据

```typescript
/**
 * 查询分时数据
 */
interface QueryTimeShareRequest {
  /** 股票代码 */
  symbol: string;
  
  /** 日期（可选，默认当日） */
  date?: Date;
}

interface QueryTimeShareResponse {
  success: boolean;
  data: TimeShareResponse;
}
```

## 7. 与时间序列管理器的集成

### 7.1 数据映射

从 `TimeSeriesManager` 的聚合数据转换为K线数据：

```typescript
function convertToKLinePoint(
  aggregatedPoint: AggregatedPoint,
  seriesId: string
): KLinePoint {
  return {
    timestamp: new Date(aggregatedPoint.startTime),
    open: aggregatedPoint.metrics.open,
    close: aggregatedPoint.metrics.close,
    high: aggregatedPoint.metrics.high,
    low: aggregatedPoint.metrics.low,
    volume: aggregatedPoint.metrics.volume,
    // amount, turnoverRate等需要从其他序列或计算得出
  };
}
```

### 7.2 数据查询流程

```
前端请求K线数据
  ↓
后端API接收请求
  ↓
从TimeSeriesManager查询聚合数据
  ↓
转换为KLinePoint格式
  ↓
添加元数据
  ↓
返回KLineResponse
```

## 8. 注意事项

1. **日期格式**：
   - K线数据使用 `YYYY-MM-DD` 格式
   - 分时数据使用 `YYYY-MM-DD HH:mm` 格式
   - 需要正确解析为 `Date` 对象

2. **价格精度**：
   - 根据 `decimal` 字段确定价格小数位数
   - 通常为2位小数

3. **数据完整性**：
   - `full` 字段表示数据是否完整
   - 如果为0，可能需要分页查询

4. **市场类型**：
   - `market: 1` 表示上海市场
   - `market: 2` 表示深圳市场

5. **成交量单位**：
   - 成交量通常以"手"为单位（1手=100股）
   - 成交额以"元"为单位

6. **缺失数据处理**：
   - 某些字段可能为0或空
   - 需要根据业务逻辑判断是否为有效数据

## 9. 实现建议

1. **数据解析器**：
   - 创建专门的解析器类处理CSV格式字符串
   - 支持错误处理和数据验证

2. **数据转换器**：
   - 从 `TimeSeriesManager` 的聚合数据转换为K线格式
   - 处理缺失字段的计算

3. **缓存策略**：
   - K线数据相对稳定，可以缓存
   - 实时数据需要及时更新

4. **分页支持**：
   - 对于大量历史数据，支持分页查询
   - 使用游标或时间范围控制
