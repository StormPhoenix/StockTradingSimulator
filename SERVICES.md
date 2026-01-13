# 服务管理指南

## 快速开始

### 🚀 启动服务
```bash
# 方式 1: 使用服务管理脚本（推荐）
npm run start:services

# 方式 2: 使用开发模式
npm run dev

# 方式 3: 直接运行脚本
./scripts/start-services.sh
```

### 🛑 停止服务
```bash
# 方式 1: 使用 npm 脚本（推荐）
npm run stop

# 方式 2: 直接运行脚本
./scripts/stop-services.sh

# 方式 3: 强制停止
./scripts/stop-services.sh --force
```

### 🔄 重启服务
```bash
npm run restart
```

## 服务地址

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:3000
- **健康检查**: http://localhost:3000/health
- **项目信息**: http://localhost:3000/api/v1/projects/info

## 常用命令

### 开发工作流
```bash
# 1. 启动开发环境
npm run start:services

# 2. 开始开发...
# 前端: http://localhost:5173
# 后端: http://localhost:3000

# 3. 停止服务
npm run stop
```

### 故障排除
```bash
# 检查服务状态
curl http://localhost:3000/health
curl http://localhost:5173

# 查看运行中的服务
lsof -i :3000,5173

# 强制停止所有相关进程
npm run stop -- --force

# 重新安装依赖
npm run clean
npm run install:all
```

### 日志查看
```bash
# 查看后端日志
tail -f logs/server.log

# 查看前端日志
tail -f logs/app.log

# 实时监控所有日志
tail -f logs/*.log
```

## 脚本选项

### stop-services.sh 选项
```bash
./scripts/stop-services.sh [选项]

选项:
  -h, --help     显示帮助信息
  -v, --verbose  显示详细输出
  -f, --force    强制停止所有相关进程
```

### start-services.sh 选项
```bash
./scripts/start-services.sh [选项]

选项:
  -h, --help       显示帮助信息
  -b, --backend    仅启动后端服务
  -f, --frontend   仅启动前端服务
  -d, --detached   后台运行（默认）
  -i, --interactive 交互模式运行
```

## 使用示例

### 示例 1: 完整开发流程
```bash
# 1. 克隆项目后首次设置
npm run install:all

# 2. 启动开发服务
npm run start:services

# 3. 验证服务运行
curl http://localhost:3000/health
curl http://localhost:5173

# 4. 开发完成后停止服务
npm run stop
```

### 示例 2: 仅测试后端
```bash
# 启动后端服务
./scripts/start-services.sh --backend

# 测试 API
curl http://localhost:3000/api/v1/projects/info

# 停止服务
npm run stop
```

### 示例 3: 仅测试前端
```bash
# 启动前端服务
./scripts/start-services.sh --frontend

# 浏览器访问 http://localhost:5173

# 停止服务
npm run stop
```

### 示例 4: 交互模式开发
```bash
# 交互模式启动（前台运行）
./scripts/start-services.sh --interactive

# 按 Ctrl+C 停止所有服务
```

### 示例 5: 故障恢复
```bash
# 如果服务异常，强制清理
./scripts/stop-services.sh --force

# 清理并重新安装
npm run clean
npm run install:all

# 重新启动
npm run start:services
```

## 注意事项

1. **首次运行**: 首次运行可能需要安装依赖，请耐心等待
2. **端口冲突**: 如果端口被占用，脚本会提示是否停止现有服务
3. **权限问题**: 确保脚本有执行权限 (`chmod +x scripts/*.sh`)
4. **环境要求**: 需要 Node.js >= 18.0.0
5. **操作系统**: 脚本在 macOS 和 Linux 上测试通过，Windows 用户建议使用 Git Bash 或 WSL

## 高级用法

### 自定义端口
如果需要使用不同端口，修改环境变量文件：

```bash
# app/.env
VITE_DEV_PORT=8080

# server/.env
PORT=4000
```

### 生产环境部署
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

### 开发环境重置
```bash
# 完全重置开发环境
npm run stop
npm run clean
rm -rf logs/
npm run install:all
npm run start:services
```

这些脚本让开发和测试变得更加便捷，您可以根据需要选择合适的命令！