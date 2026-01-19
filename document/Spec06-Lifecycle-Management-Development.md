# GameObject 生命周期管理系统 - 开发文档

**项目**: StockTradeSimulator  
**版本**: 1.0.0  
**创建日期**: 2026-01-19  

## 📋 系统概述

### 1.1 项目背景

GameObject 生命周期管理系统是 StockTradeSimulator 项目的核心基础设施，参考虚幻引擎的 FEngineLoop::Tick + AActor 设计模式，为 AI 交易者、股票模板和交易所提供统一的生命周期管理。

### 1.2 核心价值

- **统一生命周期**: 标准化的对象生命周期管理模式
- **高性能运行**: 支持 1-120 FPS 的高频循环执行
- **错误隔离**: 单个对象异常不影响系统整体运行
- **实时监控**: 完整的调试和监控界面

---

## 🎮 核心功能

### 2.1 生命周期管理

#### 对象状态流转
```
READY → ACTIVE → PAUSED → DESTROYING → DESTROYED
```

#### 生命周期方法
- `onBeginPlay()`: 对象激活时调用
- `onTick(deltaTime)`: 每帧更新时调用  
- `onDestroy()`: 对象销毁时调用

#### 核心接口
```typescript
interface GameObject {
  readonly id: number;
  state: GameObjectState;
  onBeginPlay(): void;
  onTick(deltaTime: number): void;
  onDestroy(): void;
}
```

### 2.2 系统控制

- **循环控制**: 启动/停止生命周期循环
- **帧率管理**: 动态调整 1-120 FPS
- **对象管理**: 创建、销毁、暂停、恢复对象
- **错误隔离**: 自动处理对象异常，超限自动销毁

### 2.3 实时监控

- **性能统计**: FPS、执行时间、内存使用
- **对象统计**: 各状态对象数量和详情
- **错误追踪**: 对象错误计数和日志
- **Web 界面**: 直观的调试和控制界面

---

## 🏗️ 技术架构

### 3.1 整体架构

```
前端调试界面 (Vue 3 + Element Plus)
           ↓ HTTP API
后端服务 (Node.js + Express + TypeScript)
           ↓ 内部调用
生命周期管理核心 (TypeScript)
           ↓ 接口实现
业务对象层 (AI Trader, Stock, Exchange)
```

### 3.2 核心组件

#### GameLoop - 主循环管理器
```typescript
class GameLoop {
  start(fps?: number): void     // 启动循环
  stop(): void                  // 停止循环
  tick(): void                  // 执行单次循环
  getStatus(): LoopStatus       // 获取运行状态
  getPerformanceStats(): PerformanceStats
}
```

#### GameObjectManager - 对象管理器
```typescript
class GameObjectManager {
  createObject<T extends GameObject>(ObjectClass): T
  destroyObject(id: number): void
  pauseObject(id: number): void
  resumeObject(id: number): void
  getAllObjects(): GameObject[]
}
```

#### SafeGameObjectContainer - 安全容器
- 支持遍历期间的延迟增删操作
- 避免迭代器失效问题
- 保证操作原子性

#### ErrorIsolationManager - 错误管理器
- 自动捕获生命周期方法异常
- 累计错误次数统计
- 超限自动销毁机制

---

## 🔌 API 接口

