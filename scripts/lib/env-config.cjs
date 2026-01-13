#!/usr/bin/env node

/**
 * Environment Configuration Library (CommonJS)
 * 用于读取项目环境配置的共享函数库
 */

const fs = require('fs');
const path = require('path');

/**
 * 获取项目根目录
 */
function getProjectRoot() {
    return path.resolve(__dirname, '../..');
}

/**
 * 从 .env 文件读取配置
 */
function readEnvConfig(envFile, key, defaultValue = '') {
    try {
        if (!fs.existsSync(envFile)) {
            return defaultValue;
        }

        const content = fs.readFileSync(envFile, 'utf8');
        const lines = content.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('#') || !trimmedLine.includes('=')) {
                continue;
            }
            
            const [envKey, ...valueParts] = trimmedLine.split('=');
            if (envKey.trim() === key) {
                return valueParts.join('=').trim();
            }
        }
        
        return defaultValue;
    } catch (error) {
        console.warn(`Warning: Could not read ${envFile}: ${error.message}`);
        return defaultValue;
    }
}

/**
 * 获取所有端口配置
 */
function getAllPorts() {
    const projectRoot = getProjectRoot();
    const frontendEnv = path.join(projectRoot, 'app', '.env');
    const backendEnv = path.join(projectRoot, 'server', '.env');
    
    const frontendPort = readEnvConfig(frontendEnv, 'VITE_DEV_PORT', '5173');
    const backendPort = readEnvConfig(backendEnv, 'PORT', '3001');
    const frontendApiUrl = readEnvConfig(frontendEnv, 'VITE_API_BASE_URL', `http://localhost:${backendPort}`);
    const backendCorsOrigin = readEnvConfig(backendEnv, 'CORS_ORIGIN', `http://localhost:${frontendPort}`);
    
    return {
        frontendPort: parseInt(frontendPort, 10),
        backendPort: parseInt(backendPort, 10),
        frontendApiUrl,
        backendCorsOrigin
    };
}

/**
 * 构建服务 URL
 */
function getFrontendUrl() {
    const { frontendPort } = getAllPorts();
    return `http://localhost:${frontendPort}`;
}

function getBackendUrl() {
    const { backendPort } = getAllPorts();
    return `http://localhost:${backendPort}`;
}

function getBackendHealthUrl() {
    const { backendPort } = getAllPorts();
    return `http://localhost:${backendPort}/health`;
}

function getBackendApiUrl() {
    const { backendPort } = getAllPorts();
    return `http://localhost:${backendPort}/api/v1`;
}

/**
 * 显示端口配置信息
 */
function showPortConfig() {
    const projectRoot = getProjectRoot();
    const frontendEnv = path.join(projectRoot, 'app', '.env');
    const backendEnv = path.join(projectRoot, 'server', '.env');
    const config = getAllPorts();
    
    console.log('📋 端口配置信息：');
    console.log(`  - 前端端口: ${config.frontendPort} (来源: ${frontendEnv})`);
    console.log(`  - 后端端口: ${config.backendPort} (来源: ${backendEnv})`);
    console.log(`  - 前端 API URL: ${config.frontendApiUrl}`);
    console.log(`  - 后端 CORS 源: ${config.backendCorsOrigin}`);
}

/**
 * 验证端口配置一致性
 */
function validatePortConfig() {
    const config = getAllPorts();
    let issues = 0;
    
    // 检查前端 API URL 是否与后端端口匹配
    if (!config.frontendApiUrl.includes(`:${config.backendPort}`)) {
        console.log(`⚠️  警告: 前端 API URL (${config.frontendApiUrl}) 与后端端口 (${config.backendPort}) 不匹配`);
        issues++;
    }
    
    // 检查后端 CORS 源是否与前端端口匹配
    if (!config.backendCorsOrigin.includes(`:${config.frontendPort}`)) {
        console.log(`⚠️  警告: 后端 CORS 源 (${config.backendCorsOrigin}) 与前端端口 (${config.frontendPort}) 不匹配`);
        issues++;
    }
    
    if (issues === 0) {
        console.log('✅ 端口配置验证通过');
        return true;
    } else {
        console.log(`❌ 发现 ${issues} 个端口配置问题`);
        return false;
    }
}

module.exports = {
    getProjectRoot,
    readEnvConfig,
    getAllPorts,
    getFrontendUrl,
    getBackendUrl,
    getBackendHealthUrl,
    getBackendApiUrl,
    showPortConfig,
    validatePortConfig
};

// 如果直接运行此脚本，显示配置信息
if (require.main === module) {
    showPortConfig();
    console.log();
    validatePortConfig();
}