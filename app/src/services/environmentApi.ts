/**
 * 环境管理 API 客户端服务
 * 
 * 前端与后端环境管理 API 的通信接口
 */

import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  EnvironmentPreview,
  EnvironmentDetails,
  CreateEnvironmentRequest,
  CreateEnvironmentResponse,
  EnvironmentExport,
  TradingLog
} from '../types/environment';
import type { CreationProgress } from '../../../shared/types/progress';

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
 * 环境 API 客户端
 */
export class EnvironmentApiClient {
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
   * 获取环境列表
   */
  public async getEnvironments(): Promise<{
    environments: EnvironmentPreview[];
    meta: {
      total: number;
      active: number;
      creating: number;
    };
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        environments: EnvironmentPreview[];
        meta: {
          total: number;
          active: number;
          creating: number;
        };
      }>> = await this.api.get('/environments');

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get environments');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get environments:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 创建新环境
   */
  public async createEnvironment(request: CreateEnvironmentRequest): Promise<CreateEnvironmentResponse> {
    try {
      const response: AxiosResponse<ApiResponse<CreateEnvironmentResponse>> = await this.api.post(
        '/environments',
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to create environment');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to create environment:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取环境详情
   */
  public async getEnvironmentDetails(environmentId: string): Promise<EnvironmentDetails> {
    try {
      const response: AxiosResponse<ApiResponse<EnvironmentDetails>> = await this.api.get(
        `/environments/${environmentId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get environment details');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get environment details:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 销毁环境
   */
  public async destroyEnvironment(environmentId: string): Promise<{
    message: string;
    destroyedAt: string;
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        message: string;
        destroyedAt: string;
      }>> = await this.api.delete(`/environments/${environmentId}`);

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to destroy environment');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to destroy environment:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取创建进度
   */
  public async getCreationProgress(requestId: string): Promise<CreationProgress> {
    try {
      const response: AxiosResponse<ApiResponse<CreationProgress>> = await this.api.get(
        `/environments/progress/${requestId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get creation progress');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get creation progress:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 导出环境状态
   */
  public async exportEnvironment(environmentId: string, format: 'json' = 'json'): Promise<EnvironmentExport> {
    try {
      const response: AxiosResponse<ApiResponse<EnvironmentExport>> = await this.api.get(
        `/environments/${environmentId}/export`,
        {
          params: { format }
        }
      );

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to export environment');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to export environment:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * 获取交易日志
   */
  public async getTradingLogs(
    environmentId: string,
    options?: {
      limit?: number;
      traderId?: string;
    }
  ): Promise<{
    logs: TradingLog[];
    meta: {
      total: number;
      limit: number;
      environmentId: string;
    };
  }> {
    try {
      const response: AxiosResponse<ApiResponse<{
        logs: TradingLog[];
        meta: {
          total: number;
          limit: number;
          environmentId: string;
        };
      }>> = await this.api.get(`/environments/${environmentId}/logs`, {
        params: options
      });

      if (!response.data.success) {
        throw new Error(response.data.error?.message || 'Failed to get trading logs');
      }

      return response.data.data;
    } catch (error) {
      console.error('Failed to get trading logs:', error);
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
            reject(new Error(progress.error?.message || 'Environment creation failed'));
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
   * 下载环境导出文件
   */
  public async downloadEnvironmentExport(environmentId: string): Promise<void> {
    try {
      const response = await this.api.get(`/environments/${environmentId}/export`, {
        responseType: 'blob'
      });

      // 创建下载链接
      const blob = new Blob([response.data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `environment-${environmentId}-${new Date().toISOString().split('T')[0]}.json`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 清理资源
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Failed to download environment export:', error);
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
 * 创建默认的环境 API 客户端实例
 */
export const environmentApi = new EnvironmentApiClient();

/**
 * 环境 API 服务的便捷方法
 */
export const EnvironmentService = {
  /**
   * 获取所有环境
   */
  async getAll() {
    return environmentApi.getEnvironments();
  },

  /**
   * 创建环境
   */
  async create(templateId: string, name?: string) {
    return environmentApi.createEnvironment({ templateId, name });
  },

  /**
   * 获取环境详情
   */
  async getDetails(environmentId: string) {
    return environmentApi.getEnvironmentDetails(environmentId);
  },

  /**
   * 销毁环境
   */
  async destroy(environmentId: string) {
    return environmentApi.destroyEnvironment(environmentId);
  },

  /**
   * 监控创建进度
   */
  async monitorCreation(requestId: string, onProgress: (progress: CreationProgress) => void) {
    return environmentApi.pollCreationProgress(requestId, onProgress);
  },

  /**
   * 获取创建进度
   */
  async getProgress(requestId: string) {
    return environmentApi.getCreationProgress(requestId);
  },

  /**
   * 导出环境
   */
  async export(environmentId: string) {
    return environmentApi.exportEnvironment(environmentId);
  },

  /**
   * 下载导出文件
   */
  async download(environmentId: string) {
    return environmentApi.downloadEnvironmentExport(environmentId);
  },

  /**
   * 获取交易日志
   */
  async getLogs(environmentId: string, options?: { limit?: number; traderId?: string }) {
    return environmentApi.getTradingLogs(environmentId, options);
  }
};