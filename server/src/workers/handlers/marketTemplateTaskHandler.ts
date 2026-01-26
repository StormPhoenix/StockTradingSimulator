/**
 * 市场模板任务处理器
 * 
 * 处理市场模板相关的具体业务逻辑
 * 从 MongoDB 数据库中加载真实的市场模板数据
 */

import mongoose from 'mongoose';
import {
  GenericTaskRequest,
  TaskHandler,
  TaskType
} from '../types/worker/genericTask';
import {
  MarketTemplateRequest,
  MarketTemplateResponse,
  ExchangeTemplate,
  TraderTemplate,
  StockTemplate,
  MarketTemplateStage
} from '../types/business/marketTemplate';
import {
  sendProgress,
  sendError,
  createTaskErrorFromError
} from '../utils/workerUtils';

// 导入数据库模型
import MarketEnvironment from '../../models/marketTemplate';
import type { IMarketTemplateDocument } from '../../models/marketTemplate';

/**
 * 市场模板任务处理器
 */
export class MarketTemplateTaskHandler implements TaskHandler<MarketTemplateRequest, MarketTemplateResponse> {
  public readonly taskType = TaskType.CREATE_MARKET_INSTANCE;

  private isConnected = false;
  private cachedMarketTemplate: IMarketTemplateDocument | null = null;

  /**
   * 处理市场模板任务
   */
  public async handleTask(request: GenericTaskRequest<MarketTemplateRequest>): Promise<MarketTemplateResponse> {
    const { taskId, payload } = request;
    const { templateId, userId } = payload;

    console.log(`Processing market template task: ${taskId} for template: ${templateId}`);

    try {
      // 发送初始进度
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 0, 'Connecting to database...');

      // 连接数据库
      await this.connectToDatabase();
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 10, 'Database connected, loading market template...');

