/**
 * 环境管理服务
 * 
 * 协调 Worker Thread 池和 GameObject 系统，管理环境的完整生命周期
 */

import { EventEmitter } from 'events';
import { WorkerThreadPool } from './workerThreadPool';
import { WorkerErrorHandler, WorkerError } from '../utils/workerErrorHandler';
import { CreationProgress, CreationStage } from '../../../shared/types/progress';
import { EnvironmentPreview, EnvironmentDetails, EnvironmentStatus } from '../../../shared/types/environment';
import { EnvironmentManagerEvents, ErrorHandlerEvents } from '../types/eventTypes';

/**
 * 环境创建请求
 */
export interface EnvironmentCreationRequest {
  requestId: string;
  templateId: string;
  userId: string;
  customName?: string;
}

/**
 * 环境实例引用
 */
export interface EnvironmentInstance {
  id: string;
  exchangeInstance: import('../models/runtime/exchangeInstance').ExchangeInstance;
  status: EnvironmentStatus;
  createdAt: Date;
  lastActiveAt: Date;
  templateId: string;
  userId: string;
  name: string;
}

/**
 * 环境管理器
 */
export class EnvironmentManager extends EventEmitter {
  private workerPool: WorkerThreadPool;
  private errorHandler: WorkerErrorHandler;
  private activeEnvironments: Map<string, EnvironmentInstance> = new Map();
  private creationRequests: Map<string, EnvironmentCreationRequest> = new Map();
  private progressTracking: Map<string, CreationProgress> = new Map();

  constructor(workerPool: WorkerThreadPool, errorHandler: WorkerErrorHandler) {
    super();
    this.workerPool = workerPool;
    this.errorHandler = errorHandler;
    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // Worker Pool 事件
    this.workerPool.on(EnvironmentManagerEvents.TEMPLATE_DATA, (event) => {
      this.handleTemplateDataReceived(event);
    });

    this.workerPool.on(EnvironmentManagerEvents.PROGRESS, (event) => {
      this.handleProgressUpdate(event);
    });

    this.workerPool.on(EnvironmentManagerEvents.ERROR, (event) => {
      this.handleWorkerError(event);
    });

    this.workerPool.on(EnvironmentManagerEvents.TIMEOUT, (event) => {
      this.handleWorkerTimeout(event);
    });

    // 错误处理器事件
    this.errorHandler.on(ErrorHandlerEvents.RECOVERY, (event) => {
      this.handleErrorRecovery(event);
    });
  }

