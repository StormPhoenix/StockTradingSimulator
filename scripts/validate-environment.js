#!/usr/bin/env node

/**
 * Environment Validation Script
 * 
 * Validates environment configuration and provides recommendations
 * for optimal development setup.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Validating Environment Configuration...\n');

/**
 * Parse environment file
 */
function parseEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const env = {};
  
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        env[key] = valueParts.join('=');
      }
    }
  });
  
  return env;
}

/**
 * Validate backend environment
 */
function validateBackendEnv() {
  console.log('🖥️  Backend Environment:');
  
  const env = parseEnvFile('server/.env');
  if (!env) {
    console.log('❌ server/.env file not found');
    return false;
  }

  const requiredVars = ['PORT', 'MONGODB_URI', 'NODE_ENV'];
  const recommendedVars = ['HOST', 'CORS_ORIGIN', 'JWT_SECRET'];
  
  let valid = true;
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (env[varName]) {
      console.log(`✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`❌ ${varName}: Missing (required)`);
      valid = false;
    }
  });
  
  // Check recommended variables
  recommendedVars.forEach(varName => {
    if (env[varName]) {
      console.log(`✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: Missing (recommended)`);
    }
  });
  
  // Validate specific values
  if (env.PORT) {
    const port = parseInt(env.PORT);
    if (port < 1024 || port > 65535) {
      console.log(`⚠️  PORT: ${port} is outside recommended range (1024-65535)`);
    }
  }
  
  return valid;
}

/**
 * Validate frontend environment
 */
function validateFrontendEnv() {
  console.log('\n🌐 Frontend Environment:');
  
  const env = parseEnvFile('app/.env');
  if (!env) {
    console.log('❌ app/.env file not found');
    return false;
  }

  const requiredVars = ['VITE_API_BASE_URL'];
  const recommendedVars = ['VITE_DEV_PORT', 'VITE_APP_TITLE', 'VITE_API_TIMEOUT'];
  
  let valid = true;
  
  // Check required variables
  requiredVars.forEach(varName => {
    if (env[varName]) {
      console.log(`✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`❌ ${varName}: Missing (required)`);
      valid = false;
    }
  });
  
  // Check recommended variables
  recommendedVars.forEach(varName => {
    if (env[varName]) {
      console.log(`✅ ${varName}: ${env[varName]}`);
    } else {
      console.log(`⚠️  ${varName}: Missing (recommended)`);
    }
  });
  
  // Validate API URL format
  if (env.VITE_API_BASE_URL) {
    try {
      new URL(env.VITE_API_BASE_URL);
    } catch (error) {
      console.log(`❌ VITE_API_BASE_URL: Invalid URL format`);
      valid = false;
    }
  }
  
  return valid;
}

/**
 * Check port conflicts
 */
function checkPortConflicts() {
  console.log('\n🔌 Port Configuration:');
  
  const backendEnv = parseEnvFile('server/.env');
  const frontendEnv = parseEnvFile('app/.env');
  
  const backendPort = backendEnv?.PORT || '3000';
  const frontendPort = frontendEnv?.VITE_DEV_PORT || '5173';
  
  console.log(`Backend Port: ${backendPort}`);
  console.log(`Frontend Port: ${frontendPort}`);
  
  if (backendPort === frontendPort) {
    console.log('❌ Port conflict: Backend and frontend using same port');
    return false;
  }
  
  // Check if frontend API URL matches backend port
  const apiUrl = frontendEnv?.VITE_API_BASE_URL;
  if (apiUrl && apiUrl.includes(`:${backendPort}`)) {
    console.log('✅ Frontend API URL matches backend port');
  } else {
    console.log('⚠️  Frontend API URL may not match backend port');
  }
  
  return true;
}

/**
 * Provide recommendations
 */
function provideRecommendations() {
  console.log('\n💡 Recommendations:');
  
  const backendEnv = parseEnvFile('server/.env');
  const frontendEnv = parseEnvFile('app/.env');
  
  const recommendations = [];
  
  // Check for development optimizations
  if (backendEnv?.NODE_ENV !== 'development') {
    recommendations.push('Set NODE_ENV=development for better development experience');
  }
  
  if (!frontendEnv?.VITE_DEBUG) {
    recommendations.push('Set VITE_DEBUG=true to enable frontend debugging');
  }
  
  if (!backendEnv?.DEBUG) {
    recommendations.push('Set DEBUG=true to enable backend debugging');
  }
  
  // Check for security considerations
  if (backendEnv?.JWT_SECRET === 'your-jwt-secret-key-here') {
    recommendations.push('Change JWT_SECRET from default value');
  }
  
  if (recommendations.length === 0) {
    console.log('✅ Configuration looks good!');
  } else {
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });
  }
}

/**
 * Main validation function
 */
function main() {
  const backendValid = validateBackendEnv();
  const frontendValid = validateFrontendEnv();
  const portsValid = checkPortConflicts();
  
  provideRecommendations();
  
  console.log('\n' + '='.repeat(50));
  
  if (backendValid && frontendValid && portsValid) {
    console.log('🎉 Environment validation passed!');
    process.exit(0);
  } else {
    console.log('❌ Environment validation failed. Please fix the issues above.');
    console.log('\n💡 Quick fixes:');
    console.log('   cp server/.env.example server/.env');
    console.log('   cp app/.env.example app/.env');
    console.log('   # Then edit the .env files with your configuration');
    process.exit(1);
  }
}

// Run the validation
main();