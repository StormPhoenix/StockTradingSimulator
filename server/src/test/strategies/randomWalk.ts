/**
 * Random Walk Data Generation Strategy
 * 随机游走数据生成策略
 *
 * 实现对数正态随机游走模型，用于生成符合股票价格特征的测试数据
 *
 * @feature 008-time-series-aggregation
 * @author System
 * @since 2026-01-27
 */

/**
 * 随机游走策略配置
 */
export interface RandomWalkConfig {
  /** 波动率（标准差），默认 1% (0.01) */
  volatility?: number;
  /** 基础成交量，默认 1000 */
  baseVolume?: number;
  /** 成交量波动率，默认 50% (0.5) */
  volumeVolatility?: number;
  /** 随机数种子（可选，用于可重复测试） */
  seed?: number;
}

/**
 * 随机游走策略类
 */
export class RandomWalkStrategy {
  /** 配置参数 */
  private config: {
    volatility: number;
    baseVolume: number;
    volumeVolatility: number;
  };

  constructor(config: RandomWalkConfig = {}) {
    this.config = {
      volatility: config.volatility ?? 0.01,       // 1% 波动率
      baseVolume: config.baseVolume ?? 1000,       // 基础成交量 1000
      volumeVolatility: config.volumeVolatility ?? 0.5, // 50% 成交量波动
    };
  }

  /**
   * 生成下一个价格（随机游走）
   *
   * 公式: new_price = old_price * exp((drift - 0.5 * volatility^2) * dt + volatility * sqrt(dt) * random_normal)
   * 简化版本: new_price = old_price * (1 + volatility * random_normal)
   *
   * @param previousPrice - 前一个价格
   * @returns 新价格
   */
  generatePrice(previousPrice: number): number {
    const randomNormal = this.generateNormalRandom();
    const change = this.config.volatility * randomNormal;
    return previousPrice * (1 + change);
  }

  /**
   * 生成成交量
   *
   * @returns 成交量（整数）
   */
  generateVolume(): number {
    const randomNormal = this.generateNormalRandom();
    const change = this.config.volumeVolatility * randomNormal;
    const volume = this.config.baseVolume * (1 + change);
    return Math.max(1, Math.floor(volume)); // 至少 1 手
  }

  /**
   * 生成正态分布随机数（Box-Muller 变换）
   *
   * @returns 均值为 0、标准差为 1 的正态随机数
   */
  private generateNormalRandom(): number {
    // Box-Muller 变换
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    return z0;
  }

  /**
   * 生成多个连续价格
   *
   * @param initialPrice - 初始价格
   * @param count - 生成数量
   * @returns 价格数组
   */
  generatePriceSeries(initialPrice: number, count: number): number[] {
    const prices: number[] = [initialPrice];
    for (let i = 1; i < count; i++) {
      const newPrice = this.generatePrice(prices[i - 1]);
      prices.push(Math.max(0.01, newPrice)); // 价格至少为 0.01
    }
    return prices;
  }

  /**
   * 生成多个成交量
   *
   * @param count - 生成数量
   * @returns 成交量数组
   */
  generateVolumeSeries(count: number): number[] {
    const volumes: number[] = [];
    for (let i = 0; i < count; i++) {
      volumes.push(this.generateVolume());
    }
    return volumes;
  }
}
