# 交易所时间模拟功能设计方案

## 1. 概述

本文档描述了交易所实例的时间模拟功能设计，实现A股交易时间的模拟，包括游戏时间管理、交易日历、时间状态管理等核心功能。

## 2. 设计目标

- 实现独立的游戏时间系统，独立于系统时间
- 支持时间加速功能（1x, 2x, 5x, 10x等）
- 自动识别交易日和非交易日（周一到周五）
- 自动识别交易时间段和非交易时间段
- 在非交易区间停止时间模拟
- 提供时间状态查询接口
- 支持通过配置文件自定义非交易区间

## 3. 核心设计原则

### 3.1 时间模拟策略

- **方案A：基于时间戳的连续模拟**
  - 维护独立的游戏时间戳（`simulatedTime`）
  - 每次 `onTick` 根据 `deltaTime` 和加速倍数更新游戏时间
  - 时间连续推进，无跳跃
  - 在非交易区间停止时间推进

### 3.2 非交易区间处理

- 支持配置非交易区间（如午休时间、收盘后等）
- 在非交易区间内，时间模拟停止，不推进游戏时间
- 业务逻辑（如价格更新、交易撮合）在非交易区间不执行

## 4. 游戏时间管理

### 4.1 时间初始化

#### 4.1.1 初始时间设置

- **默认值**：交易所 `onBeginPlay()` 时，游戏时间初始化为当天 9:15
- **配置支持**：可通过 `.env` 文件配置初始时间
- **对齐规则**：如果当前系统时间已过9:15，则初始化为下一个交易日的9:15

#### 4.1.2 环境变量配置

```env
# 交易所时间模拟配置
EXCHANGE_INITIAL_TIME=09:15  # 初始时间，格式 HH:mm
EXCHANGE_TIME_ACCELERATION=1.0  # 默认时间加速倍数
```

#### 4.1.3 初始化逻辑

```typescript
onBeginPlay(): void {
  // 初始化游戏时间
  this.initializeSimulatedTime();
  
  // 其他初始化逻辑...
}

private initializeSimulatedTime(): void {
  const initialTimeStr = process.env.EXCHANGE_INITIAL_TIME || '09:15';
  const [hours, minutes] = initialTimeStr.split(':').map(Number);
  
  // 获取当前系统日期
  const today = new Date();
  const initialDate = new Date(today);
  initialDate.setHours(hours, minutes, 0, 0);
  
  // 如果当前时间已过初始时间，则使用下一个交易日
  if (today > initialDate) {
    initialDate.setDate(initialDate.getDate() + 1);
    // 确保是交易日（周一到周五）
    while (!this.isTradingDay(initialDate)) {
      initialDate.setDate(initialDate.getDate() + 1);
    }
  }
  
  this.simulatedTime = initialDate;
  this.timeAcceleration = parseFloat(process.env.EXCHANGE_TIME_ACCELERATION || '1.0');
}
```

### 4.2 时间加速管理

#### 4.2.1 加速倍数设置

- 由 `ExchangeInstance` 管理时间加速倍数
- 支持动态调整加速倍数
- 加速倍数范围：0.1x - 1000x（建议范围）

#### 4.2.2 接口设计

```typescript
class ExchangeInstance {
  private timeAcceleration: number = 1.0;  // 时间加速倍数
  
  /**
   * 设置时间加速倍数
   * @param acceleration 加速倍数（0.1 - 1000）
   */
  public setTimeAcceleration(acceleration: number): void {
    if (acceleration < 0.1 || acceleration > 1000) {
      throw new Error(`Time acceleration must be between 0.1 and 1000, got ${acceleration}`);
    }
    this.timeAcceleration = acceleration;
    console.log(`[ExchangeInstance] Time acceleration set to ${acceleration}x`);
  }
  
  /**
   * 获取当前时间加速倍数
   */
  public getTimeAcceleration(): number {
    return this.timeAcceleration;
  }
}
```

