import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stock_trading_simulator'
const DB_NAME = process.env.MONGODB_DB_NAME || 'stock_trading_simulator'

// MongoDB连接配置
const mongooseOptions = {
  maxPoolSize: 10, // 连接池最大连接数
  serverSelectionTimeoutMS: 5000, // 服务器选择超时
  socketTimeoutMS: 45000, // Socket超时
  bufferCommands: false, // 禁用mongoose缓冲命令
}

// 连接数据库
export const connectDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...')
    
    const connection = await mongoose.connect(MONGODB_URI, mongooseOptions)
    
    console.log(`✅ MongoDB connected successfully`)
    console.log(`📊 Database: ${connection.connection.name}`)
    console.log(`🔗 Host: ${connection.connection.host}:${connection.connection.port}`)
    
    return connection
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message)
    throw error
  }
}

// 断开数据库连接
export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect()
    console.log('🔌 MongoDB disconnected successfully')
  } catch (error) {
    console.error('❌ MongoDB disconnection error:', error.message)
    throw error
  }
}

// 数据库连接事件监听
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB')
})

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error)
})

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB')
})

// 优雅关闭
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close()
    console.log('🛑 MongoDB connection closed through app termination')
    process.exit(0)
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error)
    process.exit(1)
  }
})

export default {
  connectDatabase,
  disconnectDatabase,
  connection: mongoose.connection,
}