# Setup Guide - Stock Trade Simulator

Complete setup guide for the Stock Trade Simulator development environment. This guide covers everything from initial installation to advanced configuration.

## 📋 Table of Contents

- [System Requirements](#system-requirements)
- [Quick Setup](#quick-setup)
- [Detailed Installation](#detailed-installation)
- [Environment Configuration](#environment-configuration)
- [Database Setup](#database-setup)
- [Development Tools](#development-tools)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Configuration](#advanced-configuration)

## 💻 System Requirements

### Minimum Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | 18.0+ | LTS version recommended |
| **npm** | 8.0+ | Comes with Node.js |
| **MongoDB** | 7.0+ | Community or Enterprise |
| **Git** | 2.30+ | Version control |
| **RAM** | 4GB | Minimum for development |
| **Storage** | 2GB | For project and dependencies |

### Recommended Requirements

| Component | Version | Notes |
|-----------|---------|-------|
| **Node.js** | 20.0+ | Latest LTS |
| **npm** | 10.0+ | Latest stable |
| **MongoDB** | 7.0+ | Latest stable |
| **Git** | 2.40+ | Latest version |
| **RAM** | 8GB+ | Better performance |
| **Storage** | 5GB+ | Room for growth |

### Operating System Support

- **macOS** 10.15+ (Catalina or later)
- **Windows** 10/11 (with WSL2 recommended)
- **Linux** Ubuntu 20.04+, CentOS 8+, or equivalent

### Development Tools (Optional but Recommended)

- **VSCode** - Primary IDE with excellent debugging support
- **Docker** - For containerized MongoDB
- **Chrome/Edge** - For frontend debugging
- **Postman** - API testing tool

## 🚀 Quick Setup

For experienced developers who want to get started immediately:

```bash
# 1. Clone and navigate
git clone <repository-url>
cd StockTradeSimulator

# 2. Install all dependencies
npm run install:all

# 3. Setup environment files
cp server/.env.example server/.env
cp app/.env.example app/.env

# 4. Start MongoDB (Docker method)
cd docker && docker-compose up -d mongodb

# 5. Seed database
cd ../server && npm run seed

# 6. Start development servers
cd .. && npm run dev
```

**Access Points**:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000/api/v1/projects/info
- Health: http://localhost:3000/health

## 📦 Detailed Installation

### Step 1: Install Node.js

#### Option A: Official Installer (Recommended)

1. **Download Node.js**:
   - Visit [nodejs.org](https://nodejs.org/)
   - Download the LTS version for your OS
   - Run the installer and follow instructions

2. **Verify Installation**:
   ```bash
   node --version  # Should show v18.0.0 or higher
   npm --version   # Should show v8.0.0 or higher
   ```

#### Option B: Using Package Managers

**macOS (Homebrew)**:
```bash
brew install node
```

**Windows (Chocolatey)**:
```bash
choco install nodejs
```

**Linux (Ubuntu/Debian)**:
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Option C: Using Node Version Manager (Advanced)

**Install nvm**:
```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows (use nvm-windows)
# Download from: https://github.com/coreybutler/nvm-windows
```

**Use nvm**:
```bash
nvm install --lts
nvm use --lts
```

### Step 2: Install Git

#### Option A: Official Installer

1. **Download Git**:
   - Visit [git-scm.com](https://git-scm.com/)
   - Download for your OS
   - Install with default settings

2. **Configure Git**:
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   ```

#### Option B: Package Managers

**macOS**:
```bash
brew install git
```

**Windows**:
```bash
choco install git
```

**Linux**:
```bash
sudo apt-get install git  # Ubuntu/Debian
sudo yum install git      # CentOS/RHEL
```

### Step 3: Install MongoDB

#### Option A: Docker (Recommended for Development)

1. **Install Docker**:
   - Download from [docker.com](https://www.docker.com/)
   - Install Docker Desktop for your OS

2. **Start MongoDB Container**:
   ```bash
   cd docker
   docker-compose up -d mongodb
   ```

3. **Verify MongoDB**:
   ```bash
   docker ps  # Should show mongodb container running
   ```

#### Option B: Local Installation

**macOS**:
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

**Windows**:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/)
2. Run installer and follow instructions
3. Start MongoDB service

**Linux (Ubuntu)**:
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

### Step 4: Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd StockTradeSimulator

# Verify project structure
ls -la
# Should see: app/, server/, docker/, document/, package.json, etc.
```

### Step 5: Install Dependencies

```bash
# Install root dependencies
npm install

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../app
npm install

# Return to root
cd ..

# Or use the convenience script
npm run install:all
```

## ⚙️ Environment Configuration

### Backend Environment (.env)

1. **Copy template**:
   ```bash
   cp server/.env.example server/.env
   ```

2. **Edit configuration**:
   ```bash
   # server/.env
   NODE_ENV=development
   PORT=3000
   HOST=localhost
   
   # Database (adjust if needed)
   MONGODB_URI=mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin
   
   # CORS (frontend URL)
   CORS_ORIGIN=http://localhost:5173
   
   # Security
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   
   # Logging
   LOG_LEVEL=info
   DEBUG=true
   ```

### Frontend Environment (.env)

1. **Copy template**:
   ```bash
   cp app/.env.example app/.env
   ```

2. **Edit configuration**:
   ```bash
   # app/.env
   # Development server
   VITE_DEV_PORT=5173
   VITE_HOST=localhost
   
   # API configuration
   VITE_API_BASE_URL=http://localhost:3000
   VITE_API_TIMEOUT=10000
   VITE_API_VERSION=v1
   
   # Application
   VITE_APP_TITLE=Stock Trading Simulator
   VITE_APP_VERSION=1.0.0
   
   # Development
   VITE_DEBUG=true
   VITE_ENABLE_MOCK_DATA=false
   ```

### Environment Validation

Run the validation script to check your configuration:

```bash
npm run validate:env
```

This will check:
- ✅ Required environment variables
- ✅ Port configurations
- ✅ API URL matching
- ⚠️ Recommendations for optimization

## 🗄️ Database Setup

### MongoDB Configuration

#### Using Docker (Recommended)

1. **Start MongoDB container**:
   ```bash
   cd docker
   docker-compose up -d mongodb
   ```

2. **Verify container is running**:
   ```bash
   docker ps
   # Should show: mongodb container on port 27017
   ```

3. **Access MongoDB shell** (optional):
   ```bash
   docker exec -it stock-simulator-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin
   ```

#### Using Local MongoDB

1. **Start MongoDB service**:
   ```bash
   # macOS
   brew services start mongodb/brew/mongodb-community
   
   # Linux
   sudo systemctl start mongod
   
   # Windows
   net start MongoDB
   ```

2. **Create database and user**:
   ```bash
   mongosh
   ```
   ```javascript
   // In MongoDB shell
   use admin
   db.createUser({
     user: "admin",
     pwd: "admin123",
     roles: ["userAdminAnyDatabase", "dbAdminAnyDatabase", "readWriteAnyDatabase"]
   })
   
   use stock_simulator
   // Database will be created automatically when first used
   ```

### Database Seeding

Populate the database with initial data:

```bash
cd server
npm run seed
```

This will create:
- Sample project information
- Default configuration
- Test data for development

### Database Management Tools

#### MongoDB Compass (GUI)

1. **Download**: [MongoDB Compass](https://www.mongodb.com/products/compass)
2. **Connect**: `mongodb://admin:admin123@localhost:27017/?authSource=admin`

#### mongo-express (Web Interface)

If using Docker setup:
```bash
cd docker
docker-compose up -d mongo-express
```
Access at: http://localhost:8081

## 🛠️ Development Tools

### VSCode Setup (Recommended)

1. **Install VSCode**:
   - Download from [code.visualstudio.com](https://code.visualstudio.com/)

2. **Install Extensions**:
   ```bash
   # Open project in VSCode
   code .
   
   # VSCode will suggest installing recommended extensions
   # Or install manually:
   # - Vue Language Features (Volar)
   # - ES6 String HTML
   # - REST Client
   # - MongoDB for VS Code
   ```

3. **Configure Workspace**:
   - Workspace settings are pre-configured in `.vscode/settings.json`
   - Debug configurations are in `.vscode/launch.json`

### Browser Setup

#### Chrome DevTools

1. **Install Chrome** (if not already installed)
2. **Install Vue DevTools Extension**:
   - Visit Chrome Web Store
   - Search for "Vue.js devtools"
   - Install the extension

#### Alternative Browsers

- **Firefox**: Install Vue DevTools addon
- **Edge**: Use built-in DevTools (Chromium-based)

### API Testing Tools

#### Postman (Recommended)

1. **Install Postman**: [getpostman.com](https://www.getpostman.com/)
2. **Import Collection**: Use the provided Postman collection (if available)
3. **Set Environment**: Configure development environment variables

#### Alternative Tools

- **Insomnia**: Lightweight REST client
- **Thunder Client**: VSCode extension
- **curl**: Command-line tool (built into most systems)

## ✅ Verification

### Step-by-Step Verification

1. **Check Node.js and npm**:
   ```bash
   node --version  # Should be 18.0+
   npm --version   # Should be 8.0+
   ```

2. **Check Git**:
   ```bash
   git --version   # Should be 2.30+
   ```

3. **Check MongoDB**:
   ```bash
   # Docker method
   docker ps | grep mongodb
   
   # Local method
   mongosh --eval "db.adminCommand('ismaster')"
   ```

4. **Check project dependencies**:
   ```bash
   npm run test:setup
   ```

5. **Start development servers**:
   ```bash
   npm run dev
   ```

6. **Verify endpoints**:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # API endpoint
   curl http://localhost:3000/api/v1/projects/info
   
   # Frontend (open in browser)
   open http://localhost:5173
   ```

### Expected Results

#### Backend Health Check
```json
{
  "status": "OK",
  "timestamp": "2026-01-12T18:00:00.000Z",
  "uptime": 123.456
}
```

#### Frontend Application
- Should display project information
- Should show "Connected to backend" status
- Should have responsive design

#### Development Console
```
[0] 🚀 Starting Stock Trading Simulator Server...
[0] ✅ MongoDB connected successfully
[0] ✅ Server started successfully!
[0] 🌐 Server running on: http://localhost:3000
[1] ➜  Local:   http://localhost:5173/
[1] ➜  Network: use --host to expose
```

## 🚨 Troubleshooting

### Common Issues

#### Node.js Issues

**Issue**: `node: command not found`
```bash
# Solution: Install Node.js or add to PATH
export PATH="/usr/local/bin:$PATH"  # macOS/Linux
# Or reinstall Node.js
```

**Issue**: `npm ERR! peer dep missing`
```bash
# Solution: Install peer dependencies
npm install --legacy-peer-deps
# Or
npm install --force
```

#### MongoDB Issues

**Issue**: `MongoNetworkError: failed to connect`
```bash
# Solution 1: Check if MongoDB is running
docker ps | grep mongodb
# Or
sudo systemctl status mongod

# Solution 2: Check connection string
# Verify MONGODB_URI in server/.env

# Solution 3: Restart MongoDB
docker-compose restart mongodb
# Or
sudo systemctl restart mongod
```

**Issue**: `Authentication failed`
```bash
# Solution: Check credentials in .env file
# Default: admin:admin123
# Or recreate user in MongoDB
```

#### Port Issues

**Issue**: `Port 3000 is already in use`
```bash
# Solution 1: Kill process using port
lsof -ti:3000 | xargs kill -9

# Solution 2: Use different port
PORT=3001 npm run dev:server
```

**Issue**: `Port 5173 is already in use`
```bash
# Solution 1: Kill process
lsof -ti:5173 | xargs kill -9

# Solution 2: Use different port
VITE_DEV_PORT=5174 npm run dev:client
```

#### Permission Issues

**Issue**: `EACCES: permission denied`
```bash
# Solution: Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm (recommended)
```

#### Git Issues

**Issue**: `fatal: not a git repository`
```bash
# Solution: Initialize git repository
git init
git remote add origin <repository-url>
```

### Platform-Specific Issues

#### Windows (WSL2 Recommended)

**Issue**: Line ending problems
```bash
# Solution: Configure git
git config --global core.autocrlf true
git config --global core.eol lf
```

**Issue**: Docker Desktop not starting
- Enable WSL2 integration in Docker Desktop settings
- Ensure Windows features are enabled (Hyper-V, WSL2)

#### macOS

**Issue**: Xcode command line tools missing
```bash
# Solution: Install Xcode tools
xcode-select --install
```

**Issue**: Homebrew permission issues
```bash
# Solution: Fix Homebrew permissions
sudo chown -R $(whoami) /usr/local/Homebrew
```

#### Linux

**Issue**: Docker permission denied
```bash
# Solution: Add user to docker group
sudo usermod -aG docker $USER
# Then logout and login again
```

### Getting Help

1. **Check logs**:
   ```bash
   # Backend logs
   cd server && npm run dev
   
   # Frontend logs
   cd app && npm run dev
   
   # MongoDB logs
   docker logs stock-simulator-mongodb
   ```

2. **Run diagnostics**:
   ```bash
   npm run test:setup      # Environment validation
   npm run validate:env    # Environment configuration
   npm run health:check    # Service health check
   ```

3. **Community Support**:
   - Check project issues on GitHub
   - Search existing solutions
   - Create new issue with detailed information

## 🔧 Advanced Configuration

### Custom Ports

#### Backend Port Configuration
```bash
# server/.env
PORT=8000  # Custom backend port

# Update frontend API URL
# app/.env
VITE_API_BASE_URL=http://localhost:8000
```

#### Frontend Port Configuration
```bash
# app/.env
VITE_DEV_PORT=3000  # Custom frontend port

# Update CORS in backend
# server/.env
CORS_ORIGIN=http://localhost:3000
```

### Database Configuration

#### Custom MongoDB URI
```bash
# server/.env
# Local MongoDB without authentication
MONGODB_URI=mongodb://localhost:27017/stock_simulator

# MongoDB Atlas (cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/stock_simulator

# Custom local MongoDB with auth
MONGODB_URI=mongodb://myuser:mypass@localhost:27017/stock_simulator?authSource=admin
```

#### Database Performance Tuning
```bash
# server/.env
# Connection pool settings
MONGODB_MAX_POOL_SIZE=10
MONGODB_SERVER_SELECTION_TIMEOUT=5000
MONGODB_SOCKET_TIMEOUT=45000
```

### Development Optimization

#### Enable Hot Reload Debugging
```bash
# server/.env
DEBUG=true
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true

# app/.env
VITE_DEBUG=true
```

#### Memory and Performance
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Enable Node.js performance hooks
export NODE_ENV=development
```

### Production-like Setup

#### Environment Configuration
```bash
# server/.env
NODE_ENV=production
LOG_LEVEL=warn
DEBUG=false

# app/.env
VITE_DEBUG=false
VITE_ENABLE_MOCK_DATA=false
```

#### Build and Test
```bash
# Build frontend
cd app && npm run build

# Test production build
cd app && npm run preview

# Start backend in production mode
cd server && NODE_ENV=production npm start
```

## 📚 Next Steps

After successful setup:

1. **Explore the Application**:
   - Browse the frontend interface
   - Test API endpoints
   - Review project structure

2. **Development Workflow**:
   - Read [Development Guide](../README.md#development-guide)
   - Learn [Debugging Techniques](../development/debugging.md)
   - Understand [API Documentation](../api/README.md)

3. **Customization**:
   - Modify environment variables
   - Customize UI components
   - Add new API endpoints

4. **Contributing**:
   - Read contribution guidelines
   - Set up testing environment
   - Submit improvements

---

**Setup Complete!** 🎉 You're ready to start developing with the Stock Trade Simulator.