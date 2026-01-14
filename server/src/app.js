import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'

import { connectDatabase } from './config/database.js'
import { apiConfig } from './config/api.js'
import errorHandler from './middleware/errorHandler.js'
import routes from './routes/index.js'
import healthRoutes from './routes/healthRoutes.js'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// 安全中间件
app.use(helmet())

// 跨域配置
app.use(cors(apiConfig.cors))

// 请求日志
app.use(morgan('combined'))

// 压缩响应
app.use(compression())

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
})
app.use('/api/', limiter)

// 解析请求体
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 健康检查路由
app.use('/health', healthRoutes)

// API路由
app.use('/api/v1', routes)

// 404处理
app.use('*', (_, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'API endpoint not found',
    },
  })
})

// 错误处理中间件
app.use(errorHandler)

// 启动服务器
async function startServer() {
  try {
    console.log('🚀 Starting Stock Trading Simulator Server...')
    console.log('📋 Environment:', process.env.NODE_ENV || 'development')
    
    // 连接数据库
    console.log('🔌 Connecting to database...')
    await connectDatabase()
    console.log('✅ Database connected successfully')
    
    app.listen(PORT, () => {
      console.log('\n🎉 Server started successfully!')
      console.log('━'.repeat(50))
      console.log(`📡 Server running on port: ${PORT}`)
      console.log(`🌐 Base URL: http://localhost:${PORT}`)
      console.log(`🏥 Health check: http://localhost:${PORT}/health`)
      console.log(`📊 Detailed health: http://localhost:${PORT}/health/detailed`)
      console.log(`🔗 API base URL: http://localhost:${PORT}/api/v1`)
      console.log(`📚 API info: http://localhost:${PORT}/api/v1`)
      console.log('━'.repeat(50))
      console.log('💡 Press Ctrl+C to stop the server')
    })
  } catch (error) {
    console.error('❌ Failed to start server:', error.message)
    console.error('💥 Error details:', error)
    process.exit(1)
  }
}

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully')
  process.exit(0)
})

startServer()

export default app