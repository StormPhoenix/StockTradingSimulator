# Stock Trading Simulator

A web-based stock trading simulator for learning and practicing trading strategies.

## Quick Start

1. **Setup Database Environment** (5 minutes):
   ```bash
   # Copy environment template
   cp .env.example docker/.env
   
   # Edit docker/.env with your secure password
   nano docker/.env
   
   # Start database services
   ./scripts/run-mongodb.sh
   ```

2. **Verify Setup**:
   - MongoDB: http://localhost:27017 (database connection)
   - Mongo Express: http://localhost:8081 (web interface)

3. **Next Steps**: See [Setup Guide](./setup/README.md) for detailed instructions.

## Project Structure

```
StockTradeSimulator/
├── .env.example              # Environment variable template
├── .gitignore               # Git ignore rules
├── docker/
│   ├── docker-compose.yml   # Database service configuration
│   └── .env                 # Environment variables (private)
├── scripts/
│   └── run-mongodb.sh       # Database management script
├── doc/
│   ├── README.md            # This file
│   └── setup/
│       └── README.md        # Detailed setup guide
├── backend/                 # Node.js backend (future)
└── frontend/                # Vue.js frontend (future)
```

## Technology Stack

- **Frontend**: Vue.js + JavaScript (future)
- **Backend**: Node.js + JavaScript (future)
- **Database**: MongoDB 7.0 (containerized)
- **Infrastructure**: Docker Compose
- **Version Control**: Git

## Development Workflow

### Database Management

```bash
# Start services
./scripts/run-mongodb.sh

# Check status
./scripts/run-mongodb.sh --status

# View logs
./scripts/run-mongodb.sh --logs

# Stop services
./scripts/run-mongodb.sh --stop

# Get help
./scripts/run-mongodb.sh --help
```

### Database Access

- **Direct Connection**: mongodb://admin:password@localhost:27017/stock_trading_simulator?authSource=admin
- **Web Interface**: http://localhost:8081 (Mongo Express)

## Documentation

- [Setup Guide](./setup/README.md) - Installation and configuration
- [API Documentation](./api/) - Backend API reference (future)
- [User Guide](./user/) - End-user documentation (future)

## Performance

- Container startup: <30 seconds
- Database connectivity: <10 seconds
- Total setup time: <5 minutes

## Security

- Environment variables stored in `.env` (excluded from git)
- MongoDB authentication enabled
- Mongo Express authentication disabled (development only)

## Support

For issues:
1. Check [Setup Guide troubleshooting](./setup/README.md#troubleshooting)
2. Review logs: `./scripts/run-mongodb.sh --logs`
3. Verify Docker is running: `docker --version`