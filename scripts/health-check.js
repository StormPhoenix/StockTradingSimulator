#!/usr/bin/env node

/**
 * Health Check Script
 * 
 * Performs health checks on running services and provides
 * status information for the development environment.
 */

const http = require('http');
const https = require('https');
const { execSync } = require('child_process');
const { getFrontendUrl, getBackendUrl, getBackendHealthUrl, getBackendApiUrl } = require('./lib/env-config.cjs');

console.log('🏥 Running Health Checks...\n');

/**
 * Make HTTP request with timeout
 */
function makeRequest(url, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data,
          headers: res.headers
        });
      });
    });
    
    req.setTimeout(timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.on('error', reject);
  });
}

/**
 * Check if port is in use
 */
function checkPort(port) {
  try {
    const result = execSync(`lsof -ti:${port}`, { stdio: 'pipe' });
    return result.toString().trim() !== '';
  } catch (error) {
    return false;
  }
}

/**
 * Check backend health
 */
async function checkBackend() {
  console.log('🖥️  Backend Server:');
  
  const port = 3000; // Default backend port
  const baseUrl = `http://localhost:${port}`;
  
  // Check if port is in use
  if (!checkPort(port)) {
    console.log(`❌ Backend server not running on port ${port}`);
    return false;
  }
  
  console.log(`✅ Backend server detected on port ${port}`);
  
  try {
    // Check health endpoint
    const healthResponse = await makeRequest(`${baseUrl}/health`);
    if (healthResponse.status === 200) {
      console.log('✅ Health endpoint responding');
    } else {
      console.log(`⚠️  Health endpoint returned status ${healthResponse.status}`);
    }
    
    // Check API endpoint
    const apiResponse = await makeRequest(`${baseUrl}/api/v1/projects/info`);
    if (apiResponse.status === 200) {
      console.log('✅ API endpoint responding');
      
      // Parse and display project info
      try {
        const data = JSON.parse(apiResponse.data);
        if (data.success && data.data) {
          console.log(`   Project: ${data.data.name}`);
          console.log(`   Version: ${data.data.version}`);
        }
      } catch (parseError) {
        console.log('⚠️  API response format unexpected');
      }
    } else {
      console.log(`❌ API endpoint returned status ${apiResponse.status}`);
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Backend health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Check frontend health
 */
async function checkFrontend() {
  console.log('\n🌐 Frontend Server:');
  
  const port = 5173; // Default frontend port
  const baseUrl = `http://localhost:${port}`;
  
  // Check if port is in use
  if (!checkPort(port)) {
    console.log(`❌ Frontend server not running on port ${port}`);
    return false;
  }
  
  console.log(`✅ Frontend server detected on port ${port}`);
  
  try {
    // Check if frontend is responding
    const response = await makeRequest(baseUrl);
    if (response.status === 200) {
      console.log('✅ Frontend server responding');
      
      // Check if it's a Vite dev server
      if (response.data.includes('vite') || response.headers['server']?.includes('vite')) {
        console.log('✅ Vite development server detected');
      }
      
      return true;
    } else {
      console.log(`⚠️  Frontend returned status ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Frontend health check failed: ${error.message}`);
    return false;
  }
}

/**
 * Check MongoDB health
 */
async function checkMongoDB() {
  console.log('\n🗄️  MongoDB Database:');
  
  try {
    // Check if MongoDB port is in use
    if (!checkPort(27017)) {
      console.log('❌ MongoDB not running on port 27017');
      return false;
    }
    
    console.log('✅ MongoDB process detected on port 27017');
    
    // Try to connect using the server's database config
    execSync('cd server && node -e "require(\'./src/config/database.js\').connectDatabase().then(() => { console.log(\'Database connection successful\'); process.exit(0); }).catch(() => process.exit(1))"', { 
      stdio: 'pipe',
      timeout: 5000 
    });
    
    console.log('✅ Database connection successful');
    return true;
    
  } catch (error) {
    console.log('❌ Database connection failed');
    console.log('   Make sure MongoDB is running:');
    console.log('   cd docker && docker-compose up -d mongodb');
    return false;
  }
}

/**
 * Check system resources
 */
function checkSystemResources() {
  console.log('\n💻 System Resources:');
  
  try {
    // Check Node.js version
    const nodeVersion = execSync('node --version', { stdio: 'pipe' }).toString().trim();
    console.log(`✅ Node.js: ${nodeVersion}`);
    
    // Check npm version
    const npmVersion = execSync('npm --version', { stdio: 'pipe' }).toString().trim();
    console.log(`✅ npm: ${npmVersion}`);
    
    // Check available memory (macOS/Linux)
    try {
      const memInfo = execSync('free -h 2>/dev/null || vm_stat | head -5', { stdio: 'pipe' }).toString();
      console.log('✅ Memory information available');
    } catch (error) {
      console.log('⚠️  Memory information not available');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ System check failed: ${error.message}`);
    return false;
  }
}

/**
 * Provide service URLs
 */
function displayServiceUrls() {
  console.log('\n🔗 Service URLs:');
  
  const services = [
    { name: 'Frontend Application', url: getFrontendUrl() },
    { name: 'Backend API', url: `${getBackendApiUrl()}/projects/info` },
    { name: 'Backend Health', url: getBackendHealthUrl() },
    { name: 'MongoDB (if mongo-express)', url: 'http://localhost:8081' }
  ];
  
  services.forEach(service => {
    console.log(`   ${service.name}: ${service.url}`);
  });
}

/**
 * Main health check function
 */
async function main() {
  const results = await Promise.all([
    checkBackend(),
    checkFrontend(),
    checkMongoDB(),
    Promise.resolve(checkSystemResources())
  ]);
  
  const [backendOk, frontendOk, mongoOk, systemOk] = results;
  
  displayServiceUrls();
  
  console.log('\n' + '='.repeat(50));
  
  const allHealthy = results.every(result => result);
  
  if (allHealthy) {
    console.log('🎉 All services are healthy!');
    console.log('\n💡 Ready for development:');
    console.log(`   Frontend: ${getFrontendUrl()}`);
    console.log(`   Backend API: ${getBackendApiUrl()}/projects/info`);
    process.exit(0);
  } else {
    console.log('⚠️  Some services need attention.');
    console.log('\n💡 To start services:');
    console.log('   npm run dev        # Start both frontend and backend');
    console.log('   cd docker && docker-compose up -d mongodb  # Start MongoDB');
    process.exit(1);
  }
}

// Run the health check
main().catch(error => {
  console.error('❌ Health check script failed:', error);
  process.exit(1);
});