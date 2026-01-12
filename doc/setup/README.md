# Stock Trading Simulator - Setup Guide

This guide will help you set up the development environment for the Stock Trading Simulator project.

## Prerequisites

Before starting, ensure you have:
- Docker Engine installed and running
- Docker Compose v2 (or docker-compose v1.27+)
- Git installed
- Unix/Linux/macOS operating system
- Terminal/shell access

## Quick Setup (5 minutes)

### 1. Configure Environment Variables

```bash
# Copy environment template to docker directory
cp .env.example docker/.env

# Edit the environment file with your preferences
nano docker/.env
```

**Required changes:**
- `MONGO_ROOT_PASSWORD`: Set a secure password (replace "change_this_secure_password")
- `MONGO_DATABASE`: Confirm database name (default: stock_trading_simulator)
- `MONGO_PORT`: Adjust if port 27017 conflicts with existing services
- `MONGO_EXPRESS_PORT`: Adjust if port 8081 conflicts with existing services

### 2. Start Database Services

```bash
# Make script executable (if not already)
chmod +x scripts/run-mongodb.sh

# Start MongoDB and mongo-express in background
./scripts/run-mongodb.sh

# Alternative: Start in foreground to see logs
./scripts/run-mongodb.sh --foreground
```

### 3. Verify Installation

After successful startup, you should see:

```
[SUCCESS] MongoDB services are running!

Connection Information:
=======================
MongoDB:
  - Host: localhost
  - Port: 27017
  - Database: stock_trading_simulator
  - Username: admin
  - Connection String: mongodb://admin:<password>@localhost:27017/stock_trading_simulator?authSource=admin

Mongo Express (Web UI):
  - URL: http://localhost:8081
  - No authentication required
```

## Script Usage

The `scripts/run-mongodb.sh` script provides several options:

### Basic Commands

```bash
# Start services in background (default)
./scripts/run-mongodb.sh

# Start services in foreground with logs
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

# Show help
./scripts/run-mongodb.sh --help
```

## Database Access

### MongoDB Direct Access

Connect to MongoDB using any MongoDB client:

- **Host**: localhost
- **Port**: 27017 (or your configured port)
- **Database**: stock_trading_simulator
- **Username**: admin (or your configured username)
- **Password**: (as set in docker/.env)
- **Authentication Database**: admin

**Connection String Example:**
```
mongodb://admin:your_password@localhost:27017/stock_trading_simulator?authSource=admin
```

### Web Interface (Mongo Express)

Access the web-based database management interface:

1. Open your browser
2. Navigate to: http://localhost:8081
3. No authentication required
4. Browse databases, collections, and documents

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

### Service Health Issues

```bash
# Check service status
./scripts/run-mongodb.sh --status

# View logs for debugging
./scripts/run-mongodb.sh --logs

# Restart services
./scripts/run-mongodb.sh --stop
./scripts/run-mongodb.sh
```

## Data Persistence

- Database data is stored in Docker named volumes
- Data persists between container restarts
- Volumes: `stock-simulator-mongodb-data` and `stock-simulator-mongodb-config`

### Managing Data Volumes

```bash
# List volumes
docker volume ls | grep stock-simulator

# Backup data (optional)
docker run --rm -v stock-simulator-mongodb-data:/data -v $(pwd):/backup alpine tar czf /backup/mongodb-backup.tar.gz -C /data .

# Remove volumes (WARNING: This deletes all data)
docker volume rm stock-simulator-mongodb-data stock-simulator-mongodb-config
```

## Performance Expectations

- Container startup: <30 seconds
- Database connectivity: <10 seconds
- Total setup time: <5 minutes
- Mongo Express web interface: Available within 30 seconds

## Security Notes

- The `.env` file contains sensitive credentials and is excluded from git
- Mongo Express has authentication disabled for development convenience
- MongoDB uses authentication with the admin user configured in `.env`
- Change default passwords before any production use

## Next Steps

After successful setup:

1. **Verify Database Connection**: Use mongo-express web interface at http://localhost:8081
2. **Create Application User**: Set up application-specific database users
3. **Configure Development Environment**: Set up Node.js and Vue.js development tools
4. **Start Application Development**: Begin implementing trading simulator features

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs: `./scripts/run-mongodb.sh --logs`
3. Verify all prerequisites are installed
4. Ensure Docker daemon is running