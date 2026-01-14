#!/bin/bash

# Stop Services Script
# 停止前端和后端开发服务器
# 动态读取 .env 文件中的端口配置

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

print_message $BLUE "🛑 停止 Stock Trading Simulator 服务..."
echo

# 函数：停止指定端口的服务
stop_port_service() {
    local port=$1
    local service_name=$2

    print_message $YELLOW "检查端口 ${port} 上的 ${service_name} 服务..."

    # 查找占用端口的进程
    local pids=$(lsof -ti:${port} 2>/dev/null || true)

    if [ -z "$pids" ]; then
        print_message $GREEN "✅ 端口 ${port} 没有运行的服务"
        return 0
    fi

    print_message $YELLOW "🔍 发现端口 ${port} 上的进程: ${pids}"

    # 尝试优雅停止 (SIGTERM)
    print_message $YELLOW "⏳ 尝试优雅停止 ${service_name}..."
    echo "$pids" | xargs kill -TERM 2>/dev/null || true

    # 等待进程停止
    sleep 2

    # 检查进程是否仍在运行
    local remaining_pids=$(lsof -ti:${port} 2>/dev/null || true)

    if [ -z "$remaining_pids" ]; then
        print_message $GREEN "✅ ${service_name} 已成功停止"
        return 0
    fi

    # 如果进程仍在运行，强制停止 (SIGKILL)
    print_message $YELLOW "⚡ 强制停止 ${service_name}..."
    echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true

    sleep 1

    # 最终检查
    local final_pids=$(lsof -ti:${port} 2>/dev/null || true)

    if [ -z "$final_pids" ]; then
        print_message $GREEN "✅ ${service_name} 已强制停止"
    else
        print_message $RED "❌ 无法停止 ${service_name} (PID: ${final_pids})"
        return 1
    fi
}

# 函数：通过进程名停止服务
stop_process_by_name() {
    local process_pattern=$1
    local service_name=$2

    print_message $YELLOW "检查 ${service_name} 进程..."

    # 查找匹配的进程
    local pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)

    if [ -z "$pids" ]; then
        print_message $GREEN "✅ 没有找到 ${service_name} 进程"
        return 0
    fi

    print_message $YELLOW "🔍 发现 ${service_name} 进程: ${pids}"

    # 尝试优雅停止
    print_message $YELLOW "⏳ 尝试优雅停止 ${service_name}..."
    echo "$pids" | xargs kill -TERM 2>/dev/null || true

    sleep 2

    # 检查进程是否仍在运行
    local remaining_pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)

    if [ -z "$remaining_pids" ]; then
        print_message $GREEN "✅ ${service_name} 已成功停止"
        return 0
    fi

    # 强制停止
    print_message $YELLOW "⚡ 强制停止 ${service_name}..."
    echo "$remaining_pids" | xargs kill -KILL 2>/dev/null || true

    sleep 1

    # 最终检查
    local final_pids=$(pgrep -f "$process_pattern" 2>/dev/null || true)

    if [ -z "$final_pids" ]; then
        print_message $GREEN "✅ ${service_name} 已强制停止"
    else
        print_message $RED "❌ 无法停止 ${service_name} (PID: ${final_pids})"
        return 1
    fi
}

# 主要停止逻辑
main() {
    local success=true

    # 获取端口配置
    get_all_ports
    
    print_message $BLUE "📋 端口配置信息："
    echo "  - 前端端口: ${FRONTEND_PORT}"
    echo "  - 后端端口: ${BACKEND_PORT}"
    echo

    # 停止前端服务 (Vite dev server)
    if ! stop_port_service "$FRONTEND_PORT" "前端服务 (Vite)"; then
        success=false
    fi

    echo

    # 停止后端服务 (Express server)
    if ! stop_port_service "$BACKEND_PORT" "后端服务 (Express)"; then
        success=false
    fi

    echo

    # 额外检查：通过进程名停止 nodemon 和 vite 进程
    if ! stop_process_by_name "nodemon.*server" "Nodemon (后端)"; then
        success=false
    fi

    echo

    if ! stop_process_by_name "vite.*--port ${FRONTEND_PORT}" "Vite (前端)"; then
        success=false
    fi

    echo

    # 通用清理：停止所有可能相关的 Node.js 进程
    print_message $YELLOW "🧹 清理其他相关进程..."

    # 停止包含 "stock" 或 "simulator" 的 Node.js 进程
    local node_pids=$(pgrep -f "node.*stock\|node.*simulator" 2>/dev/null || true)
    if [ ! -z "$node_pids" ]; then
        print_message $YELLOW "🔍 发现相关 Node.js 进程: ${node_pids}"
        echo "$node_pids" | xargs kill -TERM 2>/dev/null || true
        sleep 1

        # 检查是否还有残留进程
        local remaining_node_pids=$(pgrep -f "node.*stock\|node.*simulator" 2>/dev/null || true)
        if [ ! -z "$remaining_node_pids" ]; then
            print_message $YELLOW "⚡ 强制停止残留进程..."
            echo "$remaining_node_pids" | xargs kill -KILL 2>/dev/null || true
        fi
    fi

    echo

    # 最终状态报告
    if [ "$success" = true ]; then
        print_message $GREEN "🎉 所有服务已成功停止！"
        echo
        print_message $BLUE "💡 提示："
        echo "  - 前端服务 (端口 ${FRONTEND_PORT}) 已停止"
        echo "  - 后端服务 (端口 ${BACKEND_PORT}) 已停止"
        echo "  - 要重新启动服务，请运行: npm run dev"
    else
        print_message $RED "⚠️  部分服务可能未能完全停止"
        echo
        print_message $YELLOW "💡 建议："
        echo "  - 检查是否有进程仍在运行: lsof -i :${BACKEND_PORT},${FRONTEND_PORT}"
        echo "  - 手动停止残留进程: kill -9 <PID>"
        echo "  - 重启终端或系统以完全清理"
        exit 1
    fi
}

# 显示使用说明
show_usage() {
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  -h, --help     显示此帮助信息"
    echo "  -v, --verbose  显示详细输出"
    echo "  -f, --force    强制停止所有相关进程"
    echo
    echo "示例:"
    echo "  $0              # 停止前端和后端服务"
    echo "  $0 --verbose    # 详细模式停止服务"
    echo "  $0 --force      # 强制停止所有相关进程"
}

# 解析命令行参数
VERBOSE=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_usage
            exit 0
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            print_message $RED "❌ 未知选项: $1"
            show_usage
            exit 1
            ;;
    esac
done

# 如果是强制模式，停止所有 Node.js 进程
if [ "$FORCE" = true ]; then
    print_message $RED "⚡ 强制模式：停止所有 Node.js 开发服务器..."
    
    # 获取端口配置用于强制清理
    get_all_ports
    
    pkill -f "node.*vite\|nodemon\|npm.*dev" 2>/dev/null || true
    pkill -f "vite.*dev\|express.*dev" 2>/dev/null || true
    lsof -ti:${BACKEND_PORT},${FRONTEND_PORT} | xargs kill -9 2>/dev/null || true
    print_message $GREEN "✅ 强制清理完成"
    exit 0
fi

# 执行主函数
main