### 4.3 时间更新逻辑

```typescript
onTick(deltaTime: number): void {
  if (!this.isActive) {
    return;
  }
  
  // 检查是否在交易区间（包括交易时间和可配置的非交易区间）
  if (this.isInTradingInterval()) {
    // 更新游戏时间
    this.updateSimulatedTime(deltaTime);
  }
  // 非交易区间不更新时间，时间停止
  
  // 更新子对象
  // ...
}

/**
 * 更新模拟时间
 */
private updateSimulatedTime(deltaTime: number): void {
  const elapsedMs = deltaTime * 1000 * this.timeAcceleration;
  this.simulatedTime = new Date(this.simulatedTime.getTime() + elapsedMs);
}

/**
 * 检查是否在交易区间（包括交易时间和可配置的非交易区间）
 */
private isInTradingInterval(): boolean {
  // 1. 检查是否为交易日
  if (!this.isTradingDay(this.simulatedTime)) {
    return false;
  }
  
  // 2. 检查是否在交易时间或可配置的非交易区间
  return this.isInTradingHours() || this.isInConfiguredTradingInterval();
}
```

## 5. 交易日历管理

### 5.1 交易日规则

- **默认规则**：周一到周五为交易日
- **不需要支持**：节假日、特殊交易日
- **实现方式**：简单的星期判断

### 5.2 交易日判断

```typescript
/**
 * 检查指定日期是否为交易日
 * 默认规则：周一到周五为交易日
 */
private isTradingDay(date: Date): boolean {
  const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  // 周一到周五：1-5
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * 获取下一个交易日
 */
public getNextTradingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);
  
  while (!this.isTradingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }
  
  return nextDay;
}

/**
 * 获取上一个交易日
 */
public getPreviousTradingDay(date: Date): Date {
  const prevDay = new Date(date);
  prevDay.setDate(prevDay.getDate() - 1);
  
  while (!this.isTradingDay(prevDay)) {
    prevDay.setDate(prevDay.getDate() - 1);
  }
  
  return prevDay;
}
```

### 5.3 配置文件支持（可选扩展）

虽然当前不需要支持节假日，但为后续扩展预留接口：

```typescript
// 交易日历配置接口（预留）
interface TradingCalendarConfig {
  // 交易日规则
  tradingDays: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  
  // 节假日列表（预留，当前不使用）
  holidays?: string[]; // ISO日期字符串数组
  
  // 特殊交易日（预留，当前不使用）
  specialTradingDays?: string[]; // ISO日期字符串数组
}
```

## 6. 时间状态管理

### 6.1 时间状态枚举

```typescript
/**
 * 交易时间状态枚举
 */
export enum TradingTimeState {
  /** 开市前（0:00-9:30） */
  PRE_MARKET = 'PRE_MARKET',
  
  /** 上午交易时段（9:30-11:30） */
  MORNING_SESSION = 'MORNING_SESSION',
  
  /** 午休时段（11:30-13:00） */
  LUNCH_BREAK = 'LUNCH_BREAK',
  
  /** 下午交易时段（13:00-15:00） */
  AFTERNOON_SESSION = 'AFTERNOON_SESSION',
  
  /** 收盘后（15:00-24:00） */
  POST_MARKET = 'POST_MARKET',
  
  /** 非交易日 */
  NON_TRADING_DAY = 'NON_TRADING_DAY',
  
  /** 可配置的非交易区间（如集合竞价等） */
  CONFIGURED_NON_TRADING = 'CONFIGURED_NON_TRADING'
}
```

### 6.2 状态判断逻辑

