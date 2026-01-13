/**
 * API Service Client
 * 
 * @description Axios-based HTTP client with interceptors for
 * request/response handling, error management, and logging.
 */

import axios from 'axios';
import { apiConfig, apiEndpoints } from '../config/api.js';

/**
 * Create axios instance with default configuration
 */
const apiClient = axios.create({
  baseURL: apiConfig.baseURL,
  timeout: apiConfig.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

/**
 * Request interceptor
 * 
 * Adds common headers, logging, and request preprocessing
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to request
    config.metadata = { startTime: new Date() };
    
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data) {
        console.log('📤 Request Data:', config.data);
      }
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = generateRequestId();
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * 
 * Handles response logging, error processing, and data transformation
 */
apiClient.interceptors.response.use(
  (response) => {
    // Calculate request duration
    const duration = new Date() - response.config.metadata.startTime;
    
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`);
      if (response.data) {
        console.log('📥 Response Data:', response.data);
      }
    }
    
    // Add response metadata
    response.metadata = {
      duration,
      timestamp: new Date().toISOString()
    };
    
    return response;
  },
  (error) => {
    // Calculate request duration if available
    const duration = error.config?.metadata ? 
      new Date() - error.config.metadata.startTime : 0;
    
    // Enhanced error logging
    if (import.meta.env.DEV) {
      console.error(`❌ API Error: ${error.response?.status || 'Network'} ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`);
      if (error.response?.data) {
        console.error('📥 Error Response:', error.response.data);
      }
    }
    
    // Transform error for consistent handling
    const transformedError = transformApiError(error);
    
    return Promise.reject(transformedError);
  }
);

/**
 * Transform API errors to consistent format
 * 
 * @param {Error} error - Original axios error
 * @returns {object} Transformed error object
 */
const transformApiError = (error) => {
  const baseError = {
    message: 'An unexpected error occurred',
    status: 500,
    code: 'UNKNOWN_ERROR',
    timestamp: new Date().toISOString()
  };
  
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response;
    
    return {
      ...baseError,
      message: data?.message || `HTTP ${status} Error`,
      status,
      code: data?.code || `HTTP_${status}`,
      errors: data?.errors || [],
      data: data
    };
  } else if (error.request) {
    // Request made but no response received
    return {
      ...baseError,
      message: 'Network error - unable to reach server',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  } else {
    // Request setup error
    return {
      ...baseError,
      message: error.message || 'Request configuration error',
      code: 'REQUEST_ERROR'
    };
  }
};

/**
 * Generate unique request ID for tracking
 * 
 * @returns {string} Unique request identifier
 */
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * API client wrapper with common methods
 */
const api = {
  /**
   * GET request
   * 
   * @param {string} url - Request URL
   * @param {object} config - Axios config options
   * @returns {Promise} Response promise
   */
  get: (url, config = {}) => apiClient.get(url, config),
  
  /**
   * POST request
   * 
   * @param {string} url - Request URL
   * @param {object} data - Request data
   * @param {object} config - Axios config options
   * @returns {Promise} Response promise
   */
  post: (url, data = {}, config = {}) => apiClient.post(url, data, config),
  
  /**
   * PUT request
   * 
   * @param {string} url - Request URL
   * @param {object} data - Request data
   * @param {object} config - Axios config options
   * @returns {Promise} Response promise
   */
  put: (url, data = {}, config = {}) => apiClient.put(url, data, config),
  
  /**
   * DELETE request
   * 
   * @param {string} url - Request URL
   * @param {object} config - Axios config options
   * @returns {Promise} Response promise
   */
  delete: (url, config = {}) => apiClient.delete(url, config),
  
  /**
   * PATCH request
   * 
   * @param {string} url - Request URL
   * @param {object} data - Request data
   * @param {object} config - Axios config options
   * @returns {Promise} Response promise
   */
  patch: (url, data = {}, config = {}) => apiClient.patch(url, data, config)
};

/**
 * Health check utility
 * 
 * @returns {Promise<object>} Health status
 */
export const healthCheck = async () => {
  try {
    const response = await api.get(apiEndpoints.health.basic());
    return {
      status: 'healthy',
      data: response.data,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Export both the configured client and wrapper
export { apiClient };
export default api;