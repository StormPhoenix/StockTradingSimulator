# Quick Start Guide: Project Initialization

**Date**: 2026-01-12  
**Feature**: Project Initialization  
**Estimated Time**: 5 minutes

## Prerequisites

Before starting, ensure you have:
- Docker Engine installed and running
- Docker Compose v2 (or docker-compose v1.27+)
- Git installed
- Unix/Linux/macOS operating system
- Terminal/shell access

## Step-by-Step Setup

### 1. Initialize Git Repository
```bash
# Navigate to project directory
cd /path/to/StockTradeSimulator

# Initialize git repository (if not already done)
git init

# Create and configure .gitignore
# (This will be automated by the initialization script)
```

### 2. Configure Environment Variables
```bash
# Copy environment template
cp .env.example docker/.env

# Edit environment file with your preferences
nano docker/.env

# Required changes:
# - MONGO_ROOT_PASSWORD: Set a secure password
# - MONGO_DATABASE: Confirm database name
# - Ports: Adjust if defaults conflict with existing services
```

### 3. Start Database Services
```bash
# Make script executable
chmod +x scripts/run-mongodb.sh

# Start MongoDB and mongo-express in background
./scripts/run-mongodb.sh

# Alternative: Start in foreground to see logs
./scripts/run-mongodb.sh --foreground
```

### 4. Verify Installation
After successful startup, you should see:
```
[SUCCESS] MongoDB services are running!

Connection Information:
=======================
MongoDB:
  - Host: localhost
  - Port: 27017
  - Database: stock_trading_simulator
  - Connection String: mongodb://admin:your_password@localhost:27017/stock_trading_simulator?authSource=admin

Mongo Express (Web UI):
  - URL: http://localhost:8081
  - No authentication required
```

### 5. Test Connectivity
```bash
# Check service status
./scripts/run-mongodb.sh --status

# View logs if needed
./scripts/run-mongodb.sh --logs

# Access mongo-express web interface
open http://localhost:8081
```

## Common Commands

### Database Management
```bash
# Start services (background)
./scripts/run-mongodb.sh

# Start services (foreground with logs)
./scripts/run-mongodb.sh --foreground

# Stop all services
./scripts/run-mongodb.sh --stop

# Check service status
./scripts/run-mongodb.sh --status

# View logs for all services
./scripts/run-mongodb.sh --logs

# View logs for specific service
./scripts/run-mongodb.sh --logs mongodb
./scripts/run-mongodb.sh --logs mongo-express
```

### Git Operations
```bash
# Check repository status
git status

# Add files to staging
git add .

# Commit changes
git commit -m "Initial project setup"

# View ignored files (should include .env, node_modules, etc.)
git status --ignored
```

## File Structure After Setup

```
StockTradeSimulator/
├── .env.example              # Environment template
├── .gitignore               # Git ignore rules
├── docker/
│   ├── docker-compose.yml   # Service orchestration
│   └── .env                 # Environment variables (private)
├── scripts/
│   └── run-mongodb.sh       # Database management script
├── doc/
│   └── setup/
│       └── README.md        # This guide
└── .git/                    # Git repository
```

## Troubleshooting

### Port Conflicts
If you see port conflict errors:
```bash
# Check what's using the port
lsof -i :27017
lsof -i :8081

# Edit docker/.env to use different ports
nano docker/.env
# Change MONGO_PORT=27018 and MONGO_EXPRESS_PORT=8082
```

### Docker Issues
```bash
# Verify Docker is running
docker --version
docker ps

# Check Docker Compose
docker compose version
# or
docker-compose --version

# View container logs
docker logs stock-simulator-mongodb
docker logs stock-simulator-mongo-express
```

### Permission Issues
```bash
# Make script executable
chmod +x scripts/run-mongodb.sh

# Check file permissions
ls -la scripts/
ls -la docker/
```

### Environment File Issues
```bash
# Verify .env file exists and has correct format
cat docker/.env

# Check for missing variables
grep -E "^[A-Z_]+=.+" docker/.env
```

## Next Steps

After successful initialization:

1. **Verify Database Connection**: Use mongo-express web interface at http://localhost:8081
2. **Create Application User**: Set up application-specific database users
3. **Configure Development Environment**: Set up Node.js and Vue.js development tools
4. **Start Application Development**: Begin implementing trading simulator features

## Security Notes

- The `.env` file contains sensitive credentials and is excluded from git
- mongo-express has authentication disabled for development convenience
- MongoDB uses authentication with the admin user configured in `.env`
- Change default passwords before any production use

## Performance Expectations

- Container startup: <30 seconds
- Database connectivity: <10 seconds
- Total setup time: <5 minutes
- mongo-express web interface: Available within 30 seconds

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review container logs: `./scripts/run-mongodb.sh --logs`
3. Verify all prerequisites are installed
4. Ensure Docker daemon is running