/**
 * 市场实例管理 API 客户端服务
 * 
 * 前端与后端市场实例管理 API 的通信接口
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  MarketInstancePreview,
  MarketInstanceDetails,
  CreateMarketInstanceRequest,
  CreateMarketInstanceResponse,
  MarketInstanceExport,
  MarketTemplate,
  CreationProgress
} from '../types/environment';

/**
 * API 响应基础接口
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * 市场实例 API 客户端
 */
export class MarketInstanceApiClient {
  private api: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api/v1') {
    this.baseURL = baseURL;
    this.api = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  /**
   * 设置请求和响应拦截器
   */
  private setupInterceptors(): void {
    // 请求拦截器 - 添加认证令牌
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器 - 统一错误处理
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // 处理认证失败
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取可用模板列表
   */
  public async getTemplates(): Promise<MarketTemplate[]> {
    try {
      const response: AxiosResponse<ApiResponse<MarketTemplate[]>> = await this.api.get('/templates');

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get templates');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get templates:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取市场实例列表
   */
  public async getMarketInstances(): Promise<{
    marketInstances: MarketInstancePreview[];
    meta: {
      total: number;
      active: number;
      creating: number;
    };
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        marketInstances: MarketInstancePreview[];
        meta: {
          total: number;
          active: number;
          creating: number;
        };
      }>> = await this.api.get('/market-instances');

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get market instances');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get market instances:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 创建新市场实例
   */
  public async createMarketInstance(request: CreateMarketInstanceRequest): Promise<CreateMarketInstanceResponse> {
    try {
      const response: AxiosResponse<ApiResponse<CreateMarketInstanceResponse>> = await this.api.post(
        '/market-instances',
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create market instance');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create market instance:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取市场实例详情
   */
  public async getMarketInstanceDetails(marketInstanceId: string): Promise<MarketInstanceDetails> {
    try {
      const response: AxiosResponse<ApiResponse<MarketInstanceDetails>> = await this.api.get(
        `/market-instances/${marketInstanceId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get market instance details');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get market instance details:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 销毁市场实例
   */
  public async destroyMarketInstance(marketInstanceId: string): Promise<{
    message: string;
    destroyedAt: string;
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        message: string;
        destroyedAt: string;
      }>> = await this.api.delete(`/market-instances/${marketInstanceId}`);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to destroy market instance');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to destroy market instance:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取创建进度
   */
  public async getCreationProgress(requestId: string): Promise<CreationProgress> {
    try {
      const response: AxiosResponse<ApiResponse<CreationProgress>> = await this.api.get(
        `/market-instances/progress/${requestId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get creation progress');
      }

      // 增强进度数据，添加时间估算
      const progress = response.data.data;
      return this.enhanceProgressData(progress);
    } catch (error) {
      console.error('Failed to get creation progress:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 增强进度数据，添加时间估算和百分比计算
   */
  private enhanceProgressData(progress: CreationProgress): CreationProgress {
    const enhanced = { ...progress };

    // 计算更精确的百分比
    if (progress.details) {
      const { totalTraders = 0, createdTraders = 0, totalStocks = 0, createdStocks = 0 } = progress.details;
      const totalObjects = totalTraders + totalStocks;
      const createdObjects = createdTraders + createdStocks;

      if (totalObjects > 0) {
        // 基于实际创建的对象数量计算百分比
        const objectProgress = (createdObjects / totalObjects) * 100;
        
        // 根据阶段调整百分比
        switch (progress.stage) {
          case 'INITIALIZING':
            enhanced.percentage = Math.min(5, objectProgress);
            break;
          case 'READING_TEMPLATES':
            enhanced.percentage = Math.min(30, 5 + (objectProgress * 0.25));
            break;
          case 'CREATING_OBJECTS':
            enhanced.percentage = Math.min(95, 30 + (objectProgress * 0.65));
            break;
          case 'COMPLETE':
            enhanced.percentage = 100;
            break;
          case 'ERROR':
            // 保持当前百分比
            break;
          default:
            enhanced.percentage = Math.min(enhanced.percentage, objectProgress);
        }
      }
    }

    // 计算时间估算
    if (progress.startedAt && progress.stage !== 'COMPLETE' && progress.stage !== 'ERROR') {
      const elapsedMs = Date.now() - new Date(progress.startedAt).getTime();
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      
      if (enhanced.percentage > 0 && enhanced.percentage < 100) {
        // 基于当前进度估算剩余时间
        const estimatedTotalSeconds = (elapsedSeconds / enhanced.percentage) * 100;
        const remainingSeconds = Math.max(0, Math.floor(estimatedTotalSeconds - elapsedSeconds));
        
        // 限制最大估算时间为5分钟
        enhanced.estimatedTimeRemaining = Math.min(remainingSeconds, 300);
      }
    }

    return enhanced;
  }

  /**
   * 获取交易所实例模拟时间（供总览页时间显示与轮询）
   */
  public async getMarketInstanceTime(marketInstanceId: string): Promise<{ simulatedTime: string }> {
    try {
      const response: AxiosResponse<ApiResponse<{ simulatedTime: string }>> = await this.api.get(
        `/market-instances/${marketInstanceId}/time`
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get simulated time');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get simulated time:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 导出市场实例状态
   */
  public async exportMarketInstance(marketInstanceId: string, format: 'json' = 'json'): Promise<MarketInstanceExport> {
    try {
      const response: AxiosResponse<ApiResponse<MarketInstanceExport>> = await this.api.get(
        `/market-instances/${marketInstanceId}/export`,
        {
          params: { format }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to export market instance');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to export market instance:', error);
      throw this.handleApiError(error);
    }
  }



  /**
   * 轮询创建进度
   */
  public async pollCreationProgress(
    requestId: string,
    onProgress: (progress: CreationProgress) => void,
    options?: {
      intervalMs?: number;
      maxAttempts?: number;
    }
  ): Promise<CreationProgress> {
    const { intervalMs = 2000, maxAttempts = 150 } = options || {}; // 默认2秒间隔，最多5分钟
    let attempts = 0;

    return new Promise((resolve, reject) => {
      const poll = async () => {
        try {
          attempts++;
          const progress = await this.getCreationProgress(requestId);
          
          onProgress(progress);

          // 检查是否完成
          if (progress.stage === 'COMPLETE') {
            resolve(progress);
            return;
          }

          // 检查是否出错
          if (progress.stage === 'ERROR') {
            reject(new Error(progress.error?.message || 'Market instance creation failed'));
            return;
          }

          // 检查是否超过最大尝试次数
          if (attempts >= maxAttempts) {
            reject(new Error('Progress polling timeout'));
            return;
          }

          // 继续轮询
          setTimeout(poll, intervalMs);

        } catch (error) {
          reject(error);
        }
      };

      poll();
    });
  }

  /**
   * 下载市场实例导出文件
   */
  public async downloadMarketInstanceExport(marketInstanceId: string): Promise<void> {
    try {
      const response = await this.api.get(`/market-instances/${marketInstanceId}/export`, {
        responseType: 'blob'
      });

      // 创建下载链接
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `market-instance-${marketInstanceId}-${new Date().toISOString().split('T')[0]}.json`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理资源
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download market instance export:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 处理 API 错误
   */
  private handleApiError(error: any): Error {
    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      return new Error(`${apiError.code}: ${apiError.message}`);
    }
    
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return new Error('Invalid request parameters');
        case 401:
          return new Error('Authentication required');
        case 403:
          return new Error('Access denied');
        case 404:
          return new Error('Resource not found');
        case 409:
          return new Error('Resource conflict');
        case 500:
          return new Error('Internal server error');
        default:
          return new Error(`HTTP ${error.response.status}: ${error.response.statusText}`);
      }
    }
    
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timeout');
    }
    
    if (error.code === 'NETWORK_ERROR') {
      return new Error('Network connection failed');
    }
    
    return new Error(error.message || 'Unknown API error');
  }
}

/**
 * 创建默认的市场实例 API 客户端实例
 */
export const marketInstanceApi = new MarketInstanceApiClient();

/**
 * 市场实例 API 服务的便捷方法
 */
export const MarketInstanceService = {
  /**
   * 获取可用模板
   */
  async getTemplates() {
    return marketInstanceApi.getTemplates();
  },

  /**
   * 获取所有市场实例
   */
  async getAll() {
    return marketInstanceApi.getMarketInstances();
  },

  /**
   * 创建市场实例
   */
  async create(templateId: string, name?: string) {
    return marketInstanceApi.createMarketInstance({ templateId, name });
  },

  /**
   * 获取市场实例详情
   */
  async getDetails(marketInstanceId: string) {
    return marketInstanceApi.getMarketInstanceDetails(marketInstanceId);
  },

  /**
   * 销毁市场实例
   */
  async destroy(marketInstanceId: string) {
    return marketInstanceApi.destroyMarketInstance(marketInstanceId);
  },

  /**
   * 监控创建进度
   */
  async monitorCreation(requestId: string, onProgress: (progress: CreationProgress) => void) {
    return marketInstanceApi.pollCreationProgress(requestId, onProgress);
  },

  /**
   * 获取创建进度
   */
  async getProgress(requestId: string) {
    return marketInstanceApi.getCreationProgress(requestId);
  },

  /**
   * 导出市场实例
   */
  async export(marketInstanceId: string) {
    return marketInstanceApi.exportMarketInstance(marketInstanceId);
  },

  /**
   * 下载导出文件
   */
  async download(marketInstanceId: string) {
    return marketInstanceApi.downloadMarketInstanceExport(marketInstanceId);
  },

  /**
   * 获取交易所实例模拟时间（供总览页时间显示与轮询）
   */
  async getTime(marketInstanceId: string) {
    return marketInstanceApi.getMarketInstanceTime(marketInstanceId);
  }
};