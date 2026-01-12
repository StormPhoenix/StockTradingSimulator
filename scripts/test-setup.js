#!/usr/bin/env node

/**
 * Development Environment Test Setup
 * 
 * Validates that the development environment is properly configured
 * before starting the concurrent development servers.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Testing Development Environment Setup...\n');

/**
 * Check if a file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Check if a directory exists
 */
function dirExists(dirPath) {
  return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
}

/**
 * Run a command and return success status
 */
function runCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description}`);
    return true;
  } catch (error) {
    console.log(`❌ ${description}`);
    return false;
  }
}

/**
 * Check if a port is available
 */
function checkPort(port, description) {
  try {
    execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    console.log(`⚠️  Port ${port} is in use (${description})`);
    return false;
  } catch (error) {
    console.log(`✅ Port ${port} is available (${description})`);
    return true;
  }
}

/**
 * Validate environment files
 */
function validateEnvironment() {
  console.log('📋 Checking Environment Configuration...');
  
  const checks = [
    {
      path: 'server/.env',
      description: 'Backend environment file exists'
    },
    {
      path: 'app/.env',
      description: 'Frontend environment file exists'
    },
    {
      path: 'server/.env.example',
      description: 'Backend environment template exists'
    },
    {
      path: 'app/.env.example',
      description: 'Frontend environment template exists'
    }
  ];

  let allPassed = true;
  
  checks.forEach(check => {
    if (fileExists(check.path)) {
      console.log(`✅ ${check.description}`);
    } else {
      console.log(`❌ ${check.description}`);
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Validate project structure
 */
function validateStructure() {
  console.log('\n📁 Checking Project Structure...');
  
  const directories = [
    'server/src',
    'server/src/config',
    'server/src/controllers',
    'server/src/models',
    'server/src/routes',
    'server/src/services',
    'app/src',
    'app/src/components',
    'app/src/services',
    'app/public'
  ];

  let allPassed = true;
  
  directories.forEach(dir => {
    if (dirExists(dir)) {
      console.log(`✅ Directory exists: ${dir}`);
    } else {
      console.log(`❌ Directory missing: ${dir}`);
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Validate dependencies
 */
function validateDependencies() {
  console.log('\n📦 Checking Dependencies...');
  
  const checks = [
    {
      command: 'cd server && npm list --depth=0 | grep express',
      description: 'Backend Express.js dependency'
    },
    {
      command: 'cd server && npm list --depth=0 | grep mongodb',
      description: 'Backend MongoDB dependency'
    },
    {
      command: 'cd app && npm list --depth=0 | grep vue',
      description: 'Frontend Vue.js dependency'
    },
    {
      command: 'cd app && npm list --depth=0 | grep vite',
      description: 'Frontend Vite dependency'
    }
  ];

  let allPassed = true;
  
  checks.forEach(check => {
    if (!runCommand(check.command, check.description)) {
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Check port availability
 */
function validatePorts() {
  console.log('\n🔌 Checking Port Availability...');
  
  const ports = [
    { port: 3000, description: 'Backend server' },
    { port: 5173, description: 'Frontend dev server' }
  ];

  let allPassed = true;
  
  ports.forEach(({ port, description }) => {
    if (!checkPort(port, description)) {
      allPassed = false;
    }
  });

  return allPassed;
}

/**
 * Test MongoDB connection
 */
function testMongoConnection() {
  console.log('\n🗄️  Testing MongoDB Connection...');
  
  try {
    // Check if MongoDB port is in use
    execSync('lsof -ti:27017', { stdio: 'pipe' });
    console.log('✅ MongoDB process detected on port 27017');
    return true;
  } catch (error) {
    console.log('❌ MongoDB not running on port 27017');
    console.log('   Make sure MongoDB is running:');
    console.log('   cd docker && docker-compose up -d mongodb');
    return false;
  }
}

/**
 * Main validation function
 */
function main() {
  const results = [
    validateEnvironment(),
    validateStructure(),
    validateDependencies(),
    validatePorts(),
    testMongoConnection()
  ];

  const allPassed = results.every(result => result);

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All tests passed! Development environment is ready.');
    console.log('\n💡 You can now run:');
    console.log('   npm run dev        # Start both frontend and backend');
    console.log('   npm run dev:server # Start backend only');
    console.log('   npm run dev:client # Start frontend only');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('\n💡 Common solutions:');
    console.log('   npm run install:all  # Install all dependencies');
    console.log('   cp server/.env.example server/.env');
    console.log('   cp app/.env.example app/.env');
    console.log('   cd docker && docker-compose up -d mongodb');
    process.exit(1);
  }
}

// Run the validation
try {
  main();
} catch (error) {
  console.error('❌ Validation script failed:', error.message);
  process.exit(1);
}