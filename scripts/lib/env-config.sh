#!/bin/bash

# Environment Configuration Library
# 用于读取项目环境配置的共享函数库

# 获取脚本所在目录的项目根目录
get_project_root() {
    # 从 scripts/lib/ 目录向上两级到达项目根目录
    echo "$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
}

# 函数：从 .env 文件读取配置
read_env_config() {
    local env_file=$1
    local key=$2
    local default_value=$3

    if [ -f "$env_file" ]; then
        # 读取 .env 文件，忽略注释和空行，提取指定的键值
        local value=$(grep "^${key}=" "$env_file" 2>/dev/null | cut -d '=' -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' | head -1)
        if [ ! -z "$value" ]; then
            echo "$value"
            return 0
        fi
    fi
    
    echo "$default_value"
}

# 函数：获取所有端口配置
get_all_ports() {
    local project_root=$(get_project_root)
    local frontend_env="${project_root}/app/.env"
    local backend_env="${project_root}/server/.env"
    
    # 读取前端端口配置
    FRONTEND_PORT=$(read_env_config "$frontend_env" "VITE_DEV_PORT" "5173")
    
    # 读取后端端口配置  
    BACKEND_PORT=$(read_env_config "$backend_env" "PORT" "3001")
    
    # 读取前端 API 基础 URL（使用当前的后端端口作为默认值）
    local default_api_url="http://localhost:${BACKEND_PORT}"
    FRONTEND_API_URL=$(read_env_config "$frontend_env" "VITE_API_BASE_URL" "$default_api_url")
    
    # 读取后端 CORS 源（使用当前的前端端口作为默认值）
    local default_cors_origin="http://localhost:${FRONTEND_PORT}"
    BACKEND_CORS_ORIGIN=$(read_env_config "$backend_env" "CORS_ORIGIN" "$default_cors_origin")
    
    # 导出变量
    export FRONTEND_PORT
    export BACKEND_PORT
    export FRONTEND_API_URL
    export BACKEND_CORS_ORIGIN
}

# 函数：显示端口配置信息
show_port_config() {
    local project_root=$(get_project_root)
    local frontend_env="${project_root}/app/.env"
    local backend_env="${project_root}/server/.env"
    
    get_all_ports
    
    echo "📋 端口配置信息："
    echo "  - 前端端口: ${FRONTEND_PORT} (来源: ${frontend_env})"
    echo "  - 后端端口: ${BACKEND_PORT} (来源: ${backend_env})"
    echo "  - 前端 API URL: ${FRONTEND_API_URL}"
    echo "  - 后端 CORS 源: ${BACKEND_CORS_ORIGIN}"
}

# 函数：构建服务 URL
get_frontend_url() {
    get_all_ports
    echo "http://localhost:${FRONTEND_PORT}"
}

get_backend_url() {
    get_all_ports
    echo "http://localhost:${BACKEND_PORT}"
}

get_backend_health_url() {
    get_all_ports
    echo "http://localhost:${BACKEND_PORT}/health"
}

get_backend_api_url() {
    get_all_ports
    echo "http://localhost:${BACKEND_PORT}/api/v1"
}

# 函数：验证端口配置一致性
validate_port_config() {
    local project_root=$(get_project_root)
    local frontend_env="${project_root}/app/.env"
    local backend_env="${project_root}/server/.env"
    
    get_all_ports
    
    local issues=0
    
    # 检查前端 API URL 是否与后端端口匹配
    if [[ "$FRONTEND_API_URL" != *":${BACKEND_PORT}"* ]]; then
        echo "⚠️  警告: 前端 API URL (${FRONTEND_API_URL}) 与后端端口 (${BACKEND_PORT}) 不匹配"
        issues=$((issues + 1))
    fi
    
    # 检查后端 CORS 源是否与前端端口匹配
    if [[ "$BACKEND_CORS_ORIGIN" != *":${FRONTEND_PORT}"* ]]; then
        echo "⚠️  警告: 后端 CORS 源 (${BACKEND_CORS_ORIGIN}) 与前端端口 (${FRONTEND_PORT}) 不匹配"
        issues=$((issues + 1))
    fi
    
    if [ $issues -eq 0 ]; then
        echo "✅ 端口配置验证通过"
        return 0
    else
        echo "❌ 发现 ${issues} 个端口配置问题"
        return 1
    fi
}