```typescript
/**
 * 获取当前时间状态
 */
public getTimeState(): TradingTimeState {
  // 1. 检查是否为交易日
  if (!this.isTradingDay(this.simulatedTime)) {
    return TradingTimeState.NON_TRADING_DAY;
  }
  
  const hour = this.simulatedTime.getHours();
  const minute = this.simulatedTime.getMinutes();
  const timeValue = hour * 60 + minute;
  
  // 2. 检查可配置的非交易区间
  if (this.isInConfiguredNonTradingInterval()) {
    return TradingTimeState.CONFIGURED_NON_TRADING;
  }
  
  // 3. 检查标准交易时间段
  const morningStart = 9 * 60 + 30;   // 9:30
  const morningEnd = 11 * 60 + 30;     // 11:30
  const afternoonStart = 13 * 60;      // 13:00
  const afternoonEnd = 15 * 60;        // 15:00
  
  if (timeValue >= morningStart && timeValue <= morningEnd) {
    return TradingTimeState.MORNING_SESSION;
  }
  
  if (timeValue >= afternoonStart && timeValue <= afternoonEnd) {
    return TradingTimeState.AFTERNOON_SESSION;
  }
  
  if (timeValue < morningStart) {
    return TradingTimeState.PRE_MARKET;
  }
  
  if (timeValue > morningEnd && timeValue < afternoonStart) {
    return TradingTimeState.LUNCH_BREAK;
  }
  
  if (timeValue > afternoonEnd) {
    return TradingTimeState.POST_MARKET;
  }
  
  // 默认返回收盘后
  return TradingTimeState.POST_MARKET;
}
```

### 6.3 状态查询接口

```typescript
/**
 * 检查是否在交易时间（仅检查标准交易时间段）
 */
public isInTradingHours(): boolean {
  const state = this.getTimeState();
  return state === TradingTimeState.MORNING_SESSION || 
         state === TradingTimeState.AFTERNOON_SESSION;
}

/**
 * 检查是否在可交易区间（包括交易时间和可配置的非交易区间）
 */
public isInTradingInterval(): boolean {
  const state = this.getTimeState();
  // 交易时间或可配置的交易区间
  return this.isInTradingHours() || 
         state === TradingTimeState.CONFIGURED_NON_TRADING;
}

/**
 * 获取时间状态信息
 */
public getTimeStateInfo(): {
  state: TradingTimeState;
  simulatedTime: Date;
  isTradingDay: boolean;
  isInTradingHours: boolean;
  isInTradingInterval: boolean;
  timeAcceleration: number;
} {
  return {
    state: this.getTimeState(),
    simulatedTime: this.getSimulatedTime(),
    isTradingDay: this.isTradingDay(this.simulatedTime),
    isInTradingHours: this.isInTradingHours(),
    isInTradingInterval: this.isInTradingInterval(),
    timeAcceleration: this.timeAcceleration
  };
}
```

## 7. 非交易区间配置

### 7.1 配置需求

- 支持配置非交易区间（如集合竞价、收盘集合竞价等）
- 在非交易区间内，时间模拟停止
- 配置格式：时间段列表

### 7.2 配置文件设计

#### 7.2.1 配置文件位置

```
server/config/
  └── trading-intervals.json
```

#### 7.2.2 配置格式

```json
{
  "nonTradingIntervals": [
    {
      "name": "集合竞价",
      "start": "09:15",
      "end": "09:25",
      "description": "开盘集合竞价时间"
    },
    {
      "name": "收盘集合竞价",
      "start": "14:57",
      "end": "15:00",
      "description": "收盘集合竞价时间"
    }
  ],
  "tradingIntervals": [
    {
      "name": "早盘",
      "start": "09:30",
      "end": "11:30",
      "description": "上午交易时段"
    },
    {
      "name": "午盘",
      "start": "13:00",
      "end": "15:00",
      "description": "下午交易时段"
    }
  ]
}
```

#### 7.2.3 配置接口

```typescript
interface TradingIntervalConfig {
  nonTradingIntervals: TimeInterval[];
  tradingIntervals: TimeInterval[];
}

interface TimeInterval {
  name: string;
  start: string;  // HH:mm 格式
  end: string;    // HH:mm 格式
  description?: string;
}
```

### 7.3 配置加载和解析

