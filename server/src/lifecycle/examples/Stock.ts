import { GameObject, GameObjectState } from '../types';

/**
 * 股票对象示例类
 * 
 * 演示如何实现 GameObject 接口来创建股票业务对象
 * 模拟股票的行为：价格波动、交易量变化、市场事件响应等
 */
export class Stock implements GameObject {
  readonly id: number;
  state: GameObjectState = GameObjectState.READY;
  
  private symbol: string;
  private name: string;
  private price: number;
  private previousPrice: number;
  private volume: number = 0;
  private marketCap: number;
  private tickCount: number = 0;
  private priceHistory: number[] = [];
  private volatility: number;
  private trend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  private lastUpdateTime: number = 0;
  private isTrading: boolean = false;

  constructor(
    id: number, 
    symbol: string, 
    name: string, 
    initialPrice: number, 
    marketCap: number,
    volatility: number = 0.02
  ) {
    this.id = id;
    this.symbol = symbol.toUpperCase();
    this.name = name;
    this.price = initialPrice;
    this.previousPrice = initialPrice;
    this.marketCap = marketCap;
    this.volatility = Math.max(0.001, Math.min(0.1, volatility)); // 限制波动率在 0.1% - 10%
  }

  /**
   * 对象激活时调用
   * 初始化股票交易和价格监控
   */
  onBeginPlay(): void {
    console.log(`📊 Stock ${this.symbol} (${this.name}) started trading at $${this.price.toFixed(2)}`);
    console.log(`   Market Cap: $${this.formatMarketCap()}, Volatility: ${(this.volatility * 100).toFixed(2)}%`);
    
    this.isTrading = true;
    this.lastUpdateTime = Date.now();
    this.priceHistory.push(this.price);
    
    // 根据市值和符号确定初始趋势
    this.initializeTrend();
  }

  /**
   * 每帧更新时调用
   * 更新股票价格、交易量和市场数据
   * 
   * @param deltaTime 距离上次 tick 的时间间隔（秒）
   */
  onTick(deltaTime: number): void {
    if (!this.isTrading) return;

    this.tickCount++;
    const currentTime = Date.now();

    // 更新股票价格
    this.updatePrice(deltaTime);
    
    // 更新交易量
    this.updateVolume();
    
    // 检查趋势变化
    if (this.tickCount % 50 === 0) { // 每50个tick检查一次趋势
      this.updateTrend();
    }

    // 记录价格历史
    if (this.tickCount % 10 === 0) { // 每10个tick记录一次价格
      this.recordPriceHistory();
    }

    // 每200个tick输出一次状态信息
    if (this.tickCount % 200 === 0) {
      this.logMarketStatus();
    }

    // 模拟市场事件
    if (Math.random() < 0.001) { // 0.1% 概率发生市场事件
      this.triggerMarketEvent();
    }

    this.lastUpdateTime = currentTime;
  }

  /**
   * 对象销毁时调用
   * 停止交易，保存历史数据
   */
  onDestroy(): void {
    console.log(`📊 Stock ${this.symbol} stopped trading after ${this.tickCount} ticks`);
    console.log(`   Final price: $${this.price.toFixed(2)} (${this.getPriceChangePercent().toFixed(2)}%)`);
    console.log(`   Total volume: ${this.volume.toLocaleString()}`);
    console.log(`   Price range: $${Math.min(...this.priceHistory).toFixed(2)} - $${Math.max(...this.priceHistory).toFixed(2)}`);
    
    this.isTrading = false;
    this.priceHistory = [];
  }

  /**
   * 初始化股票趋势
   */
  private initializeTrend(): void {
    // 大市值股票倾向于更稳定
    if (this.marketCap > 100000000000) { // 1000亿以上
      this.trend = Math.random() > 0.6 ? 'bullish' : 'neutral';
    } else if (this.marketCap > 10000000000) { // 100亿以上
      this.trend = Math.random() > 0.4 ? 'bullish' : 'bearish';
    } else { // 小市值股票波动更大
      const rand = Math.random();
      this.trend = rand > 0.6 ? 'bullish' : rand > 0.3 ? 'bearish' : 'neutral';
    }
  }

  /**
   * 更新股票价格
   */
  private updatePrice(deltaTime: number): void {
    this.previousPrice = this.price;
    
    // 基础随机波动
    const randomChange = (Math.random() - 0.5) * 2 * this.volatility;
    
    // 趋势影响
    let trendInfluence = 0;
    switch (this.trend) {
      case 'bullish':
        trendInfluence = 0.001; // 0.1% 上涨倾向
        break;
      case 'bearish':
        trendInfluence = -0.001; // 0.1% 下跌倾向
        break;
      case 'neutral':
        trendInfluence = 0;
        break;
    }
    
    // 均值回归效应（防止价格偏离太远）
    const initialPrice = this.priceHistory[0] || this.price;
    const deviation = (this.price - initialPrice) / initialPrice;
    const meanReversion = -deviation * 0.001; // 轻微的均值回归
    
    // 计算总的价格变化
    const totalChange = randomChange + trendInfluence + meanReversion;
    
    // 应用价格变化
    this.price = Math.max(0.01, this.price * (1 + totalChange));
    
    // 更新市值
    this.updateMarketCap();
  }

  /**
   * 更新交易量
   */
  private updateVolume(): void {
    // 价格变化越大，交易量越大
    const priceChangePercent = Math.abs(this.getPriceChangePercent());
    const baseVolume = this.marketCap / this.price / 1000; // 基础交易量
    const volumeMultiplier = 1 + priceChangePercent / 100; // 价格变化影响交易量
    
    const randomVolume = Math.random() * baseVolume * volumeMultiplier;
    this.volume += Math.floor(randomVolume);
  }

