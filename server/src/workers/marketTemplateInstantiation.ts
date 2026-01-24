/**
 * 市场模板实例化处理器
 * 
 * 负责从数据库读取模板数据并处理成游戏实例所需的格式
 */

import { parentPort } from 'worker_threads';
import mongoose from 'mongoose';
import {
  TemplateRequestMessage,
  TemplateDataMessage,
  WorkerProgressMessage,
  WorkerErrorMessage,
  ExchangeTemplate,
  TraderTemplate,
  StockTemplate
} from '../types/workerMessages';

/**
 * 数据库连接状态
 */
let isConnected = false;

/**
 * 发送进度更新到主线程
 */
function sendProgress(
  requestId: string,
  stage: 'DATABASE_READING' | 'DATA_PROCESSING' | 'COMPLETE',
  percentage: number,
  message: string,
  details?: any
): void {
  const progressMessage: WorkerProgressMessage = {
    type: 'PROGRESS',
    requestId,
    timestamp: new Date(),
    payload: {
      stage,
      percentage,
      message,
      details
    }
  };

  parentPort?.postMessage(progressMessage);
}

/**
 * 发送错误消息到主线程
 */
function sendError(requestId: string, code: string, message: string, details?: any): void {
  const errorMessage: WorkerErrorMessage = {
    type: 'ERROR',
    requestId,
    timestamp: new Date(),
    payload: {
      code,
      message,
      details
    }
  };

  parentPort?.postMessage(errorMessage);
}

/**
 * 连接到数据库
 */