```typescript
class ExchangeInstance {
  private tradingIntervalConfig: TradingIntervalConfig | null = null;
  
  constructor(...) {
    // 加载配置
    this.loadTradingIntervalConfig();
  }
  
  /**
   * 加载交易区间配置
   */
  private loadTradingIntervalConfig(): void {
    try {
      const configPath = path.join(__dirname, '../../config/trading-intervals.json');
      const configContent = fs.readFileSync(configPath, 'utf-8');
      this.tradingIntervalConfig = JSON.parse(configContent);
    } catch (error) {
      console.warn('[ExchangeInstance] Failed to load trading interval config, using defaults');
      this.tradingIntervalConfig = null;
    }
  }
  
  /**
   * 检查是否在可配置的非交易区间
   */
  private isInConfiguredNonTradingInterval(): boolean {
    if (!this.tradingIntervalConfig) {
      return false;
    }
    
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    for (const interval of this.tradingIntervalConfig.nonTradingIntervals) {
      const [startHour, startMinute] = interval.start.split(':').map(Number);
      const [endHour, endMinute] = interval.end.split(':').map(Number);
      const startValue = startHour * 60 + startMinute;
      const endValue = endHour * 60 + endMinute;
      
      if (timeValue >= startValue && timeValue < endValue) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * 检查是否在可配置的交易区间
   */
  private isInConfiguredTradingInterval(): boolean {
    if (!this.tradingIntervalConfig) {
      return false;
    }
    
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    for (const interval of this.tradingIntervalConfig.tradingIntervals) {
      const [startHour, startMinute] = interval.start.split(':').map(Number);
      const [endHour, endMinute] = interval.end.split(':').map(Number);
      const startValue = startHour * 60 + startMinute;
      const endValue = endHour * 60 + endMinute;
      
      if (timeValue >= startValue && timeValue < endValue) {
        return true;
      }
    }
    
    return false;
  }
}
```

## 8. 时间同步机制

### 8.1 独立性原则

- **每个交易所独立管理自己的游戏时间**
- 不同交易所之间的时间相互独立，互不影响
- 支持不同交易所使用不同的时间加速倍数

### 8.2 时间隔离

```typescript
class ExchangeInstance {
  private simulatedTime: Date;  // 每个交易所独立的游戏时间
  private timeAcceleration: number;  // 每个交易所独立的加速倍数
  
  // 时间管理完全独立，不共享状态
}
```

### 8.3 不支持的功能

- **时间回退**：不支持时间回退功能（用于回测等场景，后续扩展）
- **时间跳转**：不支持跳转到指定时间（后续扩展）
- **时间同步**：不支持多个交易所时间同步

## 9. 完整接口设计

### 9.1 ExchangeInstance 时间管理接口

