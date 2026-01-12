/**
 * Environment Configuration
 * 
 * @description Centralized environment variable management with
 * validation, defaults, and type conversion.
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment configuration with validation and defaults
 */
const environment = {
  // Application Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Server Configuration
  PORT: parseInt(process.env.PORT) || 3000,
  HOST: process.env.HOST || 'localhost',
  
  // Database Configuration
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin',
  
  // CORS Configuration
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  
  // API Configuration
  API_VERSION: process.env.API_VERSION || 'v1',
  API_PREFIX: process.env.API_PREFIX || '/api',
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  LOG_FORMAT: process.env.LOG_FORMAT || 'combined',
  
  // Security Configuration
  JWT_SECRET: process.env.JWT_SECRET || 'your-jwt-secret-key-here',
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  
  // Development Configuration
  ENABLE_SWAGGER: process.env.ENABLE_SWAGGER === 'true' || false,
  ENABLE_DEBUG: process.env.ENABLE_DEBUG === 'true' || false,
  
  // Feature Flags
  ENABLE_RATE_LIMITING: process.env.ENABLE_RATE_LIMITING !== 'false',
  ENABLE_CORS: process.env.ENABLE_CORS !== 'false',
  ENABLE_HELMET: process.env.ENABLE_HELMET !== 'false',
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads',
  
  // Session Configuration
  SESSION_SECRET: process.env.SESSION_SECRET || 'your-session-secret-here',
  SESSION_MAX_AGE: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
  
  // External Services (future use)
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  EMAIL_SERVICE_URL: process.env.EMAIL_SERVICE_URL || '',
  MARKET_DATA_API_KEY: process.env.MARKET_DATA_API_KEY || '',
  
  // Monitoring and Analytics
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  ANALYTICS_ID: process.env.ANALYTICS_ID || '',
  
  // Computed Properties
  get isDevelopment() {
    return this.NODE_ENV === 'development';
  },
  
  get isProduction() {
    return this.NODE_ENV === 'production';
  },
  
  get isTest() {
    return this.NODE_ENV === 'test';
  },
  
  get baseURL() {
    return `http://${this.HOST}:${this.PORT}`;
  },
  
  get apiURL() {
    return `${this.baseURL}${this.API_PREFIX}/${this.API_VERSION}`;
  }
};

/**
 * Validate required environment variables
 * 
 * @throws {Error} If required variables are missing
 */
export const validateEnvironment = () => {
  const requiredVars = [
    'MONGODB_URI'
  ];
  
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Validate specific formats
  if (environment.PORT < 1 || environment.PORT > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }
  
  if (environment.BCRYPT_ROUNDS < 4 || environment.BCRYPT_ROUNDS > 20) {
    throw new Error('BCRYPT_ROUNDS must be between 4 and 20');
  }
  
  // Validate URLs
  try {
    new URL(environment.CORS_ORIGIN);
  } catch (error) {
    throw new Error('CORS_ORIGIN must be a valid URL');
  }
  
  console.log('✅ Environment validation passed');
};

/**
 * Get environment configuration
 * 
 * @returns {object} Environment configuration object
 */
export const getEnvironment = () => {
  return { ...environment };
};

/**
 * Get specific environment variable with default
 * 
 * @param {string} key - Environment variable key
 * @param {*} defaultValue - Default value if not found
 * @returns {*} Environment variable value or default
 */
export const getEnvVar = (key, defaultValue = null) => {
  return process.env[key] || defaultValue;
};

/**
 * Check if running in specific environment
 * 
 * @param {string} env - Environment name to check
 * @returns {boolean} True if running in specified environment
 */
export const isEnvironment = (env) => {
  return environment.NODE_ENV === env;
};

/**
 * Load environment-specific configuration file
 * 
 * @param {string} configPath - Path to config directory
 * @returns {object} Environment-specific configuration
 */
export const loadEnvironmentConfig = (configPath = './config') => {
  const envConfigFile = path.join(configPath, `${environment.NODE_ENV}.js`);
  
  try {
    const envConfig = require(envConfigFile);
    return envConfig.default || envConfig;
  } catch (error) {
    console.warn(`No environment-specific config found at ${envConfigFile}`);
    return {};
  }
};

/**
 * Print environment information (development only)
 */
export const printEnvironmentInfo = () => {
  if (!environment.isDevelopment) return;
  
  console.log('\n📋 Environment Configuration:');
  console.log(`   Environment: ${environment.NODE_ENV}`);
  console.log(`   Server: ${environment.baseURL}`);
  console.log(`   API: ${environment.apiURL}`);
  console.log(`   Database: ${environment.MONGODB_URI.replace(/\/\/.*@/, '//***:***@')}`);
  console.log(`   CORS Origin: ${environment.CORS_ORIGIN}`);
  console.log(`   Rate Limiting: ${environment.ENABLE_RATE_LIMITING ? 'Enabled' : 'Disabled'}`);
  console.log(`   Debug Mode: ${environment.ENABLE_DEBUG ? 'Enabled' : 'Disabled'}`);
  console.log('');
};

// Validate environment on import
try {
  validateEnvironment();
} catch (error) {
  console.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

export default environment;