async function connectToDatabase(): Promise<void> {
  if (isConnected) {
    return;
  }

  try {
    const mongoUri = `mongodb://${process.env.MONGODB_USERNAME}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DATABASE}?authSource=${process.env.MONGODB_AUTH_SOURCE}`;
    
    await mongoose.connect(mongoUri);
    isConnected = true;
    console.log('Worker database connection established');
  } catch (error) {
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * 发送模板数据到主线程
 */
function sendTemplateData(
  requestId: string,
  exchange: ExchangeTemplate,
  traders: TraderTemplate[],
  stocks: StockTemplate[]
): void {
  const dataMessage: TemplateDataMessage = {
    type: 'TEMPLATE_DATA',
    requestId,
    timestamp: new Date(),
    payload: {
      exchange,
      traders,
      stocks
    }
  };

  parentPort?.postMessage(dataMessage);
}

/**
 * 读取交易所模板
 */
async function readExchangeTemplate(templateId: string): Promise<ExchangeTemplate> {
  // TODO: 这里应该使用实际的 Mongoose 模型
  // 暂时返回模拟数据，等待模型定义
  console.log(`Reading exchange template: ${templateId}`);
  
  // 模拟数据库查询延迟
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    _id: templateId,
    name: `Exchange Template ${templateId}`,
    description: `Market environment template ${templateId}`,
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * 读取交易员模板
 */
async function readTraderTemplates(templateId: string): Promise<TraderTemplate[]> {
  // TODO: 这里应该使用实际的 Mongoose 模型
  // 暂时返回模拟数据，等待模型定义
  console.log(`Reading trader templates for: ${templateId}`);
  
  // 模拟数据库查询延迟
  await new Promise(resolve => setTimeout(resolve, 200));
  
  const traderCount = Math.floor(Math.random() * 10) + 5; // 5-15个交易员
  const traders: TraderTemplate[] = [];

  const riskProfiles: ('conservative' | 'moderate' | 'aggressive')[] = ['conservative', 'moderate', 'aggressive'];

  for (let i = 0; i < traderCount; i++) {
    traders.push({
      _id: `trader_${templateId}_${i}`,
      name: `AI Trader ${i + 1}`,
      riskProfile: riskProfiles[Math.floor(Math.random() * riskProfiles.length)],
      initialCapital: Math.floor(Math.random() * 100000) + 50000, // 50k-150k
      createdAt: new Date()
    });
  }

  console.log(`Generated ${traders.length} trader templates`);
  return traders;
}

/**
 * 读取股票模板
 */
async function readStockTemplates(templateId: string): Promise<StockTemplate[]> {
  // TODO: 这里应该使用实际的 Mongoose 模型
  // 暂时返回模拟数据，等待模型定义
  console.log(`Reading stock templates for: ${templateId}`);
  
  // 模拟数据库查询延迟
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const stockCount = Math.floor(Math.random() * 20) + 10; // 10-30只股票
  const stocks: StockTemplate[] = [];

  const categories = ['Technology', 'Finance', 'Healthcare', 'Energy', 'Consumer'];
  const companies = [
    'TechCorp', 'DataSys', 'CloudNet', 'FinanceFirst', 'BankSecure',
    'HealthPlus', 'MediCare', 'EnergyFlow', 'PowerGen', 'ConsumerBest'
  ];

  for (let i = 0; i < stockCount; i++) {
    const company = companies[Math.floor(Math.random() * companies.length)];
    stocks.push({
      _id: `stock_${templateId}_${i}`,
      symbol: `${company.substring(0, 4).toUpperCase()}${i}`,
      companyName: `${company} Inc.`,
      category: categories[Math.floor(Math.random() * categories.length)],
      issuePrice: Math.floor(Math.random() * 200) + 10, // $10-$210
      totalShares: Math.floor(Math.random() * 10000000) + 1000000, // 1M-11M shares
      createdAt: new Date()
    });
  }

  console.log(`Generated ${stocks.length} stock templates`);
  return stocks;
}

/**
 * 验证模板数据完整性
 */
function validateTemplateData(
  exchange: ExchangeTemplate,
  traders: TraderTemplate[],
  stocks: StockTemplate[]
): void {
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
  for (const trader of traders) {
    if (!trader._id || !trader.name || !trader.riskProfile || !trader.initialCapital) {
      throw new Error(`Invalid trader template: ${trader._id}`);
    }
    
    if (trader.initialCapital <= 0) {
      throw new Error(`Invalid initial capital for trader: ${trader._id}`);
    }
  }
  
  // 验证股票数据
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

/**
 * 处理市场模板读取请求
 */
export async function handleMarketTemplateRequest(request: TemplateRequestMessage): Promise<void> {
  const { requestId, payload } = request;
  const { templateId, userId } = payload;

  console.log(`Processing market template request: ${requestId} for template: ${templateId}`);

  try {
    // 发送初始进度
    sendProgress(requestId, 'DATABASE_READING', 0, 'Connecting to database...');

    // 连接数据库
    await connectToDatabase();
    sendProgress(requestId, 'DATABASE_READING', 10, 'Database connected, reading templates...');

    // 读取交易所模板
    const exchange = await readExchangeTemplate(templateId);
    sendProgress(requestId, 'DATABASE_READING', 30, 'Exchange template loaded');

    // 读取交易员模板
    const traders = await readTraderTemplates(templateId);
    sendProgress(requestId, 'DATABASE_READING', 60, `${traders.length} trader templates loaded`);

    // 读取股票模板
    const stocks = await readStockTemplates(templateId);
    sendProgress(requestId, 'DATABASE_READING', 90, `${stocks.length} stock templates loaded`);

    // 数据处理阶段
    sendProgress(requestId, 'DATA_PROCESSING', 95, 'Processing template data...');

    // 验证数据完整性
    validateTemplateData(exchange, traders, stocks);

    // 发送完成进度
    sendProgress(requestId, 'COMPLETE', 100, 'Template data ready', {
      totalTraders: traders.length,
      processedTraders: traders.length,
      totalStocks: stocks.length,
      processedStocks: stocks.length
    });

    // 发送模板数据
    sendTemplateData(requestId, exchange, traders, stocks);
    
    console.log(`Market template request completed: ${requestId}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error(`Market template request failed: ${requestId}`, error);
    sendError(requestId, 'TEMPLATE_READ_ERROR', errorMessage, { templateId, userId });
  }
}