### 4.1 标准响应格式

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
```

### 4.2 核心接口

#### 对象管理
- `GET /api/v1/debug/gameobjects` - 获取对象列表
- `GET /api/v1/debug/gameobjects/{id}` - 获取对象详情
- `POST /api/v1/debug/gameobjects/{id}/pause` - 暂停对象
- `POST /api/v1/debug/gameobjects/{id}/resume` - 恢复对象
- `POST /api/v1/debug/gameobjects/{id}/destroy` - 销毁对象

#### 系统监控
- `GET /api/v1/debug/performance` - 获取性能统计
- `GET /api/v1/debug/loop/status` - 获取循环状态

#### 系统控制
- `POST /api/v1/debug/loop/start` - 启动循环
- `POST /api/v1/debug/loop/stop` - 停止循环

### 4.3 响应示例

```json
{
  "success": true,
  "data": {
    "total": 15,
    "byState": {
      "READY": 2,
      "ACTIVE": 10,
      "PAUSED": 2,
      "DESTROYING": 1,
      "DESTROYED": 0
    },
    "objects": [
      {
        "id": 1,
        "state": "ACTIVE",
        "type": "AITrader",
        "errorCount": 0
      }
    ]
  },
  "message": "Objects retrieved successfully"
}
```

---

## 🖥️ 前端界面

### 5.1 界面布局

```
┌─────────────────────────────────────────────────────────────┐
│                        顶部控制栏                            │
│  [启动循环] [停止循环] [刷新数据] [设置帧率: 30 FPS]           │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────┬─────────────────────┬─────────────────────┐
│    系统状态面板      │    性能监控面板      │    对象管理面板      │
│ • 循环状态: 运行中   │ • 当前FPS: 29.8    │ • 总对象数: 15      │
│ • 运行时长: 2h 30m  │ • 目标FPS: 30      │ • 活跃对象: 10      │
│ • 总Tick数: 324000 │ • Tick耗时: 2.5ms  │ • 暂停对象: 2       │
└─────────────────────┴─────────────────────┴─────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      对象详情列表                            │
│  ID │ 状态   │ 类型      │ 错误次数 │ 操作                    │
│  1  │ ACTIVE │ AITrader  │ 0       │ [暂停] [销毁]           │
│  2  │ PAUSED │ Stock     │ 1       │ [恢复] [销毁]           │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 核心功能

- **实时数据更新**: 每秒自动刷新系统状态
- **交互式控制**: 一键启停循环和对象操作
- **状态可视化**: 清晰的颜色和图标标识
- **响应式设计**: 适配不同屏幕尺寸

### 5.3 技术实现

- **框架**: Vue 3 + Composition API
- **UI 库**: Element Plus
- **构建工具**: Vite
- **类型安全**: TypeScript 严格模式

---

## 🛠️ 开发实现

### 6.1 项目结构

```
StockTradeSimulator/
├── server/src/lifecycle/           # 生命周期核心模块
│   ├── core/                      # 核心实现
│   │   ├── GameLoop.ts
│   │   ├── GameObjectManager.ts
│   │   ├── GameObjectStateManager.ts
│   │   ├── SafeGameObjectContainer.ts
│   │   ├── ErrorIsolationManager.ts
│   │   └── AutoIncrementIdGenerator.ts
│   ├── config/LifecycleConfig.ts  # 配置管理
│   └── index.ts                   # 模块导出
├── server/src/controllers/
│   └── gameObjectDebugController.ts # 调试控制器
├── server/src/routes/
│   └── debugRoutes.ts             # 调试路由
├── app/src/components/lifecycle/
│   └── LifecycleDebug.vue         # 调试界面
├── app/src/services/
│   └── lifecycleApi.ts            # API 服务
└── shared/types/
    └── lifecycle.ts               # 共享类型定义
```

### 6.2 关键实现

#### GameLoop 核心实现
```typescript
export class GameLoop {
  private fps: number = 30
  private isRunning: boolean = false
  private intervalId: NodeJS.Timeout | null = null

  start(fps: number = 30): void {
    if (this.isRunning) {
      throw new Error('Game loop is already running')
    }

    this.fps = Math.max(1, Math.min(120, fps))
    this.isRunning = true
    
    this.intervalId = setInterval(() => {
      this.tick()
    }, 1000 / this.fps)
  }

  private tick(): void {
    try {
      // 处理 READY → ACTIVE
      this.stateManager.processReadyObjects()
      
      // 处理 ACTIVE 对象的 onTick
      this.stateManager.processActiveObjects(deltaTime)
      
      // 处理 DESTROYING → DESTROYED
      this.stateManager.processDestroyingObjects()
      
      // 清理 DESTROYED 对象
      this.stateManager.cleanupDestroyedObjects()
    } catch (error) {
      console.error('Error in game loop tick:', error)
    }
  }
}
```

