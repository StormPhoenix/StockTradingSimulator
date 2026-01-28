/**
 * Trading Time Types
 * 交易时间类型定义
 *
 * 定义交易所时间模拟相关的类型和枚举
 *
 * @feature exchange-time-simulation
 * @author System
 * @since 2026-01-27
 */

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

/**
 * 时间区间接口
 */
export interface TimeInterval {
  /** 区间名称 */
  name: string;
  /** 开始时间（HH:mm格式） */
  start: string;
  /** 结束时间（HH:mm格式） */
  end: string;
  /** 描述（可选） */
  description?: string;
}

/**
 * 交易区间配置
 */
export interface TradingIntervalConfig {
  /** 非交易区间列表（时间停止） */
  nonTradingIntervals: TimeInterval[];
  /** 交易区间列表（时间推进） */
  tradingIntervals: TimeInterval[];
}

/**
 * 时间状态信息
 */
export interface TimeStateInfo {
  /** 当前时间状态 */
  state: TradingTimeState;
  /** 游戏时间 */
  simulatedTime: Date;
  /** 是否为交易日 */
  isTradingDay: boolean;
  /** 是否在交易时间（标准交易时间段） */
  isInTradingHours: boolean;
  /** 是否在可交易区间（包括可配置区间） */
  isInTradingInterval: boolean;
  /** 时间加速倍数 */
  timeAcceleration: number;
}
