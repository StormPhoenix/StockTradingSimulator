# Frontend Application - Stock Trade Simulator

Vue.js 3 frontend application for the Stock Trade Simulator platform.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend server running (see `../server/README.md`)

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

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. **Open in browser**:
   Navigate to `http://localhost:5173`

## 📁 Project Structure

```
app/
├── src/
│   ├── App.vue            # Main application component
│   ├── main.js            # Application entry point
│   ├── assets/            # Static assets (CSS, images)
│   ├── components/        # Vue components
│   ├── services/          # API services
│   └── config/            # Configuration files
├── public/                # Public static files
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── .env.example           # Environment template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Frontend Development Server Configuration
VITE_DEV_PORT=5173
VITE_HOST=localhost

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
VITE_API_TIMEOUT=10000
VITE_API_VERSION=v1

# Application Configuration
VITE_APP_TITLE=Stock Trading Simulator
VITE_APP_VERSION=1.0.0
```

### Port Configuration

The frontend supports flexible port configuration:

```bash
# Default development port
VITE_DEV_PORT=5173

# Alternative ports for development
VITE_DEV_PORT=5174  # Alternative frontend port
VITE_DEV_PORT=8080  # Common alternative

# Preview port (for production build testing)
VITE_PREVIEW_PORT=4173
```

### API Configuration

Configure backend API connection:

```bash
# Local backend server
VITE_API_BASE_URL=http://localhost:3000

# Alternative backend ports
VITE_API_BASE_URL=http://localhost:3001
VITE_API_BASE_URL=http://localhost:8000

# Production API
VITE_API_BASE_URL=https://api.stocksimulator.com
```

## 🛠️ Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview

# Run linting
npm run lint

# Run tests (when available)
npm test
```

### Development Workflow

1. **Start development server**:
   ```bash
   npm run dev
   ```
   This starts Vite dev server with hot module replacement (HMR).

2. **Open in browser**:
   Navigate to `http://localhost:5173` (or your configured port).

3. **Make changes**:
   Edit files in `src/` and see changes instantly in the browser.

4. **Test API integration**:
   Ensure the backend server is running for full functionality.

### Hot Module Replacement (HMR)

Vite provides instant hot reload for:
- Vue components
- CSS styles
- JavaScript modules
- Environment variables (requires restart)

## 🎨 Styling and UI

### CSS Architecture

```
src/assets/styles/
├── global.css           # Global styles and CSS variables
├── components.css       # Component-specific styles
└── responsive.css       # Responsive design utilities
```

### Design System

The application uses a modern, responsive design with:
- **Color Scheme**: Professional blue and gray palette
- **Typography**: System fonts with fallbacks
- **Layout**: CSS Grid and Flexbox
- **Responsive**: Mobile-first approach
- **Animations**: Subtle transitions and loading states

### CSS Variables

Global CSS variables for consistent theming:

```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #64748b;
  --success-color: #10b981;
  --warning-color: #f59e0b;
  --error-color: #ef4444;
  --background-color: #f8fafc;
  --text-color: #1e293b;
  --border-color: #e2e8f0;
}
```

## 📡 API Integration

### Service Layer

API services are organized in `src/services/`:

```javascript
// src/services/api.js - Base API client
// src/services/projectService.js - Project-specific API calls
```

### API Client Configuration

The API client includes:
- Automatic request/response interceptors
- Error handling and retry logic
- Loading state management
- CORS support

### Example API Usage

```javascript
import { getProjectInfo } from '@/services/projectService';

// In a Vue component
export default {
  async mounted() {
    try {
      const projectInfo = await getProjectInfo();
      this.project = projectInfo;
    } catch (error) {
      this.error = 'Failed to load project information';
    }
  }
}
```

## 🐛 Debugging

### Browser DevTools

1. **Vue DevTools**: Install the Vue.js DevTools browser extension
2. **Network Tab**: Monitor API requests and responses
3. **Console**: Check for JavaScript errors and logs
4. **Sources**: Set breakpoints in source code

### VSCode Debugging