#### 错误隔离机制
```typescript
export class ErrorIsolationManager {
  private errorCounts: Map<number, number> = new Map()
  private maxErrors: number = 3

  handleObjectError(obj: GameObject, error: Error, phase: string): void {
    const currentCount = this.errorCounts.get(obj.id) || 0
    const newCount = currentCount + 1
    
    this.errorCounts.set(obj.id, newCount)
    console.error(`GameObject ${obj.id} error in ${phase}:`, error)
    
    if (newCount >= this.maxErrors) {
      console.warn(`GameObject ${obj.id} exceeded max errors, marking for destruction`)
      obj.state = GameObjectState.DESTROYING
    }
  }
}
```

---

## ⚠️ 技术注意事项

### 7.1 性能优化

#### 高效对象遍历
- 使用状态分组减少无效遍历
- 只处理需要更新的对象状态
- 批量处理状态转换操作

#### 内存管理
- 及时清理销毁的对象
- 避免内存泄漏
- 监控内存使用趋势

#### 关键性能指标
- **目标**: 实际 FPS 与目标 FPS 偏差 < 5%
- **延迟**: 单次 Tick 执行时间 < 10ms (30FPS)
- **内存**: 内存使用稳定，无明显泄漏
- **错误率**: 对象错误率 < 1%

### 7.2 错误处理

#### 异常安全设计
```typescript
private callLifecycleMethod(obj: GameObject, method: string, ...args: any[]): void {
  try {
    (obj as any)[method](...args)
  } catch (error) {
    this.errorManager.handleObjectError(obj, error as Error, method)
  }
}
```

#### 状态转换验证
```typescript
function isValidStateTransition(from: GameObjectState, to: GameObjectState): boolean {
  const validTransitions = {
    [GameObjectState.READY]: [GameObjectState.ACTIVE, GameObjectState.DESTROYING],
    [GameObjectState.ACTIVE]: [GameObjectState.PAUSED, GameObjectState.DESTROYING],
    [GameObjectState.PAUSED]: [GameObjectState.ACTIVE, GameObjectState.DESTROYING],
    [GameObjectState.DESTROYING]: [GameObjectState.DESTROYED],
    [GameObjectState.DESTROYED]: []
  }
  
  return validTransitions[from].includes(to)
}
```

### 7.3 类型安全

#### TypeScript 严格模式
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true
  }
}
```

#### 类型守卫函数
```typescript
function isGameObject(obj: any): obj is GameObject {
  return obj && 
         typeof obj.id === 'number' && 
         obj.id > 0 &&
         isValidGameObjectState(obj.state) &&
         typeof obj.onBeginPlay === 'function' &&
         typeof obj.onTick === 'function' &&
         typeof obj.onDestroy === 'function'
}
```

### 7.4 并发安全

#### 安全容器实现
```typescript
export class SafeGameObjectContainer {
  private isIterating: boolean = false
  private pendingAdditions: Map<number, GameObject> = new Map()
  private pendingRemovals: Set<number> = new Set()

  forEach(callback: (obj: GameObject) => void): void {
    this.isIterating = true
    try {
      // 安全遍历逻辑
    } finally {
      this.isIterating = false
      this.processPendingOperations()
    }
  }
}
```

---

## 🧪 测试与调试

### 8.1 测试策略

#### 单元测试
```typescript
describe('GameLoop', () => {
  it('should start with correct FPS', () => {
    gameLoop.start(60)
    const status = gameLoop.getStatus()
    expect(status.isRunning).toBe(true)
    expect(status.fps).toBe(60)
  })
})
```

#### 集成测试
```typescript
describe('Debug API', () => {
  it('should return object list', async () => {
    const response = await request(app)
      .get('/api/v1/debug/gameobjects')
      .expect(200)
    
    expect(response.body.success).toBe(true)
  })
})
```

### 8.2 调试工具

#### VSCode 调试配置
```json
{
  "name": "Debug Full Stack",
  "configurations": ["Debug Backend", "Debug Frontend"],
  "stopAll": true
}
```

#### 性能监控脚本
```javascript
// scripts/test-debug.js - 创建测试对象并监控性能
class TestAITrader {
  constructor(id) {
    this.id = id
    this.state = 'READY'
  }
  
