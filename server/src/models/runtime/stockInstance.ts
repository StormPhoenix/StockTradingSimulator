/**
 * 股票运行时实例
 * 
 * 继承 GameObject，提供股票的静态信息和基础市场数据
 */

import { GameObject, GameObjectState } from '../../lifecycle/types';

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

  // 运行时状态（按要求保持静态）
  private currentPrice: number;
  private readonly createdAt: Date;
  private lastUpdateAt: Date;

  // 市场数据历史（简单存储）
  private priceHistory: Array<{ price: number; timestamp: Date }> = [];
  private readonly maxHistorySize: number = 100;

  constructor(
    id: number,
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
    // 初始化当前价格为发行价（静态，按要求不变动）
    this.currentPrice = this.issuePrice;
    this.lastUpdateAt = new Date();
    
    // 记录初始价格
    this.addPriceHistory(this.currentPrice);
    
    console.log(`[StockInstance] Stock ${this.symbol} (${this.companyName}) initialized at $${this.currentPrice.toFixed(2)}`);
  }

  /**
   * GameObject 生命周期 - 每帧更新
   */
  onTick(deltaTime: number): void {
    // 按照需求，股票价格保持静态，不进行价格波动
    // 这里可以添加一些基础的状态维护逻辑
    
    this.lastUpdateAt = new Date();
    
    // 可以在这里添加一些市场统计信息的更新
    // 但价格本身保持不变
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
      createdAt: this.createdAt.toISOString(),
      lastUpdateAt: this.lastUpdateAt.toISOString()
    };
  }
}