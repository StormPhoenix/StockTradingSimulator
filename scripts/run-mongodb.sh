#!/bin/bash
# Stock Trading Simulator - MongoDB Container Management Script
# Usage: ./scripts/run-mongodb.sh [--help|--foreground|--stop|--status|--logs]

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DOCKER_DIR="$PROJECT_ROOT/docker"
COMPOSE_FILE="$DOCKER_DIR/docker-compose.yml"
ENV_FILE="$DOCKER_DIR/.env"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions

##
# Log an informational message in blue
# @param {string} $1 - Message to log
##
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

##
# Log a success message in green
# @param {string} $1 - Message to log
##
log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

##
# Log a warning message in yellow
# @param {string} $1 - Message to log
##
log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

##
# Log an error message in red
# @param {string} $1 - Message to log
##
log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

##
# Check system dependencies and required files
# Verifies Docker, docker-compose, and configuration files exist
# @exit 1 if any dependency is missing
##
check_dependencies() {
    log_info "Checking dependencies..."

    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        log_info "Visit https://docs.docker.com/get-docker/ for installation instructions"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker first."
        log_info "Try: 'sudo systemctl start docker' (Linux) or start Docker Desktop (Mac/Windows)"
        exit 1
    fi

    # Check for docker-compose availability
    COMPOSE_CMD=$(get_compose_cmd)
    if [ -z "$COMPOSE_CMD" ]; then
        log_error "Neither 'docker compose' nor 'docker-compose' is available."
        log_info "Please install Docker Compose: https://docs.docker.com/compose/install/"
        exit 1
    fi

    # Check if required files exist
    if [ ! -f "$COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $COMPOSE_FILE"
        log_info "Expected file: docker/docker-compose.yml"
        log_info "Please ensure you're running this script from the project root directory"
        exit 1
    fi

    if [ ! -f "$ENV_FILE" ]; then
        log_warning "Environment file not found: $ENV_FILE"
        log_info "Please copy .env.example to docker/.env and configure it:"
        log_info "  cp .env.example docker/.env"
        log_info "  nano docker/.env  # Edit with your secure password"
        exit 1
    fi

    log_success "All dependencies are available"
}

##
# Detect available docker-compose command
# @return {string} "docker compose" or "docker-compose" or empty string if neither available
##
get_compose_cmd() {
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        echo "docker compose"
    elif command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo ""
    fi
}

##
# Wait for a service to become healthy
# @param {string} $1 - Service name (mongodb or mongo-express)
# @return {number} 0 if healthy, 1 if timeout
##
check_health() {
    local service=$1
    local max_attempts=30
    local attempt=1

    log_info "Waiting for $service to become healthy..."

    while [ $attempt -le $max_attempts ]; do
        # Check if container is running and healthy using docker ps
        local container_name="stock-simulator-$service"
        if [ "$service" = "mongo-express" ]; then
            container_name="stock-simulator-mongo-express"
        fi

        local health_status=$(docker ps --filter "name=$container_name" --format "table {{.Status}}" | tail -n +2 | grep -o "healthy\|unhealthy\|starting" || echo "not_running")

        if [ "$health_status" = "healthy" ]; then
            log_success "$service is healthy"
            return 0
        fi

        if [ $((attempt % 5)) -eq 0 ]; then
            log_info "Still waiting for $service... (attempt $attempt/$max_attempts, status: $health_status)"
        fi

        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "$service failed to become healthy within expected time"
    return 1
}

##
# Start MongoDB services in foreground or background mode
# @param {string} $1 - Mode: "foreground" or "background"
# @exit 1 if services fail to start or become healthy
##
start_services() {
    local mode=$1
    COMPOSE_CMD=$(get_compose_cmd)

    log_info "Starting MongoDB services in $mode mode..."

    if [ "$mode" = "foreground" ]; then
        log_info "Starting services in foreground (Ctrl+C to stop)..."
        $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up
    else
        log_info "Starting services in background..."
        $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d

        # Wait for services to become healthy
        if check_health "mongodb" && check_health "mongo-express"; then
            log_success "All services are running and healthy!"
            show_connection_info
        else
            log_error "Some services failed to start properly."
            log_info "Troubleshooting steps:"
            log_info "  1. Check logs: $0 --logs"
            log_info "  2. Verify .env configuration: cat docker/.env"
            log_info "  3. Check port conflicts: lsof -i :27017 -i :8081"
            log_info "  4. Restart Docker daemon if needed"
            exit 1
        fi
    fi
}

##
# Stop all MongoDB services gracefully
##
stop_services() {
    COMPOSE_CMD=$(get_compose_cmd)

    log_info "Stopping MongoDB services..."
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down

    log_success "All services stopped"
}

##
# Display current status of all services
##
show_status() {
    COMPOSE_CMD=$(get_compose_cmd)

    log_info "Service Status:"
    $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
}

##
# Display logs for services
# @param {string} $1 - Optional service name (mongodb or mongo-express)
##
show_logs() {
    local service=${1:-}
    COMPOSE_CMD=$(get_compose_cmd)

    if [ -n "$service" ]; then
        log_info "Showing logs for $service:"
        $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f "$service"
    else
        log_info "Showing logs for all services:"
        $COMPOSE_CMD --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f
    fi
}

##
# Display connection information for MongoDB and Mongo Express
# Reads configuration from .env file and shows connection details
##
show_connection_info() {
    # Read environment variables from .env file
    if [ -f "$ENV_FILE" ]; then
        # Source the .env file to get variables
        set -a
        source "$ENV_FILE"
        set +a
    fi

    # Use defaults if variables not set
    MONGO_PORT=${MONGO_PORT:-27017}
    MONGO_EXPRESS_PORT=${MONGO_EXPRESS_PORT:-8081}
    MONGO_DATABASE=${MONGO_DATABASE:-stock_simulator}
    MONGO_ROOT_USERNAME=${MONGO_ROOT_USERNAME:-admin}

    echo ""
    log_success "MongoDB services are running!"
    echo ""
    echo "Connection Information:"
    echo "======================="
    echo "MongoDB:"
    echo "  - Host: localhost"
    echo "  - Port: $MONGO_PORT"
    echo "  - Database: $MONGO_DATABASE"
    echo "  - Username: $MONGO_ROOT_USERNAME"
    echo "  - Connection String: mongodb://$MONGO_ROOT_USERNAME:<password>@localhost:$MONGO_PORT/$MONGO_DATABASE?authSource=admin"
    echo ""
    echo "Mongo Express (Web UI):"
    echo "  - URL: http://localhost:$MONGO_EXPRESS_PORT"
    echo "  - No authentication required"
    echo ""
}

##
# Display help message with usage instructions
##
show_help() {
    cat << EOF
Stock Trading Simulator - MongoDB Container Management

Usage: $0 [OPTION]

Options:
  --help        Show this help message
  --foreground  Start services in foreground mode
  --stop        Stop all services
  --status      Show service status
  --logs [SERVICE]  Show logs (optionally for specific service)

Default: Start services in background mode

Examples:
  $0                    # Start in background
  $0 --foreground       # Start in foreground
  $0 --stop            # Stop services
  $0 --logs mongodb    # Show MongoDB logs
EOF
}

##
# Main execution function - parses command line arguments and executes appropriate action
# @param {string} $@ - Command line arguments
##
main() {
    cd "$PROJECT_ROOT"

    case "${1:-}" in
        --help|-h)
            show_help
            ;;
        --stop)
            check_dependencies
            stop_services
            ;;
        --status)
            check_dependencies
            show_status
            ;;
        --logs)
            check_dependencies
            show_logs "$2"
            ;;
        --foreground)
            check_dependencies
            start_services "foreground"
            ;;
        "")
            check_dependencies
            start_services "background"
            ;;
        *)
            log_error "Unknown option: $1"
            log_info "Use --help to see available options"
            show_help
            exit 1
            ;;
    esac
}

# Script entry point
main "$@"
