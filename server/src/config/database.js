import mongoose from 'mongoose'
import dotenv from 'dotenv'

// 确保环境变量已加载
dotenv.config()

// MongoDB 连接参数配置
const MONGODB_HOST = process.env.MONGODB_HOST || 'localhost'
const MONGODB_PORT = process.env.MONGODB_PORT || '27017'
const MONGODB_USERNAME = process.env.MONGODB_USERNAME || ''
const MONGODB_PASSWORD = process.env.MONGODB_PASSWORD || ''
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'stock_trading_simulator'
const MONGODB_AUTH_SOURCE = process.env.MONGODB_AUTH_SOURCE || 'admin'

// 动态构建 MongoDB URI
const buildMongoURI = () => {
  let uri = 'mongodb://'
  
  // 如果有用户名和密码，添加认证信息
  if (MONGODB_USERNAME && MONGODB_PASSWORD) {
    uri += `${encodeURIComponent(MONGODB_USERNAME)}:${encodeURIComponent(MONGODB_PASSWORD)}@`
  }
  
  // 添加主机和端口
  uri += `${MONGODB_HOST}:${MONGODB_PORT}`
  
  // 添加数据库名
  uri += `/${MONGODB_DATABASE}`
  
  // 如果有认证信息，添加认证源参数
  if (MONGODB_USERNAME && MONGODB_PASSWORD) {
    uri += `?authSource=${MONGODB_AUTH_SOURCE}`
  }
  
  return uri
}

const MONGODB_URI = buildMongoURI()

console.log('🔧 MongoDB Configuration:')
console.log(`   Host: ${MONGODB_HOST}:${MONGODB_PORT}`)
console.log(`   Database: ${MONGODB_DATABASE}`)
console.log(`   Authentication: ${MONGODB_USERNAME ? 'Enabled' : 'Disabled'}`)
if (MONGODB_USERNAME) {
  console.log(`   Auth Source: ${MONGODB_AUTH_SOURCE}`)
}

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

// 检查数据库连接状态
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1 // 1 表示已连接
}

// 获取数据库信息
export const getDatabaseInfo = () => {
  const connection = mongoose.connection
  
  if (connection.readyState !== 1) {
    return {
      status: 'disconnected',
      readyState: connection.readyState,
      readyStateText: getReadyStateText(connection.readyState)
    }
  }
  
  return {
    status: 'connected',
    name: connection.name || MONGODB_DATABASE,
    host: connection.host || MONGODB_HOST,
    port: connection.port || MONGODB_PORT,
    readyState: connection.readyState,
    readyStateText: getReadyStateText(connection.readyState)
  }
}

// 获取连接状态文本描述
const getReadyStateText = (state) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  }
  return states[state] || 'unknown'
}

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseInfo,
  connection: mongoose.connection,
}