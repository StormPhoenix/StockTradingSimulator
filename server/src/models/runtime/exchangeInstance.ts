/**
 * 交易所运行时实例
 * 
 * 继承 GameObject，管理 AI 交易员和股票的运行时容器
 */

import { GameObject, GameObjectState } from '../../lifecycle/types';
import { AITraderInstance } from './aiTraderInstance';
import { StockInstance } from './stockInstance';

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
  }

  /**
   * GameObject 生命周期 - 开始播放
   */
  onBeginPlay(): void {
    this.isActive = true;
    this.lastActiveAt = new Date();
    
    console.log(`[ExchangeInstance] Exchange "${this.name}" (ID: ${this.id}) started with ${this.traders.size} traders and ${this.stocks.size} stocks`);
    
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
   * GameObject 生命周期 - 每帧更新
   */
  onTick(deltaTime: number): void {
    if (!this.isActive) {
      return;
    }

    this.lastActiveAt = new Date();

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
   * GameObject 生命周期 - 销毁
   */
  onDestroy(): void {
    this.isActive = false;
    
    console.log(`[ExchangeInstance] Exchange "${this.name}" (ID: ${this.id}) is being destroyed`);
    
    // 销毁所有交易员
    for (const trader of this.traders.values()) {
      trader.onDestroy();
    }
    
    // 销毁所有股票
    for (const stock of this.stocks.values()) {
      stock.onDestroy();
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
      trader.onDestroy();
      this.traders.delete(traderId);
      console.log(`[ExchangeInstance] Removed trader ${traderId} from exchange "${this.name}"`);
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
      stock.onDestroy();
      this.stocks.delete(stockSymbol);
      console.log(`[ExchangeInstance] Removed stock ${stockSymbol} from exchange "${this.name}"`);
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
   * 获取环境摘要信息
   */
  public getEnvironmentSummary(): {
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
      statistics: this.getEnvironmentSummary().statistics
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
}