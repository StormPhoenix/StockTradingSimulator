# 股票交易模拟器 - 运行时实例化系统设计文档

## 1. 概述

### 1.1 设计目标
基于现有的模板系统（股票模板、AI交易者模板、市场环境模板），创建运行时实例化系统，为用户提供真实的游戏体验。系统采用生命周期管理，所有运行时对象都继承GameObject并通过GameObjectManager进行统一管理。

### 1.2 核心原则
- **简洁设计**：当前版本专注核心功能，复杂交易逻辑后续实现
- **生命周期管理**：所有实例继承GameObject，统一管理创建和销毁
- **运行时特性**：实例化对象仅存在于内存，不持久化到数据库
- **异步处理**：支持实例化进度反馈和错误处理

## 2. 系统架构

### 2.1 核心组件关系图
```
用户请求 → ExchangeController → ExchangeService
    ↓
ExchangeInstance (GameObject)
    ├── AITraderInstance[] (GameObject)
    └── StockInstance[] (GameObject)
    ↓
GameObjectManager (统一生命周期管理)
```

### 2.2 数据流向
```
前端请求(模板ID) → 后端异步实例化 → 进度反馈 → 完成/失败通知
```

## 3. 核心类型设计

### 3.1 交易所实例 (ExchangeInstance)

```typescript
class ExchangeInstance extends GameObject {
  // 基础属性
  private marketEnvironmentTemplateId: string
  private aiTraders: AITraderInstance[] = []
  private stocks: StockInstance[] = []
  private creationProgress: CreationProgress
  
  // 生命周期方法
  async onBeginPlay(): Promise<void> {
    // 1. 加载市场环境模板
    // 2. 异步创建AI交易者实例
    // 3. 异步创建股票实例
    // 4. 更新创建进度
    // 5. 处理创建失败回滚
  }
  
  onTick(deltaTime: number): void {
    // 当前版本无需特殊处理
  }
  
  onDestroy(): void {
    // 销毁所有持有的AI交易者和股票实例
    // 通过GameObjectManager.destroyObject()
  }
  
  // 业务方法
  getPreviewInfo(): ExchangePreviewInfo
  exportToJson(): string
  static importFromJson(jsonData: string): ExchangeInstance
}

interface CreationProgress {
  totalStocks: number
  createdStocks: number
  totalTraders: number
  createdTraders: number
  status: 'creating' | 'completed' | 'failed'
  errorMessage?: string
}

interface ExchangePreviewInfo {
  aiTraderCount: number
  stockCount: number
  totalCapital: number
  stocks: StockPreviewInfo[]
}
```

### 3.2 AI交易者实例 (AITraderInstance)

```typescript
class AITraderInstance extends GameObject {
  // 模板数据
  private template: ITraderTemplate
  
  // 运行时数据
  private runtimeData: {
    currentCapital: number
    name: string
    riskProfile: string
    tradingStyle: string
    // 其他运行时状态
  }
  
  // 生命周期方法
  onBeginPlay(): void {
    // 初始化交易者状态
    // 基于模板数据设置运行时属性
  }
  
  onTick(deltaTime: number): void {
    // 模拟交易决策（打印日志）
    // 格式：[AITrader-{id}] {name} 正在分析市场... 决策：{action}
  }
  
  onDestroy(): void {
    // 清理资源
  }
  
  // 业务方法
  getPreviewInfo(): TraderPreviewInfo
  toJson(): object
  static fromTemplate(template: ITraderTemplate): AITraderInstance
}

interface TraderPreviewInfo {
  name: string
  currentCapital: number
  riskProfile: string
  tradingStyle: string
}
```

### 3.3 股票实例 (StockInstance)

```typescript
class StockInstance extends GameObject {
  // 模板数据
  private template: IStockTemplate
  
  // 运行时数据
  private runtimeData: {
    currentPrice: number
    name: string
    symbol: string
    totalShares: number
    category: string
    // 其他运行时状态
  }
  
  // 生命周期方法
  onBeginPlay(): void {
    // 初始化股票状态
    // 当前价格 = 发行价格
  }
  
  onTick(deltaTime: number): void {
    // 当前版本无需处理价格变化
  }
  
  onDestroy(): void {
    // 清理资源
  }
  
  // 业务方法
  getPreviewInfo(): StockPreviewInfo
  toJson(): object
  static fromTemplate(template: IStockTemplate): StockInstance
}

interface StockPreviewInfo {
  name: string
  symbol: string
  currentPrice: number
  totalShares: number
  category: string
  marketValue: number
}
```

