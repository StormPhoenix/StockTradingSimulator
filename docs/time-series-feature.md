# 时间序列模拟与可视化功能

## 📊 功能概述

这是一个完整的时间序列数据模拟和可视化系统，支持多粒度 K 线图数据的生成、聚合和展示。

### 核心功能

✅ **数据模拟**: 使用随机游走模型生成模拟的股票价格数据
✅ **多粒度聚合**: 支持 1分钟、5分钟、15分钟、30分钟等多种时间粒度
✅ **K 线图绘制**: 实时绘制开高收低价格和成交量（SVG 原生绘制）
✅ **RESTful API**: 完整的后端 API 支持创建、查询、删除等操作
✅ **数据验证**: 自动检测时间顺序错误，防止逆时数据添加

## 🚀 快速开始

### 方法一：使用启动脚本（推荐）

```bash
# 同时启动后端和前端
./scripts/start-time-series.sh

# 停止服务
./scripts/stop-time-series.sh
```

### 方法二：手动启动

```bash
# 终端 1: 启动后端
cd server
npm run dev

# 终端 2: 启动前端
cd app
npm run dev
```

### 访问页面

在浏览器中打开:
```
http://localhost:5173/time-series
```

## 📋 功能清单

### 后端功能

| 功能 | 端点 | 说明 |
|------|--------|------|
| 创建时间序列 | POST `/api/time-series/series` | 创建新的时间序列定义 |
| 添加数据点 | POST `/api/time-series/data-points` | 批量添加原始数据点 |
| 生成模拟数据 | POST `/api/time-series/simulate` | 生成模拟数据（仅预览） |
| 生成并添加 | POST `/api/time-series/simulate-and-add` | 生成并添加到时间序列 |
| 查询聚合数据 | GET `/api/time-series/aggregated` | 查询指定时间范围的聚合数据 |
| 获取最新数据 | GET `/api/time-series/latest/:seriesId/:granularity` | 获取最新的聚合数据 |
| 获取所有序列 | GET `/api/time-series/series` | 获取所有序列 ID |
| 删除序列 | DELETE `/api/time-series/series/:seriesId` | 删除指定序列 |
| 清除聚合数据 | DELETE `/api/time-series/aggregated/:seriesId` | 清除序列的聚合数据 |

### 前端功能

| 功能 | 说明 |
|------|------|
| 配置面板 | 设置序列 ID、开始时间、数据点数量、波动率等参数 |
| 生成并添加 | 一键创建序列并生成数据 |
| 仅生成预览 | 只生成数据不添加到序列 |
| 查询数据 | 从后端查询并显示聚合数据 |
| 清除数据 | 清除序列的所有聚合数据 |
| K 线图 | SVG 原生绘制的 K 线图，支持多粒度切换 |
| 数据表格 | 显示详细的聚合数据（时间、OHLC、成交量、VWAP） |

## 📱 页面预览

页面包含以下区域：

1. **标题区**: 显示功能名称和描述
2. **配置面板**: Element Plus 表单组件，包含：
   - 序列 ID 输入
   - 开始时间选择器
   - 数据点数量
   - 时间间隔（秒）
   - 初始价格
   - 基础成交量
   - 价格波动率滑块（0.1% - 10%）
   - 成交量波动率滑块（10% - 200%）
   - 操作按钮（生成、查询、清除）

3. **状态面板**: 显示成功/警告/错误消息

4. **图表区域**:
   - SVG K 线图
   - 网格线和坐标轴
   - 成交量柱状图（底部）
   - 图例（上涨、下跌、成交量）
   - 粒度选择器

5. **数据表格**: Element Plus 表格组件，显示：
   - 开始时间 / 结束时间
   - 开盘价 / 最高价 / 最低价 / 收盘价
   - 成交量
   - VWAP
   - 数据点数量

## 🎨 图表特性

### K 线图