  /**
   * 更新市值
   */
  private updateMarketCap(): void {
    // 简化模型：假设流通股数不变，市值随价格变化
    const priceChange = this.price / (this.priceHistory[0] || this.price);
    this.marketCap = this.marketCap * priceChange;
  }

  /**
   * 更新趋势
   */
  private updateTrend(): void {
    if (this.priceHistory.length < 20) return;
    
    // 分析最近20个价格点的趋势
    const recentPrices = this.priceHistory.slice(-20);
    const firstPrice = recentPrices[0];
    const lastPrice = recentPrices[recentPrices.length - 1];
    const changePercent = (lastPrice - firstPrice) / firstPrice;
    
    if (changePercent > 0.02) { // 上涨超过2%
      this.trend = 'bullish';
    } else if (changePercent < -0.02) { // 下跌超过2%
      this.trend = 'bearish';
    } else {
      this.trend = 'neutral';
    }
  }

  /**
   * 记录价格历史
   */
  private recordPriceHistory(): void {
    this.priceHistory.push(this.price);
    
    // 只保留最近1000个价格点
    if (this.priceHistory.length > 1000) {
      this.priceHistory = this.priceHistory.slice(-1000);
    }
  }

  /**
   * 触发市场事件
   */
  private triggerMarketEvent(): void {
    const events = [
      { name: 'Earnings Beat', impact: 0.05 },
      { name: 'Earnings Miss', impact: -0.03 },
      { name: 'Analyst Upgrade', impact: 0.02 },
      { name: 'Analyst Downgrade', impact: -0.02 },
      { name: 'Market News', impact: (Math.random() - 0.5) * 0.04 },
      { name: 'Sector Rotation', impact: (Math.random() - 0.5) * 0.03 }
    ];
    
    const event = events[Math.floor(Math.random() * events.length)];
    const oldPrice = this.price;
    this.price = Math.max(0.01, this.price * (1 + event.impact));
    
    console.log(`📰 Market Event for ${this.symbol}: ${event.name} - Price: $${oldPrice.toFixed(2)} → $${this.price.toFixed(2)} (${(event.impact * 100).toFixed(2)}%)`);
  }

  /**
   * 记录市场状态
   */
  private logMarketStatus(): void {
    const changePercent = this.getPriceChangePercent();
    const trendIcon = this.trend === 'bullish' ? '📈' : this.trend === 'bearish' ? '📉' : '➡️';
    
    console.log(`${trendIcon} ${this.symbol}: $${this.price.toFixed(2)} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%) | Volume: ${this.volume.toLocaleString()} | Trend: ${this.trend}`);
  }

  /**
   * 获取价格变化百分比
   */
  private getPriceChangePercent(): number {
    const initialPrice = this.priceHistory[0] || this.price;
    return ((this.price - initialPrice) / initialPrice) * 100;
  }

  /**
   * 格式化市值显示
   */
  private formatMarketCap(): string {
    if (this.marketCap >= 1000000000000) {
      return `$${(this.marketCap / 1000000000000).toFixed(2)}T`;
    } else if (this.marketCap >= 1000000000) {
      return `$${(this.marketCap / 1000000000).toFixed(2)}B`;
    } else if (this.marketCap >= 1000000) {
      return `$${(this.marketCap / 1000000).toFixed(2)}M`;
    } else {
      return `$${this.marketCap.toFixed(0)}`;
    }
  }

  // 公共方法，用于外部查询

  /**
   * 获取股票代码
   */
  getSymbol(): string {
    return this.symbol;
  }

  /**
   * 获取公司名称
   */
  getName(): string {
    return this.name;
  }

  /**
   * 获取当前价格
   */
  getPrice(): number {
    return this.price;
  }

  /**
   * 获取前一个价格
   */
  getPreviousPrice(): number {
    return this.previousPrice;
  }

  /**
   * 获取交易量
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * 获取市值
   */
  getMarketCap(): number {
    return this.marketCap;
  }

  /**
   * 获取波动率
   */
  getVolatility(): number {
    return this.volatility;
  }

  /**
   * 获取当前趋势
   */
  getTrend(): 'bullish' | 'bearish' | 'neutral' {
    return this.trend;
  }

  /**
   * 获取价格历史
   */
  getPriceHistory(): number[] {
    return [...this.priceHistory];
  }

  /**
   * 获取 tick 计数
   */
  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * 检查是否在交易
   */
  isTradingActive(): boolean {
    return this.isTrading;
  }

  /**
   * 获取股票摘要信息
   */
  getSummary(): {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    volume: number;
    marketCap: string;
    trend: string;
  } {
    return {
      symbol: this.symbol,
      name: this.name,
      price: this.price,
      change: this.price - this.previousPrice,
      changePercent: this.getPriceChangePercent(),
      volume: this.volume,
      marketCap: this.formatMarketCap(),
      trend: this.trend
    };
  }

  /**
   * 获取技术指标
   */
  getTechnicalIndicators(): {
    sma20: number | null; // 20期简单移动平均
    volatility: number;
    priceRange: { min: number; max: number };
    trend: string;
  } {
    let sma20 = null;
    
    if (this.priceHistory.length >= 20) {
      const recent20 = this.priceHistory.slice(-20);
      sma20 = recent20.reduce((sum, price) => sum + price, 0) / 20;
    }
    
    const priceRange = {
      min: Math.min(...this.priceHistory),
      max: Math.max(...this.priceHistory)
    };
    
    return {
      sma20,
      volatility: this.volatility,
      priceRange,
      trend: this.trend
    };
  }
}