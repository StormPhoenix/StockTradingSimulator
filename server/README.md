# Backend Server - Stock Trade Simulator

Express.js backend server for the Stock Trade Simulator application.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start MongoDB** (if not running):
   ```bash
   # Using Docker (recommended)
   cd ../docker && docker-compose up -d mongodb
   
   # Or using local MongoDB
   mongod --dbpath /path/to/your/db
   ```

4. **Seed the database** (optional):
   ```bash
   npm run seed
   ```

5. **Start the server**:
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will be available at `http://localhost:3000`

## 📁 Project Structure

```
server/
├── src/
│   ├── app.js              # Express app configuration
│   ├── server.js           # Server entry point
│   ├── config/
│   │   ├── database.js     # MongoDB connection
│   │   └── environment.js  # Environment configuration
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   └── utils/             # Utility functions
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=localhost

# Database Configuration
MONGODB_URI=mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# API Configuration
API_VERSION=v1
API_PREFIX=/api
```

### Port Configuration

The server supports flexible port configuration:

```bash
# Default port
PORT=3000

# Alternative ports for development
PORT=3001  # Alternative backend port
PORT=8000  # Common alternative
```

### Database Configuration

MongoDB connection options:

```bash
# Local MongoDB with authentication
MONGODB_URI=mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin

# Local MongoDB without authentication
MONGODB_URI=mongodb://localhost:27017/stock_simulator

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stock_simulator
```

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Endpoints

#### Health Check
```http
GET /health
```
Returns server health status.

#### Project Information
```http
GET /api/v1/projects/info
```
Returns project information and configuration.

**Response Example**:
```json
{
  "success": true,
  "data": {
    "name": "Stock Trade Simulator",
    "version": "1.0.0",
    "description": "A comprehensive stock trading simulation platform",
    "technologies": ["Node.js", "Express.js", "MongoDB", "Vue.js"],
    "features": {
      "frontend": "Vue.js 3 with Vite",
      "backend": "Express.js with MongoDB",
      "database": "MongoDB with Mongoose ODM",
      "development": "Hot reload and debugging support"
    }
  }
}
```

## 🛠️ Development

### Available Scripts

```bash
# Development with auto-reload
npm run dev

# Start production server
npm start

# Seed database with sample data
npm run seed

# Run linting
npm run lint

# Run tests (when available)
npm test
```

### Development Workflow

1. **Start in development mode**:
   ```bash
   npm run dev
   ```
   This starts the server with nodemon for auto-reload on file changes.

2. **Monitor logs**:
   The server provides detailed logging in development mode.

3. **Test API endpoints**:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Project info
   curl http://localhost:3000/api/v1/projects/info
   ```

### Database Management

#### Seeding Data
```bash
# Run the seed script
npm run seed

# Or manually
node src/utils/seedData.js
```

#### Connecting to MongoDB
```bash
# Using MongoDB shell
mongosh "mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin"

# Using MongoDB Compass
mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin
```

## 🐛 Debugging

### VSCode Debugging

1. Open the project in VSCode
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Debug Backend Server"
4. Set breakpoints in your code
5. Press F5 to start debugging

### Manual Debugging

```bash
# Start with Node.js inspector
node --inspect src/server.js

# Or with nodemon
npx nodemon --inspect src/server.js
```

Then connect Chrome DevTools to `chrome://inspect`

## 🔒 Security

### CORS Configuration
The server is configured to accept requests from the frontend:
```javascript
CORS_ORIGIN=http://localhost:5173
```

### Rate Limiting
Basic rate limiting is configured:
- 100 requests per 15 minutes per IP

### Environment Security
- Never commit `.env` files
- Use strong JWT secrets in production
- Configure proper MongoDB authentication

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: Port 3000 is already in use
```
**Solution**: Change the port in `.env` or kill the existing process:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use a different port
PORT=3001 npm run dev
```

#### MongoDB Connection Failed
```bash
Error: MongoNetworkError: failed to connect to server
```
**Solutions**:
1. Ensure MongoDB is running
2. Check connection string in `.env`
3. Verify MongoDB authentication credentials

#### Module Not Found
```bash
Error: Cannot find module 'some-package'
```
**Solution**: Reinstall dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```

### Debug Mode

Enable detailed debugging:
```bash
DEBUG=true npm run dev
```

This enables:
- Detailed error messages
- Request/response logging
- Database query logging

## 📦 Dependencies

### Production Dependencies
- `express` - Web framework
- `mongodb` - MongoDB driver
- `dotenv` - Environment variables
- `cors` - CORS middleware
- `helmet` - Security middleware
- `express-rate-limit` - Rate limiting

### Development Dependencies
- `nodemon` - Auto-reload during development

## 🤝 Contributing

1. Follow the existing code structure
2. Add JSDoc comments for functions
3. Test your changes locally
4. Ensure environment variables are documented

## 📄 License

This project is part of the Stock Trade Simulator application.