```typescript
export class ExchangeInstance implements GameObject {
  // ========== 时间管理属性 ==========
  private simulatedTime: Date;                    // 游戏时间
  private timeAcceleration: number = 1.0;         // 时间加速倍数
  private tradingIntervalConfig: TradingIntervalConfig | null = null;
  
  // ========== 时间查询接口 ==========
  
  /**
   * 获取当前游戏时间
   */
  public getSimulatedTime(): Date {
    return new Date(this.simulatedTime);
  }
  
  /**
   * 获取当前时间状态
   */
  public getTimeState(): TradingTimeState {
    // 实现见 6.2
  }
  
  /**
   * 检查是否在交易时间（标准交易时间段）
   */
  public isInTradingHours(): boolean {
    // 实现见 6.3
  }
  
  /**
   * 检查是否在可交易区间（包括可配置区间）
   */
  public isInTradingInterval(): boolean {
    // 实现见 6.3
  }
  
  /**
   * 检查是否为交易日
   */
  public isTradingDay(date?: Date): boolean {
    const targetDate = date || this.simulatedTime;
    return this.isTradingDayInternal(targetDate);
  }
  
  /**
   * 获取时间状态详细信息
   */
  public getTimeStateInfo(): TimeStateInfo {
    // 实现见 6.3
  }
  
  // ========== 时间控制接口 ==========
  
  /**
   * 设置时间加速倍数
   */
  public setTimeAcceleration(acceleration: number): void {
    // 实现见 4.2
  }
  
  /**
   * 获取时间加速倍数
   */
  public getTimeAcceleration(): number {
    return this.timeAcceleration;
  }
  
  // ========== 交易日历接口 ==========
  
  /**
   * 获取下一个交易日
   */
  public getNextTradingDay(date?: Date): Date {
    const targetDate = date || this.simulatedTime;
    return this.getNextTradingDayInternal(targetDate);
  }
  
  /**
   * 获取上一个交易日
   */
  public getPreviousTradingDay(date?: Date): Date {
    const targetDate = date || this.simulatedTime;
    return this.getPreviousTradingDayInternal(targetDate);
  }
  
  // ========== 内部方法 ==========
  
  /**
   * 初始化游戏时间
   */
  private initializeSimulatedTime(): void {
    // 实现见 4.1.3
  }
  
  /**
   * 更新游戏时间
   */
  private updateSimulatedTime(deltaTime: number): void {
    // 实现见 4.3
  }
  
  /**
   * 检查是否在交易区间（用于时间更新判断）
   */
  private isInTradingIntervalForUpdate(): boolean {
    // 检查是否为交易日
    if (!this.isTradingDayInternal(this.simulatedTime)) {
      return false;
    }
    
    // 检查是否在交易时间或可配置的交易区间
    return this.isInTradingHours() || this.isInConfiguredTradingInterval();
  }
}
```

### 9.2 类型定义

```typescript
/**
 * 交易时间状态
 */
export enum TradingTimeState {
  PRE_MARKET = 'PRE_MARKET',
  MORNING_SESSION = 'MORNING_SESSION',
  LUNCH_BREAK = 'LUNCH_BREAK',
  AFTERNOON_SESSION = 'AFTERNOON_SESSION',
  POST_MARKET = 'POST_MARKET',
  NON_TRADING_DAY = 'NON_TRADING_DAY',
  CONFIGURED_NON_TRADING = 'CONFIGURED_NON_TRADING'
}

/**
 * 时间状态信息
 */
export interface TimeStateInfo {
  state: TradingTimeState;
  simulatedTime: Date;
  isTradingDay: boolean;
  isInTradingHours: boolean;
  isInTradingInterval: boolean;
  timeAcceleration: number;
}

/**
 * 交易区间配置
 */
export interface TradingIntervalConfig {
  nonTradingIntervals: TimeInterval[];
  tradingIntervals: TimeInterval[];
}

/**
 * 时间区间
 */
export interface TimeInterval {
  name: string;
  start: string;  // HH:mm
  end: string;    // HH:mm
  description?: string;
}
```

## 10. 实现流程

### 10.1 初始化流程

```
ExchangeInstance 构造函数
  ↓
加载交易区间配置文件
  ↓
onBeginPlay()
  ↓
初始化游戏时间（从.env读取或使用默认值9:15）
  ↓
对齐到最近的交易日9:15
  ↓
初始化完成
```

### 10.2 时间更新流程

```
GameLoop.onTick(deltaTime)
  ↓
ExchangeInstance.onTick(deltaTime)
  ↓
检查 isInTradingIntervalForUpdate()
  ├── 是交易日？
  │   ├── 是 → 继续检查
  │   └── 否 → 停止时间更新
  ├── 在交易时间或可配置交易区间？
  │   ├── 是 → 更新游戏时间
  │   └── 否 → 停止时间更新
  ↓
更新子对象（traders, stocks）
```

### 10.3 状态查询流程