  /**
   * 创建新环境
   */
  public async createEnvironment(
    templateId: string,
    userId: string,
    customName?: string
  ): Promise<string> {
    const requestId = `env_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 创建请求记录
    const request: EnvironmentCreationRequest = {
      requestId,
      templateId,
      userId,
      customName
    };
    
    this.creationRequests.set(requestId, request);
    
    // 初始化进度跟踪
    const initialProgress: CreationProgress = {
      requestId,
      stage: CreationStage.INITIALIZING,
      percentage: 0,
      message: 'Initializing environment creation...',
      details: {
        totalTraders: 0,
        createdTraders: 0,
        totalStocks: 0,
        createdStocks: 0
      },
      startedAt: new Date()
    };
    
    this.progressTracking.set(requestId, initialProgress);
    this.emit(EnvironmentManagerEvents.PROGRESS_UPDATE, initialProgress);
    
    try {
      // 验证模板存在性
      await this.validateTemplate(templateId, userId);
      
      // 更新进度到模板读取阶段
      this.updateProgress(requestId, CreationStage.READING_TEMPLATES, 10, 'Reading template data...');
      
      // 提交到 Worker Thread 池，传递相同的 requestId
      await this.workerPool.submitTask(templateId, userId, requestId);
      
      return requestId;
      
    } catch (error) {
      // 处理创建失败
      await this.handleCreationFailure(requestId, error);
      throw error;
    }
  }

  /**
   * 验证模板
   */
  private async validateTemplate(templateId: string, userId: string): Promise<void> {
    // TODO: 实现模板验证逻辑
    // 1. 检查模板是否存在
    // 2. 检查用户是否有权限访问
    // 3. 检查模板数据完整性
    
    // 暂时模拟验证
    if (!templateId || templateId.length === 0) {
      throw new Error('Invalid template ID');
    }
    
    // 模拟异步验证
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  /**
   * 处理模板数据接收
   */
  private async handleTemplateDataReceived(event: any): Promise<void> {
    const { requestId, data } = event;
    const request = this.creationRequests.get(requestId);
    
    if (!request) {
      console.error(`No creation request found for requestId: ${requestId}`);
      return;
    }
    
    try {
      // 更新进度到对象创建阶段
      this.updateProgress(requestId, CreationStage.CREATING_OBJECTS, 70, 'Creating runtime instances...');
      
      // 创建 GameObject 实例
      const environmentInstance = await this.createGameObjects(request, data);
      
      // 注册环境实例
      this.activeEnvironments.set(environmentInstance.id, environmentInstance);
      
      // 完成创建
      this.updateProgress(requestId, CreationStage.COMPLETE, 100, 'Environment created successfully');
      
      // 清理创建请求
      this.creationRequests.delete(requestId);
      
      // 发出环境创建完成事件
      this.emit(EnvironmentManagerEvents.ENVIRONMENT_CREATED, {
        requestId,
        environmentId: environmentInstance.id,
        environment: environmentInstance
      });
      
    } catch (error) {
      await this.handleCreationFailure(requestId, error);
    }
  }

  /**
   * 创建 GameObject 实例
   */
  private async createGameObjects(
    request: EnvironmentCreationRequest,
    templateData: any
  ): Promise<EnvironmentInstance> {
    const { exchange, traders, stocks } = templateData;
    
    // 导入运行时实例类
    const { ExchangeInstance } = await import('../models/runtime/exchangeInstance');
    const { AITraderInstance } = await import('../models/runtime/aiTraderInstance');
    const { StockInstance } = await import('../models/runtime/stockInstance');
    
    // 导入 GameObjectManager
    const { GameObjectManager } = await import('../lifecycle/core/gameObjectManager');
    
    // 获取 GameObjectManager 单例实例
    const gameObjectManager = GameObjectManager.getInstance();
    
    try {
      // 创建交易所实例
      const exchangeInstance = gameObjectManager.createObject(ExchangeInstance, {
        templateId: exchange._id,
        name: request.customName || exchange.name,
        description: exchange.description
      });

      // 创建股票实例
      const stockInstances = stocks.map((stockTemplate: any) => {
        return gameObjectManager.createObject(StockInstance, {
          templateId: stockTemplate._id,
          symbol: stockTemplate.symbol,
          companyName: stockTemplate.companyName,
          category: stockTemplate.category,
          issuePrice: stockTemplate.issuePrice,
          totalShares: stockTemplate.totalShares
        });
      });

      // 创建交易员实例
      const traderInstances = traders.map((traderTemplate: any) => {
        return gameObjectManager.createObject(AITraderInstance, {
          templateId: traderTemplate._id,
          name: traderTemplate.name,
          riskProfile: traderTemplate.riskProfile,
          initialCapital: traderTemplate.initialCapital
        });
      });

      // 将股票和交易员添加到交易所
      stockInstances.forEach((stock: any) => {
        exchangeInstance.addStock(stock);
      });

      traderInstances.forEach((trader: any) => {
        exchangeInstance.addTrader(trader);
        // 设置可用股票列表
        // 简化版本不需要设置股票列表
        // trader.setAvailableStocks(stockInstances.map((s: any) => s.symbol));
      });

      // 启动 GameObjectManager（如果还没有启动）
      if (!gameObjectManager.isRunning()) {
        gameObjectManager.start();
      }

      // 创建环境实例记录
      const environmentInstance: EnvironmentInstance = {
        id: `env_${exchangeInstance.id}`,
        exchangeInstance,
        status: EnvironmentStatus.ACTIVE,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        templateId: request.templateId,
        userId: request.userId,
        name: request.customName || exchange.name
      };

      return environmentInstance;

    } catch (error) {
      // 如果创建失败，清理已创建的对象
      console.error('GameObject creation failed:', error);
      throw error;
    }
  }

  /**
   * 处理进度更新
   */
  private handleProgressUpdate(event: any): void {
    const { requestId, progress } = event;
    const currentProgress = this.progressTracking.get(requestId);
    
    if (!currentProgress) {
      return;
    }
    
    // 更新进度信息
    const updatedProgress: CreationProgress = {
      ...currentProgress,
      percentage: Math.max(currentProgress.percentage, progress.percentage),
      message: progress.message,
      details: {
        ...currentProgress.details,
        ...progress.details
      }
    };
    
    this.progressTracking.set(requestId, updatedProgress);
    this.emit(EnvironmentManagerEvents.PROGRESS_UPDATE, updatedProgress);
  }

  /**
   * 更新进度
   */
  private updateProgress(
    requestId: string,
    stage: CreationStage,
    percentage: number,
    message: string,
    details?: any
  ): void {
    const currentProgress = this.progressTracking.get(requestId);
    
    if (!currentProgress) {
      return;
    }
    
    const updatedProgress: CreationProgress = {
      ...currentProgress,
      stage,
      percentage,
      message,
      details: {
        ...currentProgress.details,
        ...details
      }
    };
    
    if (stage === CreationStage.COMPLETE || stage === CreationStage.ERROR) {
      updatedProgress.completedAt = new Date();
    }
    
    this.progressTracking.set(requestId, updatedProgress);
    this.emit(EnvironmentManagerEvents.PROGRESS_UPDATE, updatedProgress);
  }

  /**
   * 处理 Worker 错误
   */
  private handleWorkerError(event: any): void {
    const { requestId, error } = event;
    this.handleCreationFailure(requestId, error);
  }

  /**
   * 处理 Worker 超时
   */
  private handleWorkerTimeout(event: any): void {
    const { requestId } = event;
    const timeoutError = new Error('Template reading timeout');
    this.handleCreationFailure(requestId, timeoutError);
  }

  /**
   * 处理创建失败
   */
  private async handleCreationFailure(requestId: string, error: any): Promise<void> {
    const workerError = this.errorHandler.handleError(error, { requestId });
    
    // 更新进度为错误状态
    this.updateProgress(
      requestId,
      CreationStage.ERROR,
      -1,
      'Environment creation failed',
      {
        error: {
          code: workerError.code,
          message: workerError.message,
          details: workerError.details
        }
      }
    );
    
    // 清理资源
    await this.rollbackCreation(requestId);
    
    // 发出创建失败事件
    this.emit(EnvironmentManagerEvents.ENVIRONMENT_CREATION_FAILED, {
      requestId,
      error: workerError
    });
  }

  /**
   * 回滚创建
   */
  private async rollbackCreation(requestId: string): Promise<void> {
    try {
      const request = this.creationRequests.get(requestId);
      if (!request) {
        return;
      }

      // 查找可能已创建的环境实例
      const environmentInstance = Array.from(this.activeEnvironments.values())
        .find(env => env.templateId === request.templateId && env.userId === request.userId);

      if (environmentInstance && environmentInstance.exchangeInstance) {
        // 销毁 GameObject 实例
        const { GameObjectManager } = await import('../lifecycle/core/gameObjectManager');
        const gameObjectManager = GameObjectManager.getInstance();

        try {
          // 销毁交易所实例（会自动销毁关联的交易员和股票）
          gameObjectManager.destroyObject(environmentInstance.exchangeInstance.id);
          
          // 从活跃环境中移除
          this.activeEnvironments.delete(environmentInstance.id);
          
          console.log(`Rollback: Destroyed environment ${environmentInstance.id} and all associated objects`);
        } catch (destroyError) {
          console.error(`Rollback: Failed to destroy GameObject instances:`, destroyError);
        }
      }

      // 清理跟踪数据
      this.creationRequests.delete(requestId);
      
      console.log(`Rollback completed for request: ${requestId}`);
      
    } catch (rollbackError) {
      console.error(`Rollback failed for request ${requestId}:`, rollbackError);
    }
  }

  /**
   * 处理错误恢复
   */
  private handleErrorRecovery(event: any): void {
    const { error, strategy } = event;
    
    switch (strategy.type) {
      case 'RETRY':
        // 重试逻辑将由 Worker Pool 处理
        break;
      case 'RESTART_WORKER':
        // Worker 重启逻辑将由 Worker Pool 处理
        break;
      case 'ABORT':
        // 终止创建请求
        if (error.requestId) {
          this.handleCreationFailure(error.requestId, new Error('Creation aborted due to unrecoverable error'));
        }
        break;
    }
  }

  /**
   * 获取环境列表
   */
  public getEnvironments(userId: string): EnvironmentPreview[] {
    const userEnvironments = Array.from(this.activeEnvironments.values())
      .filter(env => env.userId === userId);
    
    return userEnvironments.map(env => {
      // 从实际 GameObject 实例获取统计信息
      let statistics = {
        traderCount: 0,
        stockCount: 0,
        totalCapital: 0,
        averageCapitalPerTrader: 0
      };

      if (env.exchangeInstance) {
        const summary = env.exchangeInstance.getEnvironmentSummary();
        statistics = summary.statistics;
      }

      return {
        exchangeId: env.id,
        name: env.name,
        description: `Environment created from template ${env.templateId}`,
        status: env.status,
        createdAt: env.createdAt,
        lastActiveAt: env.lastActiveAt,
        statistics,
        templateInfo: {
          templateId: env.templateId,
          templateName: `Template ${env.templateId}`
        }
      };
    });
  }

  /**
   * 获取环境详情
   */
  public getEnvironmentDetails(environmentId: string, userId: string): EnvironmentDetails | null {
    const environment = this.activeEnvironments.get(environmentId);
    
    if (!environment || environment.userId !== userId) {
      return null;
    }
    
    // 从实际 GameObject 实例获取详细信息
    if (environment.exchangeInstance) {
      const summary = environment.exchangeInstance.getEnvironmentSummary();
      const traderDetails = environment.exchangeInstance.getTraderDetails();
      const stockDetails = environment.exchangeInstance.getStockDetails();

      return {
        exchangeId: environment.id,
        name: environment.name,
        description: summary.description,
        status: environment.status,
        createdAt: environment.createdAt,
        lastActiveAt: environment.lastActiveAt,
        statistics: summary.statistics,
        templateInfo: {
          templateId: environment.templateId,
          templateName: `Template ${environment.templateId}`
        },
        traders: traderDetails.map(trader => ({
          id: trader.id,
          name: trader.name,
          currentCapital: trader.currentCapital,
          initialCapital: trader.initialCapital,
          riskProfile: trader.riskProfile as 'conservative' | 'moderate' | 'aggressive',
          isActive: trader.isActive,
          performanceMetrics: {
            totalTrades: 0, // TODO: 从实际实例获取
            profitLoss: trader.currentCapital - trader.initialCapital,
            profitLossPercentage: ((trader.currentCapital - trader.initialCapital) / trader.initialCapital) * 100,
            winRate: 0.5, // TODO: 从实际实例获取
            averageTradeValue: trader.currentCapital / Math.max(1, 1), // TODO: 从实际实例获取
            lastTradeAt: undefined // TODO: 从实际实例获取
          }
        })),
        stocks: stockDetails.map(stock => ({
          id: stock.id,
          symbol: stock.symbol,
          companyName: stock.companyName,
          category: stock.category,
          currentPrice: stock.currentPrice,
          issuePrice: stock.issuePrice,
          totalShares: stock.totalShares,
          marketCap: stock.marketCap
        }))
      };
    }

    // 如果没有实际实例，返回基础信息
    return {
      exchangeId: environment.id,
      name: environment.name,
      description: `Environment created from template ${environment.templateId}`,
      status: environment.status,
      createdAt: environment.createdAt,
      lastActiveAt: environment.lastActiveAt,
      statistics: {
        traderCount: 0,
        stockCount: 0,
        totalCapital: 0,
        averageCapitalPerTrader: 0
      },
      templateInfo: {
        templateId: environment.templateId,
        templateName: `Template ${environment.templateId}`
      },
      traders: [],
      stocks: []
    };
  }

  /**
   * 销毁环境
   */
  public async destroyEnvironment(environmentId: string, userId: string): Promise<void> {
    const environment = this.activeEnvironments.get(environmentId);
    
    if (!environment || environment.userId !== userId) {
      throw new Error('Environment not found or access denied');
    }
    
    try {
      // 实现实际的 GameObject 清理逻辑
      if (environment.exchangeInstance) {
        const { GameObjectManager } = await import('../lifecycle/core/gameObjectManager');
        const gameObjectManager = GameObjectManager.getInstance();

        // 调用 GameObject.onDestroy() 并从 GameObjectManager 中移除
        gameObjectManager.destroyObject(environment.exchangeInstance.id);
        
        console.log(`Destroyed GameObject instance for environment ${environmentId}`);
      }
      
      // 从活跃环境中移除
      this.activeEnvironments.delete(environmentId);
      
      // 发出环境销毁事件
      this.emit(EnvironmentManagerEvents.ENVIRONMENT_DESTROYED, {
        environmentId,
        userId,
        destroyedAt: new Date()
      });
      
    } catch (error) {
      throw new Error(`Failed to destroy environment: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 获取创建进度
   */
  public getCreationProgress(requestId: string): CreationProgress | null {
    return this.progressTracking.get(requestId) || null;
  }

  /**
   * 导出环境状态
   */
  public async exportEnvironmentState(environmentId: string, userId: string): Promise<any> {
    const environment = this.activeEnvironments.get(environmentId);
    
    if (!environment || environment.userId !== userId) {
      throw new Error('Environment not found or access denied');
    }

    try {
      const exportData = {
        exportedAt: new Date().toISOString(),
        environment: {
          id: environmentId,
          name: environment.name,
          description: (environment as any).description || 'No description',
          status: environment.status,
          createdAt: environment.createdAt,
          templateInfo: {
            templateId: environment.templateId,
            templateName: (environment as any).templateName || 'Unknown Template'
          }
        },
        templateData: {
          // Include original template data used for creation
          exchange: (environment as any).originalTemplateData?.exchange || null,
          traders: (environment as any).originalTemplateData?.traders || [],
          stocks: (environment as any).originalTemplateData?.stocks || []
        },
        runtimeState: {
          // Export current runtime state
          traders: this.serializeTraders(environment.exchangeInstance),
          stocks: this.serializeStocks(environment.exchangeInstance),
          tradingLogs: this.getTradingLogs(environment.exchangeInstance),
          performanceMetrics: this.calculatePerformanceMetrics(environment.exchangeInstance),
          statistics: {
            traderCount: (environment as any).statistics?.traderCount || 0,
            stockCount: (environment as any).statistics?.stockCount || 0,
            totalCapital: (environment as any).statistics?.totalCapital || 0,
            averageCapitalPerTrader: (environment as any).statistics?.averageCapitalPerTrader || 0
          }
        }
      };

      return exportData;
    } catch (error) {
      throw new Error(`Failed to export environment state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * 序列化交易员实例
   */
  private serializeTraders(exchangeInstance: any): any[] {
    if (!exchangeInstance || !exchangeInstance.getActiveTraders) {
      return [];
    }

    try {
      const traders = exchangeInstance.getActiveTraders();
      return traders.map((trader: any) => ({
        id: trader.id,
        name: trader.name,
        riskProfile: trader.riskProfile,
        tradingStyle: trader.tradingStyle,
        currentCapital: trader.getCapital ? trader.getCapital() : trader.currentCapital,
        initialCapital: trader.initialCapital,
        isActive: trader.isActive,
        performanceMetrics: trader.getPerformanceMetrics ? trader.getPerformanceMetrics() : null,
        tradingHistory: trader.getTradingHistory ? trader.getTradingHistory().slice(-50) : [] // Last 50 logs
      }));
    } catch (error) {
      console.error('Failed to serialize traders:', error);
      return [];
    }
  }

  /**
   * 序列化股票实例
   */
  private serializeStocks(exchangeInstance: any): any[] {
    if (!exchangeInstance || !exchangeInstance.getAvailableStocks) {
      return [];
    }

    try {
      const stocks = exchangeInstance.getAvailableStocks();
      return stocks.map((stock: any) => ({
        id: stock.id,
        symbol: stock.symbol,
        companyName: stock.companyName,
        category: stock.category,
        currentPrice: stock.getCurrentPrice ? stock.getCurrentPrice() : stock.currentPrice,
        issuePrice: stock.issuePrice,
        totalShares: stock.totalShares,
        marketCap: stock.getMarketCap ? stock.getMarketCap() : (stock.currentPrice * stock.totalShares),
        stockInfo: stock.getStockInfo ? stock.getStockInfo() : null
      }));
    } catch (error) {
      console.error('Failed to serialize stocks:', error);
      return [];
    }
  }

  /**
   * 获取交易日志
   */
  private getTradingLogs(exchangeInstance: any): any[] {
    if (!exchangeInstance || !exchangeInstance.getActiveTraders) {
      return [];
    }

    try {
      const traders = exchangeInstance.getActiveTraders();
      const allLogs: any[] = [];

      traders.forEach((trader: any) => {
        if (trader.getTradingHistory) {
          const logs = trader.getTradingHistory();
          allLogs.push(...logs);
        }
      });

      // Sort by timestamp (newest first) and limit to last 1000 logs
      return allLogs
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 1000);
    } catch (error) {
      console.error('Failed to get trading logs:', error);
      return [];
    }
  }

  /**
   * 计算性能指标
   */
  private calculatePerformanceMetrics(exchangeInstance: any): any {
    if (!exchangeInstance || !exchangeInstance.getActiveTraders) {
      return null;
    }

    try {
      const traders = exchangeInstance.getActiveTraders();
      const stocks = exchangeInstance.getAvailableStocks ? exchangeInstance.getAvailableStocks() : [];

      const totalCapital = traders.reduce((sum: number, trader: any) => {
        const capital = trader.getCapital ? trader.getCapital() : trader.currentCapital || 0;
        return sum + capital;
      }, 0);

      const totalInitialCapital = traders.reduce((sum: number, trader: any) => {
        return sum + (trader.initialCapital || 0);
      }, 0);

      const totalMarketCap = stocks.reduce((sum: number, stock: any) => {
        const marketCap = stock.getMarketCap ? stock.getMarketCap() : 0;
        return sum + marketCap;
      }, 0);

      return {
        totalCurrentCapital: totalCapital,
        totalInitialCapital: totalInitialCapital,
        totalReturn: totalCapital - totalInitialCapital,
        totalReturnPercentage: totalInitialCapital > 0 ? ((totalCapital - totalInitialCapital) / totalInitialCapital) * 100 : 0,
        averageCapitalPerTrader: traders.length > 0 ? totalCapital / traders.length : 0,
        totalMarketCap: totalMarketCap,
        traderCount: traders.length,
        stockCount: stocks.length,
        calculatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Failed to calculate performance metrics:', error);
      return null;
    }
  }

  /**
   * 清理过期的进度跟踪
   */
  public cleanupExpiredProgress(): void {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24小时
    
    for (const [requestId, progress] of this.progressTracking.entries()) {
      const age = now.getTime() - progress.startedAt.getTime();
      
      if (age > maxAge) {
        this.progressTracking.delete(requestId);
      }
    }
  }

  /**
   * 获取管理器状态
   */
  public getManagerStatus(): {
    activeEnvironments: number;
    pendingCreations: number;
    workerPoolStatus: any;
    errorStats: any;
  } {
    return {
      activeEnvironments: this.activeEnvironments.size,
      pendingCreations: this.creationRequests.size,
      workerPoolStatus: this.workerPool.getPoolStatus(),
      errorStats: this.errorHandler.getErrorStats()
    };
  }
}