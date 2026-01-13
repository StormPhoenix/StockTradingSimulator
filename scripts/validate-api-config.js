#!/usr/bin/env node

/**
 * API Configuration Validation Script
 * 
 * @description Validates that frontend and backend API configurations
 * are synchronized and compatible.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

/**
 * Colors for console output
 */
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

/**
 * Parse .env file
 * 
 * @param {string} filePath - Path to .env file
 * @returns {object} Parsed environment variables
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        env[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return env;
}

/**
 * Validate API configuration
 */
function validateApiConfig() {
  console.log(`${colors.cyan}🔍 API Configuration Validation${colors.reset}\n`);
  
  // Parse backend .env
  const backendEnvPath = path.join(projectRoot, 'server', '.env');
  const backendEnv = parseEnvFile(backendEnvPath);
  
  // Parse frontend .env
  const frontendEnvPath = path.join(projectRoot, 'app', '.env');
  const frontendEnv = parseEnvFile(frontendEnvPath);
  
  console.log(`${colors.blue}📋 Configuration Files:${colors.reset}`);
  console.log(`  Backend:  ${backendEnvPath}`);
  console.log(`  Frontend: ${frontendEnvPath}\n`);
  
  // Extract relevant configurations
  const backendConfig = {
    apiVersion: backendEnv.API_VERSION || 'v1',
    apiPrefix: backendEnv.API_PREFIX || '/api',
    port: backendEnv.PORT || '3000'
  };
  
  const frontendConfig = {
    apiVersion: frontendEnv.VITE_API_VERSION || 'v1',
    apiPrefix: frontendEnv.VITE_API_PREFIX || '/api',
    baseUrl: frontendEnv.VITE_API_BASE_URL || 'http://localhost:3000'
  };
  
  console.log(`${colors.blue}⚙️  Backend Configuration:${colors.reset}`);
  console.log(`  API_VERSION: ${backendConfig.apiVersion}`);
  console.log(`  API_PREFIX:  ${backendConfig.apiPrefix}`);
  console.log(`  PORT:        ${backendConfig.port}\n`);
  
  console.log(`${colors.blue}⚙️  Frontend Configuration:${colors.reset}`);
  console.log(`  VITE_API_VERSION: ${frontendConfig.apiVersion}`);
  console.log(`  VITE_API_PREFIX:  ${frontendConfig.apiPrefix}`);
  console.log(`  VITE_API_BASE_URL: ${frontendConfig.baseUrl}\n`);
  
  // Validation checks
  const issues = [];
  const warnings = [];
  
  // Check API version compatibility
  if (backendConfig.apiVersion !== frontendConfig.apiVersion) {
    issues.push(`API version mismatch: Backend(${backendConfig.apiVersion}) vs Frontend(${frontendConfig.apiVersion})`);
  }
  
  // Check API prefix compatibility
  if (backendConfig.apiPrefix !== frontendConfig.apiPrefix) {
    issues.push(`API prefix mismatch: Backend(${backendConfig.apiPrefix}) vs Frontend(${frontendConfig.apiPrefix})`);
  }
  
  // Check base URL port compatibility
  const expectedBaseUrl = `http://localhost:${backendConfig.port}`;
  if (frontendConfig.baseUrl !== expectedBaseUrl) {
    warnings.push(`Base URL might be incorrect: Expected(${expectedBaseUrl}) vs Configured(${frontendConfig.baseUrl})`);
  }
  
  // Check for missing configurations
  if (!backendEnv.API_VERSION) {
    warnings.push('Backend API_VERSION not explicitly set (using default: v1)');
  }
  
  if (!backendEnv.API_PREFIX) {
    warnings.push('Backend API_PREFIX not explicitly set (using default: /api)');
  }
  
  if (!frontendEnv.VITE_API_VERSION) {
    warnings.push('Frontend VITE_API_VERSION not set (using default: v1)');
  }
  
  if (!frontendEnv.VITE_API_PREFIX) {
    warnings.push('Frontend VITE_API_PREFIX not set (using default: /api)');
  }
  
  // Report results
  console.log(`${colors.cyan}📊 Validation Results:${colors.reset}\n`);
  
  if (issues.length === 0) {
    console.log(`${colors.green}✅ Configuration Compatibility: PASSED${colors.reset}`);
    console.log(`   Frontend and backend API configurations are compatible.\n`);
  } else {
    console.log(`${colors.red}❌ Configuration Compatibility: FAILED${colors.reset}`);
    issues.forEach(issue => {
      console.log(`${colors.red}   - ${issue}${colors.reset}`);
    });
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log(`${colors.yellow}⚠️  Warnings:${colors.reset}`);
    warnings.forEach(warning => {
      console.log(`${colors.yellow}   - ${warning}${colors.reset}`);
    });
    console.log();
  }
  
  // Generate expected API paths
  const apiPath = `${backendConfig.apiPrefix}/${backendConfig.apiVersion}`;
  console.log(`${colors.cyan}🔗 Expected API Endpoints:${colors.reset}`);
  console.log(`   Base URL: ${frontendConfig.baseUrl}`);
  console.log(`   API Path: ${apiPath}`);
  console.log(`   Full URL: ${frontendConfig.baseUrl}${apiPath}`);
  console.log(`   Example:  ${frontendConfig.baseUrl}${apiPath}/projects/info\n`);
  
  // Recommendations
  if (issues.length > 0 || warnings.length > 0) {
    console.log(`${colors.cyan}💡 Recommendations:${colors.reset}`);
    
    if (issues.length > 0) {
      console.log(`${colors.yellow}   1. Update frontend .env to match backend configuration:${colors.reset}`);
      console.log(`      VITE_API_VERSION=${backendConfig.apiVersion}`);
      console.log(`      VITE_API_PREFIX=${backendConfig.apiPrefix}`);
      console.log();
    }
    
    if (warnings.some(w => w.includes('not explicitly set'))) {
      console.log(`${colors.yellow}   2. Explicitly set all API configuration values in .env files${colors.reset}`);
      console.log(`      to avoid relying on defaults.\n`);
    }
    
    console.log(`${colors.yellow}   3. Run this script after any configuration changes${colors.reset}`);
    console.log(`      to ensure compatibility.\n`);
  }
  
  return issues.length === 0;
}

/**
 * Main execution
 */
function main() {
  try {
    const isValid = validateApiConfig();
    
    if (isValid) {
      console.log(`${colors.green}🎉 All API configurations are valid and compatible!${colors.reset}`);
      process.exit(0);
    } else {
      console.log(`${colors.red}💥 API configuration validation failed!${colors.reset}`);
      console.log(`${colors.red}   Please fix the issues above before proceeding.${colors.reset}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`${colors.red}❌ Validation Error: ${error.message}${colors.reset}`);
    process.exit(1);
  }
}

// Run validation if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { validateApiConfig, parseEnvFile };