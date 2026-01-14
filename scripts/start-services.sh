#!/bin/bash

# Start Services Script
# 启动前端和后端开发服务器

set -e  # 遇到错误时退出

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 加载环境配置库
source "${SCRIPT_DIR}/lib/env-config.sh"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 获取项目根目录
PROJECT_ROOT=$(get_project_root)

print_message $BLUE "🚀 启动 Stock Trading Simulator 服务..."
echo "📁 项目根目录: $PROJECT_ROOT"
echo

# 检查项目结构
check_project_structure() {
    print_message $YELLOW "🔍 检查项目结构..."
    
    if [ ! -d "$PROJECT_ROOT/app" ]; then
        print_message $RED "❌ 未找到前端目录: $PROJECT_ROOT/app"
        exit 1
    fi
    
    if [ ! -d "$PROJECT_ROOT/server" ]; then
        print_message $RED "❌ 未找到后端目录: $PROJECT_ROOT/server"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/app/package.json" ]; then
        print_message $RED "❌ 未找到前端 package.json"
        exit 1
    fi
    
    if [ ! -f "$PROJECT_ROOT/server/package.json" ]; then
        print_message $RED "❌ 未找到后端 package.json"
        exit 1
    fi
    
    print_message $GREEN "✅ 项目结构检查通过"
}

# 检查端口是否被占用
check_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_message $YELLOW "⚠️  端口 $port ($service_name) 已被占用"
        local pid=$(lsof -ti:$port)
        print_message $YELLOW "   进程 PID: $pid"
        
        read -p "是否停止现有服务并继续？(y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            print_message $YELLOW "🛑 停止端口 $port 上的服务..."
            kill -TERM $pid 2>/dev/null || kill -KILL $pid 2>/dev/null || true
            sleep 2
        else
            print_message $RED "❌ 取消启动"
            exit 1
        fi
    fi
}

# 检查依赖是否安装
check_dependencies() {
    print_message $YELLOW "📦 检查依赖安装..."
    
    # 检查前端依赖
    if [ ! -d "$PROJECT_ROOT/app/node_modules" ]; then
        print_message $YELLOW "⚠️  前端依赖未安装，正在安装..."
        cd "$PROJECT_ROOT/app"
        npm install
        if [ $? -ne 0 ]; then
            print_message $RED "❌ 前端依赖安装失败"
            exit 1
        fi
        print_message $GREEN "✅ 前端依赖安装完成"
    fi
    
    # 检查后端依赖
    if [ ! -d "$PROJECT_ROOT/server/node_modules" ]; then
        print_message $YELLOW "⚠️  后端依赖未安装，正在安装..."
        cd "$PROJECT_ROOT/server"
        npm install
        if [ $? -ne 0 ]; then
            print_message $RED "❌ 后端依赖安装失败"
            exit 1
        fi
        print_message $GREEN "✅ 后端依赖安装完成"
    fi
    
    print_message $GREEN "✅ 依赖检查完成"
}

# 启动后端服务
start_backend() {
    print_message $BLUE "🔧 启动后端服务..."
    
    cd "$PROJECT_ROOT/server"
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_message $YELLOW "⚠️  未找到 .env 文件，从 .env.example 复制..."
            cp .env.example .env
        else
            print_message $RED "❌ 未找到环境变量配置文件"
            exit 1
        fi
    fi
    
    # 在后台启动后端服务
    print_message $YELLOW "🚀 启动 Express 服务器 (端口 3000)..."
    nohup npm run dev > ../logs/server.log 2>&1 &
    local backend_pid=$!
    
    echo $backend_pid > ../logs/server.pid
    print_message $GREEN "✅ 后端服务已启动 (PID: $backend_pid)"
    
    # 等待后端服务启动
    print_message $YELLOW "⏳ 等待后端服务启动..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$(get_backend_health_url)" >/dev/null 2>&1; then
            print_message $GREEN "✅ 后端服务启动成功！"
            break
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        
        if [ $attempt -eq $max_attempts ]; then
            print_message $RED "❌ 后端服务启动超时"
            return 1
        fi
    done
}