  onBeginPlay() { console.log(`Trader ${this.id} started`) }
  onTick(deltaTime) { /* 交易逻辑 */ }
  onDestroy() { console.log(`Trader ${this.id} destroyed`) }
}
```

### 8.3 常见问题排查

#### 循环无法启动
- 检查循环状态: `gameLoop.getStatus()`
- 验证 FPS 参数: 1-120 范围
- 检查系统资源使用情况

#### 性能问题
- 分析 Tick 执行时间
- 检查对象数量和分布
- 监控内存使用趋势

#### API 连接问题
- 验证端口配置: `lsof -i :3000`
- 测试 API 连接: `curl http://localhost:3000/api/v1/debug/loop/status`
- 检查路由注册和 CORS 配置

---

## 🚀 部署与运维

### 9.1 Docker 部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY . .
RUN npm ci && npm run build:all
EXPOSE 3000 5173
CMD ["npm", "run", "start:prod"]
```

### 9.2 监控告警

#### 关键指标监控
- FPS 监控: 实际 FPS < 目标 FPS * 0.9
- 执行时间: Tick 执行时间 > 10ms
- 错误率: 对象错误率 > 1%
- 内存使用: 内存增长趋势异常

#### 日志管理
```typescript
// 结构化日志格式
interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error'
  component: string
  objectId?: number
  message: string
  context?: Record<string, any>
}
```

---

## 🔮 扩展性设计

### 10.1 业务对象扩展

#### AI 交易者示例
```typescript
export class AITrader implements GameObject {
  readonly id: number
  state: GameObjectState = GameObjectState.READY
  
  private strategy: TradingStrategy
  private portfolio: Portfolio

  onBeginPlay(): void {
    // 初始化交易策略和投资组合
  }

  onTick(deltaTime: number): void {
    // 执行交易逻辑
    const decisions = this.strategy.execute(marketData, this.portfolio)
    this.executeTrades(decisions)
  }

  onDestroy(): void {
    // 清算持仓，保存交易记录
  }
}
```

#### 股票对象示例
```typescript
export class Stock implements GameObject {
  readonly id: number
  state: GameObjectState = GameObjectState.READY
  
  private symbol: string
  private price: number
  private volatility: number

  onTick(deltaTime: number): void {
    // 更新股票价格
    this.updatePrice()
    // 广播价格变化
    this.notifyPriceChange()
  }
}
```

### 10.2 未来扩展点

- **序列化支持**: 对象状态的保存和恢复
- **分布式支持**: 多节点的对象管理
- **事件系统**: 生命周期事件的发布订阅
- **依赖管理**: 对象间的依赖关系处理
- **性能分析**: 详细的性能分析和优化建议

---

## 📚 总结

GameObject 生命周期管理系统为 StockTradeSimulator 项目提供了：

1. **统一的对象管理框架** - 标准化的生命周期接口
2. **高性能的运行时环境** - 支持高频循环和大量对象
3. **完善的错误处理机制** - 异常隔离和自动恢复
4. **直观的调试监控界面** - 实时状态监控和控制
5. **良好的扩展性设计** - 支持未来业务需求扩展

该系统为后续开发 AI 交易者、股票模板和交易所等业务对象奠定了坚实的技术基础，确保了系统的可靠性、性能和可维护性。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-19  
**维护者**: StockTradeSimulator 开发团队