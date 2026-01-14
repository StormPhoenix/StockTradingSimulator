# 服务管理脚本

本目录包含用于管理 Stock Trading Simulator 前端和后端服务的脚本。

## 脚本列表

### 🛑 stop-services.sh
停止所有运行中的前端和后端服务。

**功能：**
- 动态读取 .env 配置文件中的端口设置
- 停止前端服务 (Vite) - 端口从 app/.env 读取
- 停止后端服务 (Express) - 端口从 server/.env 读取
- 清理相关的 nodemon 和 vite 进程
- 支持优雅停止和强制停止

**使用方法：**
```bash
# 基本用法
./scripts/stop-services.sh

# 显示帮助
./scripts/stop-services.sh --help

# 详细模式
./scripts/stop-services.sh --verbose

# 强制停止所有相关进程
./scripts/stop-services.sh --force

# 或使用 npm 脚本
npm run stop
```

### 🔍 check-ports.sh
检查和验证端口配置。

**功能：**
- 显示当前的端口配置信息
- 验证前后端配置的一致性
- 检查端口占用情况
- 显示服务访问地址

**使用方法：**
```bash
# 检查端口配置
./scripts/check-ports.sh

# 或使用 Node.js 版本
node scripts/lib/env-config.js
```

### 📦 backup-speckit.sh
备份 speckit 生成的中间文件。

**功能：**
- 自动打包 .codebuddy、.specify、specs 目录
- 生成带时间戳的备份文件名 (speckit-YYYYMMDD_HHMMSS.zip)
- 保存到 archives/ 目录
- 排除不必要的文件（node_modules、.git 等）
- 支持备份管理（列出、清理、验证）

**使用方法：**
```bash
# 创建备份
./scripts/backup-speckit.sh

# 列出现有备份
./scripts/backup-speckit.sh --list

# 验证最新备份
./scripts/backup-speckit.sh --verify

# 清理旧备份（保留最新5个）
./scripts/backup-speckit.sh --clean

# 显示帮助
./scripts/backup-speckit.sh --help
```

### 🚀 start-services.sh
启动前端和后端开发服务器。

**功能：**
- 检查项目结构和依赖
- 自动安装缺失的依赖
- 动态读取 .env 配置文件中的端口设置
- 启动后端服务 - 端口从 server/.env 读取
- 启动前端服务 - 端口从 app/.env 读取
- 健康检查和状态监控

**使用方法：**
```bash
# 启动所有服务
./scripts/start-services.sh

# 仅启动后端
./scripts/start-services.sh --backend

# 仅启动前端
./scripts/start-services.sh --frontend

# 交互模式（前台运行）
./scripts/start-services.sh --interactive

# 或使用 npm 脚本
npm run start:services
```

## NPM 脚本快捷方式

在项目根目录下，您可以使用以下 npm 脚本：

```bash
# 服务管理
npm run stop                # 停止所有服务
npm run start:services      # 启动所有服务
npm run restart             # 重启服务（停止 + 启动）
npm run dev                 # 开发模式（使用 concurrently 同时启动）

# 端口和配置检查
npm run check:ports         # 检查端口配置
npm run validate:api        # 验证 API 配置
npm run health:check        # 健康检查

# Speckit 文件备份
npm run backup:speckit      # 创建 speckit 文件备份
npm run backup:list         # 列出现有备份文件
npm run backup:clean        # 清理旧备份文件

# 其他工具
npm run install:all         # 安装所有依赖
npm run build               # 构建项目
npm run lint                # 代码检查
npm run test                # 运行测试
```

## 服务端口

端口配置现在动态从环境配置文件读取：

- **前端 (Vue.js + Vite)**: 端口从 `app/.env` 中的 `VITE_DEV_PORT` 读取 (默认: 5173)
- **后端 (Express.js)**: 端口从 `server/.env` 中的 `PORT` 读取 (默认: 3001)
- **健康检查**: `http://localhost:{后端端口}/health`
- **API 端点**: `http://localhost:{后端端口}/api/v1/projects/info`

要查看当前的端口配置，可以运行：
```bash
node scripts/lib/env-config.js
```

## 日志文件

启动脚本会在项目根目录创建 `logs/` 文件夹，包含：

- `logs/server.log` - 后端服务日志
- `logs/app.log` - 前端服务日志
- `logs/server.pid` - 后端进程 ID
- `logs/app.pid` - 前端进程 ID

## 故障排除

### 端口被占用
如果遇到端口被占用的错误：

```bash
# 检查当前配置的端口
node scripts/lib/env-config.js

# 检查端口占用情况（使用动态端口）
lsof -i :{端口号}

# 强制停止所有服务
./scripts/stop-services.sh --force

# 或手动停止特定端口
lsof -ti:3000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### 依赖问题
如果遇到依赖相关错误：

```bash
# 重新安装所有依赖
npm run clean
npm run install:all

# 或分别安装
cd app && npm install
cd ../server && npm install
```

### 服务启动失败
检查日志文件：

```bash
# 查看后端日志
tail -f logs/server.log

# 查看前端日志
tail -f logs/app.log

# 检查环境变量
npm run validate:env

# 运行健康检查
npm run health:check
```

## 脚本特性

### 🎨 彩色输出
脚本使用彩色输出来提高可读性：
- 🔵 蓝色：信息消息
- 🟡 黄色：警告和进度
- 🟢 绿色：成功消息
- 🔴 红色：错误消息

### 🛡️ 错误处理
- 优雅停止进程（SIGTERM）
- 强制停止备选方案（SIGKILL）
- 详细的错误报告
- 进程状态验证

### 📊 状态监控
- 实时服务状态检查
- 端口占用检测
- 健康检查集成
- 启动超时保护

### 🔧 灵活配置
- 支持单独启动/停止前端或后端
- 交互模式和后台模式
- 详细模式输出
- 强制模式清理

## 开发工作流建议

1. **开始开发**：
   ```bash
   npm run start:services
   # 或
   npm run dev
   ```

2. **停止开发**：
   ```bash
   npm run stop
   ```

3. **重启服务**：
   ```bash
   npm run restart
   ```

4. **调试问题**：
   ```bash
   # 检查服务状态
   curl http://localhost:3000/health
   curl http://localhost:5173
   
   # 查看日志
   tail -f logs/server.log
   tail -f logs/app.log
   ```

5. **清理环境**：
   ```bash
   npm run stop
   npm run clean
   npm run install:all
   ```

## 注意事项

- 脚本需要在项目根目录下运行
- 确保有足够的权限执行脚本
- Windows 用户可能需要使用 Git Bash 或 WSL
- 首次运行可能需要安装依赖，会花费一些时间

## 支持

如果遇到问题，请检查：
1. Node.js 版本 >= 18.0.0
2. npm 版本是否最新
3. 项目结构是否完整
4. 环境变量配置是否正确
5. 端口是否被其他应用占用