#!/usr/bin/env node

/**
 * Debug Configuration Test Script
 * 
 * Tests and validates VSCode debug configurations for both
 * frontend and backend environments.
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

console.log('🐛 Testing Debug Configurations...\n');

/**
 * Check if VSCode debug configuration exists
 */
function validateDebugConfig() {
  console.log('📋 Checking Debug Configuration Files...');
  
  const launchPath = '.vscode/launch.json';
  const settingsPath = '.vscode/settings.json';
  
  let valid = true;
  
  if (fs.existsSync(launchPath)) {
    console.log('✅ VSCode launch.json exists');
    
    try {
      const launchConfig = JSON.parse(fs.readFileSync(launchPath, 'utf8'));
      
      // Check for required configurations
      const requiredConfigs = [
        'Debug Backend',
        'Debug Frontend',
        'Debug Full Stack'
      ];
      
      const availableConfigs = launchConfig.configurations?.map(c => c.name) || [];
      const availableCompounds = launchConfig.compounds?.map(c => c.name) || [];
      const allConfigs = [...availableConfigs, ...availableCompounds];
      
      requiredConfigs.forEach(configName => {
        if (allConfigs.includes(configName)) {
          console.log(`✅ Debug configuration found: ${configName}`);
        } else {
          console.log(`❌ Debug configuration missing: ${configName}`);
          valid = false;
        }
      });
      
    } catch (error) {
      console.log('❌ Invalid launch.json format');
      valid = false;
    }
  } else {
    console.log('❌ VSCode launch.json missing');
    valid = false;
  }
  
  if (fs.existsSync(settingsPath)) {
    console.log('✅ VSCode settings.json exists');
  } else {
    console.log('⚠️  VSCode settings.json missing (optional)');
  }
  
  return valid;
}

/**
 * Test backend debug setup
 */
