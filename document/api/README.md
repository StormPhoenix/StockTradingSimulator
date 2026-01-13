# API Documentation - Stock Trade Simulator

Complete API reference for the Stock Trade Simulator backend services.

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URL & Versioning](#base-url--versioning)
- [Request/Response Format](#requestresponse-format)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Endpoints](#endpoints)
- [Examples](#examples)
- [Testing](#testing)

## 🎯 Overview

The Stock Trade Simulator API provides RESTful endpoints for managing trading simulations, user portfolios, and market data. Built with Express.js and MongoDB, it offers a robust and scalable backend for the trading simulation platform.

### API Features

- **RESTful Design** - Standard HTTP methods and status codes
- **JSON Format** - All requests and responses use JSON
- **Error Handling** - Consistent error response format
- **Rate Limiting** - Protection against abuse
- **CORS Support** - Cross-origin resource sharing enabled
- **Health Monitoring** - Built-in health check endpoints

### Current Version

- **Version**: v1
- **Status**: Development
- **Last Updated**: January 2026

## 🔐 Authentication

**Current Status**: No authentication required (development phase)

**Future Implementation**: JWT-based authentication will be added in future versions.

```http
# Future authentication header
Authorization: Bearer <jwt-token>
```

## 🌐 Base URL & Versioning

### Development Environment
```
Base URL: http://localhost:3000
API Base: http://localhost:3000/api/v1
```

### Production Environment (Future)
```
Base URL: https://api.stocksimulator.com
API Base: https://api.stocksimulator.com/api/v1
```

### Versioning Strategy

- **URL Versioning**: `/api/v1/`, `/api/v2/`
- **Backward Compatibility**: Previous versions supported for 6 months
- **Version Header**: `API-Version: v1` (optional)

## 📝 Request/Response Format

### Request Format

#### Headers
```http
Content-Type: application/json
Accept: application/json
User-Agent: StockSimulator-Client/1.0
```

#### Body (for POST/PUT requests)
```json
{
  "data": {
    // Request payload
  }
}
```

### Response Format

#### Success Response
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "meta": {
    "timestamp": "2026-01-12T18:00:00.000Z",
    "version": "v1",
    "requestId": "req_123456789"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      // Additional error information
    }
  },
  "meta": {
    "timestamp": "2026-01-12T18:00:00.000Z",
    "version": "v1",
    "requestId": "req_123456789"
  }
}
```

## ❌ Error Handling

### HTTP Status Codes

| Status Code | Description | Usage |
|-------------|-------------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 422 | Unprocessable Entity | Validation errors |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily unavailable |

### Error Codes

| Error Code | Description | HTTP Status |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | Request validation failed | 400 |
| `RESOURCE_NOT_FOUND` | Requested resource not found | 404 |
| `DATABASE_ERROR` | Database operation failed | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | 429 |
| `INTERNAL_ERROR` | Unexpected server error | 500 |

### Error Response Examples

#### Validation Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "message": "Invalid email format"
    }
  }
}
```

#### Not Found Error
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Project not found",
    "details": {
      "resource": "project",
      "id": "nonexistent-id"
    }
  }
}
```

## 🚦 Rate Limiting

### Current Limits

- **Rate**: 100 requests per 15 minutes per IP address
- **Burst**: Up to 10 requests per second
- **Headers**: Rate limit information included in response headers

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642003200
X-RateLimit-Window: 900
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "limit": 100,
      "window": 900,
      "retryAfter": 300
    }
  }
}
```

## 📡 Endpoints

### Health & Status

#### Health Check
```http
GET /health
```

**Description**: Check server health and status.

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-01-12T18:00:00.000Z",
  "uptime": 3600.123,
  "version": "1.0.0",
  "environment": "development"
}
```

**Status Codes**:
- `200` - Service healthy
- `503` - Service unhealthy

---

### Project Information

#### Get Project Info
```http
GET /api/v1/projects/info
```

**Description**: Retrieve project information and configuration.

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "Stock Trade Simulator",
    "version": "1.0.0",
    "description": "A comprehensive stock trading simulation platform",
    "technologies": [
      "Node.js",
      "Express.js", 
      "MongoDB",
      "Vue.js"
    ],
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
    },
    "endpoints": {
      "health": "/health",
      "api": "/api/v1",
      "docs": "/api/docs"
    }
  },
  "meta": {
    "timestamp": "2026-01-12T18:00:00.000Z",
    "version": "v1"
  }
}
```

**Status Codes**:
- `200` - Success
- `500` - Server error

---

### Future Endpoints (Planned)

#### User Management
```http
POST   /api/v1/users/register    # Register new user
POST   /api/v1/users/login       # User login
GET    /api/v1/users/profile     # Get user profile
PUT    /api/v1/users/profile     # Update user profile
DELETE /api/v1/users/account     # Delete user account
```

#### Portfolio Management
```http
GET    /api/v1/portfolios        # Get user portfolios
POST   /api/v1/portfolios        # Create new portfolio
GET    /api/v1/portfolios/:id    # Get specific portfolio
PUT    /api/v1/portfolios/:id    # Update portfolio
DELETE /api/v1/portfolios/:id    # Delete portfolio
```

#### Trading Operations
```http
POST   /api/v1/trades            # Execute trade
GET    /api/v1/trades            # Get trade history
GET    /api/v1/trades/:id        # Get specific trade
PUT    /api/v1/trades/:id        # Update trade (if allowed)
DELETE /api/v1/trades/:id        # Cancel trade (if allowed)
```