1. Open the project in VSCode
2. Go to Run and Debug (Ctrl+Shift+D)
3. Select "Debug Frontend (Chrome)"
4. Set breakpoints in your Vue components
5. Press F5 to start debugging

### Debug Configuration

The project includes VSCode debug configuration in `.vscode/launch.json`:

```json
{
  "name": "Debug Frontend (Chrome)",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/app/src"
}
```

## 🏗️ Building and Deployment

### Development Build

```bash
# Build for development (with source maps)
npm run build:dev
```

### Production Build

```bash
# Build for production (optimized)
npm run build
```

Build output goes to `dist/` directory with:
- Minified JavaScript and CSS
- Optimized assets
- Source maps (in development)
- Vendor chunk splitting

### Preview Production Build

```bash
# Build and preview locally
npm run build
npm run preview
```

### Deployment Options

#### Static Hosting
Deploy the `dist/` folder to:
- Netlify
- Vercel
- GitHub Pages
- AWS S3 + CloudFront

#### Docker Deployment
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
EXPOSE 80
```

## 🔒 Security

### Environment Variables

- Prefix all environment variables with `VITE_`
- Never expose sensitive data in frontend environment variables
- Use different configurations for development/production

### Content Security Policy

The application includes basic CSP headers:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; script-src 'self' 'unsafe-inline';">
```

### API Security

- All API requests use HTTPS in production
- CORS is properly configured
- No sensitive data stored in localStorage

## 🚨 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
Error: Port 5173 is already in use
```
**Solution**: Change the port or kill existing process:
```bash
# Use different port
VITE_DEV_PORT=5174 npm run dev

# Or kill existing process
lsof -ti:5173 | xargs kill -9
```

#### API Connection Failed
```bash
Network Error: Failed to fetch
```
**Solutions**:
1. Ensure backend server is running
2. Check `VITE_API_BASE_URL` in `.env`
3. Verify CORS configuration on backend

#### Build Errors
```bash
Error: Failed to resolve import
```
**Solutions**:
1. Check import paths and file extensions
2. Ensure all dependencies are installed
3. Clear node_modules and reinstall:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

#### Hot Reload Not Working
**Solutions**:
1. Check if files are being watched correctly
2. Restart the development server
3. Check for syntax errors in code

### Debug Mode

Enable detailed debugging:
```bash
VITE_DEBUG=true npm run dev
```

This enables:
- Detailed error messages
- API request/response logging
- Component lifecycle logging

## 📦 Dependencies

### Production Dependencies
- `vue` - Vue.js 3 framework
- `axios` - HTTP client for API requests

### Development Dependencies
- `@vitejs/plugin-vue` - Vue plugin for Vite
- `vite` - Build tool and dev server

### Optional Dependencies
- `vue-router` - Client-side routing (if needed)
- `pinia` - State management (if needed)
- `@vueuse/core` - Vue composition utilities (if needed)

## 🎯 Performance

### Optimization Features

- **Code Splitting**: Automatic vendor chunk separation
- **Tree Shaking**: Unused code elimination
- **Asset Optimization**: Image and CSS optimization
- **Lazy Loading**: Component-level code splitting
- **Caching**: Aggressive caching strategies

### Performance Monitoring

Monitor performance using:
- Browser DevTools Performance tab
- Lighthouse audits
- Vue DevTools performance profiler

## 🤝 Contributing

### Code Style

- Use Vue 3 Composition API
- Follow Vue.js style guide
- Add JSDoc comments for functions
- Use TypeScript-style prop definitions

### Component Guidelines

```vue
<template>
  <!-- Use semantic HTML -->
  <!-- Add proper accessibility attributes -->
</template>

<script>
// Use Composition API
// Add proper prop validation
// Include JSDoc comments
</script>

<style scoped>
/* Use scoped styles */
/* Follow BEM methodology */
</style>
```

### Testing

When adding tests:
- Use Vue Test Utils
- Test component behavior, not implementation
- Include accessibility tests
- Test API integration

## 📄 License

This project is part of the Stock Trade Simulator application.