function testBackendDebug() {
  console.log('\n🖥️  Testing Backend Debug Setup...');
  
  try {
    // Check if backend can start with debug flags
    console.log('Testing Node.js inspector support...');
    execSync('node --version', { stdio: 'pipe' });
    console.log('✅ Node.js available');
    
    // Check if nodemon is available
    execSync('cd server && npm list nodemon', { stdio: 'pipe' });
    console.log('✅ Nodemon available for hot reload debugging');
    
    // Test debug port availability
    try {
      execSync('lsof -ti:9229', { stdio: 'pipe' });
      console.log('⚠️  Debug port 9229 is in use');
      return false;
    } catch (error) {
      console.log('✅ Debug port 9229 is available');
    }
    
    // Check backend source files
    const backendSrc = 'server/src';
    if (fs.existsSync(backendSrc)) {
      console.log('✅ Backend source files available');
    } else {
      console.log('❌ Backend source files missing');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Backend debug test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test frontend debug setup
 */
function testFrontendDebug() {
  console.log('\n🌐 Testing Frontend Debug Setup...');
  
  try {
    // Check Vite configuration
    const viteConfigPath = 'app/vite.config.js';
    if (fs.existsSync(viteConfigPath)) {
      console.log('✅ Vite configuration exists');
      
      const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
      if (viteConfig.includes('sourcemap')) {
        console.log('✅ Source maps configured in Vite');
      } else {
        console.log('⚠️  Source maps may not be configured');
      }
    } else {
      console.log('❌ Vite configuration missing');
      return false;
    }
    
    // Check frontend source files
    const frontendSrc = 'app/src';
    if (fs.existsSync(frontendSrc)) {
      console.log('✅ Frontend source files available');
    } else {
      console.log('❌ Frontend source files missing');
      return false;
    }
    
    // Check if Chrome debugging port is available
    try {
      execSync('lsof -ti:9222', { stdio: 'pipe' });
      console.log('⚠️  Chrome debug port 9222 is in use');
    } catch (error) {
      console.log('✅ Chrome debug port 9222 is available');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Frontend debug test failed: ${error.message}`);
    return false;
  }
}

/**
 * Test source map generation
 */
function testSourceMaps() {
  console.log('\n🗺️  Testing Source Map Generation...');
  
  try {
    // Test if frontend can build with source maps
    console.log('Testing frontend build with source maps...');
    execSync('cd app && npm run build', { stdio: 'pipe' });
    
    // Check if source maps were generated
    const distPath = 'app/dist';
    if (fs.existsSync(distPath)) {
      const files = fs.readdirSync(distPath, { recursive: true });
      const sourceMapFiles = files.filter(file => 
        typeof file === 'string' && file.endsWith('.map')
      );
      
      if (sourceMapFiles.length > 0) {
        console.log(`✅ Source maps generated: ${sourceMapFiles.length} files`);
        return true;
      } else {
        console.log('❌ No source map files found');
        return false;
      }
    } else {
      console.log('❌ Build output directory not found');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Source map test failed: ${error.message}`);
    return false;
  }
}

/**
 * Provide debugging instructions
 */
function provideInstructions() {
  console.log('\n💡 Debug Setup Instructions:');
  
  console.log('\n🖥️  Backend Debugging:');
  console.log('1. Open VSCode');
  console.log('2. Go to Run and Debug (Ctrl+Shift+D)');
  console.log('3. Select "Debug Backend" or "Debug Full Stack"');
  console.log('4. Set breakpoints in server/src/ files');
  console.log('5. Press F5 to start debugging');
  
  console.log('\n🌐 Frontend Debugging:');
  console.log('1. Ensure frontend dev server is running (npm run dev:client)');
  console.log('2. In VSCode, select "Debug Frontend" configuration');
  console.log('3. Set breakpoints in app/src/ files');
  console.log('4. Press F5 to launch Chrome with debugging');
  
  console.log('\n🔄 Full Stack Debugging:');
  console.log('1. Select "Debug Full Stack" configuration');
  console.log('2. This will start both backend and frontend debugging');
  console.log('3. Set breakpoints in both frontend and backend code');
  console.log('4. Debug API calls end-to-end');
  
  console.log('\n🛠️  Alternative Methods:');
  console.log('Backend: npm run debug (starts with --inspect)');
  console.log('Frontend: Use browser DevTools (F12)');
  console.log('Attach: Use "Debug Backend (Attach)" for running processes');
}

/**
 * Clean up test artifacts
 */
function cleanup() {
  try {
    // Remove build artifacts if they were created for testing
    const distPath = 'app/dist';
    if (fs.existsSync(distPath)) {
      console.log('\n🧹 Cleaning up test artifacts...');
      execSync(`rm -rf ${distPath}`, { stdio: 'pipe' });
      console.log('✅ Test artifacts cleaned up');
    }
  } catch (error) {
    console.log('⚠️  Could not clean up test artifacts');
  }
}

/**
 * Main test function
 */
function main() {
  const results = [
    validateDebugConfig(),
    testBackendDebug(),
    testFrontendDebug(),
    testSourceMaps()
  ];

  cleanup();

  const allPassed = results.every(result => result);

  console.log('\n' + '='.repeat(50));
  
  if (allPassed) {
    console.log('🎉 All debug tests passed!');
    console.log('\n✅ Debug environment is ready for development.');
    provideInstructions();
    process.exit(0);
  } else {
    console.log('❌ Some debug tests failed.');
    console.log('\n💡 Common solutions:');
    console.log('   - Ensure VSCode is installed with debugging extensions');
    console.log('   - Check that Node.js and npm are properly installed');
    console.log('   - Verify that source maps are enabled in Vite config');
    console.log('   - Make sure debug ports (9229, 9222) are available');
    provideInstructions();
    process.exit(1);
  }
}

// Run the debug tests
try {
  main();
} catch (error) {
  console.error('❌ Debug test script failed:', error.message);
  process.exit(1);
}