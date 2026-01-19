import { GameObject, GameObjectState } from '../types';

/**
 * AI 交易者示例类
 * 
 * 演示如何实现 GameObject 接口来创建业务对象
 * 模拟 AI 交易者的行为：策略执行、交易决策、资金管理等
 */
export class AITrader implements GameObject {
  readonly id: number;
  state: GameObjectState = GameObjectState.READY;
  
  private strategy: string;
  private capital: number;
  private portfolio: Map<string, number> = new Map(); // 股票代码 -> 持仓数量
  private tickCount: number = 0;
  private lastTradeTime: number = 0;
  private tradeInterval: number; // 交易间隔（毫秒）
  private isActive: boolean = false;

  constructor(id: number, strategy: string, capital: number, tradeIntervalMs: number = 5000) {
    this.id = id;
    this.strategy = strategy;
    this.capital = capital;
    this.tradeInterval = tradeIntervalMs;
  }

  /**
   * 对象激活时调用
   * 初始化交易策略和相关资源
   */
  onBeginPlay(): void {
    console.log(`🤖 AI Trader ${this.id} started with strategy: ${this.strategy}, capital: $${this.capital}`);
    this.isActive = true;
    this.lastTradeTime = Date.now();
    
    // 根据策略初始化不同的参数
    switch (this.strategy.toLowerCase()) {
      case 'aggressive':
        this.tradeInterval = 2000; // 2秒交易一次
        break;
      case 'conservative':
        this.tradeInterval = 10000; // 10秒交易一次
        break;
      case 'balanced':
        this.tradeInterval = 5000; // 5秒交易一次
        break;
      default:
        this.tradeInterval = 5000;
    }
  }

  /**
   * 每帧更新时调用
   * 执行交易逻辑和策略决策
   * 
   * @param deltaTime 距离上次 tick 的时间间隔（秒）
   */
  onTick(deltaTime: number): void {
    if (!this.isActive) return;

    this.tickCount++;
    const currentTime = Date.now();

    // 每隔一定时间执行一次交易决策
    if (currentTime - this.lastTradeTime >= this.tradeInterval) {
      this.executeTradeLogic();
      this.lastTradeTime = currentTime;
    }

    // 每100个tick输出一次状态信息
    if (this.tickCount % 100 === 0) {
      this.logStatus();
    }
  }

  /**
   * 对象销毁时调用
   * 清理资源，保存交易记录等
   */
  onDestroy(): void {
    console.log(`🤖 AI Trader ${this.id} destroyed after ${this.tickCount} ticks`);
    console.log(`   Final capital: $${this.capital.toFixed(2)}`);
    console.log(`   Portfolio: ${this.getPortfolioSummary()}`);
    
    this.isActive = false;
    this.portfolio.clear();
  }

  /**
   * 执行交易逻辑
   * 根据策略做出买入/卖出决策
   */
  private executeTradeLogic(): void {
    // 模拟市场数据获取
    const availableStocks = ['AAPL', 'GOOGL', 'MSFT', 'TSLA', 'AMZN'];
    const randomStock = availableStocks[Math.floor(Math.random() * availableStocks.length)];
    const stockPrice = this.getSimulatedStockPrice(randomStock);

    // 根据策略执行不同的交易逻辑
    switch (this.strategy.toLowerCase()) {
      case 'aggressive':
        this.executeAggressiveStrategy(randomStock, stockPrice);
        break;
      case 'conservative':
        this.executeConservativeStrategy(randomStock, stockPrice);
        break;
      case 'balanced':
        this.executeBalancedStrategy(randomStock, stockPrice);
        break;
    }
  }

  /**
   * 激进策略：频繁交易，高风险高收益
   */
  private executeAggressiveStrategy(stock: string, price: number): void {
    const action = Math.random() > 0.5 ? 'buy' : 'sell';
    const amount = Math.floor(this.capital * 0.1 / price); // 使用10%资金

    if (action === 'buy' && amount > 0 && this.capital >= amount * price) {
      this.buyStock(stock, amount, price);
    } else if (action === 'sell' && this.portfolio.has(stock)) {
      const holdings = this.portfolio.get(stock) || 0;
      const sellAmount = Math.min(holdings, Math.floor(holdings * 0.5));
      if (sellAmount > 0) {
        this.sellStock(stock, sellAmount, price);
      }
    }
  }