#### Market Data
```http
GET    /api/v1/stocks            # Get stock list
GET    /api/v1/stocks/:symbol    # Get stock details
GET    /api/v1/stocks/:symbol/price    # Get current price
GET    /api/v1/stocks/:symbol/history  # Get price history
```

## 🧪 Examples

### Using curl

#### Health Check
```bash
curl -X GET http://localhost:3000/health \
  -H "Accept: application/json"
```

#### Get Project Info
```bash
curl -X GET http://localhost:3000/api/v1/projects/info \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

### Using JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Health check
const healthCheck = async () => {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('Health:', response.data);
  } catch (error) {
    console.error('Health check failed:', error);
  }
};

// Get project info
const getProjectInfo = async () => {
  try {
    const response = await api.get('/projects/info');
    console.log('Project:', response.data);
  } catch (error) {
    console.error('Failed to get project info:', error);
  }
};
```

### Using Python (requests)

```python
import requests
import json

base_url = "http://localhost:3000"
api_url = f"{base_url}/api/v1"

headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
}

# Health check
def health_check():
    response = requests.get(f"{base_url}/health", headers=headers)
    return response.json()

# Get project info
def get_project_info():
    response = requests.get(f"{api_url}/projects/info", headers=headers)
    return response.json()

# Example usage
if __name__ == "__main__":
    health = health_check()
    print("Health:", json.dumps(health, indent=2))
    
    project = get_project_info()
    print("Project:", json.dumps(project, indent=2))
```

## 🧪 Testing

### Manual Testing

#### Using Browser
Navigate to endpoints directly:
- Health: http://localhost:3000/health
- Project Info: http://localhost:3000/api/v1/projects/info

#### Using Postman

1. **Import Collection**: Create a Postman collection with all endpoints
2. **Environment Variables**: Set up development and production environments
3. **Test Scripts**: Add automated tests for response validation

#### Using REST Client (VSCode Extension)

Create a `.http` file:

```http
### Health Check
GET http://localhost:3000/health
Accept: application/json

### Project Info
GET http://localhost:3000/api/v1/projects/info
Accept: application/json
Content-Type: application/json
```

### Automated Testing (Future)

#### Unit Tests
```javascript
// Example test with Jest
describe('Project Controller', () => {
  test('should return project info', async () => {
    const response = await request(app)
      .get('/api/v1/projects/info')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.name).toBe('Stock Trade Simulator');
  });
});
```

#### Integration Tests
```javascript
// Example integration test
describe('API Integration', () => {
  test('should handle complete workflow', async () => {
    // Test health check
    await request(app).get('/health').expect(200);
    
    // Test project info
    const projectResponse = await request(app)
      .get('/api/v1/projects/info')
      .expect(200);
    
    expect(projectResponse.body.success).toBe(true);
  });
});
```

### Performance Testing

#### Load Testing with Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10

scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/health"
      - get:
          url: "/api/v1/projects/info"
```

## 📊 Monitoring & Analytics

### Logging

All API requests are logged with:
- Request method and URL
- Response status code
- Response time
- User agent
- IP address
- Timestamp

### Metrics (Future)

- **Response Times**: Average, median, 95th percentile
- **Error Rates**: 4xx and 5xx error percentages
- **Throughput**: Requests per second
- **Database Performance**: Query execution times

### Health Monitoring

The `/health` endpoint provides:
- Server uptime
- Database connectivity
- Memory usage
- CPU usage
- Environment information

## 🔧 Development

### Adding New Endpoints

1. **Create Route Handler**:
   ```javascript
   // server/src/controllers/newController.js
   export const newEndpoint = async (req, res) => {
     try {
       // Implementation
       res.json({ success: true, data: result });
     } catch (error) {
       res.status(500).json({ 
         success: false, 
         error: { message: error.message } 
       });
     }
   };
   ```

2. **Define Routes**:
   ```javascript
   // server/src/routes/newRoutes.js
   import express from 'express';
   import { newEndpoint } from '../controllers/newController.js';
   
   const router = express.Router();
   router.get('/new-endpoint', newEndpoint);
   
   export default router;
   ```

3. **Register Routes**:
   ```javascript
   // server/src/app.js
   import newRoutes from './routes/newRoutes.js';
   app.use('/api/v1/new', newRoutes);
   ```

4. **Update Documentation**: Add endpoint details to this document

### API Versioning

When creating new API versions:

1. **Create new route directory**: `server/src/routes/v2/`
2. **Update base path**: `/api/v2/`
3. **Maintain backward compatibility**: Keep v1 routes active
4. **Update documentation**: Create separate docs for new version

## 📚 Additional Resources

### Related Documentation
- [Setup Guide](../setup/README.md) - Development environment setup
- [Debugging Guide](../development/debugging.md) - API debugging
- [Main Documentation](../README.md) - Project overview

### External Resources
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [REST API Best Practices](https://restfulapi.net/)
- [HTTP Status Codes](https://httpstatuses.com/)

### Tools & Extensions
- **Postman** - API testing and documentation
- **Insomnia** - REST client alternative
- **Thunder Client** - VSCode REST client extension
- **REST Client** - VSCode HTTP file support

---

**API Version**: v1 | **Last Updated**: January 2026 | **Status**: Development