## 4. 服务层设计

### 4.1 交易所服务 (ExchangeService)

```typescript
class ExchangeService {
  // 核心业务方法
  async createExchange(marketEnvironmentTemplateId: string): Promise<{
    exchangeId: number
    success: boolean
    error?: string
  }>
  
  async getCreationProgress(exchangeId: number): Promise<CreationProgress>
  
  async getExchangeList(): Promise<ExchangeListItem[]>
  
  async getExchangePreview(exchangeId: number): Promise<ExchangePreviewInfo>
  
  async destroyExchange(exchangeId: number): Promise<boolean>
  
  async exportExchange(exchangeId: number): Promise<string>
  
  // 内部方法
  private async createAITradersFromTemplate(
    traderTemplates: ITraderTemplate[],
    progressCallback: (progress: number) => void
  ): Promise<AITraderInstance[]>
  
  private async createStocksFromTemplate(
    stockTemplates: IStockTemplate[],
    progressCallback: (progress: number) => void
  ): Promise<StockInstance[]>
  
  private async rollbackCreation(
    createdTraders: AITraderInstance[],
    createdStocks: StockInstance[]
  ): Promise<void>
}

interface ExchangeListItem {
  exchangeId: number
  marketEnvironmentName: string
  aiTraderCount: number
  stockCount: number
  totalCapital: number
  createdAt: Date
  status: 'running' | 'stopped'
}
```

## 5. 控制器层设计

### 5.1 交易所控制器 (ExchangeController)

```typescript
class ExchangeController {
  // API端点
  
  // POST /api/exchange/create
  async createExchange(req: Request, res: Response): Promise<void> {
    // 参数：{ marketEnvironmentTemplateId: string }
    // 返回：{ exchangeId: number, success: boolean, error?: string }
  }
  
  // GET /api/exchange/progress/:exchangeId
  async getCreationProgress(req: Request, res: Response): Promise<void> {
    // 返回：CreationProgress
  }
  
  // GET /api/exchange/list
  async getExchangeList(req: Request, res: Response): Promise<void> {
    // 返回：ExchangeListItem[]
  }
  
  // GET /api/exchange/:exchangeId/preview
  async getExchangePreview(req: Request, res: Response): Promise<void> {
    // 返回：ExchangePreviewInfo
  }
  
  // DELETE /api/exchange/:exchangeId
  async destroyExchange(req: Request, res: Response): Promise<void> {
    // 返回：{ success: boolean }
  }
  
  // GET /api/exchange/:exchangeId/export
  async exportExchange(req: Request, res: Response): Promise<void> {
    // 返回：JSON文件下载
  }
}
```

## 6. 实例化流程设计

### 6.1 创建流程
```
1. 前端发起创建请求 (POST /api/exchange/create)
   ↓
2. 验证市场环境模板ID
   ↓
3. 创建ExchangeInstance并注册到GameObjectManager
   ↓
4. 异步执行onBeginPlay()
   ├── 4.1 加载市场环境模板
   ├── 4.2 批量创建AI交易者实例
   │   ├── 创建进度更新 (1/N, 2/N, ...)
   │   └── 注册到GameObjectManager
   ├── 4.3 批量创建股票实例
   │   ├── 创建进度更新 (1/M, 2/M, ...)
   │   └── 注册到GameObjectManager
   └── 4.4 完成或失败处理
   ↓
5. 返回创建结果给前端
```

### 6.2 错误处理和回滚
```
创建失败场景：
├── 模板加载失败 → 直接返回错误
├── AI交易者创建失败 → 销毁已创建的交易者，返回错误
├── 股票创建失败 → 销毁已创建的交易者和股票，返回错误
└── 部分创建成功 → 全部回滚，确保数据一致性
```

## 7. 进度反馈机制

