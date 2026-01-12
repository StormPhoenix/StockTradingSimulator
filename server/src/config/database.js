/**
 * Database Configuration and Connection
 * 
 * @description Handles MongoDB connection setup, configuration,
 * and connection lifecycle management.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * Database configuration options
 */
const dbConfig = {
  uri: process.env.MONGODB_URI || 'mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin',
  options: {
    // Connection options
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    
    // Replica set options (if applicable)
    retryWrites: true,
    w: 'majority'
  }
};

/**
 * Connect to MongoDB database
 * 
 * @returns {Promise<void>}
 */
export const connectDatabase = async () => {
  try {
    console.log('🔄 Connecting to MongoDB...');
    
    // Set mongoose options
    mongoose.set('strictQuery', false);
    
    // Connect to database
    const connection = await mongoose.connect(dbConfig.uri, dbConfig.options);
    
    console.log(`✅ MongoDB connected successfully to: ${connection.connection.host}`);
    console.log(`📊 Database: ${connection.connection.name}`);
    
    // Handle connection events
    setupConnectionEvents();
    
    return connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Exit process with failure
    process.exit(1);
  }
};

/**
 * Setup database connection event handlers
 */
const setupConnectionEvents = () => {
  const db = mongoose.connection;
  
  // Connection events
  db.on('connected', () => {
    console.log('📡 Mongoose connected to MongoDB');
  });
  
  db.on('error', (error) => {
    console.error('❌ Mongoose connection error:', error);
  });
  
  db.on('disconnected', () => {
    console.log('📴 Mongoose disconnected from MongoDB');
  });
  
  // Reconnection events
  db.on('reconnected', () => {
    console.log('🔄 Mongoose reconnected to MongoDB');
  });
  
  db.on('reconnectFailed', () => {
    console.error('❌ Mongoose reconnection failed');
  });
};

/**
 * Gracefully close database connection
 * 
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing MongoDB connection:', error.message);
  }
};

/**
 * Check database connection status
 * 
 * @returns {boolean} Connection status
 */
export const isDatabaseConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Get database connection info
 * 
 * @returns {object} Connection information
 */
export const getDatabaseInfo = () => {
  const connection = mongoose.connection;
  
  return {
    status: getConnectionStatus(connection.readyState),
    host: connection.host,
    port: connection.port,
    name: connection.name,
    readyState: connection.readyState
  };
};

/**
 * Convert connection ready state to human-readable status
 * 
 * @param {number} readyState - Mongoose connection ready state
 * @returns {string} Human-readable status
 */
const getConnectionStatus = (readyState) => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return states[readyState] || 'unknown';
};

/**
 * Setup graceful shutdown handlers
 */
export const setupGracefulShutdown = () => {
  // Handle process termination
  process.on('SIGINT', async () => {
    console.log('\n🛑 Received SIGINT. Gracefully shutting down...');
    await disconnectDatabase();
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM. Gracefully shutting down...');
    await disconnectDatabase();
    process.exit(0);
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', async (error) => {
    console.error('❌ Uncaught Exception:', error);
    await disconnectDatabase();
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    await disconnectDatabase();
    process.exit(1);
  });
};

export default {
  connectDatabase,
  disconnectDatabase,
  isDatabaseConnected,
  getDatabaseInfo,
  setupGracefulShutdown
};