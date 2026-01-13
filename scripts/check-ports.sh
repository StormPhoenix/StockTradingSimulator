#!/bin/bash

# Port Configuration Check Script
# 检查和验证端口配置的脚本

set -e

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

print_message $BLUE "🔍 检查端口配置..."
echo

# 获取端口配置
get_all_ports

# 显示配置信息
print_message $BLUE "📋 当前端口配置："
echo "  - 前端端口: ${FRONTEND_PORT}"
echo "  - 后端端口: ${BACKEND_PORT}"
echo "  - 前端 API URL: ${FRONTEND_API_URL}"
echo "  - 后端 CORS 源: ${BACKEND_CORS_ORIGIN}"
echo

# 验证配置一致性
print_message $YELLOW "🔧 验证配置一致性..."
if validate_port_config; then
    print_message $GREEN "✅ 所有配置验证通过！"
else
    print_message $RED "❌ 发现配置问题，请检查 .env 文件"
    exit 1
fi

echo

# 检查端口占用情况
print_message $YELLOW "🔍 检查端口占用情况..."

check_port_usage() {
    local port=$1
    local service_name=$2
    
    local pids=$(lsof -ti:${port} 2>/dev/null || true)
    
    if [ -z "$pids" ]; then
        print_message $GREEN "✅ 端口 ${port} (${service_name}) 可用"
    else
        print_message $YELLOW "⚠️  端口 ${port} (${service_name}) 被占用 (PID: ${pids})"
        
        # 显示占用进程的详细信息
        local process_info=$(ps -p ${pids} -o pid,ppid,cmd --no-headers 2>/dev/null || true)
        if [ ! -z "$process_info" ]; then
            echo "   进程信息: ${process_info}"
        fi
    fi
}

check_port_usage "$FRONTEND_PORT" "前端服务"
check_port_usage "$BACKEND_PORT" "后端服务"

echo

# 显示服务 URL
print_message $BLUE "🌐 服务访问地址："
echo "  - 前端应用: $(get_frontend_url)"
echo "  - 后端 API: $(get_backend_api_url)"
echo "  - 健康检查: $(get_backend_health_url)"

echo

print_message $BLUE "💡 提示："
echo "  - 要修改端口配置，请编辑相应的 .env 文件"
echo "  - 前端端口配置: app/.env 中的 VITE_DEV_PORT"
echo "  - 后端端口配置: server/.env 中的 PORT"
echo "  - 修改后需要重启服务才能生效"