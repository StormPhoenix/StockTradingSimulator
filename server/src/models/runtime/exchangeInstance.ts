/**
 * 交易所运行时实例
 * 
 * 继承 GameObject，管理 AI 交易员和股票的运行时容器
 */

import { GameObject, GameObjectState } from '../../lifecycle/types';
import { AITraderInstance } from './aiTraderInstance';
import { StockInstance } from './stockInstance';
import {
  TradingTimeState,
  TradingIntervalConfig,
  TimeStateInfo,
} from '../../types/tradingTime';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GameObjectManager } from '@/lifecycle/core/gameObjectManager';

/**
 * 交易所实例类
 */
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

  // 时间模拟相关
  private simulatedTime: Date;                    // 游戏时间
  private timeAcceleration: number = 1.0;         // 时间加速倍数
  private tradingIntervalConfig: TradingIntervalConfig;

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
    
    // 初始化游戏时间（临时值，将在 onBeginPlay 中正确初始化）
    this.simulatedTime = new Date();
    
    // 初始化交易区间配置（使用默认值，将在 loadTradingIntervalConfig 中覆盖）
    this.tradingIntervalConfig = this.getDefaultTradingIntervalConfig();
    
    // 加载交易区间配置
    this.loadTradingIntervalConfig();
  }

  /**
   * GameObject 生命周期 - 开始播放
   */
  onBeginPlay(): void {
    this.isActive = true;
    this.lastActiveAt = new Date();
    
    // 初始化游戏时间
    this.initializeSimulatedTime();
    
    console.log(`[ExchangeInstance] Exchange "${this.name}" (ID: ${this.id}) started with ${this.traders.size} traders and ${this.stocks.size} stocks`);
    console.log(`[ExchangeInstance] Simulated time initialized: ${this.simulatedTime.toISOString()}, acceleration: ${this.timeAcceleration}x`);
  }

  /**
   * GameObject 生命周期 - 每帧更新
   */
  onTick(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }

    this.lastActiveAt = new Date();

    // 游戏时间更新
    this.updateSimulatedTime(deltaTime);
  }

  /**
   * GameObject 生命周期 - 销毁
   */
  onDestroy(): void {
    this.isActive = false;
    
    console.log(`[ExchangeInstance] Exchange "${this.name}" (ID: ${this.id}) is being destroyed`);
    
    // 通过 GameObjectManager 销毁所有交易员
    const gameObjectManager = GameObjectManager.getInstance();
    
    for (const trader of this.traders.values()) {
      try {
        gameObjectManager.destroyObject(trader.id);
      } catch (error) {
        console.error(`[ExchangeInstance] Failed to destroy trader ${trader.id}:`, error);
      }
    }
    
    // 通过 GameObjectManager 销毁所有股票
    for (const stock of this.stocks.values()) {
      try {
        gameObjectManager.destroyObject(stock.id);
      } catch (error) {
        console.error(`[ExchangeInstance] Failed to destroy stock ${stock.id}:`, error);
      }
    }
    
    // 清理容器
    this.traders.clear();
    this.stocks.clear();
  }

  /**
   * 添加交易员实例
   */
  public addTrader(trader: AITraderInstance): void {
    this.traders.set(trader.id.toString(), trader);
    console.log(`[ExchangeInstance] Added trader "${trader.name}" (ID: ${trader.id}) to exchange "${this.name}"`);
  }

  /**
   * 移除交易员实例
   */
  public removeTrader(traderId: string): void {
    const trader = this.traders.get(traderId);
    if (trader) {
      // 通过 GameObjectManager 销毁交易员
      const { GameObjectManager } = require('../../lifecycle/core/gameObjectManager');
      const gameObjectManager = GameObjectManager.getInstance();
      
      try {
        gameObjectManager.destroyObject(trader.id);
        this.traders.delete(traderId);
        console.log(`[ExchangeInstance] Removed trader ${traderId} from exchange "${this.name}"`);
      } catch (error) {
        console.error(`[ExchangeInstance] Failed to remove trader ${traderId}:`, error);
      }
    }
  }

  /**
   * 添加股票实例
   */
  public addStock(stock: StockInstance): void {
    this.stocks.set(stock.symbol, stock);
    console.log(`[ExchangeInstance] Added stock "${stock.symbol}" (${stock.companyName}) to exchange "${this.name}"`);
  }

  /**
   * 移除股票实例
   */
  public removeStock(stockSymbol: string): void {
    const stock = this.stocks.get(stockSymbol);
    if (stock) {
      // 通过 GameObjectManager 销毁股票
      const { GameObjectManager } = require('../../lifecycle/core/gameObjectManager');
      const gameObjectManager = GameObjectManager.getInstance();
      
      try {
        gameObjectManager.destroyObject(stock.id);
        this.stocks.delete(stockSymbol);
        console.log(`[ExchangeInstance] Removed stock ${stockSymbol} from exchange "${this.name}"`);
      } catch (error) {
        console.error(`[ExchangeInstance] Failed to remove stock ${stockSymbol}:`, error);
      }
    }
  }

  /**
   * 获取活跃交易员列表
   */
  public getActiveTraders(): AITraderInstance[] {
    return Array.from(this.traders.values()).filter(
      trader => trader.state === GameObjectState.ACTIVE
    );
  }

  /**
   * 获取可用股票列表
   */
  public getAvailableStocks(): StockInstance[] {
    return Array.from(this.stocks.values()).filter(
      stock => stock.state === GameObjectState.ACTIVE
    );
  }

  /**
   * 获取总资本（简化版本返回固定值）
   */
  public getTotalCapital(): number {
    // 简化版本：返回交易员数量 * 100000 作为模拟总资本
    return this.traders.size * 100000;
  }

  /**
   * 获取市场实例摘要信息
   */
  public getMarketInstanceSummary(): {
    exchangeId: string;
    name: string;
    description: string;
    status: string;
    createdAt: Date;
    lastActiveAt: Date;
    statistics: {
      traderCount: number;
      stockCount: number;
      totalCapital: number;
      averageCapitalPerTrader: number;
    };
  } {
    const activeTraders = this.getActiveTraders();
    const totalCapital = this.getTotalCapital();
    
    return {
      exchangeId: this.id.toString(),
      name: this.name,
      description: this.description,
      status: this.isActive ? 'ACTIVE' : 'INACTIVE',
      createdAt: this.createdAt,
      lastActiveAt: this.lastActiveAt,
      statistics: {
        traderCount: activeTraders.length,
        stockCount: this.getAvailableStocks().length,
        totalCapital,
        averageCapitalPerTrader: activeTraders.length > 0 ? totalCapital / activeTraders.length : 0
      }
    };
  }

  /**
   * 获取交易员详细信息（简化版本）
   */
  public getTraderDetails(): Array<{
    id: string;
    name: string;
    currentCapital: number;
    initialCapital: number;
    riskProfile: string;
    isActive: boolean;
  }> {
    return Array.from(this.traders.values()).map(trader => ({
      id: trader.id.toString(),
      name: trader.name,
      currentCapital: 100000, // 简化版本：固定资本
      initialCapital: 100000, // 简化版本：固定资本
      riskProfile: trader.riskProfile,
      isActive: trader.state === GameObjectState.ACTIVE
    }));
  }

  /**
   * 获取股票详细信息
   */
  public getStockDetails(): Array<{
    id: string;
    symbol: string;
    companyName: string;
    category: string;
    currentPrice: number;
    issuePrice: number;
    totalShares: number;
    marketCap: number;
  }> {
    return Array.from(this.stocks.values()).map(stock => ({
      id: stock.id.toString(),
      symbol: stock.symbol,
      companyName: stock.companyName,
      category: stock.category,
      currentPrice: stock.getCurrentPrice(),
      issuePrice: stock.issuePrice,
      totalShares: stock.totalShares,
      marketCap: stock.getMarketCap()
    }));
  }

  /**
   * 获取交易日志（简化版本）
   */
  public getTradingLogs(limit: number = 50, traderId?: string): Array<{
    traderId: string;
    traderName: string;
    capital: number;
    decisionType: string;
    targetStock: string;
    timestamp: Date;
  }> {
    // 简化版本：返回空数组，因为我们不再记录交易日志
    return [];
  }

  /**
   * 导出环境状态
   */
  public exportState(): {
    exchange: any;
    traders: any[];
    stocks: any[];
    tradingLogs: any[];
    statistics: any;
  } {
    return {
      exchange: {
        id: this.id,
        templateId: this.templateId,
        name: this.name,
        description: this.description,
        createdAt: this.createdAt,
        lastActiveAt: this.lastActiveAt,
        isActive: this.isActive
      },
      traders: this.getTraderDetails(),
      stocks: this.getStockDetails(),
      tradingLogs: this.getTradingLogs(1000), // 导出更多日志
      statistics: this.getMarketInstanceSummary().statistics
    };
  }

  /**
   * 获取指定交易员
   */
  public getTrader(traderId: string): AITraderInstance | undefined {
    return this.traders.get(traderId);
  }

  /**
   * 获取指定股票
   */
  public getStock(symbol: string): StockInstance | undefined {
    return this.stocks.get(symbol);
  }

  /**
   * 检查环境是否健康
   */
  public isHealthy(): boolean {
    return this.isActive && 
           this.traders.size > 0 && 
           this.stocks.size > 0 &&
           this.getActiveTraders().length > 0 &&
           this.getAvailableStocks().length > 0;
  }

  // ============================================================================
  // 时间模拟功能
  // ============================================================================

  /**
   * 获取默认交易区间配置
   */
  private getDefaultTradingIntervalConfig(): TradingIntervalConfig {
    return {
      nonTradingIntervals: [
        {
          name: '集合竞价',
          start: '09:15',
          end: '09:25',
          description: '开盘集合竞价时间，时间停止'
        },
        {
          name: '收盘集合竞价',
          start: '14:57',
          end: '15:00',
          description: '收盘集合竞价时间，时间停止'
        }
      ],
      tradingIntervals: [
        {
          name: '早盘',
          start: '09:30',
          end: '11:30',
          description: '上午交易时段，时间推进'
        },
        {
          name: '午盘',
          start: '13:00',
          end: '15:00',
          description: '下午交易时段，时间推进'
        }
      ]
    };
  }

  /**
   * 加载交易区间配置
   */
  private loadTradingIntervalConfig(): void {
    try {
      // 配置文件路径：server/trading-intervals.yml
      // 从 src/models/runtime/ 或 dist/server/src/models/runtime/ 向上找到 server 目录
      let configPath: string;
      if (__dirname.includes('dist')) {
        // 编译后的路径：dist/server/src/models/runtime/ -> ../../../../trading-intervals.yml
        configPath = path.join(__dirname, '../../../../trading-intervals.yml');
      } else {
        // 源码路径：src/models/runtime/ -> ../../trading-intervals.yml
        configPath = path.join(__dirname, '../../trading-intervals.yml');
      }
      
      if (fs.existsSync(configPath)) {
        const configContent = fs.readFileSync(configPath, 'utf-8');
        this.tradingIntervalConfig = yaml.load(configContent) as TradingIntervalConfig;
        console.log(`[ExchangeInstance] Trading interval config loaded from ${configPath}`);
      } else {
        console.warn(`[ExchangeInstance] Trading interval config file not found at ${configPath}, using defaults`);
        this.tradingIntervalConfig = this.getDefaultTradingIntervalConfig();
      }
    } catch (error) {
      console.warn('[ExchangeInstance] Failed to load trading interval config, using defaults:', error);
      this.tradingIntervalConfig = this.getDefaultTradingIntervalConfig();
    }
  }

  /**
   * 初始化游戏时间
   */
  private initializeSimulatedTime(): void {
    const initialTimeStr = process.env.EXCHANGE_INITIAL_TIME || '09:15';
    let [hours, minutes] = initialTimeStr.split(':').map(Number);
    
    // 验证时间格式
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.warn(`[ExchangeInstance] Invalid EXCHANGE_INITIAL_TIME format: ${initialTimeStr}, using default 09:15`);
      hours = 9;
      minutes = 15;
    }
    
    // 获取当前系统日期
    const today = new Date();
    const initialDate = new Date(today);
    initialDate.setHours(hours, minutes, 0, 0);
    
    // 如果当前时间已过初始时间，则使用下一个交易日
    if (today > initialDate) {
      initialDate.setDate(initialDate.getDate() + 1);
      // 确保是交易日（周一到周五）
      while (!this.isTradingDayInternal(initialDate)) {
        initialDate.setDate(initialDate.getDate() + 1);
      }
    } else {
      // 如果初始日期不是交易日，找到下一个交易日
      while (!this.isTradingDayInternal(initialDate)) {
        initialDate.setDate(initialDate.getDate() + 1);
      }
    }
    
    this.simulatedTime = initialDate;
    this.timeAcceleration = parseFloat(process.env.EXCHANGE_TIME_ACCELERATION || '1.0');
    
    // 验证加速倍数
    if (isNaN(this.timeAcceleration) || this.timeAcceleration < 0.1 || this.timeAcceleration > 1000) {
      console.warn(`[ExchangeInstance] Invalid EXCHANGE_TIME_ACCELERATION: ${process.env.EXCHANGE_TIME_ACCELERATION}, using default 1.0`);
      this.timeAcceleration = 1.0;
    }
  }

  /**
   * 更新模拟时间
   */
  private updateSimulatedTime(deltaTime: number): void {
    const elapsedMs = deltaTime * 1000 * this.timeAcceleration;
    this.simulatedTime = new Date(this.simulatedTime.getTime() + elapsedMs);
  }

  /**
   * 检查是否在交易区间（用于时间更新判断）
   * 只有在交易区间内才推进时间
   */
  private isInTradingIntervalForUpdate(): boolean {
    // 1. 检查是否为交易日
    if (!this.isTradingDayInternal(this.simulatedTime)) {
      return false;
    }
    
    // 2. 检查是否在交易时间或可配置的交易区间
    return this.isInTradingHoursInternal() || this.isInConfiguredTradingInterval();
  }

  /**
   * 检查指定日期是否为交易日（内部方法）
   * 默认规则：周一到周五为交易日
   */
  private isTradingDayInternal(date: Date): boolean {
    const dayOfWeek = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
    // 周一到周五：1-5
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  }

  /**
   * 检查是否在可配置的非交易区间
   */
  private isInConfiguredNonTradingInterval(): boolean {
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    for (const interval of this.tradingIntervalConfig.nonTradingIntervals) {
      const [startHour, startMinute] = interval.start.split(':').map(Number);
      const [endHour, endMinute] = interval.end.split(':').map(Number);
      const startValue = startHour * 60 + startMinute;
      const endValue = endHour * 60 + endMinute;
      
      // 检查时间是否在区间内（左闭右开）
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
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    for (const interval of this.tradingIntervalConfig.tradingIntervals) {
      const [startHour, startMinute] = interval.start.split(':').map(Number);
      const [endHour, endMinute] = interval.end.split(':').map(Number);
      const startValue = startHour * 60 + startMinute;
      const endValue = endHour * 60 + endMinute;
      
      // 检查时间是否在区间内（左闭右开）
      if (timeValue >= startValue && timeValue < endValue) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * 检查是否在交易时间（标准交易时间段，内部方法）
   */
  private isInTradingHoursInternal(): boolean {
    const hour = this.simulatedTime.getHours();
    const minute = this.simulatedTime.getMinutes();
    const timeValue = hour * 60 + minute;
    
    const morningStart = 9 * 60 + 30;   // 9:30
    const morningEnd = 11 * 60 + 30;     // 11:30
    const afternoonStart = 13 * 60;      // 13:00
    const afternoonEnd = 15 * 60;        // 15:00
    
    return (timeValue >= morningStart && timeValue <= morningEnd) ||
           (timeValue >= afternoonStart && timeValue <= afternoonEnd);
  }

  /**
   * 获取当前时间状态
   */
  public getTimeState(): TradingTimeState {
    // 1. 检查是否为交易日
    if (!this.isTradingDayInternal(this.simulatedTime)) {
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

  /**
   * 获取当前游戏时间
   */
  public getSimulatedTime(): Date {
    return new Date(this.simulatedTime);
  }

  /**
   * 检查是否在交易时间（标准交易时间段）
   */
  public isInTradingHours(): boolean {
    const state = this.getTimeState();
    return state === TradingTimeState.MORNING_SESSION || 
           state === TradingTimeState.AFTERNOON_SESSION;
  }

  /**
   * 检查是否在可交易区间（包括交易时间和可配置的交易区间）
   */
  public isInTradingInterval(): boolean {
    const state = this.getTimeState();
    // 交易时间或可配置的交易区间
    return this.isInTradingHours() || 
           state === TradingTimeState.CONFIGURED_NON_TRADING;
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
    return {
      state: this.getTimeState(),
      simulatedTime: this.getSimulatedTime(),
      isTradingDay: this.isTradingDay(),
      isInTradingHours: this.isInTradingHours(),
      isInTradingInterval: this.isInTradingInterval(),
      timeAcceleration: this.timeAcceleration
    };
  }

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

  /**
   * 获取下一个交易日
   */
  public getNextTradingDay(date?: Date): Date {
    const targetDate = date || this.simulatedTime;
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isTradingDayInternal(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  }

  /**
   * 获取上一个交易日
   */
  public getPreviousTradingDay(date?: Date): Date {
    const targetDate = date || this.simulatedTime;
    const prevDay = new Date(targetDate);
    prevDay.setDate(prevDay.getDate() - 1);
    
    while (!this.isTradingDayInternal(prevDay)) {
      prevDay.setDate(prevDay.getDate() - 1);
    }
    
    return prevDay;
  }
}