```
外部调用 getTimeState()
  ↓
检查是否为交易日
  ├── 否 → 返回 NON_TRADING_DAY
  └── 是 → 继续检查
      ↓
检查可配置的非交易区间
  ├── 是 → 返回 CONFIGURED_NON_TRADING
  └── 否 → 继续检查
      ↓
检查标准交易时间段
  ├── 9:30-11:30 → MORNING_SESSION
  ├── 13:00-15:00 → AFTERNOON_SESSION
  ├── < 9:30 → PRE_MARKET
  ├── 11:30-13:00 → LUNCH_BREAK
  └── > 15:00 → POST_MARKET
```

## 11. 配置文件示例

### 11.1 .env 配置

```env
# 交易所时间模拟配置
EXCHANGE_INITIAL_TIME=09:15
EXCHANGE_TIME_ACCELERATION=1.0
```

### 11.2 trading-intervals.json 配置

```json
{
  "nonTradingIntervals": [
    {
      "name": "集合竞价",
      "start": "09:15",
      "end": "09:25",
      "description": "开盘集合竞价时间，时间停止"
    },
    {
      "name": "收盘集合竞价",
      "start": "14:57",
      "end": "15:00",
      "description": "收盘集合竞价时间，时间停止"
    }
  ],
  "tradingIntervals": [
    {
      "name": "早盘",
      "start": "09:30",
      "end": "11:30",
      "description": "上午交易时段，时间推进"
    },
    {
      "name": "午盘",
      "start": "13:00",
      "end": "15:00",
      "description": "下午交易时段，时间推进"
    }
  ]
}
```

## 12. 关键设计决策

### 12.1 时间推进策略

- **在交易区间内**：时间正常推进（根据加速倍数）
- **在非交易区间内**：时间停止推进
- **非交易日**：时间停止推进

### 12.2 非交易区间处理

- **配置的非交易区间**：时间停止，业务逻辑不执行
- **标准非交易时间段**（如午休、收盘后）：时间停止，业务逻辑不执行
- **非交易日**：时间停止，业务逻辑不执行

### 12.3 时间状态优先级

1. 非交易日检查（最高优先级）
2. 可配置的非交易区间检查
3. 标准交易时间段检查
4. 其他时间段（开市前、午休、收盘后）

### 12.4 时间加速范围

- **建议范围**：0.1x - 1000x
- **常用倍数**：1x, 2x, 5x, 10x, 50x, 100x
- **验证**：设置时验证范围，超出范围抛出异常

## 13. 实现检查清单

- [ ] 实现游戏时间初始化（从.env读取配置）
- [ ] 实现时间更新逻辑（基于deltaTime和加速倍数）
- [ ] 实现交易日判断（周一到周五）
- [ ] 实现时间状态枚举和判断逻辑
- [ ] 实现交易区间配置文件加载
- [ ] 实现非交易区间检查逻辑
- [ ] 实现时间加速设置接口
- [ ] 实现时间状态查询接口
- [ ] 实现交易日历查询接口（下一个/上一个交易日）
- [ ] 在onTick中集成时间更新逻辑
- [ ] 编写单元测试
- [ ] 编写配置文件示例

## 14. 注意事项

1. **时间精度**：使用毫秒级精度，确保时间连续性
2. **配置加载**：配置文件加载失败时使用默认值，不中断系统
3. **时间隔离**：确保不同交易所的时间完全独立
4. **性能考虑**：时间状态检查逻辑要高效，避免频繁计算
5. **边界处理**：正确处理时间段的边界情况（如9:30:00是否包含）
6. **非交易日跳过**：当时间推进到非交易日时，自动跳到下一个交易日

## 15. 后续扩展方向

虽然当前版本不支持，但为后续扩展预留接口：

1. **时间回退**：支持时间回退功能（用于回测）
2. **时间跳转**：支持跳转到指定时间
3. **节假日支持**：支持节假日配置
4. **特殊交易日**：支持特殊交易日配置
5. **事件通知**：时间状态变化时触发事件
6. **时间同步**：支持多个交易所时间同步

---

**文档版本**：1.0  
**创建日期**：2026-01-27  
**最后更新**：2026-01-27
