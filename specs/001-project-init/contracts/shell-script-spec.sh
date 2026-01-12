#!/bin/bash
# Shell Script Specification
# File: scripts/run-mongodb.sh

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
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check dependencies (Docker, docker-compose, files)
check_dependencies() {
    # Implementation: Check for Docker, docker-compose, required files
    # Exit with error if dependencies missing
}

# Get docker-compose command (docker compose vs docker-compose)
get_compose_cmd() {
    # Implementation: Detect available compose command
}

# Health check function for services
check_health() {
    local service=$1
    # Implementation: Wait for service to become healthy
    # Return 0 on success, 1 on failure
}

# Start services in background or foreground mode
start_services() {
    local mode=$1
    # Implementation: Start containers with docker-compose
    # Handle foreground/background modes
    # Verify health and show connection info
}

# Stop all services
stop_services() {
    # Implementation: Stop containers gracefully
}

# Show service status
show_status() {
    # Implementation: Display container status
}

# Show service logs
show_logs() {
    local service=${1:-}
    # Implementation: Display logs for service or all services
}

# Show connection information after successful startup
show_connection_info() {
    # Implementation: Display MongoDB and mongo-express connection details
    # Read from .env file for port and credential information
}

# Show help message
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

# Main execution function
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
            show_help
            exit 1
            ;;
    esac
}

# Script entry point
main "$@"