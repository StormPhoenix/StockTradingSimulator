/**
 * API Configuration
 * 
 * @description Centralized API configuration management that reads from
 * environment variables to avoid hardcoded API paths and versions.
 */

/**
 * API configuration object
 */
export const apiConfig = {
  // Base URL for API requests
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  
  // Request timeout in milliseconds
  timeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  
  // API prefix (e.g., '/api')
  prefix: import.meta.env.VITE_API_PREFIX || '/api',
  
  // API version (e.g., 'v1')
  version: import.meta.env.VITE_API_VERSION || 'v1',
  
  // Combined API path prefix
  get apiPath() {
    return `${this.prefix}/${this.version}`;
  }
};

/**
 * API endpoint builder
 * 
 * @description Utility functions to build API endpoints dynamically
 * based on configuration, avoiding hardcoded paths.
 */
export const apiEndpoints = {
  /**
   * Build full API endpoint URL
   * 
   * @param {string} path - Endpoint path (e.g., '/projects/info')
   * @returns {string} Full endpoint URL
   */
  build(path) {
    // Ensure path starts with /
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${apiConfig.apiPath}${cleanPath}`;
  },

  /**
   * Projects endpoints
   */
  projects: {
    // GET /api/v1/projects/info
    info: () => apiEndpoints.build('/projects/info'),
    
    // GET /api/v1/projects
    list: () => apiEndpoints.build('/projects'),
    
    // GET /api/v1/projects/:id
    byId: (id) => apiEndpoints.build(`/projects/${id}`),
    
    // POST /api/v1/projects
    create: () => apiEndpoints.build('/projects'),
    
    // PUT /api/v1/projects/:id
    update: (id) => apiEndpoints.build(`/projects/${id}`),
    
    // DELETE /api/v1/projects/:id
    delete: (id) => apiEndpoints.build(`/projects/${id}`),
    
    // PATCH /api/v1/projects/:id/activate
    activate: (id) => apiEndpoints.build(`/projects/${id}/activate`),
    
    // GET /api/v1/projects/stats
    stats: () => apiEndpoints.build('/projects/stats')
  },

  /**
   * Health check endpoints
   */
  health: {
    // GET /health
    basic: () => '/health',
    
    // GET /health/detailed
    detailed: () => '/health/detailed',
    
    // GET /health/ready
    ready: () => '/health/ready',
    
    // GET /health/live
    live: () => '/health/live'
  }
};

/**
 * Environment-specific configuration
 */
export const envConfig = {
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
};

/**
 * Configuration validation
 * 
 * @description Validates that all required configuration is present
 * and provides helpful error messages for missing values.
 */
export const validateConfig = () => {
  const errors = [];
  
  if (!apiConfig.baseURL) {
    errors.push('VITE_API_BASE_URL is required');
  }
  
  if (!apiConfig.prefix) {
    errors.push('VITE_API_PREFIX is required');
  }
  
  if (!apiConfig.version) {
    errors.push('VITE_API_VERSION is required');
  }
  
  if (errors.length > 0) {
    console.error('❌ API Configuration Errors:');
    errors.forEach(error => console.error(`  - ${error}`));
    throw new Error(`Invalid API configuration: ${errors.join(', ')}`);
  }
  
  // Log configuration in development
  if (envConfig.isDevelopment && envConfig.enableDebug) {
    console.log('🔧 API Configuration:', {
      baseURL: apiConfig.baseURL,
      apiPath: apiConfig.apiPath,
      timeout: apiConfig.timeout,
      environment: envConfig.isDevelopment ? 'development' : 'production'
    });
  }
  
  return true;
};

// Validate configuration on module load
validateConfig();

export default apiConfig;