# 启动前端服务
start_frontend() {
    print_message $BLUE "🎨 启动前端服务..."
    
    cd "$PROJECT_ROOT/app"
    
    # 检查环境变量文件
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            print_message $YELLOW "⚠️  未找到 .env 文件，从 .env.example 复制..."
            cp .env.example .env
        fi
    fi
    
    # 在后台启动前端服务
    print_message $YELLOW "🚀 启动 Vite 开发服务器 (端口 5173)..."
    nohup npm run dev > ../logs/app.log 2>&1 &
    local frontend_pid=$!
    
    echo $frontend_pid > ../logs/app.pid
    print_message $GREEN "✅ 前端服务已启动 (PID: $frontend_pid)"
    
    # 等待前端服务启动
    print_message $YELLOW "⏳ 等待前端服务启动..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$(get_frontend_url)" >/dev/null 2>&1; then
            print_message $GREEN "✅ 前端服务启动成功！"
            break
        fi
        
        sleep 1
        attempt=$((attempt + 1))
        
        if [ $attempt -eq $max_attempts ]; then
            print_message $RED "❌ 前端服务启动超时"
            return 1
        fi
    done
}

# 显示服务状态
show_status() {
    echo
    print_message $BLUE "📊 服务状态："
    echo
    
    # 检查后端状态
    if curl -s "$(get_backend_health_url)" >/dev/null 2>&1; then
        print_message $GREEN "✅ 后端服务: $(get_backend_url) (运行中)"
        print_message $GREEN "   健康检查: $(get_backend_health_url)"
        print_message $GREEN "   API 端点: $(get_backend_api_url)/projects/info"
    else
        print_message $RED "❌ 后端服务: 未运行"
    fi
    
    # 检查前端状态
    if curl -s "$(get_frontend_url)" >/dev/null 2>&1; then
        print_message $GREEN "✅ 前端服务: $(get_frontend_url) (运行中)"
    else
        print_message $RED "❌ 前端服务: 未运行"
    fi
    
    echo
    print_message $BLUE "📝 日志文件："
    echo "   后端日志: $PROJECT_ROOT/logs/server.log"
    echo "   前端日志: $PROJECT_ROOT/logs/app.log"
    echo
    print_message $BLUE "🛑 停止服务："
    echo "   运行: ./scripts/stop-services.sh"
    echo "   或者: Ctrl+C (如果在前台运行)"
}

# 创建日志目录
create_log_directory() {
    if [ ! -d "$PROJECT_ROOT/logs" ]; then
        mkdir -p "$PROJECT_ROOT/logs"
        print_message $GREEN "✅ 创建日志目录: $PROJECT_ROOT/logs"
    fi
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help       显示此帮助信息"
    echo "  -b, --backend    仅启动后端服务"
    echo "  -f, --frontend   仅启动前端服务"
    echo "  -d, --detached   后台运行（默认）"
    echo "  -i, --interactive 交互模式运行"
    echo
    echo "示例:"
    echo "  $0                # 启动前端和后端服务"
    echo "  $0 --backend      # 仅启动后端服务"
    echo "  $0 --frontend     # 仅启动前端服务"
    echo "  $0 --interactive  # 交互模式启动"
}

# 主函数
main() {
    local start_backend=true
    local start_frontend=true
    local interactive=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_usage
                exit 0
                ;;
            -b|--backend)
                start_frontend=false
                shift
                ;;
            -f|--frontend)
                start_backend=false
                shift
                ;;
            -d|--detached)
                interactive=false
                shift
                ;;
            -i|--interactive)
                interactive=true
                shift
                ;;
            *)
                print_message $RED "❌ 未知选项: $1"
                show_usage
                exit 1
                ;;
        esac
    done
    
    # 执行启动流程
    check_project_structure
    create_log_directory
    check_dependencies
    
    if [ "$start_backend" = true ]; then
        check_port 3000 "后端服务"
    fi
    
    if [ "$start_frontend" = true ]; then
        check_port 5173 "前端服务"
    fi
    
    echo
    
    if [ "$start_backend" = true ]; then
        start_backend
        echo
    fi
    
    if [ "$start_frontend" = true ]; then
        start_frontend
        echo
    fi
    
    show_status
    
    if [ "$interactive" = true ]; then
        print_message $YELLOW "🔄 交互模式 - 按 Ctrl+C 停止所有服务"
        
        # 设置信号处理
        trap 'print_message $YELLOW "🛑 收到停止信号，正在停止服务..."; ./scripts/stop-services.sh; exit 0' INT TERM
        
        # 保持脚本运行
        while true; do
            sleep 1
        done
    fi
}

# 执行主函数
main "$@"