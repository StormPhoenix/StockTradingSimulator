/**
 * Frontend Environment Configuration
 *
 * @description Centralized environment variable management for Vue.js application
 * with validation, defaults, and type conversion for Vite environment variables.
 */

// Environment configuration interface
interface EnvironmentConfig {
  // Development Server Configuration
  DEV_PORT: number
  PREVIEW_PORT: number

  // API Configuration
  API_BASE_URL: string
  API_TIMEOUT: number
  API_PREFIX: string
  API_VERSION: string

  // Application Configuration
  APP_TITLE: string
  APP_VERSION: string
  BASE_PATH: string

  // Environment Detection
  NODE_ENV: string

  // Feature Flags
  ENABLE_DEBUG: boolean
  ENABLE_MOCK_DATA: boolean
  ENABLE_PWA: boolean
  ENABLE_ANALYTICS: boolean

  // Performance Configuration
  ENABLE_PERFORMANCE_MONITORING: boolean
  API_RETRY_ATTEMPTS: number
  API_RETRY_DELAY: number

  // UI Configuration
  THEME: string
  LANGUAGE: string

  // External Services (future use)
  SENTRY_DSN: string
  ANALYTICS_ID: string
  WEBSOCKET_URL: string

  // Build Information (injected by Vite)
  BUILD_TIME: string
  COMMIT_HASH: string

  // Computed Properties
  readonly isDevelopment: boolean
  readonly isProduction: boolean
  readonly isTest: boolean
  readonly apiURL: string
  readonly healthURL: string
  readonly fullTitle: string
}

/**
 * Frontend environment configuration
 * All Vite environment variables must be prefixed with VITE_
 */
const environment: EnvironmentConfig = {
  // Development Server Configuration
  DEV_PORT: parseInt(import.meta.env.VITE_DEV_PORT) || 5173,
  PREVIEW_PORT: parseInt(import.meta.env.VITE_PREVIEW_PORT) || 4173,

  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  API_TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
  API_PREFIX: import.meta.env.VITE_API_PREFIX || 'api',
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',

  // Application Configuration
  APP_TITLE: import.meta.env.VITE_APP_TITLE || 'Stock Trading Simulator',
  APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
  BASE_PATH: import.meta.env.VITE_BASE_PATH || '/',

  // Environment Detection
  NODE_ENV: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development',

  // Feature Flags
  ENABLE_DEBUG: import.meta.env.VITE_ENABLE_DEBUG === 'true' || import.meta.env.DEV,
  ENABLE_MOCK_DATA: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || false,
  ENABLE_PWA: import.meta.env.VITE_ENABLE_PWA === 'true' || false,
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true' || false,

  // Performance Configuration
  ENABLE_PERFORMANCE_MONITORING: import.meta.env.VITE_ENABLE_PERFORMANCE === 'true' || false,
  API_RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS) || 3,
  API_RETRY_DELAY: parseInt(import.meta.env.VITE_API_RETRY_DELAY) || 1000,

  // UI Configuration
  THEME: import.meta.env.VITE_THEME || 'light',
  LANGUAGE: import.meta.env.VITE_LANGUAGE || 'en',

  // External Services (future use)
  SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN || '',
  ANALYTICS_ID: import.meta.env.VITE_ANALYTICS_ID || '',
  WEBSOCKET_URL: import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:3001',

  // Build Information (injected by Vite)
  BUILD_TIME: import.meta.env.VITE_BUILD_TIME || new Date().toISOString(),
  COMMIT_HASH: import.meta.env.VITE_COMMIT_HASH || 'unknown',

  // Computed Properties
  get isDevelopment(): boolean {
    return this.NODE_ENV === 'development' || import.meta.env.DEV;
  },

  get isProduction(): boolean {
    return this.NODE_ENV === 'production' || import.meta.env.PROD;
  },

  get isTest(): boolean {
    return this.NODE_ENV === 'test';
  },

  get apiURL(): string {
    return `${this.API_BASE_URL}/${this.API_PREFIX}/${this.API_VERSION}`;
  },

  get healthURL(): string {
    return `${this.API_BASE_URL}/health`;
  },

  get fullTitle(): string {
    return `${this.APP_TITLE} v${this.APP_VERSION}`;
  }
};

/**
 * Validate environment configuration
 *
 * @throws {Error} If validation fails
 */
