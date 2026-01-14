# API 配置管理指南

## 概述

本指南说明如何正确配置和管理前后端 API 配置，避免硬编码问题并确保配置同步。

## 🚨 问题背景

### 之前的问题
- **硬编码 API 路径** - 前端代码中直接写死 `/api/v1/` 路径
- **配置不同步** - 后端修改 API 版本或前缀时，前端无法自动适应
- **维护困难** - 需要手动同步多个文件中的配置

### 解决方案
- **集中配置管理** - 统一的配置文件和环境变量
- **动态端点生成** - 基于配置自动生成 API 端点
- **配置验证工具** - 自动检查前后端配置兼容性

## 📁 配置文件结构

```
project/
├── server/.env                 # 后端环境配置
├── app/.env                   # 前端环境配置
├── app/src/config/api.js      # 前端 API 配置管理
└── scripts/validate-api-config.js  # 配置验证脚本
```

## ⚙️ 配置详解

### 后端配置 (`server/.env`)

```bash
# API Configuration
API_VERSION=v1          # API 版本号
API_PREFIX=/api         # API 路径前缀
PORT=3000              # 服务器端口
```

### 前端配置 (`app/.env`)

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:3000  # 后端服务地址
VITE_API_PREFIX=/api                     # API 路径前缀
VITE_API_VERSION=v1                      # API 版本号
VITE_API_TIMEOUT=10000                   # 请求超时时间
```

### 配置映射关系

| 后端配置 | 前端配置 | 说明 |
|---------|---------|------|
| `API_VERSION` | `VITE_API_VERSION` | API 版本，必须保持一致 |
| `API_PREFIX` | `VITE_API_PREFIX` | API 前缀，必须保持一致 |
| `PORT` | `VITE_API_BASE_URL` | 端口需要匹配 |

## 🔧 使用方法

### 1. 前端 API 配置 (`app/src/config/api.js`)

```javascript
// 自动读取环境变量
export const apiConfig = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  prefix: import.meta.env.VITE_API_PREFIX || '/api',
  version: import.meta.env.VITE_API_VERSION || 'v1',
  
  // 动态生成完整 API 路径
  get apiPath() {
    return `${this.prefix}/${this.version}`;
  }
};

// 端点构建器
export const apiEndpoints = {
  build(path) {
    return `${apiConfig.apiPath}${path}`;
  },
  
  projects: {
    info: () => apiEndpoints.build('/projects/info'),
    list: () => apiEndpoints.build('/projects'),
    byId: (id) => apiEndpoints.build(`/projects/${id}`)
  }
};
```

### 2. 服务中使用端点

```javascript
// ❌ 错误方式 - 硬编码
const response = await api.get('/api/v1/projects/info');

// ✅ 正确方式 - 使用配置
import { apiEndpoints } from '../config/api.js';
const response = await api.get(apiEndpoints.projects.info());
```

### 3. 配置验证

```bash
# 验证前后端配置兼容性
npm run validate:api

# 或直接运行脚本
node scripts/validate-api-config.js
```

## 🔍 配置验证工具

### 验证内容
- ✅ API 版本兼容性检查
- ✅ API 前缀一致性检查  
- ✅ 基础 URL 端口匹配检查
- ✅ 缺失配置警告
- ✅ 生成预期端点示例

### 验证输出示例

```bash
🔍 API Configuration Validation

📋 Configuration Files:
  Backend:  /project/server/.env
  Frontend: /project/app/.env

⚙️ Backend Configuration:
  API_VERSION: v1
  API_PREFIX:  /api
  PORT:        3000

⚙️ Frontend Configuration:
  VITE_API_VERSION: v1
  VITE_API_PREFIX:  /api
  VITE_API_BASE_URL: http://localhost:3000

📊 Validation Results:
✅ Configuration Compatibility: PASSED

🔗 Expected API Endpoints:
   Base URL: http://localhost:3000
   API Path: /api/v1
   Example:  http://localhost:3000/api/v1/projects/info

🎉 All API configurations are valid and compatible!
```

## 🚀 最佳实践

### 1. 配置更新流程

1. **修改后端配置** - 更新 `server/.env`
2. **同步前端配置** - 更新 `app/.env` 中对应的 `VITE_*` 变量
3. **运行验证** - 执行 `npm run validate:api`
4. **重启服务** - 重启前后端服务应用新配置

### 2. 环境特定配置

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:3000
VITE_API_VERSION=v1

# 测试环境  
VITE_API_BASE_URL=http://test-api.example.com
VITE_API_VERSION=v1

# 生产环境
VITE_API_BASE_URL=https://api.example.com
VITE_API_VERSION=v2
```

### 3. 版本升级策略

```bash
# 升级到 v2 API
# 1. 后端支持 v2
API_VERSION=v2

# 2. 前端配置同步
VITE_API_VERSION=v2

# 3. 验证配置
npm run validate:api

# 4. 测试功能
npm run test
```

## 🛡️ 错误处理

### 常见配置错误

1. **版本不匹配**
   ```
   ❌ API version mismatch: Backend(v2) vs Frontend(v1)
   ```
   **解决**: 同步 `API_VERSION` 和 `VITE_API_VERSION`

2. **前缀不匹配**
   ```
   ❌ API prefix mismatch: Backend(/rest) vs Frontend(/api)
   ```
   **解决**: 同步 `API_PREFIX` 和 `VITE_API_PREFIX`

3. **端口不匹配**
   ```
   ⚠️ Base URL might be incorrect: Expected(http://localhost:3001) vs Configured(http://localhost:3000)
   ```
   **解决**: 更新 `VITE_API_BASE_URL` 中的端口

### 调试技巧

```javascript
// 在浏览器控制台查看当前配置
import { apiConfig } from './src/config/api.js';
console.log('API Config:', apiConfig);
console.log('API Path:', apiConfig.apiPath);
```

## 📊 配置管理命令

```bash
# 验证 API 配置
npm run validate:api

# 验证环境配置
npm run validate:env

# 健康检查
npm run health:check

# 重启服务（应用新配置）
npm run restart
```

## 🔄 迁移指南

### 从硬编码迁移到配置化

1. **识别硬编码** - 搜索项目中的 `/api/v1/` 字符串
2. **添加配置** - 在 `.env` 文件中添加相应配置
3. **更新代码** - 使用 `apiEndpoints` 替换硬编码路径
4. **验证功能** - 运行测试确保功能正常
5. **配置验证** - 运行 `npm run validate:api`

### 示例迁移

```javascript
// 迁移前
const getProjects = () => api.get('/api/v1/projects');
const getProject = (id) => api.get(`/api/v1/projects/${id}`);

// 迁移后
import { apiEndpoints } from '../config/api.js';
const getProjects = () => api.get(apiEndpoints.projects.list());
const getProject = (id) => api.get(apiEndpoints.projects.byId(id));
```

## 🎯 总结

通过实施这套配置管理方案：

- ✅ **消除硬编码** - 所有 API 路径都基于配置生成
- ✅ **确保同步** - 自动验证前后端配置兼容性
- ✅ **简化维护** - 集中管理，一处修改，处处生效
- ✅ **支持多环境** - 不同环境使用不同配置
- ✅ **提高可靠性** - 减少配置错误导致的问题

这样的设计大大提高了项目的可维护性和可靠性，避免了因配置不同步导致的问题。