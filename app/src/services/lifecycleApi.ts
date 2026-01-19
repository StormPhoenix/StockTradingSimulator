import type { 
  ApiResponse, 
  GameObjectStatsResponse, 
  PerformanceStats, 
  LoopStatus,
  StartLoopRequest
} from '@shared';
import { LIFECYCLE_API_ENDPOINTS } from '@shared';

/**
 * 生命周期管理 API 服务
 * 
 * 提供与后端生命周期管理系统交互的 TypeScript 客户端
 * 包装所有 HTTP 请求并提供类型安全的接口
 */
export class LifecycleApiService {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1/debug') {
    this.baseUrl = baseUrl;
  }

  // ============================================================================
  // GameObject Statistics Methods
  // ============================================================================

  /**
   * 获取游戏对象统计信息
   */
  async getObjectStats(): Promise<GameObjectStatsResponse> {
    try {
      const response = await fetch(`${this.baseUrl}${LIFECYCLE_API_ENDPOINTS.GAMEOBJECTS_STATS}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let result: ApiResponse<GameObjectStatsResponse>;
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch object stats');
      }
      
      if (!result.data) {
        throw new Error('No data received from server');
      }
      
      return result.data;
    } catch (error) {
      console.error('getObjectStats error:', error);
      throw error;
    }
  }

  // ============================================================================
  // System Monitoring Methods
  // ============================================================================

  /**
   * 获取系统性能统计
   */
  async getPerformanceStats(): Promise<PerformanceStats> {
    try {
      const response = await fetch(`${this.baseUrl}${LIFECYCLE_API_ENDPOINTS.PERFORMANCE}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let result: ApiResponse<PerformanceStats>;
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch performance stats');
      }
      
      if (!result.data) {
        throw new Error('No data received from server');
      }
      
      return result.data;
    } catch (error) {
      console.error('getPerformanceStats error:', error);
      throw error;
    }
  }

  /**
   * 获取游戏循环状态
   */
  async getLoopStatus(): Promise<LoopStatus> {
    try {
      const response = await fetch(`${this.baseUrl}${LIFECYCLE_API_ENDPOINTS.LOOP_STATUS}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let result: ApiResponse<LoopStatus>;
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to fetch loop status');
      }
      
      if (!result.data) {
        throw new Error('No data received from server');
      }
      
      return result.data;
    } catch (error) {
      console.error('getLoopStatus error:', error);
      throw error;
    }
  }

  // ============================================================================
  // System Control Methods
  // ============================================================================

  /**
   * 启动游戏循环
   */
  async startLoop(fps?: number): Promise<void> {
    try {
      const body: StartLoopRequest = fps ? { fps } : {};
      
      const response = await fetch(`${this.baseUrl}${LIFECYCLE_API_ENDPOINTS.LOOP_START}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let result: ApiResponse<null>;
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to start loop');
      }
    } catch (error) {
      console.error('startLoop error:', error);
      throw error;
    }
  }

  /**
   * 停止游戏循环
   */
  async stopLoop(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}${LIFECYCLE_API_ENDPOINTS.LOOP_STOP}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const text = await response.text();
      let result: ApiResponse<null>;
      
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse JSON response:', text);
        throw new Error(`Invalid JSON response: ${parseError}`);
      }
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to stop loop');
      }
    } catch (error) {
      console.error('stopLoop error:', error);
      throw error;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * 检查 API 连接状态
   */
  async checkConnection(): Promise<boolean> {
    try {
      await this.getLoopStatus();
      return true;
    } catch (error) {
      console.error('API connection check failed:', error);
      return false;
    }
  }
}

/**
 * 默认的生命周期 API 服务实例
 */
export const lifecycleApi = new LifecycleApiService();

/**
 * 导出默认实例
 */
export default lifecycleApi;