### 7.1 进度计算
```typescript
interface ProgressCalculation {
  // 总进度 = (已创建交易者数 + 已创建股票数) / (总交易者数 + 总股票数)
  totalProgress: number // 0-100
  
  // 分阶段进度
  traderProgress: number // 0-100
  stockProgress: number // 0-100
  
  // 当前阶段
  currentStage: 'loading_template' | 'creating_traders' | 'creating_stocks' | 'completed'
}
```

### 7.2 前端轮询机制
```
前端每500ms轮询一次进度接口
GET /api/exchange/progress/:exchangeId

返回格式：
{
  totalProgress: 65,
  traderProgress: 100,
  stockProgress: 30,
  currentStage: 'creating_stocks',
  status: 'creating',
  errorMessage?: string
}
```

## 8. 序列化设计

### 8.1 导出格式
```json
{
  "exchangeInfo": {
    "marketEnvironmentTemplateId": "template_id",
    "createdAt": "2026-01-19T10:00:00Z",
    "version": "1.0"
  },
  "aiTraders": [
    {
      "gameObjectId": 12345,
      "template": { /* ITraderTemplate数据 */ },
      "runtimeData": { /* 当前运行时状态 */ }
    }
  ],
  "stocks": [
    {
      "gameObjectId": 12346,
      "template": { /* IStockTemplate数据 */ },
      "runtimeData": { /* 当前运行时状态 */ }
    }
  ]
}
```

### 8.2 复用现有机制
- 利用现有的市场环境模板序列化工具类
- 扩展支持运行时实例数据的序列化
- 保持JSON格式的兼容性

## 9. 日志设计

### 9.1 AI交易者模拟决策日志
```
格式：[AITrader-{gameObjectId}] {traderName} | 资金: ${currentCapital} | 决策: {randomAction}

示例：
[AITrader-12345] 激进交易者A | 资金: $50000 | 决策: 正在分析AAPL股票，考虑买入
[AITrader-12346] 保守交易者B | 资金: $30000 | 决策: 持有现金，观望市场
[AITrader-12347] 平衡交易者C | 资金: $40000 | 决策: 正在评估TSLA风险
```

### 9.2 系统日志
```
实例化日志：
[Exchange] 开始创建交易所实例，模板ID: {templateId}
[Exchange] AI交易者创建进度: {current}/{total}
[Exchange] 股票创建进度: {current}/{total}
[Exchange] 交易所创建完成，ID: {exchangeId}

错误日志：
[Exchange] 创建失败: {errorMessage}
[Exchange] 开始回滚操作...
[Exchange] 回滚完成
```

## 10. 文件结构

```
server/src/
├── models/
│   ├── runtime/
│   │   ├── exchangeInstance.ts
│   │   ├── aiTraderInstance.ts
│   │   └── stockInstance.ts
├── services/
│   └── exchangeService.ts
├── controllers/
│   └── exchangeController.ts
├── routes/
│   └── exchange.ts
├── types/
│   └── exchange.ts
└── utils/
    └── exchangeSerializer.ts
```

## 11. API接口规范

### 11.1 创建交易所
```
POST /api/exchange/create
Request: {
  marketEnvironmentTemplateId: string
}
Response: {
  exchangeId: number,
  success: boolean,
  error?: string
}
```

### 11.2 获取创建进度
```
GET /api/exchange/progress/:exchangeId
Response: {
  totalProgress: number,
  traderProgress: number,
  stockProgress: number,
  currentStage: string,
  status: 'creating' | 'completed' | 'failed',
  errorMessage?: string
}
```

### 11.3 获取交易所列表
```
GET /api/exchange/list
Response: {
  exchanges: ExchangeListItem[]
}
```

### 11.4 获取交易所预览
```
GET /api/exchange/:exchangeId/preview
Response: ExchangePreviewInfo
```

### 11.5 销毁交易所
```
DELETE /api/exchange/:exchangeId
Response: {
  success: boolean
}
```

### 11.6 导出交易所
```
GET /api/exchange/:exchangeId/export
Response: JSON文件下载
```

## 12. 实现计划和优先级

**⚠️ 重要：必须严格按照以下顺序实现，不可跳跃或并行开发**

### 🎯 Phase 1: 后端基础数据类型 (第一优先级)
**目标**：建立完整的类型系统和数据结构

