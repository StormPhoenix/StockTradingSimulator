# StockTradeSimulator TypeScript 迁移方案

## 概述

本文档详细描述了将 StockTradeSimulator 项目从 JavaScript 迁移到 TypeScript 的渐进式方案。该方案旨在提供更严格的类型检查，提升代码质量和开发体验，同时最小化迁移风险。

## 项目结构分析

### 前端 (Vue.js + Vite)
- **框架**: Vue 3 + Vite + Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP 客户端**: Axios
- **表单验证**: Vee-validate + Yup

### 后端 (Node.js + Express)
- **框架**: Express.js
- **数据库**: MongoDB + Mongoose
- **验证**: Joi
- **安全**: Helmet + CORS
- **工具**: UUID, Compression

## 迁移策略

### 核心原则
1. **渐进式迁移**: 分阶段进行，保持系统稳定运行
2. **向后兼容**: 确保 `.ts` 文件可以被 `.js` 文件正常导入
3. **风险控制**: 每个阶段完成后进行完整测试
4. **并行开发**: 前后端可以并行进行迁移

---

## 阶段 0：环境准备 (1-2天)

### 目标
建立 TypeScript 开发环境，配置编译和构建工具。

### 0.1 前端环境配置

#### 步骤 1: 安装 TypeScript 依赖
```bash
cd app
npm install -D typescript vue-tsc @types/node @vue/tsconfig
```

**依赖说明**:
- `typescript`: TypeScript 编译器
- `vue-tsc`: Vue 单文件组件的 TypeScript 类型检查
- `@types/node`: Node.js 类型定义
- `@vue/tsconfig`: Vue 官方 TypeScript 配置

#### 步骤 2: 创建 Vue 环境声明文件
```typescript
// app/env.d.ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// 环境变量类型定义
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_TITLE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

#### 步骤 3: 验证前端配置
```bash
# 检查 TypeScript 版本
npx tsc --version