  /**
   * 保守策略：谨慎交易，注重风险控制
   */
  private executeConservativeStrategy(stock: string, price: number): void {
    // 只有在价格较低时才买入
    if (Math.random() > 0.7) { // 30% 概率交易
      const amount = Math.floor(this.capital * 0.05 / price); // 使用5%资金
      
      if (amount > 0 && this.capital >= amount * price) {
        this.buyStock(stock, amount, price);
      }
    }
  }

  /**
   * 平衡策略：中等频率交易，平衡风险和收益
   */
  private executeBalancedStrategy(stock: string, price: number): void {
    const action = Math.random() > 0.6 ? 'buy' : 'sell';
    
    if (action === 'buy') {
      const amount = Math.floor(this.capital * 0.08 / price); // 使用8%资金
      if (amount > 0 && this.capital >= amount * price) {
        this.buyStock(stock, amount, price);
      }
    } else if (this.portfolio.has(stock)) {
      const holdings = this.portfolio.get(stock) || 0;
      const sellAmount = Math.floor(holdings * 0.3);
      if (sellAmount > 0) {
        this.sellStock(stock, sellAmount, price);
      }
    }
  }

  /**
   * 买入股票
   */
  private buyStock(stock: string, amount: number, price: number): void {
    const cost = amount * price;
    if (this.capital >= cost) {
      this.capital -= cost;
      const currentHoldings = this.portfolio.get(stock) || 0;
      this.portfolio.set(stock, currentHoldings + amount);
      
      console.log(`📈 Trader ${this.id} bought ${amount} shares of ${stock} at $${price.toFixed(2)} (Cost: $${cost.toFixed(2)})`);
    }
  }

  /**
   * 卖出股票
   */
  private sellStock(stock: string, amount: number, price: number): void {
    const currentHoldings = this.portfolio.get(stock) || 0;
    if (currentHoldings >= amount) {
      const revenue = amount * price;
      this.capital += revenue;
      
      const newHoldings = currentHoldings - amount;
      if (newHoldings === 0) {
        this.portfolio.delete(stock);
      } else {
        this.portfolio.set(stock, newHoldings);
      }
      
      console.log(`📉 Trader ${this.id} sold ${amount} shares of ${stock} at $${price.toFixed(2)} (Revenue: $${revenue.toFixed(2)})`);
    }
  }

  /**
   * 获取模拟股票价格
   */
  private getSimulatedStockPrice(stock: string): number {
    // 简单的价格模拟，基于股票代码生成相对稳定的价格
    const basePrice = stock.length * 20 + Math.abs(stock.charCodeAt(0) - 65) * 5;
    const volatility = (Math.random() - 0.5) * 0.1; // ±5% 波动
    return basePrice * (1 + volatility);
  }

  /**
   * 记录状态信息
   */
  private logStatus(): void {
    const portfolioValue = this.calculatePortfolioValue();
    const totalValue = this.capital + portfolioValue;
    
    console.log(`💰 Trader ${this.id} Status - Capital: $${this.capital.toFixed(2)}, Portfolio: $${portfolioValue.toFixed(2)}, Total: $${totalValue.toFixed(2)}`);
  }

  /**
   * 计算投资组合价值
   */
  private calculatePortfolioValue(): number {
    let totalValue = 0;
    for (const [stock, amount] of this.portfolio) {
      const currentPrice = this.getSimulatedStockPrice(stock);
      totalValue += amount * currentPrice;
    }
    return totalValue;
  }

  /**
   * 获取投资组合摘要
   */
  private getPortfolioSummary(): string {
    if (this.portfolio.size === 0) {
      return 'Empty';
    }
    
    const holdings = Array.from(this.portfolio.entries())
      .map(([stock, amount]) => `${stock}:${amount}`)
      .join(', ');
    
    return holdings;
  }

  // 公共方法，用于外部查询
  
  /**
   * 获取交易者策略
   */
  getStrategy(): string {
    return this.strategy;
  }

  /**
   * 获取当前资金
   */
  getCapital(): number {
    return this.capital;
  }

  /**
   * 获取投资组合
   */
  getPortfolio(): Map<string, number> {
    return new Map(this.portfolio);
  }

  /**
   * 获取总资产价值
   */
  getTotalValue(): number {
    return this.capital + this.calculatePortfolioValue();
  }

  /**
   * 获取 tick 计数
   */
  getTickCount(): number {
    return this.tickCount;
  }

  /**
   * 检查是否活跃
   */
  isTraderActive(): boolean {
    return this.isActive;
  }
}