- **实体线**: 开盘价到收盘价
  - 绿色 (#10b981): 收盘价 ≥ 开盘价
  - 红色 (#ef4444): 收盘价 < 开盘价

- **影线**: 最高价到最低价
  - 与实体线颜色相同
  - 透明度 30%

- **最高/最低价标记**: 每5个K线显示
  - 实心圆点标记

### 成交量柱状图

- **颜色**: 与K线涨跌一致
  - 绿色: 上涨K线的成交量
  - 红色: 下跌K线的成交量
- **高度**: 按比例缩放（底部20px高度）
- **宽度**: 每个K线10px，中间留5px间隙

### 坐标轴

- **X轴**: 时间标签（显示开始时间）
- **Y轴**: 价格标签（显示2位小数）
- **网格**: 虚线网格

## 📊 数据模型

### 请求参数示例

```json
// 创建序列
{
  "seriesId": "STOCK-SIM-001",
  "name": "模拟股票",
  "dataType": "CONTINUOUS",
  "granularityLevels": ["MIN_1", "MIN_5", "MIN_15", "MIN_30"],
  "metrics": ["OPEN", "HIGH", "LOW", "CLOSE", "VOLUME", "VWAP"]
}

// 生成数据
{
  "seriesId": "STOCK-SIM-001",
  "baseTime": "2026-01-27T10:00:00.000Z",
  "pointCount": 100,
  "intervalSeconds": 60,
  "initialPrice": 100,
  "baseVolume": 1000,
  "priceVolatility": 0.01,
  "volumeVolatility": 0.5
}

// 查询数据
GET /api/time-series/aggregated?seriesId=STOCK-SIM-001&granularity=MIN_1&startTime=2026-01-27T10:00:00.000Z&endTime=2026-01-27T12:00:00.000Z
```

### 响应示例

```json
{
  "success": true,
  "data": [
    {
      "seriesId": "STOCK-SIM-001",
      "granularity": "MIN_1",
      "startTime": "2026-01-27T10:00:00.000Z",
      "endTime": "2026-01-27T10:01:00.000Z",
      "open": 100,
      "high": 100,
      "low": 100,
      "close": 100,
      "volume": 1000,
      "vwap": 100,
      "dataPointCount": 1,
      "createdAt": "2026-01-27T10:01:00.000Z",
      "updatedAt": "2026-01-27T10:01:00.000Z"
    }
  ],
  "count": 100
}
```

## 🔧 技术实现

### 后端

- **框架**: Express.js + TypeScript
- **数据结构**: 基于 Feature 008 的时间序列模块
- **数据模拟**: 随机游走模型（正态分布）
- **时间管理**: 完全基于数据点时间戳，不依赖系统时间
- **错误处理**: 完善的错误捕获和响应

### 前端

- **框架**: Vue 3 + TypeScript + Vite
- **UI库**: Element Plus
- **图表**: SVG 原生绘制（无额外依赖）
- **HTTP客户端**: Axios

### 数据流

```
用户操作 → 前端组件 → API 调用 → 后端服务
→ TimeSeriesManager → 聚合数据存储
→ 返回前端 → 数据可视化
```

## 📂 文件结构

```
StockTradingSimulator/
├── server/
│   ├── src/
│   │   ├── routes/
│   │   │   └── timeSeriesRoutes.ts      # 时间序列 API 路由
│   │   ├── services/
│   │   │   ├── timeSeriesService.ts     # 时间序列服务
│   │   │   └── timeSeriesSimulationService.ts  # 数据模拟服务
│   │   └── types/
│   │       └── timeSeries/              # 时间序列数据结构
│   └── docs/
│       └── time-series-simulation.md  # API 文档
├── app/
│   └── src/
│       ├── components/
│       │   └── TimeSeriesSimulation.vue  # 前端主组件
│       └── router/
│           └── index.ts               # 路由配置
├── scripts/
│   ├── start-time-series.sh           # 启动脚本
│   └── stop-time-series.sh            # 停止脚本
└── docs/
    └── time-series-feature.md          # 本文档
```

## 🎯 使用场景

### 场景 1: 模拟单个股票

1. 配置序列 ID 为 "STOCK-001"
2. 设置初始价格为 100
3. 生成 100 个数据点（1分钟间隔）
4. 选择 5分钟粒度查看聚合数据

### 场景 2: 对比多个粒度

1. 生成足够多的数据点
2. 切换粒度选择器：1分钟 → 5分钟 → 15分钟 → 30分钟
3. 观察不同粒度下的数据聚合情况

### 场景 3: 调整波动率

1. 生成第一组数据（低波动率 1%）
2. 清除数据
3. 生成第二组数据（高波动率 5%）
4. 对比两组数据的图表形态

## ⚠️ 注意事项

1. **时间顺序**: 数据点必须按时间顺序添加，否则会抛出错误
2. **窗口关闭**: 最后一个窗口需要额外的数据点来触发聚合
3. **内存管理**: 长时间序列会占用内存，建议定期清理
4. **端口占用**: 确保 3000（后端）和 5173（前端）端口未被占用
5. **数据持久化**: 当前版本不持久化数据，重启后数据会丢失

## 🔗 相关链接

- [时间序列模块文档](../server/types/timeSeries/README.md)
- [API 文档](../server/docs/time-series-simulation.md)
- [测试脚本](../server/scripts/test-time-series.ts)

## 🐛 故障排除

### 问题 1: 端口已被占用

```bash
# 查看端口占用
lsof -i :3000  # 后端端口
lsof -i :5173  # 前端端口

# 杀掉占用端口的进程
kill -9 <PID>
```

### 问题 2: 查询返回空数组

**原因**: 最后一个窗口未关闭（需要额外数据点）

**解决**: 前端会自动添加一个额外数据点触发窗口关闭

### 问题 3: TypeScript 编译错误

```bash
# 重新编译
cd server
npm run build

# 或者检查类型
npx tsc --noEmit
```

## 📞 技术栈

- **后端**: Node.js 18+, Express 4.18+, TypeScript 5.x
- **前端**: Vue 3.4+, Vite 5.0+, Element Plus 2.4+
- **开发工具**: ts-node, npm scripts
- **数据可视化**: SVG 原生绘制

## 🎉 开始使用

现在就可以开始体验时间序列模拟功能了！

```bash
# 使用便捷启动脚本
./scripts/start-time-series.sh
```

然后在浏览器中访问:
```
http://localhost:5173/time-series
```

祝使用愉快！🚀
