/**
 * API Configuration
 * 
 * @description Centralized API configuration management that reads from
 * environment variables to avoid hardcoded API paths and versions.
 */

// API 配置接口
interface ApiConfig {
  baseURL: string
  timeout: number
  prefix: string
  version: string
  readonly apiPath: string
}

// 环境配置接口
interface EnvConfig {
  isDevelopment: boolean
  isProduction: boolean
  enableDebug: boolean
  enableMockData: boolean
  appTitle: string
  appVersion: string
  logLevel: string
}

// API 端点构建器接口
interface ApiEndpoints {
  build: (path: string) => string
  projects: {
    info: () => string
    list: () => string
    byId: (id: string) => string
    create: () => string
    update: (id: string) => string
    delete: (id: string) => string
    activate: (id: string) => string
    stats: () => string
  }
  health: {
    basic: () => string
    detailed: () => string
    ready: () => string
    live: () => string
  }
}

/**
 * API configuration object
 */
export const apiConfig: ApiConfig = {
  // Base URL for API requests
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  
  // Request timeout in milliseconds
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT as string) || 10000,
  
  // API prefix (e.g., '/api')
  prefix: import.meta.env.VITE_API_PREFIX || '/api',
  
  // API version (e.g., 'v1')
  version: import.meta.env.VITE_API_VERSION || 'v1',
  
  // Combined API path prefix
  get apiPath(): string {
    return `${this.prefix}/${this.version}`
  }
}

/**
 * API endpoint builder
 * 
 * @description Utility functions to build API endpoints dynamically
 * based on configuration, avoiding hardcoded paths.
 */
export const apiEndpoints: ApiEndpoints = {
  /**
   * Build full API endpoint URL
   * 
   * @param path - Endpoint path (e.g., '/projects/info')
   * @returns Full endpoint URL
   */
  build(path: string): string {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`
    return `${apiConfig.apiPath}${cleanPath}`
  },

  /**
   * Projects endpoints
   */
  projects: {
    // GET /api/v1/projects/info
    info: (): string => apiEndpoints.build('/projects/info'),
    
    // GET /api/v1/projects
    list: (): string => apiEndpoints.build('/projects'),
    
    // GET /api/v1/projects/:id
    byId: (id: string): string => apiEndpoints.build(`/projects/${id}`),
    
    // POST /api/v1/projects
    create: (): string => apiEndpoints.build('/projects'),
    
    // PUT /api/v1/projects/:id
    update: (id: string): string => apiEndpoints.build(`/projects/${id}`),
    
    // DELETE /api/v1/projects/:id
    delete: (id: string): string => apiEndpoints.build(`/projects/${id}`),
    
    // PATCH /api/v1/projects/:id/activate
    activate: (id: string): string => apiEndpoints.build(`/projects/${id}/activate`),
    
    // GET /api/v1/projects/stats
    stats: (): string => apiEndpoints.build('/projects/stats')
  },

  /**
   * Health check endpoints
   */
  health: {
    // GET /health
    basic: (): string => '/health',
    
    // GET /health/detailed
    detailed: (): string => '/health/detailed',
    
    // GET /health/ready
    ready: (): string => '/health/ready',
    
    // GET /health/live
    live: (): string => '/health/live'
  }
}

/**
 * Environment-specific configuration
 */
export const envConfig: EnvConfig = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Debug settings
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
  
  // App metadata
  appTitle: import.meta.env.VITE_APP_TITLE || 'Stock Trading Simulator',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Logging configuration
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'info'
}

/**
 * Configuration validation
 * 
 * @description Validates that all required configuration is present
 * and provides helpful error messages for missing values.
 */
export const validateConfig = (): boolean => {
  const errors: string[] = []
  
  if (!apiConfig.baseURL) {
    errors.push('VITE_API_BASE_URL is required')
  }
  
  if (!apiConfig.prefix) {
    errors.push('VITE_API_PREFIX is required')
  }
  
  if (!apiConfig.version) {
    errors.push('VITE_API_VERSION is required')
  }
  
  if (errors.length > 0) {
    console.error('❌ API Configuration Errors:')
    errors.forEach(error => console.error(`  - ${error}`))
    throw new Error(`Invalid API configuration: ${errors.join(', ')}`)
  }
  
  // Log configuration in development
  if (envConfig.isDevelopment && envConfig.enableDebug) {
    console.log('🔧 API Configuration:', {
      baseURL: apiConfig.baseURL,
      apiPath: apiConfig.apiPath,
      timeout: apiConfig.timeout,
      environment: envConfig.isDevelopment ? 'development' : 'production'
    })
  }
  
  return true
}

// Validate configuration on module load
validateConfig()

export default apiConfig