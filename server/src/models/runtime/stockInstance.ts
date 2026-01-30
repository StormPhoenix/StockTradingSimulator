/**
 * 股票运行时实例
 * 
 * 继承 GameObject，提供股票的静态信息和基础市场数据
 */

import { GameObject, GameObjectState } from '../../lifecycle/types';
import { ExchangeInstance } from './exchangeInstance';
import { TimeSeriesManager, DataType, Metric, MissingDataStrategy } from '../../types/timeSeries';

/**
 * 股票信息接口
 */
export interface StockInfo {
  symbol: string;
  companyName: string;
  category: string;
  currentPrice: number;
  marketCap: number;
  totalShares: number;
  issuePrice: number;
}

/**
 * 股票实例类
 */
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

  // 运行时状态
  private currentPrice: number;
  private readonly createdAt: Date;
  private lastUpdateAt: Date;

  // 交易所和时间序列管理器引用
  private readonly exchangeInstance: ExchangeInstance;
  private readonly timeSeriesManager: TimeSeriesManager;
  private readonly priceSeriesId: string;
  private readonly volumeSeriesId: string;

  // 股价模拟相关（固定值）
  private readonly priceVolatility: number = 0.01;       // 价格波动率 1%
  private readonly baseVolume: number = 1000;            // 基础成交量
  private readonly volumeVolatility: number = 0.5;       // 成交量波动率 50%

  // 数据写入频率控制（基于游戏时间）
  private lastPriceUpdateGameTime: number = 0;           // 上次价格更新的游戏时间（毫秒）
  private readonly priceUpdateInterval: number = 1000;    // 价格更新间隔（游戏时间毫秒，默认1秒）

  // 市场数据历史（简单存储）
  private priceHistory: Array<{ price: number; timestamp: Date }> = [];
  private readonly maxHistorySize: number = 100;

  constructor(
    id: number,
    exchangeInstance: ExchangeInstance,
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

  /**
   * GameObject 生命周期 - 开始播放
   */
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

  /**
   * GameObject 生命周期 - 每帧更新
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  /**
   * GameObject 生命周期 - 销毁
   */
  onDestroy(): void {
    console.log(`[StockInstance] Stock ${this.symbol} (${this.companyName}) destroyed`);
    
    // 清理价格历史
    this.priceHistory = [];
  }

  /**
   * 获取当前价格
   */
  public getCurrentPrice(): number {
    return this.currentPrice;
  }

  /**
   * 获取市值
   */
  public getMarketCap(): number {
    return this.currentPrice * this.totalShares;
  }

  /**
   * 获取股票信息
   */
  public getStockInfo(): StockInfo {
    return {
      symbol: this.symbol,
      companyName: this.companyName,
      category: this.category,
      currentPrice: this.currentPrice,
      marketCap: this.getMarketCap(),
      totalShares: this.totalShares,
      issuePrice: this.issuePrice
    };
  }

  /**
   * 获取价格变化百分比（相对于发行价）
   */
  public getPriceChangePercentage(): number {
    return ((this.currentPrice - this.issuePrice) / this.issuePrice) * 100;
  }

  /**
   * 获取价格历史
   */
  public getPriceHistory(): Array<{ price: number; timestamp: Date }> {
    return [...this.priceHistory]; // 返回副本
  }

  /**
   * 添加价格历史记录
   */
  private addPriceHistory(price: number): void {
    this.priceHistory.push({
      price,
      timestamp: new Date()
    });

    // 保持历史记录大小限制
    if (this.priceHistory.length > this.maxHistorySize) {
      this.priceHistory.splice(0, this.priceHistory.length - this.maxHistorySize);
    }
  }

  /**
   * 获取股票统计信息
   */
  public getStatistics(): {
    symbol: string;
    companyName: string;
    category: string;
    currentPrice: number;
    issuePrice: number;
    priceChange: number;
    priceChangePercentage: number;
    marketCap: number;
    totalShares: number;
    createdAt: Date;
    lastUpdateAt: Date;
    dataPoints: number;
  } {
    const priceChange = this.currentPrice - this.issuePrice;
    
    return {
      symbol: this.symbol,
      companyName: this.companyName,
      category: this.category,
      currentPrice: this.currentPrice,
      issuePrice: this.issuePrice,
      priceChange,
      priceChangePercentage: this.getPriceChangePercentage(),
      marketCap: this.getMarketCap(),
      totalShares: this.totalShares,
      createdAt: this.createdAt,
      lastUpdateAt: this.lastUpdateAt,
      dataPoints: this.priceHistory.length
    };
  }

  /**
   * 获取基础市场数据
   */
  public getMarketData(): {
    symbol: string;
    price: number;
    volume: number; // 模拟交易量
    high: number;   // 模拟最高价
    low: number;    // 模拟最低价
    open: number;   // 模拟开盘价
    close: number;  // 模拟收盘价
    timestamp: Date;
  } {
    // 由于价格静态，这些值都基于当前价格生成
    const basePrice = this.currentPrice;
    
    return {
      symbol: this.symbol,
      price: basePrice,
      volume: Math.floor(Math.random() * 1000000) + 100000, // 模拟交易量
      high: basePrice * (1 + Math.random() * 0.02), // 模拟最高价（+0-2%）
      low: basePrice * (1 - Math.random() * 0.02),  // 模拟最低价（-0-2%）
      open: basePrice,  // 开盘价等于当前价
      close: basePrice, // 收盘价等于当前价
      timestamp: this.lastUpdateAt
    };
  }

  /**
   * 获取股票详细信息（用于导出）
   */
  public getDetailedInfo(): {
    basic: StockInfo;
    statistics: ReturnType<StockInstance['getStatistics']>;
    marketData: ReturnType<StockInstance['getMarketData']>;
    priceHistory: Array<{ price: number; timestamp: Date }>;
  } {
    return {
      basic: this.getStockInfo(),
      statistics: this.getStatistics(),
      marketData: this.getMarketData(),
      priceHistory: this.getPriceHistory()
    };
  }

  /**
   * 检查股票是否有效
   */
  public isValid(): boolean {
    return this.symbol.length > 0 &&
           this.companyName.length > 0 &&
           this.currentPrice > 0 &&
           this.totalShares > 0 &&
           this.issuePrice > 0;
  }

  /**
   * 获取股票显示名称
   */
  public getDisplayName(): string {
    return `${this.symbol} - ${this.companyName}`;
  }

  /**
   * 获取股票简短描述
   */
  public getDescription(): string {
    return `${this.companyName} (${this.symbol}) - ${this.category} sector stock trading at $${this.currentPrice.toFixed(2)}`;
  }

  /**
   * 比较两个股票实例
   */
  public equals(other: StockInstance): boolean {
    return this.id === other.id && this.symbol === other.symbol;
  }

  /**
   * 获取股票的哈希值（用于去重等）
   */
  public getHash(): string {
    return `${this.symbol}_${this.id}`;
  }

  /**
   * 当日涨幅（百分比）：(当前价 - 发行价) / 发行价 * 100
   * 由 StockInstance 计算，Controller 仅负责获取。
   */
  public getDailyChangePercent(): number {
    if (this.issuePrice === 0) return 0;
    return ((this.currentPrice - this.issuePrice) / this.issuePrice) * 100;
  }

  /**
   * 转换为 JSON 对象（用于序列化）
   */
  public toJSON(): {
    id: number;
    templateId: string;
    symbol: string;
    companyName: string;
    category: string;
    currentPrice: number;
    issuePrice: number;
    totalShares: number;
    marketCap: number;
    dailyChangePercent: number;
    createdAt: string;
    lastUpdateAt: string;
  } {
    return {
      id: this.id,
      templateId: this.templateId,
      symbol: this.symbol,
      companyName: this.companyName,
      category: this.category,
      currentPrice: this.currentPrice,
      issuePrice: this.issuePrice,
      totalShares: this.totalShares,
      marketCap: this.getMarketCap(),
      dailyChangePercent: this.getDailyChangePercent(),
      createdAt: this.createdAt.toISOString(),
      lastUpdateAt: this.lastUpdateAt.toISOString()
    };
  }

  // ============================================================================
  // 价格模拟相关方法
  // ============================================================================

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
}