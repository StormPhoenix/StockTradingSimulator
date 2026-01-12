# Data Model: Project Initialization

**Date**: 2026-01-12  
**Feature**: Project Initialization  
**Phase**: 1 - Design & Contracts

## Configuration Entities

### Environment Configuration
**Purpose**: Store environment-specific configuration values for Docker services

**Attributes**:
- `MONGO_ROOT_USERNAME`: String - MongoDB administrator username
- `MONGO_ROOT_PASSWORD`: String - MongoDB administrator password  
- `MONGO_DATABASE`: String - Default database name for the application
- `MONGO_PORT`: Number - Port for MongoDB service (default: 27017)
- `MONGO_EXPRESS_PORT`: Number - Port for mongo-express web interface (default: 8081)
- `NODE_ENV`: String - Application environment (development/production)
- `MONGODB_URI`: String - Complete MongoDB connection string for application use

**Validation Rules**:
- All password fields must be non-empty strings
- Port numbers must be between 1024-65535
- Database name must follow MongoDB naming conventions (no spaces, special characters)
- Connection URI must be valid MongoDB format

**Relationships**: None (configuration entity)

### Docker Service Configuration
**Purpose**: Define containerized service specifications and dependencies

**Services**:
- **MongoDB Service**
  - Image: mongo:7.0
  - Authentication: Enabled with admin user
  - Data persistence: Named Docker volumes
  - Health checks: MongoDB ping command
  
- **Mongo Express Service**  
  - Image: mongo-express:latest
  - Authentication: Disabled for development
  - Dependency: MongoDB service health
  - Web interface: Port 8081

**Volume Mappings**:
- `mongodb_data`: Database files (/data/db)
- `mongodb_config`: Configuration files (/data/configdb)

**Network Configuration**:
- Custom bridge network for service isolation
- Port exposure for external connectivity

### File System Structure
**Purpose**: Define project organization and file locations

**Directories**:
- `scripts/`: Shell scripts for automation
- `docker/`: Docker configuration files
- `doc/`: Project documentation
- `.env.example`: Environment variable template

**Files**:
- `run-mongodb.sh`: Database container management script
- `docker-compose.yml`: Service orchestration configuration
- `.gitignore`: Version control exclusion rules
- `.env`: Environment variables (created from template)

**Permissions**:
- Shell scripts: Executable (755)
- Configuration files: Read-only (644)
- Environment files: Restricted (600)

## State Transitions

### Container Lifecycle States
1. **Stopped** → **Starting** (via run-mongodb.sh)
2. **Starting** → **Healthy** (health checks pass)
3. **Healthy** → **Running** (services operational)
4. **Running** → **Stopping** (via --stop command)
5. **Stopping** → **Stopped** (containers terminated)

### Setup Process States
1. **Uninitialized** → **Template Created** (.env.example copied)
2. **Template Created** → **Configured** (.env file populated)
3. **Configured** → **Services Started** (containers launched)
4. **Services Started** → **Validated** (connectivity verified)
5. **Validated** → **Ready** (status report generated)

## Data Persistence

### MongoDB Data Volumes
- **Primary Data**: Stored in named Docker volume `mongodb_data`
- **Configuration**: Stored in named Docker volume `mongodb_config`
- **Backup Location**: Optional volume `mongodb_backup` for database dumps

### Configuration Persistence
- **Environment Variables**: Stored in `docker/.env` file
- **Docker Compose**: Stored in `docker/docker-compose.yml`
- **Scripts**: Stored in `scripts/` directory with version control

## Validation Rules

### Environment Variable Validation
- Password complexity: Minimum 8 characters, alphanumeric
- Port availability: Check for conflicts before container start
- Database name format: MongoDB naming conventions
- File permissions: Ensure .env file is not world-readable

### Container Health Validation
- MongoDB: Successful ping response within 30 seconds
- Mongo Express: HTTP 200 response on port 8081
- Network connectivity: Services can communicate internally
- Volume mounting: Data directories accessible and writable

### Script Execution Validation
- Docker availability: Command exists and daemon running
- File existence: Required configuration files present
- Permission checks: Scripts executable, files readable
- Error handling: Graceful failure with informative messages