# Stock Trade Simulator - Documentation

Welcome to the Stock Trade Simulator project documentation. This comprehensive guide covers all aspects of the application, from setup to advanced development.

## 📋 Table of Contents

- [Project Overview](#project-overview)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Development Guide](#development-guide)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)

## 🎯 Project Overview

The Stock Trade Simulator is a comprehensive web application that allows users to practice stock trading without financial risk. Built with modern web technologies, it provides a realistic trading environment for learning and skill development.

### Key Features

- **Real-time Trading Simulation** - Practice trading with virtual money
- **Portfolio Management** - Track investments and performance
- **Market Data Integration** - Access to real market information
- **Educational Resources** - Learn trading strategies and concepts
- **Risk-free Environment** - Practice without financial consequences

### Technology Stack

#### Frontend
- **Vue.js 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and development server
- **Axios** - HTTP client for API communication
- **Modern CSS** - Responsive design with CSS Grid and Flexbox

#### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling

#### Development Tools
- **VSCode** - Integrated development environment
- **Docker** - Containerization for consistent environments
- **Git** - Version control system
- **npm** - Package management

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- MongoDB 7.0+
- Git 2.30+
- VSCode (recommended)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd StockTradeSimulator
   ```

2. **Install dependencies**:
   ```bash
   npm run install:all
   ```

3. **Setup environment**:
   ```bash
   cp server/.env.example server/.env
   cp app/.env.example app/.env
   # Edit .env files with your configuration
   ```

4. **Start MongoDB**:
   ```bash
   cd docker
   docker-compose up -d mongodb
   ```

5. **Seed the database**:
   ```bash
   cd server
   npm run seed
   ```

6. **Start development servers**:
   ```bash
   npm run dev
   ```

7. **Open the application**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000/api/v1/projects/info
   - Health Check: http://localhost:3000/health

## 🏗️ Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Vue.js)      │◄──►│   (Express.js)  │◄──►│   (MongoDB)     │
│   Port: 5173    │    │   Port: 3000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Project Structure

```
StockTradeSimulator/
├── app/                    # Frontend application
│   ├── src/               # Vue.js source code
│   ├── public/            # Static assets
│   ├── dist/              # Build output
│   └── package.json       # Frontend dependencies
├── server/                # Backend application
│   ├── src/               # Express.js source code
│   └── package.json       # Backend dependencies
├── docker/                # Docker configurations
├── document/              # Documentation
├── .vscode/               # VSCode configurations
├── scripts/               # Utility scripts
└── package.json           # Root workspace configuration
```

### Data Flow

1. **User Interaction** - User interacts with Vue.js frontend
2. **API Request** - Frontend makes HTTP requests to Express.js backend
3. **Business Logic** - Backend processes requests and applies business rules
4. **Database Operation** - Backend queries/updates MongoDB database
5. **Response** - Backend returns JSON response to frontend
6. **UI Update** - Frontend updates user interface with new data

## 💻 Development Guide

### Development Workflow

1. **Start development environment**:
   ```bash
   npm run dev  # Starts both frontend and backend
   ```

2. **Make changes**:
   - Frontend files: `app/src/`
   - Backend files: `server/src/`

3. **Test changes**:
   - Frontend: Hot reload automatically updates browser
   - Backend: Nodemon restarts server on file changes

4. **Debug issues**:
   - Use VSCode debugging configurations
   - Check browser DevTools for frontend issues
   - Monitor server logs for backend issues

### Code Organization

#### Frontend Structure
```
app/src/
├── components/         # Vue components
├── services/          # API service layer
├── assets/            # Static assets (CSS, images)
├── config/            # Configuration files
├── App.vue            # Main application component
└── main.js            # Application entry point
```

#### Backend Structure
```
server/src/
├── controllers/       # Request handlers
├── models/           # Database models
├── routes/           # API route definitions
├── services/         # Business logic
├── middleware/       # Express middleware
├── config/           # Configuration files
├── utils/            # Utility functions
└── server.js         # Application entry point
```

### Environment Configuration

#### Development Environment
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Database**: mongodb://localhost:27017
- **Hot Reload**: Enabled for both frontend and backend

#### Environment Variables

**Backend (.env)**:
```bash
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/stock_simulator?authSource=admin
CORS_ORIGIN=http://localhost:5173
```

**Frontend (.env)**:
```bash
VITE_API_BASE_URL=http://localhost:3000
VITE_DEV_PORT=5173
VITE_APP_TITLE=Stock Trading Simulator
```

### Testing Strategy

#### Manual Testing
- **Frontend**: Browser testing with DevTools
- **Backend**: API testing with curl or Postman
- **Integration**: End-to-end user workflows

#### Automated Testing (Future)
- **Unit Tests**: Jest for both frontend and backend
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Cypress for user workflow testing

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
Currently, the API does not require authentication. This will be added in future versions.

### Endpoints

#### Health Check
```http
GET /health
```
Returns server health status.

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-01-12T18:00:00.000Z",
  "uptime": 3600.123
}
```

#### Project Information
```http
GET /api/v1/projects/info
```
Returns project information and configuration.

**Response**:
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
    },
    "status": {
      "database": "connected",
      "server": "running",
      "environment": "development"
    }
  }
}
```

### Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Rate Limiting

- **Limit**: 100 requests per 15 minutes per IP
- **Headers**: Rate limit information in response headers
- **Exceeded**: HTTP 429 status with retry information

## 🚀 Deployment

### Development Deployment

1. **Build frontend**:
   ```bash
   cd app
   npm run build
   ```

2. **Start production server**:
   ```bash
   cd server
   NODE_ENV=production npm start
   ```

### Production Deployment (Future)

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

#### Cloud Deployment
- **Frontend**: Deploy to Netlify, Vercel, or AWS S3
- **Backend**: Deploy to Heroku, AWS EC2, or DigitalOcean
- **Database**: MongoDB Atlas or self-hosted MongoDB

### Environment Configuration

#### Production Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/stocksim
CORS_ORIGIN=https://yourdomain.com

# Frontend
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_APP_TITLE=Stock Trading Simulator
```

## 🤝 Contributing

### Development Setup

1. **Fork the repository**
2. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make changes and test**
4. **Commit with descriptive messages**:
   ```bash
   git commit -m "Add: New trading feature"
   ```
5. **Push and create pull request**

### Code Standards

#### JavaScript/Vue.js
- Use ES6+ features
- Follow Vue.js style guide
- Add JSDoc comments for functions
- Use meaningful variable names

#### Git Workflow
- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive pull request descriptions
- Include tests for new features

#### Code Review
- All changes require code review
- Ensure tests pass before merging
- Update documentation for new features
- Follow security best practices

## 📚 Additional Resources

### Documentation
- [Setup Guide](setup/README.md) - Detailed setup instructions
- [API Documentation](api/README.md) - Complete API reference
- [Debugging Guide](development/debugging.md) - Debugging instructions

### External Resources
- [Vue.js Documentation](https://vuejs.org/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Node.js Documentation](https://nodejs.org/docs/)

### Community
- **Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Wiki**: Community-maintained documentation

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

## 🙏 Acknowledgments

- Vue.js team for the excellent framework
- Express.js community for the robust web framework
- MongoDB team for the flexible database
- All contributors and testers

---

**Happy Trading! 📈✨**