#### 1.1 核心类型定义 (必须首先完成)
```
实现顺序：
1. shared/types/exchange.ts - 定义所有接口和类型
2. server/src/models/runtime/stockInstance.ts - 股票实例类
3. server/src/models/runtime/aiTraderInstance.ts - AI交易者实例类  
4. server/src/models/runtime/exchangeInstance.ts - 交易所实例类
```

#### 1.2 类型验证 (类型定义完成后)
```
实现内容：
- 所有类继承GameObject的正确性验证
- 接口定义的完整性检查
- 类型导入导出的正确性测试
- 基础方法签名的验证
```

#### 1.3 基础工具类 (数据类型稳定后)
```
实现顺序：
1. server/src/utils/exchangeSerializer.ts - 序列化工具
2. server/src/types/exchange.ts - 服务层类型定义
```

**⚠️ Phase 1 完成标准**：
- [ ] 所有类型编译无错误
- [ ] 基础类可以正确实例化
- [ ] GameObject继承关系正确
- [ ] 类型导入导出正常

---

### 🎯 Phase 2: 后端实例化接口 (第二优先级)
**目标**：实现完整的后端API和业务逻辑

#### 2.1 服务层实现 (Phase 1完成后开始)
```
实现顺序：
1. server/src/services/exchangeService.ts - 核心业务逻辑
   - createExchange() 方法
   - 实例化流程和进度管理
   - 错误处理和回滚机制
2. 与GameObjectManager的集成测试
3. 异步创建流程的完整实现
```

#### 2.2 控制器层实现 (服务层稳定后)
```
实现顺序：
1. server/src/controllers/exchangeController.ts - API端点
2. server/src/routes/exchange.ts - 路由配置
3. 中间件和参数验证
4. 错误处理和响应格式统一
```

#### 2.3 集成测试 (控制器完成后)
```
测试内容：
- API端点的完整性测试
- 实例化流程的端到端测试
- 错误场景的处理验证
- 进度反馈机制的正确性
- 序列化功能的验证
```

**⚠️ Phase 2 完成标准**：
- [ ] 所有API端点正常响应
- [ ] 实例化流程完整无误
- [ ] 错误处理机制有效
- [ ] 进度反馈准确
- [ ] 可以通过Postman等工具完整测试

---

### 🎯 Phase 3: 前端功能实现 (第三优先级)
**目标**：实现用户界面和交互功能

#### 3.1 前端API集成 (后端API稳定后开始)
```
实现顺序：
1. API服务封装 - 封装所有后端接口
2. 数据模型定义 - 前端数据类型
3. 状态管理 - 交易所状态管理
```

#### 3.2 用户界面实现 (API集成完成后)
```
实现顺序：
1. 交易所创建页面 - 模板选择和创建
2. 进度条组件 - 实例化进度显示
3. 交易所列表页面 - 显示所有交易所
4. 交易所详情页面 - 预览信息展示
5. 导出功能 - JSON文件下载
```

#### 3.3 用户体验优化 (基础功能完成后)
```
实现内容：
- 错误提示和用户反馈
- 加载状态和交互优化
- 响应式设计适配
- 性能优化和缓存策略
```

**⚠️ Phase 3 完成标准**：
- [ ] 用户可以完整创建交易所
- [ ] 进度条正确显示创建进度
- [ ] 错误情况有明确提示
- [ ] 交易所列表和详情正常显示
- [ ] 导出功能正常工作

---

### 🚨 实现约束和注意事项

#### 严格的实现顺序
1. **不可跳跃**：必须完成当前Phase的所有内容才能进入下一Phase
2. **不可并行**：不同Phase之间不能同时开发
3. **完整验证**：每个Phase完成后必须通过完成标准验证

#### 质量保证
1. **代码审查**：每个Phase完成后进行代码审查
2. **测试覆盖**：关键功能必须有测试用例
3. **文档更新**：实现过程中及时更新技术文档

#### 风险控制
1. **回滚准备**：每个Phase完成后创建代码快照
2. **问题跟踪**：记录实现过程中的问题和解决方案
3. **进度监控**：定期检查实现进度和质量

这个分阶段实现计划确保了系统的稳定性和可维护性，避免了因为跳跃式开发导致的集成问题和技术债务。