# 验证 Vue TypeScript 支持
npx vue-tsc --noEmit
```

### 0.2 后端环境配置

#### 步骤 1: 安装 TypeScript 依赖
```bash
cd server
npm install -D typescript ts-node @types/node @types/express @types/mongoose @types/cors @types/helmet @types/morgan @types/compression @types/uuid @types/joi nodemon
```

**依赖说明**:
- `ts-node`: 直接运行 TypeScript 文件
- `@types/*`: 各个库的类型定义文件
- `nodemon`: 支持 TypeScript 的热重载

#### 步骤 2: 创建 nodemon 配置
```json
// server/nodemon.json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node src/app.ts"
}
```

#### 步骤 3: 验证后端配置
```bash
# 检查 TypeScript 版本
npx tsc --version

# 测试 ts-node
npx ts-node --version
```

### 常见问题解决

#### 问题 1: Vue 组件类型错误
**症状**: `.vue` 文件导入时出现类型错误
**解决方案**: 确保 `env.d.ts` 文件正确配置，并重启 IDE

#### 问题 2: 路径别名不生效
**症状**: `@/` 路径别名无法解析
**解决方案**: 检查 `tsconfig.json` 中的 `baseUrl` 和 `paths` 配置

#### 问题 3: Mongoose 类型冲突
**症状**: Mongoose 类型定义冲突
**解决方案**: 
```bash
npm install @types/mongoose@latest
# 或者使用特定版本
npm install @types/mongoose@^7.4.0
```

### 0.3 配置文件创建

#### 前端 `app/tsconfig.json`
```json
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue"],
  "exclude": ["src/**/__tests__/*"],
  "compilerOptions": {
    "composite": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 后端 `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 0.4 构建脚本更新

#### 前端 `app/package.json`
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "type-check": "vue-tsc --noEmit"
  }
}
```

#### 后端 `server/package.json`
```json
{
  "scripts": {
    "start": "node dist/app.js",
    "dev": "ts-node src/app.ts",
    "build": "tsc",
    "dev:watch": "ts-node --watch src/app.ts"
  }
}
```

---

## 阶段 1：类型定义基础 (2-3天)

### 目标
建立项目的核心类型定义体系，为后续迁移提供类型基础。

### 1.1 创建类型定义目录结构

#### 前端类型定义结构
```bash
# 创建类型定义目录
mkdir -p app/src/types

# 创建各个类型文件
touch app/src/types/{index,api,market,trader,stock,template,common,components}.ts
```

#### 后端类型定义结构
```bash
# 创建类型定义目录
mkdir -p server/src/types

# 创建各个类型文件
touch server/src/types/{index,api,models,services,common}.ts
```

### 1.2 核心类型定义实施

#### 步骤 1: API 响应类型 (`types/api.ts`)
```typescript
// 通用 API 响应接口
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  filename?: string;
}

// 分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// 错误响应接口
export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
  code?: string;
  details?: Record<string, any>;
}

// HTTP 状态码枚举
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}

// 请求方法类型
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
```

#### 步骤 2: 通用类型定义 (`types/common.ts`)
```typescript
// 基础实体接口
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 查询过滤器
export interface QueryFilter {
  search?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// 操作结果
export interface OperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// 验证结果
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}
```

#### 步骤 3: 市场环境类型 (`types/market.ts`)
```typescript
import type { BaseEntity } from './common';
import type { TraderConfig } from './trader';
import type { StockConfig } from './stock';

// 市场环境状态枚举
export enum MarketEnvironmentStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  ARCHIVED = 'archived'
}

// 市场环境接口
export interface MarketEnvironment extends BaseEntity {
  name: string;
  description: string;
  traders: TraderConfig[];
  stocks: StockConfig[];
  status: MarketEnvironmentStatus;
  statistics?: MarketStatistics;
}

// 市场统计信息
export interface MarketStatistics {
  totalTraders: number;
  totalStocks: number;
  totalCapital: number;
  totalMarketValue: number;
  averageTraderCapital: number;
}

// 创建市场环境请求
export interface MarketEnvironmentCreateRequest {
  name: string;
  description: string;
  traders: TraderConfigInput[];
  stocks: StockConfigInput[];
}

// 更新市场环境请求
export interface MarketEnvironmentUpdateRequest {
  name?: string;
  description?: string;
  status?: MarketEnvironmentStatus;
}

// 市场环境查询参数
export interface MarketEnvironmentQuery {
  status?: MarketEnvironmentStatus;
  search?: string;
  page?: number;
  limit?: number;
}

// 导出配置
export interface MarketExportConfig {
  format: 'json' | 'csv' | 'excel';
  includeStatistics: boolean;
  includeTraders: boolean;
  includeStocks: boolean;
}
```

### 1.3 类型定义最佳实践

#### 实践 1: 使用枚举替代字符串联合类型
```typescript
// ❌ 不推荐
export type Status = 'active' | 'inactive' | 'pending';

// ✅ 推荐
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending'
}
```

#### 实践 2: 使用泛型提高复用性
```typescript
// ✅ 通用列表响应
export interface ListResponse<T> extends ApiResponse<T[]> {
  total: number;
  hasMore: boolean;
}

// ✅ 通用创建请求
export interface CreateRequest<T> {
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
}
```

#### 实践 3: 使用工具类型简化定义
```typescript
// ✅ 使用 Pick 和 Omit
export type MarketEnvironmentSummary = Pick<MarketEnvironment, 'id' | 'name' | 'status'>;
export type MarketEnvironmentInput = Omit<MarketEnvironment, 'id' | 'createdAt' | 'updatedAt'>;

// ✅ 使用 Partial 表示可选更新
export type MarketEnvironmentPartialUpdate = Partial<MarketEnvironmentInput>;
```

### 1.4 类型验证和测试

#### 步骤 1: 创建类型测试文件
```typescript
// types/__tests__/market.test.ts
import type { MarketEnvironment, MarketEnvironmentCreateRequest } from '../market';

// 类型兼容性测试
const testMarketEnvironment: MarketEnvironment = {
  id: 'test-id',
  name: 'Test Market',
  description: 'Test Description',
  traders: [],
  stocks: [],
  status: 'draft' as const,
  createdAt: new Date(),
  updatedAt: new Date()
};

// 确保类型正确性
const testCreateRequest: MarketEnvironmentCreateRequest = {
  name: 'Test Market',
  description: 'Test Description',
  traders: [],
  stocks: []
};
```

#### 步骤 2: 添加类型检查脚本
```json
// package.json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

### 常见问题解决

#### 问题 1: 循环依赖
**症状**: 类型文件之间出现循环引用
**解决方案**: 
```typescript
// 使用 import type 避免运行时依赖
import type { TraderConfig } from './trader';

// 或者将共同依赖提取到 common.ts
```

#### 问题 2: 枚举值类型错误
**症状**: 枚举值在运行时和编译时不一致
**解决方案**:
```typescript
// ✅ 使用字符串枚举
export enum Status {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

// ✅ 或使用 const assertion
export const Status = {
  ACTIVE: 'active',
  INACTIVE: 'inactive'
} as const;

export type Status = typeof Status[keyof typeof Status];
```

#### 问题 3: 复杂嵌套类型性能问题
**症状**: TypeScript 编译缓慢
**解决方案**:
```typescript
// ✅ 使用类型别名简化复杂类型
type ComplexType = Record<string, Array<{ id: string; data: unknown }>>;

// ✅ 避免过深的嵌套
interface SimpleConfig {
  basic: BasicInfo;
  advanced: AdvancedInfo;
}
```

---

## 阶段 2：工具函数迁移 (2-3天)

### 目标
迁移纯函数和工具类，建立类型安全的基础设施。

### 2.1 迁移优先级策略

#### 高优先级 (无外部依赖)
```bash
# 前端工具函数
app/src/utils/
├── validationUtils.js → validationUtils.ts  ✅ 优先
├── fileUtils.js → fileUtils.ts              ✅ 优先

# 后端工具函数
server/src/utils/
├── validationUtils.js → validationUtils.ts  ✅ 优先
├── jsonUtils.js → jsonUtils.ts              ✅ 优先
```

#### 中优先级 (依赖其他模块)
```bash
server/src/utils/
├── marketUtils.js → marketUtils.ts          ⚠️  依赖模型
└── seedData.js → seedData.ts                ⚠️  依赖模型
```

### 2.2 详细迁移步骤

#### 步骤 1: 验证工具函数迁移
```typescript
// utils/validationUtils.ts
import type { ValidationResult, ValidationError } from '@/types/common';

// 验证结果接口
export interface FieldValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface ValidationRules {
  [fieldName: string]: FieldValidationRule;
}

// 市场环境名称验证
export function validateMarketEnvironmentName(name: string): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!name || name.trim().length === 0) {
    errors.push({
      field: 'name',
      message: '市场环境名称不能为空',
      code: 'REQUIRED'
    });
  }
  
  if (name && name.length > 50) {
    errors.push({
      field: 'name',
      message: '市场环境名称不能超过50个字符',
      code: 'MAX_LENGTH'
    });
  }
  
  if (name && !/^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(name)) {
    errors.push({
      field: 'name',
      message: '市场环境名称只能包含中文、英文、数字、下划线和连字符',
      code: 'INVALID_FORMAT'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// 通用字段验证器
export function validateField(
  value: any, 
  fieldName: string, 
  rules: FieldValidationRule
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  // 必填验证
  if (rules.required && (value === null || value === undefined || value === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName}不能为空`,
      code: 'REQUIRED'
    });
    return errors; // 如果必填验证失败，不进行其他验证
  }
  
  // 如果值为空且非必填，跳过其他验证
  if (!value && !rules.required) {
    return errors;
  }
  
  // 最小长度验证
  if (rules.minLength && value.length < rules.minLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName}长度不能少于${rules.minLength}个字符`,
      code: 'MIN_LENGTH'
    });
  }
  
  // 最大长度验证
  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push({
      field: fieldName,
      message: `${fieldName}长度不能超过${rules.maxLength}个字符`,
      code: 'MAX_LENGTH'
    });
  }
  
  // 正则表达式验证
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push({
      field: fieldName,
      message: `${fieldName}格式不正确`,
      code: 'INVALID_FORMAT'
    });
  }
  
  // 自定义验证
  if (rules.custom) {
    const customError = rules.custom(value);
    if (customError) {
      errors.push({
        field: fieldName,
        message: customError,
        code: 'CUSTOM_VALIDATION'
      });
    }
  }
  
  return errors;
}

// 批量验证
export function validateObject<T extends Record<string, any>>(
  obj: T,
  rules: ValidationRules
): ValidationResult {
  const allErrors: ValidationError[] = [];
  
  for (const [fieldName, fieldRules] of Object.entries(rules)) {
    const fieldValue = obj[fieldName];
    const fieldErrors = validateField(fieldValue, fieldName, fieldRules);
    allErrors.push(...fieldErrors);
  }
  
  return {
    isValid: allErrors.length === 0,
    errors: allErrors
  };
}

// 数值验证
export function validateNumber(
  value: any,
  fieldName: string,
  options: {
    min?: number;
    max?: number;
    integer?: boolean;
    positive?: boolean;
  } = {}
): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (isNaN(value) || value === null || value === undefined) {
    errors.push({
      field: fieldName,
      message: `${fieldName}必须是有效数字`,
      code: 'INVALID_NUMBER'
    });
    return errors;
  }
  
  const numValue = Number(value);
  
  if (options.integer && !Number.isInteger(numValue)) {
    errors.push({
      field: fieldName,
      message: `${fieldName}必须是整数`,
      code: 'NOT_INTEGER'
    });
  }
  
  if (options.positive && numValue <= 0) {
    errors.push({
      field: fieldName,
      message: `${fieldName}必须是正数`,
      code: 'NOT_POSITIVE'
    });
  }
  
  if (options.min !== undefined && numValue < options.min) {
    errors.push({
      field: fieldName,
      message: `${fieldName}不能小于${options.min}`,
      code: 'MIN_VALUE'
    });
  }
  
  if (options.max !== undefined && numValue > options.max) {
    errors.push({
      field: fieldName,
      message: `${fieldName}不能大于${options.max}`,
      code: 'MAX_VALUE'
    });
  }
  
  return errors;
}
```

#### 步骤 2: 文件工具函数迁移
```typescript
// utils/fileUtils.ts
import type { ApiResponse } from '@/types/api';

// 文件类型枚举
export enum FileType {
  JSON = 'json',
  CSV = 'csv',
  EXCEL = 'excel',
  PDF = 'pdf'
}

// 文件下载配置
export interface DownloadConfig {
  filename: string;
  type: FileType;
  data: any;
}

// 导出结果
export interface ExportResult {
  success: boolean;
  filename?: string;
  error?: string;
  size?: number;
}

// 下载 JSON 文件
export function downloadJsonFile(data: any, filename: string): ExportResult {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return {
      success: true,
      filename: link.download,
      size: blob.size
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : '下载失败'
    };
  }
}

// 处理 API 响应下载
export function handleApiDownload<T>(
  response: ApiResponse<T>,
  defaultFilename: string = 'download'
): ExportResult {
  if (!response.success) {
    return {
      success: false,
      error: response.message || '下载失败'
    };
  }
  
  if (!response.data) {
    return {
      success: false,
      error: '响应数据为空'
    };
  }
  
  const filename = response.filename || defaultFilename;
  return downloadJsonFile(response.data, filename);
}

// 文件大小格式化
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 验证文件类型
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type) || 
         allowedTypes.some(type => file.name.toLowerCase().endsWith(type));
}

// 读取文件内容
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(new Error('文件读取失败'));
    reader.readAsText(file);
  });
}

// 读取 JSON 文件
export async function readJsonFile<T = any>(file: File): Promise<T> {
  try {
    const text = await readFileAsText(file);
    return JSON.parse(text);
  } catch (error) {
    throw new Error('JSON 文件格式错误');
  }
}
```

### 2.3 迁移验证和测试

#### 步骤 1: 创建单元测试
```typescript
// utils/__tests__/validationUtils.test.ts
import { validateMarketEnvironmentName, validateNumber } from '../validationUtils';

describe('validationUtils', () => {
  describe('validateMarketEnvironmentName', () => {
    it('should validate correct name', () => {
      const result = validateMarketEnvironmentName('测试市场环境');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject empty name', () => {
      const result = validateMarketEnvironmentName('');
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('REQUIRED');
    });
    
    it('should reject too long name', () => {
      const longName = 'a'.repeat(51);
      const result = validateMarketEnvironmentName(longName);
      expect(result.isValid).toBe(false);
      expect(result.errors[0].code).toBe('MAX_LENGTH');
    });
  });
  
  describe('validateNumber', () => {
    it('should validate positive number', () => {
      const errors = validateNumber(100, 'price', { positive: true });
      expect(errors).toHaveLength(0);
    });
    
    it('should reject negative number when positive required', () => {
      const errors = validateNumber(-10, 'price', { positive: true });
      expect(errors[0].code).toBe('NOT_POSITIVE');
    });
  });
});
```

#### 步骤 2: 向后兼容性测试
```typescript
// 确保 .js 文件可以正常导入 .ts 文件
// test-compatibility.js
const { validateMarketEnvironmentName } = require('./validationUtils.ts');

console.log('Testing compatibility...');
const result = validateMarketEnvironmentName('Test Market');
console.log('Result:', result);
```

### 2.4 常见问题解决

#### 问题 1: 类型导入错误
**症状**: 无法导入自定义类型
**解决方案**:
```typescript
// ✅ 使用 import type
import type { ValidationResult } from '@/types/common';

// ✅ 或者混合导入
import { someFunction, type SomeType } from './module';
```

#### 问题 2: 函数重载类型定义
**症状**: 函数有多种调用方式，类型定义复杂
**解决方案**:
```typescript
// ✅ 使用函数重载
export function validateField(value: string, rules: StringValidationRule): ValidationError[];
export function validateField(value: number, rules: NumberValidationRule): ValidationError[];
export function validateField(value: any, rules: any): ValidationError[] {
  // 实现
}
```

#### 问题 3: 泛型约束问题
**症状**: 泛型类型过于宽泛或过于严格
**解决方案**:
```typescript
// ✅ 使用适当的泛型约束
export function processData<T extends Record<string, any>>(
  data: T,
  processor: (item: T) => T
): T {
  return processor(data);
}
```

---

## 阶段 3：服务层迁移 (3-4天)

### 目标
迁移业务逻辑层，确保 API 调用和数据处理的类型安全。

### 3.1 前端服务层迁移顺序

#### 第一批 (基础服务)
```
app/src/services/
├── api.js → api.ts                    ✅ 基础 HTTP 客户端
```

#### 第二批 (独立服务)
```
├── templateService.js → .ts           ✅ 相对独立
├── projectService.js → .ts            ✅ 相对独立  
```

#### 第三批 (复杂服务)
```
├── marketService.js → .ts             ⚠️  复杂业务逻辑
```

### 3.2 后端服务层迁移顺序

#### 第一批 (验证服务)
```
server/src/services/
├── validationService.js → .ts         ✅ 验证逻辑
```

#### 第二批 (业务服务)
```
├── templateService.js → .ts           ✅ 模板服务
├── projectService.js → .ts            ✅ 项目服务
```

#### 第三批 (核心服务)
```
├── allocationService.js → .ts         ⚠️  复杂算法
└── marketService.js → .ts             ⚠️  核心业务逻辑
```

### 3.3 关键技术点

#### HTTP 客户端类型化
```typescript
// api.ts
import axios, { AxiosResponse } from 'axios';
import type { ApiResponse } from '@/types/api';

export class ApiClient {
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await axios.get(url);
    return response.data;
  }
  
  async post<T, D = any>(url: string, data: D): Promise<ApiResponse<T>> {
    const response: AxiosResponse<ApiResponse<T>> = await axios.post(url, data);
    return response.data;
  }
}
```

#### 服务方法类型化
```typescript
// marketService.ts
import type { MarketEnvironment, MarketEnvironmentCreateRequest } from '@/types/market';
import type { ApiResponse } from '@/types/api';

export class MarketService {
  async createMarketEnvironment(
    data: MarketEnvironmentCreateRequest
  ): Promise<ApiResponse<MarketEnvironment>> {
    return this.apiClient.post<MarketEnvironment>('/api/market', data);
  }
  
  async getMarketEnvironments(): Promise<ApiResponse<MarketEnvironment[]>> {
    return this.apiClient.get<MarketEnvironment[]>('/api/market');
  }
}
```

---

## 阶段 4：数据模型迁移 (2-3天)

### 目标
将 Mongoose 模型迁移到 TypeScript，建立类型安全的数据访问层。

### 4.1 迁移策略和准备

#### 步骤 1: 安装 Mongoose TypeScript 支持
```bash
cd server
npm install @types/mongoose@latest
# 如果遇到版本冲突，使用特定版本
npm install @types/mongoose@^7.4.0
```

#### 步骤 2: 创建模型类型定义结构
```bash
# 创建模型类型目录
mkdir -p server/src/types/models
touch server/src/types/models/{base,market,trader,stock,template}.ts
```

### 4.2 基础模型类型定义

#### 步骤 1: 基础模型接口 (`types/models/base.ts`)
```typescript
import { Document, Types } from 'mongoose';

// 基础文档接口
export interface BaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// 基础模型静态方法接口
export interface BaseModel<T extends BaseDocument> {
  findByIdAndValidate(id: string): Promise<T | null>;
  findActiveRecords(): Promise<T[]>;
  softDelete(id: string): Promise<boolean>;
}

// 软删除接口
export interface SoftDeleteDocument extends BaseDocument {
  isDeleted: boolean;
  deletedAt?: Date;
}

// 时间戳接口
export interface TimestampDocument extends BaseDocument {
  createdAt: Date;
  updatedAt: Date;
}
```

#### 步骤 2: 市场环境模型 (`models/MarketEnvironment.ts`)
```typescript
import { Document, Schema, model, Model } from 'mongoose';
import type { BaseDocument, BaseModel } from '@/types/models/base';
import type { TraderConfig, StockConfig } from '@/types';

// 市场环境文档接口
export interface IMarketEnvironment extends BaseDocument {
  name: string;
  description: string;
  traders: TraderConfig[];
  stocks: StockConfig[];
  status: 'draft' | 'active' | 'completed' | 'archived';
  statistics?: {
    totalTraders: number;
    totalStocks: number;
    totalCapital: number;
    totalMarketValue: number;
  };
}

// 市场环境模型接口 (静态方法)
export interface IMarketEnvironmentModel extends Model<IMarketEnvironment>, BaseModel<IMarketEnvironment> {
  findByStatus(status: string): Promise<IMarketEnvironment[]>;
  calculateStatistics(id: string): Promise<IMarketEnvironment['statistics']>;
  exportToJson(id: string): Promise<{ data: any; filename: string }>;
}

// 市场环境 Schema 定义
const MarketEnvironmentSchema = new Schema<IMarketEnvironment>({
  name: {
    type: String,
    required: [true, '市场环境名称不能为空'],
    trim: true,
    maxlength: [50, '市场环境名称不能超过50个字符'],
    validate: {
      validator: function(v: string) {
        return /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/.test(v);
      },
      message: '市场环境名称只能包含中文、英文、数字、下划线和连字符'
    }
  },
  description: {
    type: String,
    required: [true, '市场环境描述不能为空'],
    trim: true,
    maxlength: [500, '描述不能超过500个字符']
  },
  traders: [{
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(traders: TraderConfig[]) {
        return Array.isArray(traders) && traders.length > 0;
      },
      message: '至少需要一个交易员配置'
    }
  }],
  stocks: [{
    type: Schema.Types.Mixed,
    required: true,
    validate: {
      validator: function(stocks: StockConfig[]) {
        return Array.isArray(stocks) && stocks.length > 0;
      },
      message: '至少需要一个股票配置'
    }
  }],
  status: {
    type: String,
    enum: {
      values: ['draft', 'active', 'completed', 'archived'],
      message: '状态值无效'
    },
    default: 'draft'
  },
  statistics: {
    totalTraders: { type: Number, default: 0 },
    totalStocks: { type: Number, default: 0 },
    totalCapital: { type: Number, default: 0 },
    totalMarketValue: { type: Number, default: 0 }
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引定义
MarketEnvironmentSchema.index({ name: 1 }, { unique: true });
MarketEnvironmentSchema.index({ status: 1 });
MarketEnvironmentSchema.index({ createdAt: -1 });

// 虚拟字段
MarketEnvironmentSchema.virtual('traderCount').get(function(this: IMarketEnvironment) {
  return this.traders ? this.traders.length : 0;
});

MarketEnvironmentSchema.virtual('stockCount').get(function(this: IMarketEnvironment) {
  return this.stocks ? this.stocks.length : 0;
});

// 实例方法
MarketEnvironmentSchema.methods.activate = function(this: IMarketEnvironment): Promise<IMarketEnvironment> {
  this.status = 'active';
  return this.save();
};

MarketEnvironmentSchema.methods.complete = function(this: IMarketEnvironment): Promise<IMarketEnvironment> {
  this.status = 'completed';
  return this.save();
};

MarketEnvironmentSchema.methods.calculateTotalCapital = function(this: IMarketEnvironment): number {
  return this.traders.reduce((total, trader) => total + trader.initialCapital, 0);
};

// 静态方法
MarketEnvironmentSchema.statics.findByStatus = function(
  this: IMarketEnvironmentModel,
  status: string
): Promise<IMarketEnvironment[]> {
  return this.find({ status }).sort({ createdAt: -1 });
};

MarketEnvironmentSchema.statics.calculateStatistics = async function(
  this: IMarketEnvironmentModel,
  id: string
): Promise<IMarketEnvironment['statistics']> {
  const environment = await this.findById(id);
  if (!environment) {
    throw new Error('市场环境不存在');
  }
  
  const totalTraders = environment.traders.length;
  const totalStocks = environment.stocks.length;
  const totalCapital = environment.calculateTotalCapital();
  const totalMarketValue = environment.stocks.reduce(
    (total, stock) => total + (stock.issuePrice * stock.totalShares), 
    0
  );
  
  const statistics = {
    totalTraders,
    totalStocks,
    totalCapital,
    totalMarketValue
  };
  
  // 更新统计信息
  environment.statistics = statistics;
  await environment.save();
  
  return statistics;
};

MarketEnvironmentSchema.statics.exportToJson = async function(
  this: IMarketEnvironmentModel,
  id: string
): Promise<{ data: any; filename: string }> {
  const environment = await this.findById(id);
  if (!environment) {
    throw new Error('市场环境不存在');
  }
  
  const exportData = {
    id: environment.id,
    name: environment.name,
    description: environment.description,
    traders: environment.traders,
    stocks: environment.stocks,
    status: environment.status,
    statistics: environment.statistics,
    exportedAt: new Date().toISOString()
  };
  
  const filename = `market_${environment.id}_${Date.now()}.json`;
  
  return { data: exportData, filename };
};

// 中间件 - 保存前自动计算统计信息
MarketEnvironmentSchema.pre('save', function(this: IMarketEnvironment) {
  if (this.isModified('traders') || this.isModified('stocks')) {
    this.statistics = {
      totalTraders: this.traders.length,
      totalStocks: this.stocks.length,
      totalCapital: this.calculateTotalCapital(),
      totalMarketValue: this.stocks.reduce(
        (total, stock) => total + (stock.issuePrice * stock.totalShares), 
        0
      )
    };
  }
});

// 中间件 - 删除前验证
MarketEnvironmentSchema.pre('deleteOne', { document: true }, function(this: IMarketEnvironment) {
  if (this.status === 'active') {
    throw new Error('不能删除活跃状态的市场环境');
  }
});

// 创建并导出模型
export const MarketEnvironment = model<IMarketEnvironment, IMarketEnvironmentModel>(
  'MarketEnvironment', 
  MarketEnvironmentSchema
);
```

### 4.3 模板模型迁移

#### 步骤 1: 交易员模板模型 (`models/TraderTemplate.ts`)
```typescript
import { Document, Schema, model, Model } from 'mongoose';
import type { BaseDocument } from '@/types/models/base';

// 风险偏好枚举
export enum RiskProfile {
  CONSERVATIVE = 'conservative',
  MODERATE = 'moderate',
  AGGRESSIVE = 'aggressive'
}

// 分配算法枚举
export enum AllocationAlgorithm {
  EQUAL_WEIGHT = 'equal_weight',
  MARKET_CAP = 'market_cap',
  RISK_PARITY = 'risk_parity',
  MOMENTUM = 'momentum'
}

// 交易员模板文档接口
export interface ITraderTemplate extends BaseDocument {
  name: string;
  initialCapital: number;
  riskProfile: RiskProfile;
  allocationAlgorithm: AllocationAlgorithm;
  description: string;
  isActive: boolean;
  usageCount: number;
}

// 交易员模板模型接口
export interface ITraderTemplateModel extends Model<ITraderTemplate> {
  findActive(): Promise<ITraderTemplate[]>;
  incrementUsage(id: string): Promise<void>;
  getPopularTemplates(limit?: number): Promise<ITraderTemplate[]>;
}

// Schema 定义
const TraderTemplateSchema = new Schema<ITraderTemplate>({
  name: {
    type: String,
    required: [true, '模板名称不能为空'],
    trim: true,
    maxlength: [50, '模板名称不能超过50个字符'],
    unique: true
  },
  initialCapital: {
    type: Number,
    required: [true, '初始资金不能为空'],
    min: [1000, '初始资金不能少于1000'],
    max: [10000000, '初始资金不能超过1000万']
  },
  riskProfile: {
    type: String,
    enum: {
      values: Object.values(RiskProfile),
      message: '风险偏好值无效'
    },
    required: [true, '风险偏好不能为空']
  },
  allocationAlgorithm: {
    type: String,
    enum: {
      values: Object.values(AllocationAlgorithm),
      message: '分配算法值无效'
    },
    required: [true, '分配算法不能为空']
  },
  description: {
    type: String,
    required: [true, '描述不能为空'],
    trim: true,
    maxlength: [200, '描述不能超过200个字符']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// 索引
TraderTemplateSchema.index({ name: 1 }, { unique: true });
TraderTemplateSchema.index({ isActive: 1 });
TraderTemplateSchema.index({ usageCount: -1 });
TraderTemplateSchema.index({ riskProfile: 1 });

// 静态方法
TraderTemplateSchema.statics.findActive = function(
  this: ITraderTemplateModel
): Promise<ITraderTemplate[]> {
  return this.find({ isActive: true }).sort({ name: 1 });
};

TraderTemplateSchema.statics.incrementUsage = async function(
  this: ITraderTemplateModel,
  id: string
): Promise<void> {
  await this.findByIdAndUpdate(id, { $inc: { usageCount: 1 } });
};

TraderTemplateSchema.statics.getPopularTemplates = function(
  this: ITraderTemplateModel,
  limit: number = 10
): Promise<ITraderTemplate[]> {
  return this.find({ isActive: true })
    .sort({ usageCount: -1 })
    .limit(limit);
};

export const TraderTemplate = model<ITraderTemplate, ITraderTemplateModel>(
  'TraderTemplate',
  TraderTemplateSchema
);
```

### 4.4 模型关系和引用

#### 步骤 1: 模型关系定义
```typescript
// types/models/relations.ts
import type { Types } from 'mongoose';

// 引用类型定义
export interface ModelReference<T = any> {
  _id: Types.ObjectId;
  ref: T;
}

// 填充选项
export interface PopulateOptions {
  path: string;
  select?: string;
  populate?: PopulateOptions;
}

// 查询选项
export interface QueryOptions {
  populate?: PopulateOptions[];
  select?: string;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
}
```

### 4.5 模型验证和中间件

#### 步骤 1: 自定义验证器
```typescript
// utils/modelValidators.ts
import type { ValidationError } from '@/types/common';

// 股票代码验证
export function validateStockSymbol(symbol: string): boolean {
  return /^[A-Z]{2,6}$/.test(symbol);
}

// 交易员名称验证
export function validateTraderName(name: string): boolean {
  return /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]{2,20}$/.test(name);
}

// 资金金额验证
export function validateCapitalAmount(amount: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (amount < 1000) {
    errors.push({
      field: 'initialCapital',
      message: '初始资金不能少于1000元',
      code: 'MIN_CAPITAL'
    });
  }
  
  if (amount > 10000000) {
    errors.push({
      field: 'initialCapital',
      message: '初始资金不能超过1000万元',
      code: 'MAX_CAPITAL'
    });
  }
  
  return errors;
}
```

### 4.6 常见问题解决

#### 问题 1: Mongoose 类型推导问题
**症状**: TypeScript 无法正确推导 Mongoose 文档类型
**解决方案**:
```typescript
// ✅ 明确指定泛型类型
const MarketEnvironmentSchema = new Schema<IMarketEnvironment>({
  // schema definition
});

// ✅ 使用类型断言
const environment = await MarketEnvironment.findById(id) as IMarketEnvironment;
```

#### 问题 2: 虚拟字段类型问题
**症状**: 虚拟字段在 TypeScript 中无法访问
**解决方案**:
```typescript
// ✅ 在接口中定义虚拟字段
export interface IMarketEnvironment extends BaseDocument {
  // 实际字段
  name: string;
  
  // 虚拟字段
  traderCount?: number;
  stockCount?: number;
}
```

#### 问题 3: 静态方法类型定义
**症状**: 静态方法无法正确类型化
**解决方案**:
```typescript
// ✅ 扩展 Model 接口
export interface IMarketEnvironmentModel extends Model<IMarketEnvironment> {
  findByStatus(status: string): Promise<IMarketEnvironment[]>;
}

// ✅ 在创建模型时指定类型
export const MarketEnvironment = model<IMarketEnvironment, IMarketEnvironmentModel>(
  'MarketEnvironment', 
  MarketEnvironmentSchema
);
```

---

## 阶段 5：控制器和路由迁移 (2-3天)

### 目标
迁移 Express 控制器和路由，确保 API 层的类型安全。

### 5.1 控制器迁移顺序

#### 第一批 (简单控制器)
```
server/src/controllers/
├── projectController.js → .ts         ✅ 相对简单
```

#### 第二批 (中等复杂度)
```
├── templateController.js → .ts        ✅ 中等复杂度
```

#### 第三批 (复杂控制器)
```
└── marketController.js → .ts          ⚠️  最复杂
```

### 5.2 路由迁移顺序

```
server/src/routes/
├── healthRoutes.js → .ts              ✅ 简单
├── templates.js → .ts                 ✅ 中等
├── market.js → .ts                    ⚠️  复杂
└── index.js → .ts                     ✅ 入口文件
```

### 5.3 Express TypeScript 扩展

#### 请求/响应类型扩展
```typescript
// types/api.ts
import { Request, Response } from 'express';

export interface TypedRequest<T = any> extends Request {
  body: T;
}

export interface TypedResponse<T = any> extends Response {
  json(body: ApiResponse<T>): this;
}
```

#### 控制器方法类型化
```typescript
// controllers/marketController.ts
import type { TypedRequest, TypedResponse } from '@/types/api';
import type { MarketEnvironmentCreateRequest, MarketEnvironment } from '@/types/market';

export class MarketController {
  async createMarketEnvironment(
    req: TypedRequest<MarketEnvironmentCreateRequest>,
    res: TypedResponse<MarketEnvironment>
  ): Promise<void> {
    try {
      const marketEnvironment = await this.marketService.create(req.body);
      res.json({
        success: true,
        data: marketEnvironment
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '创建市场环境失败',
        error: error.message
      });
    }
  }
}
```

### 5.4 中间件类型化

```typescript
// middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';

export function validateBody<T>(schema: Joi.ObjectSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        message: '请求参数验证失败',
        error: error.details[0].message
      });
      return;
    }
    next();
  };
}
```

---

## 阶段 6：状态管理迁移 (2-3天)

### 目标
将 Pinia 状态管理迁移到 TypeScript，确保状态的类型安全。

### 6.1 Store 迁移优先级

```
app/src/stores/
├── index.js → .ts                     ✅ 基础配置
├── templates.js → .ts                 ✅ 模板状态
└── market.js → .ts                    ⚠️  复杂状态逻辑
```

### 6.2 Pinia + TypeScript 模式

#### Store 定义
```typescript
// stores/market.ts
import { defineStore } from 'pinia';
import type { MarketEnvironment, MarketEnvironmentCreateRequest } from '@/types/market';
import { marketService } from '@/services/marketService';

interface MarketState {
  environments: MarketEnvironment[];
  currentEnvironment: MarketEnvironment | null;
  loading: boolean;
  error: string | null;
}

export const useMarketStore = defineStore('market', {
  state: (): MarketState => ({
    environments: [],
    currentEnvironment: null,
    loading: false,
    error: null
  }),

  getters: {
    activeEnvironments: (state): MarketEnvironment[] => 
      state.environments.filter(env => env.status === 'active'),
    
    environmentCount: (state): number => 
      state.environments.length
  },

  actions: {
    async fetchEnvironments(): Promise<void> {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await marketService.getMarketEnvironments();
        if (response.success) {
          this.environments = response.data;
        } else {
          this.error = response.message || '获取市场环境失败';
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误';
      } finally {
        this.loading = false;
      }
    },

    async createEnvironment(data: MarketEnvironmentCreateRequest): Promise<boolean> {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await marketService.createMarketEnvironment(data);
        if (response.success) {
          this.environments.push(response.data);
          return true;
        } else {
          this.error = response.message || '创建市场环境失败';
          return false;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : '未知错误';
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});
```

### 6.3 Store 类型导出

```typescript
// stores/index.ts
export { useMarketStore } from './market';
export { useTemplateStore } from './templates';

// 导出所有 Store 的类型
export type { MarketState } from './market';
export type { TemplateState } from './templates';
```

---

## 阶段 7：Vue 组件迁移 (3-5天)

### 目标
将 Vue 组件迁移到 TypeScript，确保组件的类型安全和更好的开发体验。

### 7.1 组件迁移策略

#### 迁移优先级
```bash
# 第一批 (简单组件)
app/src/components/common/NotFound.vue                ✅ 简单组件

# 第二批 (中等复杂度)
app/src/components/admin/TraderTemplateManager.vue    ✅ 中等复杂度
app/src/components/admin/StockTemplateManager.vue     ✅ 中等复杂度

# 第三批 (布局组件)
app/src/layouts/AdminLayout.vue                       ⚠️  布局组件
app/src/layouts/MarketLayout.vue                      ⚠️  布局组件

# 第四批 (复杂组件)
app/src/components/market/MarketInitializer.vue       ⚠️  最复杂组件
```

### 7.2 Vue 3 + TypeScript 详细实施

#### 步骤 1: 简单组件迁移 (`NotFound.vue`)
```vue
<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

// Props 定义
interface Props {
  message?: string;
  showBackButton?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  message: '页面未找到',
  showBackButton: true
});

// Emits 定义
interface Emits {
  (e: 'back'): void;
}

const emit = defineEmits<Emits>();

// 路由
const router = useRouter();

// 计算属性
const displayMessage = computed((): string => {
  return props.message || '页面未找到';
});

// 方法
const handleBack = (): void => {
  if (props.showBackButton) {
    emit('back');
    router.back();
  }
};

const goHome = (): void => {
  router.push('/');
};
</script>

<template>
  <div class="not-found">
    <div class="not-found__content">
      <h1 class="not-found__title">404</h1>
      <p class="not-found__message">{{ displayMessage }}</p>
      <div class="not-found__actions">
        <el-button 
          v-if="showBackButton" 
          type="default" 
          @click="handleBack"
        >
          返回上页
        </el-button>
        <el-button 
          type="primary" 
          @click="goHome"
        >
          回到首页
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.not-found__content {
  text-align: center;
}

.not-found__title {
  font-size: 72px;
  color: #409eff;
  margin-bottom: 16px;
}

.not-found__message {
  font-size: 18px;
  color: #606266;
  margin-bottom: 32px;
}

.not-found__actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}
</style>
```

#### 步骤 2: 复杂组件迁移 (`MarketInitializer.vue`)
```vue
<script setup lang="ts">
import { ref, reactive, computed, onMounted, nextTick } from 'vue';
import type { Ref } from 'vue';
import { ElMessage, ElMessageBox, ElForm, ElTable } from 'element-plus';
import type { FormInstance, FormRules, TableInstance } from 'element-plus';

// 类型导入
import type { 
  MarketEnvironment, 
  MarketEnvironmentCreateRequest,
  MarketEnvironmentQuery 
} from '@/types/market';
import type { TraderConfig, TraderTemplate } from '@/types/trader';
import type { StockConfig, StockTemplate } from '@/types/stock';
import type { ValidationResult } from '@/types/common';

// Store 和 Service 导入
import { useMarketStore } from '@/stores/market';
import { useTemplateStore } from '@/stores/templates';
import { marketService } from '@/services/marketService';

// Props 定义
interface Props {
  initialData?: MarketEnvironment;
  mode?: 'create' | 'view' | 'manage';
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'manage',
  readonly: false
});

// Emits 定义
interface Emits {
  (e: 'created', environment: MarketEnvironment): void;
  (e: 'updated', environment: MarketEnvironment): void;
  (e: 'deleted', id: string): void;
  (e: 'exported', result: { success: boolean; filename?: string }): void;
}

const emit = defineEmits<Emits>();

// Store 实例
const marketStore = useMarketStore();
const templateStore = useTemplateStore();

// 响应式数据
const loading = ref<boolean>(false);
const dialogVisible = ref<boolean>(false);
const dialogMode = ref<'create' | 'edit' | 'view'>('create');
const selectedEnvironment = ref<MarketEnvironment | null>(null);

// 表单数据
const formData = reactive<MarketEnvironmentCreateRequest>({
  name: '',
  description: '',
  traders: [],
  stocks: []
});

// 查询参数
const queryParams = reactive<MarketEnvironmentQuery>({
  status: undefined,
  search: '',
  page: 1,
  limit: 10
});

// 选中的模板
const selectedTraderTemplates = ref<TraderTemplate[]>([]);
const selectedStockTemplates = ref<StockTemplate[]>([]);

// Template refs
const formRef = ref<FormInstance>();
const tableRef = ref<TableInstance>();

// 表单验证规则
const formRules: FormRules = {
  name: [
    { required: true, message: '请输入市场环境名称', trigger: 'blur' },
    { min: 2, max: 50, message: '名称长度在 2 到 50 个字符', trigger: 'blur' },
    {
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_\-\s]+$/,
      message: '名称只能包含中文、英文、数字、下划线和连字符',
      trigger: 'blur'
    }
  ],
  description: [
    { required: true, message: '请输入市场环境描述', trigger: 'blur' },
    { min: 10, max: 500, message: '描述长度在 10 到 500 个字符', trigger: 'blur' }
  ]
};

// 计算属性
const isFormValid = computed((): boolean => {
  return formData.name.trim().length > 0 && 
         formData.description.trim().length > 0 &&
         formData.traders.length > 0 &&
         formData.stocks.length > 0;
});

const totalCapital = computed((): number => {
  return formData.traders.reduce((total, trader) => total + trader.initialCapital, 0);
});

const totalMarketValue = computed((): number => {
  return formData.stocks.reduce(
    (total, stock) => total + (stock.issuePrice * stock.totalShares), 
    0
  );
});

const environmentList = computed((): MarketEnvironment[] => {
  return marketStore.environments;
});

const filteredEnvironments = computed((): MarketEnvironment[] => {
  let filtered = environmentList.value;
  
  if (queryParams.status) {
    filtered = filtered.filter(env => env.status === queryParams.status);
  }
  
  if (queryParams.search) {
    const search = queryParams.search.toLowerCase();
    filtered = filtered.filter(env => 
      env.name.toLowerCase().includes(search) ||
      env.description.toLowerCase().includes(search)
    );
  }
  
  return filtered;
});

// 方法定义
const handleCreate = (): void => {
  resetForm();
  dialogMode.value = 'create';
  dialogVisible.value = true;
};

const handleEdit = (environment: MarketEnvironment): void => {
  selectedEnvironment.value = environment;
  fillFormData(environment);
  dialogMode.value = 'edit';
  dialogVisible.value = true;
};

const handleView = (environment: MarketEnvironment): void => {
  selectedEnvironment.value = environment;
  fillFormData(environment);
  dialogMode.value = 'view';
  dialogVisible.value = true;
};

const handleDelete = async (environment: MarketEnvironment): Promise<void> => {
  try {
    await ElMessageBox.confirm(
      `确定要删除市场环境 "${environment.name}" 吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    loading.value = true;
    const success = await marketStore.deleteEnvironment(environment.id);
    
    if (success) {
      ElMessage.success('删除成功');
      emit('deleted', environment.id);
    } else {
      ElMessage.error(marketStore.error || '删除失败');
    }
  } catch (error) {
    // 用户取消删除
  } finally {
    loading.value = false;
  }
};

const handleExport = async (environment: MarketEnvironment): Promise<void> => {
  try {
    loading.value = true;
    const result = await marketService.exportMarketEnvironment(environment.id);
    
    if (result.success) {
      ElMessage.success('导出成功');
      emit('exported', { success: true, filename: result.filename });
    } else {
      ElMessage.error('导出失败');
      emit('exported', { success: false });
    }
  } catch (error) {
    ElMessage.error('导出失败');
    emit('exported', { success: false });
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (): Promise<void> => {
  if (!formRef.value) return;
  
  try {
    const valid = await formRef.value.validate();
    if (!valid) return;
    
    if (!isFormValid.value) {
      ElMessage.error('请完善所有必填信息');
      return;
    }
    
    loading.value = true;
    
    if (dialogMode.value === 'create') {
      const success = await marketStore.createEnvironment(formData);
      if (success) {
        ElMessage.success('创建成功');
        const newEnvironment = marketStore.environments[marketStore.environments.length - 1];
        emit('created', newEnvironment);
        dialogVisible.value = false;
      } else {
        ElMessage.error(marketStore.error || '创建失败');
      }
    } else if (dialogMode.value === 'edit' && selectedEnvironment.value) {
      const success = await marketStore.updateEnvironment(selectedEnvironment.value.id, formData);
      if (success) {
        ElMessage.success('更新成功');
        const updatedEnvironment = marketStore.environments.find(
          env => env.id === selectedEnvironment.value!.id
        );
        if (updatedEnvironment) {
          emit('updated', updatedEnvironment);
        }
        dialogVisible.value = false;
      } else {
        ElMessage.error(marketStore.error || '更新失败');
      }
    }
  } catch (error) {
    ElMessage.error('操作失败');
  } finally {
    loading.value = false;
  }
};

const handleCancel = (): void => {
  dialogVisible.value = false;
  resetForm();
};

const resetForm = (): void => {
  Object.assign(formData, {
    name: '',
    description: '',
    traders: [],
    stocks: []
  });
  selectedTraderTemplates.value = [];
  selectedStockTemplates.value = [];
  selectedEnvironment.value = null;
  
  nextTick(() => {
    formRef.value?.clearValidate();
  });
};

const fillFormData = (environment: MarketEnvironment): void => {
  Object.assign(formData, {
    name: environment.name,
    description: environment.description,
    traders: [...environment.traders],
    stocks: [...environment.stocks]
  });
};

const addTraderConfig = (template: TraderTemplate): void => {
  const traderConfig: TraderConfig = {
    id: `trader_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    name: template.name,
    initialCapital: template.initialCapital,
    riskProfile: template.riskProfile,
    allocationAlgorithm: template.allocationAlgorithm,
    description: template.description
  };
  
  formData.traders.push(traderConfig);
  
  // 增加模板使用次数
  templateStore.incrementTraderTemplateUsage(template.id);
};

const removeTraderConfig = (index: number): void => {
  formData.traders.splice(index, 1);
};

const addStockConfig = (template: StockTemplate): void => {
  const stockConfig: StockConfig = {
    id: `stock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    templateId: template.id,
    symbol: template.symbol,
    name: template.name,
    issuePrice: template.issuePrice,
    totalShares: template.totalShares,
    sector: template.sector
  };
  
  formData.stocks.push(stockConfig);
  
  // 增加模板使用次数
  templateStore.incrementStockTemplateUsage(template.id);
};

const removeStockConfig = (index: number): void => {
  formData.stocks.splice(index, 1);
};

const handleSearch = (): void => {
  // 触发搜索
  queryParams.page = 1;
};

const handlePageChange = (page: number): void => {
  queryParams.page = page;
};

const handleSizeChange = (size: number): void => {
  queryParams.limit = size;
  queryParams.page = 1;
};

// 生命周期
onMounted(async () => {
  await Promise.all([
    marketStore.fetchEnvironments(),
    templateStore.fetchTraderTemplates(),
    templateStore.fetchStockTemplates()
  ]);
});

// 暴露给模板的方法和数据
defineExpose({
  handleCreate,
  handleRefresh: () => marketStore.fetchEnvironments()
});
</script>

<template>
  <div class="market-initializer">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="page-title">
        <h2>市场环境管理</h2>
        <p>创建和管理股票交易模拟的市场环境</p>
      </div>
      <div class="page-actions">
        <el-button 
          type="primary" 
          @click="handleCreate"
          :disabled="loading"
        >
          创建市场环境
        </el-button>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="状态">
          <el-select 
            v-model="queryParams.status" 
            placeholder="全部状态"
            clearable
            style="width: 120px"
          >
            <el-option label="草稿" value="draft" />
            <el-option label="活跃" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已归档" value="archived" />
          </el-select>
        </el-form-item>
        <el-form-item label="搜索">
          <el-input
            v-model="queryParams.search"
            placeholder="搜索名称或描述"
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 环境列表 -->
    <div class="environment-list">
      <el-table
        ref="tableRef"
        :data="filteredEnvironments"
        :loading="marketStore.loading"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="统计信息" width="200">
          <template #default="{ row }">
            <div class="statistics">
              <span>交易员: {{ row.statistics?.totalTraders || 0 }}</span>
              <span>股票: {{ row.statistics?.totalStocks || 0 }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleView(row)">查看</el-button>
            <el-button size="small" type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button size="small" @click="handleExport(row)">导出</el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(row)"
              :disabled="row.status === 'active'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="getDialogTitle()"
      width="80%"
      :close-on-click-modal="false"
      @close="handleCancel"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        :disabled="dialogMode === 'view' || loading"
      >
        <!-- 基本信息 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <span class="section-title">基本信息</span>
          </template>
          
          <el-form-item label="环境名称" prop="name">
            <el-input 
              v-model="formData.name" 
              placeholder="请输入市场环境名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
          
          <el-form-item label="环境描述" prop="description">
            <el-input
              v-model="formData.description"
              type="textarea"
              :rows="3"
              placeholder="请输入市场环境描述"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>
        </el-card>

        <!-- 交易员配置 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span class="section-title">交易员配置</span>
              <el-button 
                v-if="dialogMode !== 'view'"
                size="small" 
                type="primary"
                @click="showTraderTemplateSelector = true"
              >
                添加交易员
              </el-button>
            </div>
          </template>
          
          <div v-if="formData.traders.length === 0" class="empty-state">
            <p>暂无交易员配置，请添加交易员</p>
          </div>
          
          <div v-else class="trader-list">
            <div 
              v-for="(trader, index) in formData.traders" 
              :key="trader.id"
              class="trader-item"
            >
              <div class="trader-info">
                <h4>{{ trader.name }}</h4>
                <p>初始资金: ¥{{ trader.initialCapital.toLocaleString() }}</p>
                <p>风险偏好: {{ getRiskProfileText(trader.riskProfile) }}</p>
                <p>分配算法: {{ getAllocationAlgorithmText(trader.allocationAlgorithm) }}</p>
              </div>
              <div v-if="dialogMode !== 'view'" class="trader-actions">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="removeTraderConfig(index)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="section-summary">
            <p><strong>总资金: ¥{{ totalCapital.toLocaleString() }}</strong></p>
          </div>
        </el-card>

        <!-- 股票配置 -->
        <el-card class="form-section" shadow="never">
          <template #header>
            <div class="section-header">
              <span class="section-title">股票配置</span>
              <el-button 
                v-if="dialogMode !== 'view'"
                size="small" 
                type="primary"
                @click="showStockTemplateSelector = true"
              >
                添加股票
              </el-button>
            </div>
          </template>
          
          <div v-if="formData.stocks.length === 0" class="empty-state">
            <p>暂无股票配置，请添加股票</p>
          </div>
          
          <div v-else class="stock-list">
            <div 
              v-for="(stock, index) in formData.stocks" 
              :key="stock.id"
              class="stock-item"
            >
              <div class="stock-info">
                <h4>{{ stock.symbol }} - {{ stock.name }}</h4>
                <p>发行价: ¥{{ stock.issuePrice }}</p>
                <p>总股数: {{ stock.totalShares.toLocaleString() }}</p>
                <p>市值: ¥{{ (stock.issuePrice * stock.totalShares).toLocaleString() }}</p>
              </div>
              <div v-if="dialogMode !== 'view'" class="stock-actions">
                <el-button 
                  size="small" 
                  type="danger" 
                  @click="removeStockConfig(index)"
                >
                  移除
                </el-button>
              </div>
            </div>
          </div>
          
          <div class="section-summary">
            <p><strong>总市值: ¥{{ totalMarketValue.toLocaleString() }}</strong></p>
          </div>
        </el-card>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCancel">
            {{ dialogMode === 'view' ? '关闭' : '取消' }}
          </el-button>
          <el-button 
            v-if="dialogMode !== 'view'"
            type="primary" 
            @click="handleSubmit"
            :loading="loading"
            :disabled="!isFormValid"
          >
            {{ dialogMode === 'create' ? '创建' : '更新' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.market-initializer {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.page-title h2 {
  margin: 0 0 8px 0;
  color: #303133;
}

.page-title p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.search-section {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.environment-list {
  background: white;
  border-radius: 4px;
}

.statistics {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 12px;
}

.form-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-weight: 600;
  color: #303133;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #909399;
}

.trader-list,
.stock-list {
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
}

.trader-item,
.stock-item {
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.trader-info h4,
.stock-info h4 {
  margin: 0 0 8px 0;
  color: #303133;
}

.trader-info p,
.stock-info p {
  margin: 4px 0;
  color: #606266;
  font-size: 14px;
}

.section-summary {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.dialog-footer {
  text-align: right;
}
</style>
```

### 7.3 组件类型定义和最佳实践

#### 步骤 1: 组件类型定义文件 (`types/components.ts`)
```typescript
import type { MarketEnvironment } from './market';
import type { TraderTemplate, StockTemplate } from './template';

// 市场初始化器组件 Props
export interface MarketInitializerProps {
  initialData?: MarketEnvironment;
  mode?: 'create' | 'view' | 'manage';
  readonly?: boolean;
}

// 市场初始化器组件 Emits
export interface MarketInitializerEmits {
  created: [environment: MarketEnvironment];
  updated: [environment: MarketEnvironment];
  deleted: [id: string];
  exported: [result: { success: boolean; filename?: string }];
}

// 模板管理器组件 Props
export interface TemplateManagerProps {
  type: 'trader' | 'stock';
  selectedIds?: string[];
  multiple?: boolean;
  readonly?: boolean;
}

// 模板管理器组件 Emits
export interface TemplateManagerEmits {
  selected: [templates: TraderTemplate[] | StockTemplate[]];
  created: [template: TraderTemplate | StockTemplate];
  updated: [template: TraderTemplate | StockTemplate];
  deleted: [id: string];
}

// 表格列配置
export interface TableColumn {
  prop: string;
  label: string;
  width?: number | string;
  minWidth?: number | string;
  fixed?: boolean | 'left' | 'right';
  sortable?: boolean;
  formatter?: (row: any, column: any, cellValue: any) => string;
}

// 分页配置
export interface PaginationConfig {
  page: number;
  size: number;
  total: number;
  sizes: number[];
  layout: string;
}

// 对话框配置
export interface DialogConfig {
  visible: boolean;
  title: string;
  width?: string | number;
  fullscreen?: boolean;
  modal?: boolean;
  closeOnClickModal?: boolean;
  closeOnPressEscape?: boolean;
}
```

### 7.4 组件通信类型化

#### 步骤 1: 父子组件通信
```typescript
// 父组件
const handleChildEvent = (data: MarketEnvironment): void => {
  console.log('Received from child:', data);
};

// 子组件 emits
const emit = defineEmits<{
  (e: 'update', data: MarketEnvironment): void;
  (e: 'delete', id: string): void;
}>();

// 触发事件
emit('update', marketEnvironment);
```

#### 步骤 2: 组件引用类型化
```typescript
// 组件引用
const childRef = ref<InstanceType<typeof ChildComponent>>();

// 调用子组件方法
const callChildMethod = (): void => {
  childRef.value?.someMethod();
};
```

### 7.5 常见问题解决

#### 问题 1: Element Plus 组件类型错误
**症状**: Element Plus 组件的 ref 类型无法正确推导
**解决方案**:
```typescript
import type { FormInstance, TableInstance } from 'element-plus';

const formRef = ref<FormInstance>();
const tableRef = ref<TableInstance>();
```

#### 问题 2: 动态组件类型问题
**症状**: 动态组件无法正确类型化
**解决方案**:
```typescript
// 定义组件映射
const componentMap = {
  trader: TraderTemplateManager,
  stock: StockTemplateManager
} as const;

// 使用 computed 确保类型安全
const currentComponent = computed(() => {
  return componentMap[props.type];
});
```

#### 问题 3: 事件处理函数类型推导
**症状**: 事件处理函数参数类型无法推导
**解决方案**:
```typescript
// ✅ 明确指定事件类型
const handleClick = (event: MouseEvent): void => {
  // 处理逻辑
};

// ✅ 使用 Element Plus 的事件类型
import type { ElButton } from 'element-plus';
const handleButtonClick = (event: Parameters<ElButton['onClick']>[0]): void => {
  // 处理逻辑
};
```

---

## 阶段 8：配置和入口文件 (1-2天)

### 目标
迁移项目配置文件和入口文件，完成整体 TypeScript 化。

### 8.1 前端配置文件迁移

```
app/src/
├── config/
│   ├── api.js → .ts
│   └── environment.js → .ts
├── main.js → .ts
└── router/index.js → .ts
```

#### 主入口文件
```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import * as ElementPlusIconsVue from '@element-plus/icons-vue';

import App from './App.vue';
import router from './router';
import './assets/styles/global.css';

const app = createApp(App);
const pinia = createPinia();

// 注册 Element Plus 图标
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(pinia);
app.use(router);
app.use(ElementPlus);

app.mount('#app');
```

#### 路由配置
```typescript
// router/index.ts
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import type { App } from 'vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/market'
  },
  {
    path: '/market',
    component: () => import('@/layouts/MarketLayout.vue'),
    children: [
      {
        path: '',
        name: 'MarketInitializer',
        component: () => import('@/components/market/MarketInitializer.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('@/layouts/AdminLayout.vue'),
    children: [
      {
        path: 'traders',
        name: 'TraderTemplateManager',
        component: () => import('@/components/admin/TraderTemplateManager.vue')
      },
      {
        path: 'stocks',
        name: 'StockTemplateManager',
        component: () => import('@/components/admin/StockTemplateManager.vue')
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
```

### 8.2 后端配置文件迁移

```
server/src/
├── config/
│   ├── api.js → .ts
│   ├── database.js → .ts
│   └── environment.js → .ts
├── app.js → .ts
└── server.js → .ts
```

#### 应用入口文件
```typescript
// app.ts
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import { connectDatabase } from './config/database';
import { errorHandler } from './middleware/errorHandler';
import { securityMiddleware } from './middleware/security';
import routes from './routes';

class App {
  public app: Application;

  constructor() {
    this.app = express();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(compression());
    this.app.use(morgan('combined'));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    
    // 速率限制
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100 // limit each IP to 100 requests per windowMs
    });
    this.app.use(limiter);
    
    this.app.use(securityMiddleware);
  }

  private initializeRoutes(): void {
    this.app.use('/api', routes);
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  public async initialize(): Promise<void> {
    await connectDatabase();
  }
}

export default App;
```

---

## 阶段 9：构建配置优化 (1天)

### 目标
优化 TypeScript 构建配置，提升开发体验和构建性能。

### 9.1 前端构建配置

#### Vite 配置更新
```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    target: 'es2015',
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
          ui: ['element-plus']
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
```

### 9.2 后端构建配置

#### TypeScript 编译配置优化
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    },
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### 9.3 开发工具配置

#### ESLint TypeScript 配置
```json
{
  "extends": [
    "@vue/typescript/recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn"
  }
}
```

#### Prettier TypeScript 支持
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "parser": "typescript"
}
```

---

## 详细实施检查清单

### 阶段 0 检查清单 ✅
- [ ] 前端 TypeScript 依赖安装完成
- [ ] 后端 TypeScript 依赖安装完成
- [ ] `tsconfig.json` 配置文件创建并验证
- [ ] `env.d.ts` 环境声明文件创建
- [ ] `nodemon.json` 配置文件创建
- [ ] 构建脚本更新并测试通过
- [ ] TypeScript 编译器版本验证
- [ ] IDE TypeScript 支持配置完成

### 阶段 1 检查清单 ✅
- [ ] 类型定义目录结构创建
- [ ] 核心业务类型定义完成
- [ ] API 响应类型定义完成
- [ ] 通用类型和工具类型定义
- [ ] 枚举类型定义完成
- [ ] 类型导出索引文件创建
- [ ] 类型兼容性测试通过
- [ ] 循环依赖检查通过

### 阶段 2 检查清单 ✅
- [ ] 验证工具函数迁移完成
- [ ] 文件工具函数迁移完成
- [ ] 函数参数和返回值类型化
- [ ] 错误处理类型统一
- [ ] 单元测试创建并通过
- [ ] 向后兼容性验证
- [ ] 泛型函数类型约束正确

### 阶段 3 检查清单 ✅
- [ ] HTTP 客户端类型化完成
- [ ] 前端服务层迁移完成
- [ ] 后端服务层迁移完成
- [ ] 异步操作类型安全
- [ ] 错误处理类型化
- [ ] 服务方法单元测试
- [ ] API 接口类型契约验证

### 阶段 4 检查清单 ✅
- [ ] Mongoose 模型接口定义
- [ ] Schema 类型注解完成
- [ ] 模型静态方法类型化
- [ ] 模型实例方法类型化
- [ ] 数据验证规则类型化
- [ ] 模型中间件类型安全
- [ ] 数据库查询类型安全
- [ ] 模型关系类型定义

### 阶段 5 检查清单 ✅
- [ ] Express 请求/响应类型扩展
- [ ] 控制器方法类型化
- [ ] 路由处理函数类型化
- [ ] 中间件函数类型化
- [ ] 错误处理中间件类型化
- [ ] 参数验证类型化
- [ ] API 端点类型安全测试

### 阶段 6 检查清单 ✅
- [ ] Pinia Store 状态类型定义
- [ ] Store Actions 类型化
- [ ] Store Getters 类型化
- [ ] 异步 Actions 错误处理
- [ ] Store 类型导出
- [ ] 组件中 Store 使用类型化
- [ ] 状态管理单元测试

### 阶段 7 检查清单 ✅
- [ ] Vue 组件 Props 类型定义
- [ ] Vue 组件 Emits 类型定义
- [ ] Composition API 类型化
- [ ] Template refs 类型化
- [ ] 组件方法类型化
- [ ] 组件生命周期类型化
- [ ] Element Plus 组件类型集成
- [ ] 组件单元测试更新

### 阶段 8 检查清单 ✅
- [ ] 前端配置文件迁移
- [ ] 后端配置文件迁移
- [ ] 主入口文件类型化
- [ ] 路由配置类型化
- [ ] 环境变量类型化
- [ ] 应用启动流程类型化
- [ ] 配置验证类型化

### 阶段 9 检查清单 ✅
- [ ] Vite 配置优化
- [ ] TypeScript 编译配置优化
- [ ] ESLint TypeScript 规则配置
- [ ] Prettier TypeScript 支持
- [ ] 构建性能优化
- [ ] 开发体验优化
- [ ] 生产构建验证
- [ ] 类型检查 CI/CD 集成

---

## 故障排除指南

### 常见编译错误

#### 1. 模块解析错误
```
Error: Cannot find module '@/types/market' or its corresponding type declarations.
```

**解决方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### 2. Vue 组件类型错误
```
Error: Property 'xxx' does not exist on type 'ComponentPublicInstance'
```

**解决方案**:
```typescript
// 确保正确的 Props 类型定义
interface Props {
  xxx: string;
}

const props = defineProps<Props>();
```

#### 3. Mongoose 类型冲突
```
Error: Argument of type 'xxx' is not assignable to parameter of type 'xxx'
```

**解决方案**:
```typescript
// 使用正确的 Mongoose 类型
import { Document, Schema, model, Model } from 'mongoose';

export interface IModel extends Document {
  // 字段定义
}
```

### 性能问题

#### 1. TypeScript 编译缓慢
**症状**: `tsc` 或 `vue-tsc` 编译时间过长

**解决方案**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

#### 2. IDE 响应缓慢
**症状**: VSCode 或其他 IDE 在 TypeScript 项目中响应缓慢

**解决方案**:
```json
// .vscode/settings.json
{
  "typescript.preferences.includePackageJsonAutoImports": "off",
  "typescript.suggest.autoImports": false
}
```

### 运行时错误

#### 1. 类型断言错误
**症状**: 运行时出现类型相关的错误

**解决方案**:
```typescript
// ❌ 避免过度使用 any
const data: any = response.data;

// ✅ 使用类型守卫
function isMarketEnvironment(obj: any): obj is MarketEnvironment {
  return obj && typeof obj.id === 'string' && typeof obj.name === 'string';
}

if (isMarketEnvironment(data)) {
  // 安全使用 data
}
```

#### 2. 异步操作类型错误
**症状**: Promise 类型处理不当

**解决方案**:
```typescript
// ✅ 正确的异步类型处理
async function fetchData(): Promise<MarketEnvironment[]> {
  try {
    const response = await api.get<ApiResponse<MarketEnvironment[]>>('/market');
    return response.data.data;
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '获取数据失败');
  }
}
```

### 构建问题

#### 1. 生产构建失败
**症状**: 开发环境正常，生产构建失败

**解决方案**:
```bash
# 检查类型错误
npm run type-check

# 清理缓存
rm -rf node_modules/.cache
rm -rf dist
npm run build
```

#### 2. 依赖类型缺失
**症状**: 第三方库类型定义缺失

**解决方案**:
```bash
# 安装缺失的类型定义
npm install -D @types/library-name

# 或创建自定义类型声明
// types/vendor.d.ts
declare module 'library-name' {
  export function someFunction(): void;
}
```

---

## 迁移后验证

### 功能验证清单

#### 1. 核心功能验证
- [ ] 市场环境创建功能正常
- [ ] 市场环境编辑功能正常
- [ ] 市场环境删除功能正常
- [ ] 市场环境导出功能正常
- [ ] 交易员模板管理功能正常
- [ ] 股票模板管理功能正常

#### 2. 用户界面验证
- [ ] 所有页面正常加载
- [ ] 表单验证正常工作
- [ ] 数据展示正确
- [ ] 交互操作响应正常
- [ ] 错误提示正确显示
- [ ] 成功提示正确显示

#### 3. 数据完整性验证
- [ ] 数据库操作正常
- [ ] 数据验证规则生效
- [ ] 数据关系正确维护
- [ ] 数据导入导出正常
- [ ] 数据备份恢复正常

### 性能验证

#### 1. 编译性能
```bash
# 测试编译时间
time npm run build

# 测试类型检查时间
time npm run type-check
```

#### 2. 运行时性能
- [ ] 页面加载速度正常
- [ ] API 响应时间正常
- [ ] 内存使用合理
- [ ] CPU 使用合理

### 开发体验验证

#### 1. IDE 支持
- [ ] 自动补全正常工作
- [ ] 类型提示准确
- [ ] 错误提示及时
- [ ] 重构功能正常
- [ ] 导航功能正常

#### 2. 调试支持
- [ ] 断点调试正常
- [ ] 源码映射正确
- [ ] 错误堆栈清晰
- [ ] 热重载正常

---

## 团队协作指南

### 代码审查要点

#### 1. 类型定义审查
- [ ] 类型定义是否准确
- [ ] 是否过度使用 `any`
- [ ] 泛型使用是否合理
- [ ] 类型导入是否正确

#### 2. 代码质量审查
- [ ] 函数签名是否清晰
- [ ] 错误处理是否完善
- [ ] 异步操作是否类型安全
- [ ] 组件接口是否合理

### 最佳实践

#### 1. 类型定义
```typescript
// ✅ 推荐：明确的类型定义
interface UserConfig {
  name: string;
  age: number;
  isActive: boolean;
}

// ❌ 避免：过度使用 any
interface UserConfig {
  [key: string]: any;
}
```

#### 2. 错误处理
```typescript
// ✅ 推荐：类型化的错误处理
class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number
  ) {
    super(message);
  }
}

// ❌ 避免：通用错误处理
throw new Error('Something went wrong');
```

#### 3. 异步操作
```typescript
// ✅ 推荐：明确的 Promise 类型
async function fetchUser(id: string): Promise<User> {
  const response = await api.get<ApiResponse<User>>(`/users/${id}`);
  return response.data.data;
}

// ❌ 避免：未类型化的 Promise
async function fetchUser(id: string) {
  const response = await api.get(`/users/${id}`);
  return response.data;
}
```

---

## 持续改进

### 监控指标

#### 1. 代码质量指标
- TypeScript 覆盖率
- 类型错误数量
- ESLint 警告数量
- 代码复杂度

#### 2. 开发效率指标
- 编译时间
- 构建时间
- 热重载时间
- IDE 响应时间

### 优化建议

#### 1. 类型定义优化
- 定期审查和重构类型定义
- 消除重复的类型定义
- 优化复杂的泛型类型
- 提取公共类型到共享模块

#### 2. 构建优化
- 启用增量编译
- 优化 TypeScript 配置
- 使用类型检查缓存
- 并行化构建过程

#### 3. 开发工具优化
- 配置 IDE 插件
- 自定义代码片段
- 配置自动格式化
- 设置代码质量检查

通过这个详细的 TypeScript 迁移方案，你可以系统性地将项目从 JavaScript 迁移到 TypeScript，确保迁移过程的安全性和高效性，同时最大化 TypeScript 带来的收益。