export const validateEnvironment = (): void => {
  const errors: string[] = [];

  // Validate API base URL
  try {
    new URL(environment.API_BASE_URL);
  } catch (error) {
    errors.push('VITE_API_BASE_URL must be a valid URL');
  }

  // Validate ports
  if (environment.DEV_PORT < 1 || environment.DEV_PORT > 65535) {
    errors.push('VITE_DEV_PORT must be between 1 and 65535');
  }

  if (environment.PREVIEW_PORT < 1 || environment.PREVIEW_PORT > 65535) {
    errors.push('VITE_PREVIEW_PORT must be between 1 and 65535');
  }

  // Validate timeout
  if (environment.API_TIMEOUT < 1000) {
    errors.push('VITE_API_TIMEOUT must be at least 1000ms');
  }

  // Validate retry configuration
  if (environment.API_RETRY_ATTEMPTS < 0 || environment.API_RETRY_ATTEMPTS > 10) {
    errors.push('VITE_API_RETRY_ATTEMPTS must be between 0 and 10');
  }

  if (environment.API_RETRY_DELAY < 100) {
    errors.push('VITE_API_RETRY_DELAY must be at least 100ms');
  }

  if (errors.length > 0) {
    throw new Error(`Environment validation failed:\n${errors.join('\n')}`);
  }

  if (environment.isDevelopment) {
    console.log('✅ Frontend environment validation passed');
  }
};

/**
 * Get environment configuration
 *
 * @returns Environment configuration object
 */
export const getEnvironment = (): EnvironmentConfig => {
  return { ...environment };
};

/**
 * Get specific environment variable with default
 *
 * @param key - Environment variable key (with VITE_ prefix)
 * @param defaultValue - Default value if not found
 * @returns Environment variable value or default
 */
export const getEnvVar = (key: string, defaultValue: any = null): any => {
  return import.meta.env[key] || defaultValue;
};

/**
 * Check if running in specific environment
 *
 * @param env - Environment name to check
 * @returns True if running in specified environment
 */
export const isEnvironment = (env: string): boolean => {
  return environment.NODE_ENV === env;
};

/**
 * Get feature flag value
 *
 * @param flag - Feature flag name
 * @returns Feature flag value
 */
export const getFeatureFlag = (flag: string): boolean => {
  const envKey = `VITE_ENABLE_${flag.toUpperCase()}`;
  return import.meta.env[envKey] === 'true';
};

/**
 * Print environment information (development only)
 */
export const printEnvironmentInfo = (): void => {
  if (!environment.isDevelopment) return;

  console.log('\n📋 Frontend Environment Configuration:');
  console.log(`   Environment: ${environment.NODE_ENV}`);
  console.log(`   App Title: ${environment.fullTitle}`);
  console.log(`   Dev Server: http://localhost:${environment.DEV_PORT}`);
  console.log(`   API Base URL: ${environment.API_BASE_URL}`);
  console.log(`   API Timeout: ${environment.API_TIMEOUT}ms`);
  console.log(`   Debug Mode: ${environment.ENABLE_DEBUG ? 'Enabled' : 'Disabled'}`);
  console.log(`   Mock Data: ${environment.ENABLE_MOCK_DATA ? 'Enabled' : 'Disabled'}`);
  console.log(`   Build Time: ${environment.BUILD_TIME}`);
  console.log('');
};

// Runtime configuration interface
export interface RuntimeConfig {
  app: {
    title: string
    version: string
    buildTime: string
    commitHash: string
  }
  api: {
    baseURL: string
    timeout: number
    retryAttempts: number
    retryDelay: number
  }
  features: {
    debug: boolean
    mockData: boolean
    pwa: boolean
    analytics: boolean
    performanceMonitoring: boolean
  }
  ui: {
    theme: string
    language: string
  }
}

/**
 * Create runtime configuration object for use in components
 *
 * @returns Runtime configuration
 */
export const createRuntimeConfig = (): RuntimeConfig => {
  return {
    app: {
      title: environment.APP_TITLE,
      version: environment.APP_VERSION,
      buildTime: environment.BUILD_TIME,
      commitHash: environment.COMMIT_HASH
    },
    api: {
      baseURL: environment.API_BASE_URL,
      timeout: environment.API_TIMEOUT,
      retryAttempts: environment.API_RETRY_ATTEMPTS,
      retryDelay: environment.API_RETRY_DELAY
    },
    features: {
      debug: environment.ENABLE_DEBUG,
      mockData: environment.ENABLE_MOCK_DATA,
      pwa: environment.ENABLE_PWA,
      analytics: environment.ENABLE_ANALYTICS,
      performanceMonitoring: environment.ENABLE_PERFORMANCE_MONITORING
    },
    ui: {
      theme: environment.THEME,
      language: environment.LANGUAGE
    }
  };
};

// Validate environment on import
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Frontend environment validation failed:', (error as Error).message);
  // Don't exit in browser environment, just log the error
}

export default environment;