      // 加载市场模板数据
      await this.loadMarketTemplate(templateId);
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 20, 'Market template loaded');

      // 读取交易所模板
      const exchange = await this.readExchangeTemplate(templateId);
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 30, 'Exchange template loaded');

      // 读取交易员模板
      const traders = await this.readTraderTemplates(templateId);
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 60, `${traders.length} trader templates loaded`);

      // 读取股票模板
      const stocks = await this.readStockTemplates(templateId);
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATABASE_READING, 90, `${stocks.length} stock templates loaded`);

      // 数据处理阶段
      sendProgress(taskId, this.taskType, MarketTemplateStage.DATA_PROCESSING, 95, 'Processing template data...');

      // 验证数据完整性
      await this.validateTemplateData(exchange, traders, stocks);

      // 发送完成进度
      sendProgress(taskId, this.taskType, MarketTemplateStage.COMPLETE, 100, 'Template data ready', {
        totalTraders: traders.length,
        processedTraders: traders.length,
        totalStocks: stocks.length,
        processedStocks: stocks.length
      });

      console.log(`Market template task completed: ${taskId}`);

      return {
        type: this.taskType as TaskType.CREATE_MARKET_INSTANCE,
        exchange,
        traders,
        stocks
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error(`Market template task failed: ${taskId}`, error);

      sendError(taskId, this.taskType, createTaskErrorFromError(
        error instanceof Error ? error : new Error(errorMessage),
        'MARKET_TEMPLATE_ERROR',
        { templateId, userId }
      ));

      throw error;
    }
  }

  /**
   * 加载市场模板数据
   */
  private async loadMarketTemplate(templateId: string): Promise<void> {
    console.log(`Loading market template: ${templateId}`);

    try {
      // 从数据库读取市场模板
      this.cachedMarketTemplate = await MarketEnvironment.findById(templateId);
      
      if (!this.cachedMarketTemplate) {
        throw new Error(`Market template not found: ${templateId}`);
      }

      console.log(`Market template loaded: ${this.cachedMarketTemplate.name || templateId}`);
      console.log(`- Traders: ${this.cachedMarketTemplate.traders.length}`);
      console.log(`- Stocks: ${this.cachedMarketTemplate.stocks.length}`);
    } catch (error) {
      console.error(`Failed to load market template ${templateId}:`, error);
      throw new Error(`Failed to load market template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 连接到数据库
   */
  private async connectToDatabase(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      const mongoUri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=${process.env.MONGODB_AUTH_SOURCE}`;

      await mongoose.connect(mongoUri);
      this.isConnected = true;
      console.log('Worker database connection established');
    } catch (error) {
      throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 读取交易所模板
   */
  private async readExchangeTemplate(templateId: string): Promise<ExchangeTemplate> {
    console.log(`Reading exchange template: ${templateId}`);

    if (!this.cachedMarketTemplate) {
      throw new Error('Market template not loaded');
    }

    // 转换为 ExchangeTemplate 格式
    return {
      _id: this.cachedMarketTemplate._id.toString(),
      name: this.cachedMarketTemplate.name || `Market Template ${templateId}`,
      description: this.cachedMarketTemplate.description || `Market environment template ${templateId}`,
      createdAt: this.cachedMarketTemplate.createdAt,
      updatedAt: this.cachedMarketTemplate.updatedAt
    };
  }

  /**
   * 读取交易员模板
   */
  private async readTraderTemplates(templateId: string): Promise<TraderTemplate[]> {
    console.log(`Reading trader templates for: ${templateId}`);

    if (!this.cachedMarketTemplate) {
      throw new Error('Market template not loaded');
    }

    const traders: TraderTemplate[] = [];

    // 转换交易员数据
    for (let i = 0; i < this.cachedMarketTemplate.traders.length; i++) {
      const traderData = this.cachedMarketTemplate.traders[i];
      
      traders.push({
        _id: traderData.id,
        name: traderData.name,
        riskProfile: traderData.riskProfile,
        initialCapital: traderData.initialCapital,
        createdAt: traderData.createdAt
      });
    }

    console.log(`Loaded ${traders.length} trader templates from database`);
    return traders;
  }

  /**
   * 读取股票模板
   */
  private async readStockTemplates(templateId: string): Promise<StockTemplate[]> {
    console.log(`Reading stock templates for: ${templateId}`);

    if (!this.cachedMarketTemplate) {
      throw new Error('Market template not loaded');
    }

    const stocks: StockTemplate[] = [];

    // 转换股票数据
    for (let i = 0; i < this.cachedMarketTemplate.stocks.length; i++) {
      const stockData = this.cachedMarketTemplate.stocks[i];
      
      stocks.push({
        _id: stockData.id,
        symbol: stockData.symbol,
        companyName: stockData.name,
        category: stockData.category || 'General',
        issuePrice: stockData.issuePrice,
        totalShares: stockData.totalShares,
        createdAt: stockData.createdAt
      });
    }

    console.log(`Loaded ${stocks.length} stock templates from database`);
    return stocks;
  }

  /**
   * 验证模板数据完整性
   */
  private async validateTemplateData(
    exchange: ExchangeTemplate,
    traders: TraderTemplate[],
    stocks: StockTemplate[]
  ): Promise<void> {
    if (!exchange) {
      throw new Error('Exchange template is missing');
    }

    if (!traders || traders.length === 0) {
      throw new Error('No trader templates found');
    }

    if (!stocks || stocks.length === 0) {
      throw new Error('No stock templates found');
    }

    // 验证交易员数据
    console.log('Validating trader templates...');
    for (const trader of traders) {
      if (!trader._id || !trader.name || !trader.riskProfile || !trader.initialCapital) {
        throw new Error(`Invalid trader template: ${trader._id}`);
      }

      if (trader.initialCapital <= 0) {
        throw new Error(`Invalid initial capital for trader: ${trader._id}`);
      }
    }

    // 验证股票数据
    console.log('Validating stock templates...');
    for (const stock of stocks) {
      if (!stock._id || !stock.symbol || !stock.companyName || !stock.category) {
        throw new Error(`Invalid stock template: ${stock._id}`);
      }

      if (stock.issuePrice <= 0 || stock.totalShares <= 0) {
        throw new Error(`Invalid stock parameters for: ${stock.symbol}`);
      }
    }

    console.log('Template data validation passed');
  }
}