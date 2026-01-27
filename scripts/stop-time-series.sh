#!/bin/bash

# 时间序列模拟功能停止脚本
# 停止后端和前端服务

set -e

echo "========================================="
echo "停止时间序列模拟功能"
echo "========================================="
echo ""

# 从 PID 文件读取进程 ID
BACKEND_PID=""
FRONTEND_PID=""

if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
fi

if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
fi

# 停止后端
if [ ! -z "$BACKEND_PID" ]; then
    echo "🛑 停止后端服务 (PID: $BACKEND_PID)..."
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        kill $BACKEND_PID
        echo "✅ 后端服务已停止"
    else
        echo "⚠️  后端进程未运行"
    fi
    rm -f logs/backend.pid
else
    echo "⚠️  未找到后端 PID 文件"
fi

echo ""

# 停止前端
if [ ! -z "$FRONTEND_PID" ]; then
    echo "🛑 停止前端服务 (PID: $FRONTEND_PID)..."
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        kill $FRONTEND_PID
        echo "✅ 前端服务已停止"
    else
        echo "⚠️  前端进程未运行"
    fi
    rm -f logs/frontend.pid
else
    echo "⚠️  未找到前端 PID 文件"
fi

echo ""
echo "========================================="
echo "服务已停止"
echo "========================================="
