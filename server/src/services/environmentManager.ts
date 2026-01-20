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
    this.workerPool.on('templateData', (event) => {
      this.handleTemplateDataReceived(event);
    });

    this.workerPool.on('progress', (event) => {
      this.handleProgressUpdate(event);
    });

    this.workerPool.on('error', (event) => {
      this.handleWorkerError(event);
    });

    this.workerPool.on('timeout', (event) => {
      this.handleWorkerTimeout(event);
    });

    // 错误处理器事件
    this.errorHandler.on('recovery', (event) => {
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
    this.emit('progressUpdate', initialProgress);
    
    try {
      // 验证模板存在性
      await this.validateTemplate(templateId, userId);
      
      // 更新进度到模板读取阶段
      this.updateProgress(requestId, CreationStage.READING_TEMPLATES, 10, 'Reading template data...');
      
      // 提交到 Worker Thread 池
      await this.workerPool.submitTask(templateId, userId);
      
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
      this.emit('environmentCreated', {
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
    
    // 创建 GameObjectManager 实例（如果还没有全局实例）
    const gameObjectManager = new GameObjectManager();
    
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
    this.emit('progressUpdate', updatedProgress);
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
    this.emit('progressUpdate', updatedProgress);
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
    this.emit('environmentCreationFailed', {
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
        const gameObjectManager = new GameObjectManager();

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
        const gameObjectManager = new GameObjectManager();

        // 调用 GameObject.onDestroy() 并从 GameObjectManager 中移除
        gameObjectManager.destroyObject(environment.exchangeInstance.id);
        
        console.log(`Destroyed GameObject instance for environment ${environmentId}`);
      }
      
      // 从活跃环境中移除
      this.activeEnvironments.delete(environmentId);
      
      // 发出环境销毁事件
      this.emit('environmentDestroyed', {
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