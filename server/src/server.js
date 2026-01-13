/**
 * Server Entry Point
 * 
 * @description Main server file that initializes the Express application,
 * connects to the database, and starts the HTTP server.
 */

import dotenv from 'dotenv';
import createApp from './app.js';
import { connectDatabase, setupGracefulShutdown } from './config/database.js';

// Load environment variables
dotenv.config();

/**
 * Start the server
 */
const startServer = async () => {
  try {
    console.log('🚀 Starting Stock Trading Simulator Server...');
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    
    // Connect to database
    await connectDatabase();
    
    // Create Express application
    const app = createApp();
    
    // Get port from environment or default
    const PORT = process.env.PORT || 3000;
    const HOST = process.env.HOST || 'localhost';
    
    // Start HTTP server
    const server = app.listen(PORT, () => {
      console.log('✅ Server started successfully!');
      console.log(`🌐 Server running on: http://${HOST}:${PORT}`);
      console.log(`🏥 Health check: http://${HOST}:${PORT}/health`);
      console.log(`📡 API endpoint: http://${HOST}:${PORT}/api/v1/projects/info`);
      console.log('🛑 Press Ctrl+C to stop the server');
    });
    
    // Setup graceful shutdown
    setupGracefulShutdown();
    
    // Handle server-specific shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
      
      server.close((err) => {
        if (err) {
          console.error('❌ Error during server shutdown:', err);
          process.exit(1);
        }
        
        console.log('✅ HTTP server closed successfully');
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 10000);
    };
    
    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use`);
        console.log('💡 Try using a different port or stop the existing process');
        process.exit(1);
      } else {
        console.error('❌ Server error:', error);
        process.exit(1);
      }
    });
    
    return server;
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export default startServer;