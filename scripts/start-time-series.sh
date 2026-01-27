#!/bin/bash

# 时间序列模拟功能启动脚本
# 同时启动后端和前端服务

set -e

echo "========================================="
echo "时间序列模拟功能启动"
echo "========================================="
echo ""

# 检查端口占用
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo "⚠️  警告: 端口 $port 已被占用"
        echo "请先停止使用该端口的 $service 服务"
        exit 1
    fi
}

# 检查后端端口
check_port 3000 "后端"

# 检查前端端口
check_port 5173 "前端"

# 创建日志目录
mkdir -p logs

# 启动后端
echo "🚀 启动后端服务..."
cd server

# 使用后台进程启动后端，并保存日志
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!

echo "✅ 后端服务已启动 (PID: $BACKEND_PID)"
echo "   地址: http://localhost:3000"
echo "   日志: logs/backend.log"
echo ""

# 等待后端启动
sleep 3

# 启动前端
echo "🚀 启动前端服务..."
cd ../app

# 使用后台进程启动前端，并保存日志
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!

echo "✅ 前端服务已启动 (PID: $FRONTEND_PID)"
echo "   地址: http://localhost:5173"
echo "   日志: logs/frontend.log"
echo ""

# 保存 PID 到文件
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

echo "========================================="
echo "服务启动完成"
echo "========================================="
echo ""
echo "📱 在浏览器中打开: http://localhost:5173/time-series"
echo ""
echo "📝 查看日志:"
echo "   后端: tail -f logs/backend.log"
echo "   前端: tail -f logs/frontend.log"
echo ""
echo "🛑 停止服务:"
echo "   kill $BACKEND_PID  # 停止后端"
echo "   kill $FRONTEND_PID # 停止前端"
echo "   或运行: ./scripts/stop-time-series.sh"
echo ""
echo "按 Ctrl+C 退出（需要手动停止后台服务）"
echo ""

# 捕获退出信号
trap 'echo ""; echo "正在停止服务..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo "✅ 服务已停止"; exit 0' INT

# 保持脚本运行
wait
