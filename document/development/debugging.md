# Debugging Guide - Stock Trade Simulator

Complete guide for debugging both frontend and backend components of the Stock Trade Simulator application.

## 🎯 Quick Start

### Prerequisites

- VSCode with debugging extensions
- Node.js 18+ with inspector support
- Chrome or Edge browser
- Project dependencies installed

### Launch Debugging

1. **Open VSCode** in the project root
2. **Go to Run and Debug** (Ctrl+Shift+D / Cmd+Shift+D)
3. **Select a debug configuration**:
   - `Debug Full Stack` - Debug both frontend and backend
   - `Debug Backend` - Debug server only
   - `Debug Frontend` - Debug client only
4. **Press F5** to start debugging

## 🖥️ Backend Debugging

### VSCode Debug Configuration

The backend uses Node.js inspector for debugging:

```json
{
  "name": "Debug Backend",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/server/src/server.js",
  "cwd": "${workspaceFolder}/server",
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "true"
  }
}
```

### Debug Methods

#### 1. VSCode Integrated Debugging (Recommended)

```bash
# In VSCode:
# 1. Set breakpoints in server/src/ files
# 2. Select "Debug Backend" configuration
# 3. Press F5
```

#### 2. Command Line Debugging

```bash
# Start with inspector
cd server
npm run debug

# Start with break on first line
npm run debug:brk

# Attach to running process
npm run debug:attach
```

#### 3. Attach to Running Process

```bash
# Start server with inspect flag
cd server
node --inspect=9229 src/server.js

# In VSCode, use "Debug Backend (Attach)" configuration
```

### Setting Breakpoints

1. **Open any server file** (e.g., `server/src/controllers/projectController.js`)
2. **Click in the gutter** next to line numbers to set breakpoints
3. **Red dots** indicate active breakpoints
4. **Start debugging** to hit breakpoints

### Debug Features

- **Step Over** (F10): Execute current line
- **Step Into** (F11): Enter function calls
- **Step Out** (Shift+F11): Exit current function
- **Continue** (F5): Resume execution
- **Restart** (Ctrl+Shift+F5): Restart debug session

### Debugging API Endpoints

```javascript
// Example: Debug project controller
export const getProjectInfo = async (req, res) => {
  // Set breakpoint here
  debugger; // Or use this for programmatic breakpoint
  
  try {
    const projectInfo = await projectService.getProjectInfo();
    // Inspect variables in Debug Console
    console.log('Project info:', projectInfo);
    
    res.json({
      success: true,
      data: projectInfo
    });
  } catch (error) {
    // Debug error handling
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
};
```

### Debug Console Commands

```javascript
// In Debug Console (while paused):
req.params          // Inspect request parameters
req.body            // Inspect request body
res.locals          // Inspect response locals
process.env         // Check environment variables
mongoose.connection // Check database connection
```

## 🌐 Frontend Debugging

### VSCode Debug Configuration

The frontend uses Chrome DevTools Protocol:

```json
{
  "name": "Debug Frontend",
  "type": "chrome",
  "request": "launch",
  "url": "http://localhost:5173",
  "webRoot": "${workspaceFolder}/app/src",
  "sourceMaps": true
}
```

### Debug Methods

#### 1. VSCode Chrome Debugging (Recommended)

```bash
# 1. Start frontend dev server
npm run dev:client

# 2. In VSCode:
# - Set breakpoints in app/src/ files
# - Select "Debug Frontend" configuration
# - Press F5 (launches Chrome with debugging)
```

#### 2. Browser DevTools

```bash
# Start dev server
npm run dev:client

# Open browser to http://localhost:5173
# Press F12 to open DevTools
# Go to Sources tab to set breakpoints
```

#### 3. Vue DevTools Extension

Install Vue DevTools browser extension for Vue-specific debugging:
- Component inspection
- Vuex state debugging
- Event tracking
- Performance profiling

### Setting Breakpoints

1. **Open Vue component** (e.g., `app/src/App.vue`)
2. **Set breakpoints** in `<script>` section
3. **Use debugger statement** for programmatic breakpoints:

```vue
<script>
export default {
  async mounted() {
    debugger; // Execution will pause here
    
    try {
      const data = await this.fetchProjectInfo();
      console.log('Fetched data:', data);
    } catch (error) {
      debugger; // Pause on error
      console.error('Error:', error);
    }
  }
}
</script>
```

### Debugging Vue Components

```vue
<template>
  <div class="project-info">
    <!-- Debug template rendering -->
    <pre>{{ $data }}</pre>
  </div>
</template>

<script>
export default {
  data() {
    return {
      project: null,
      loading: false,
      error: null
    };
  },
  
  async mounted() {
    // Set breakpoint here to debug component lifecycle
    await this.loadProject();
  },
  
  methods: {
    async loadProject() {
      this.loading = true;
      
      try {
        // Debug API calls
        console.log('Fetching project info...');
        const response = await fetch('/api/v1/projects/info');
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        this.project = data.data;
        
      } catch (error) {
        // Debug error handling
        console.error('Failed to load project:', error);
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

### Debug Console Commands

```javascript
// In browser console (while paused):
this.$data          // Component data
this.$props         // Component props
this.$refs          // Template refs
this.$parent        // Parent component
this.$children      // Child components
this.$el            // Component DOM element

// Vue 3 Composition API
getCurrentInstance() // Current component instance
```

## 🔄 Full Stack Debugging

### Compound Configuration

Debug both frontend and backend simultaneously:

```json
{
  "name": "Debug Full Stack",
  "configurations": [
    "Debug Backend",
    "Debug Frontend"
  ],
  "stopAll": true
}
```

### End-to-End Debugging Workflow

1. **Start full stack debugging**:
   ```bash
   # In VSCode: Select "Debug Full Stack" and press F5
   ```

2. **Set breakpoints in both environments**:
   - Backend: `server/src/controllers/projectController.js`
   - Frontend: `app/src/services/projectService.js`

3. **Trigger API call from frontend**:
   - Breakpoint hits in frontend service
   - Step through HTTP request
   - Breakpoint hits in backend controller
   - Step through server logic
   - Return to frontend with response

### Debugging API Communication

```javascript
// Frontend (app/src/services/projectService.js)
export const getProjectInfo = async () => {
  debugger; // Breakpoint 1: Before API call
  
  try {
    const response = await api.get('/projects/info');
    debugger; // Breakpoint 2: After API response
    
    return response.data;
  } catch (error) {
    debugger; // Breakpoint 3: On error
    throw error;
  }
};

// Backend (server/src/controllers/projectController.js)
export const getProjectInfo = async (req, res) => {
  debugger; // Breakpoint 4: API endpoint hit
  
  try {
    const data = await projectService.getProjectInfo();
    debugger; // Breakpoint 5: Before response
    
    res.json({ success: true, data });
  } catch (error) {
    debugger; // Breakpoint 6: On server error
    res.status(500).json({ error: error.message });
  }
};
```

## 🛠️ Advanced Debugging Techniques

### Source Maps

Source maps are configured for both environments:

```javascript
// Vite config (app/vite.config.js)
export default defineConfig({
  build: {
    sourcemap: true, // Generate source maps
  },
  css: {
    devSourcemap: true, // CSS source maps
  }
});
```

### Conditional Breakpoints

Set breakpoints that only trigger under specific conditions:

```javascript
// Right-click breakpoint → Add Conditional Breakpoint
// Condition examples:
req.params.id === 'specific-id'
this.project && this.project.status === 'error'
process.env.NODE_ENV === 'development'
```

### Logpoints

Add logging without modifying code:

```javascript
// Right-click in gutter → Add Logpoint
// Examples:
console.log('Request received:', req.body)
console.log('Component state:', this.$data)
```

### Performance Debugging

#### Backend Performance

```javascript
// Add timing to API endpoints
export const getProjectInfo = async (req, res) => {
  const startTime = Date.now();
  
  try {
    const data = await projectService.getProjectInfo();
    const duration = Date.now() - startTime;
    
    console.log(`API call took ${duration}ms`);
    res.json({ success: true, data, meta: { duration } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### Frontend Performance

```vue
<script>
export default {
  async mounted() {
    console.time('component-mount');
    
    await this.loadData();
    
    console.timeEnd('component-mount');
  }
};
</script>
```

## 🚨 Troubleshooting

### Common Issues

#### Backend Debugging Issues

**Port 9229 already in use**
```bash
# Find and kill process using debug port
lsof -ti:9229 | xargs kill -9

# Or use different port
node --inspect=9230 src/server.js
```

**Breakpoints not hitting**
- Ensure source maps are enabled
- Check file paths in launch.json
- Verify Node.js version supports inspector
- Restart debug session

**Cannot connect to runtime**
- Check if server is running
- Verify debug port is correct
- Ensure no firewall blocking

#### Frontend Debugging Issues

**Chrome not launching**
- Check Chrome installation path
- Try Edge configuration instead
- Use browser DevTools as fallback

**Source maps not working**
- Verify Vite source map configuration
- Check webRoot path in launch.json
- Clear browser cache

**Breakpoints in wrong location**
- Check sourceMapPathOverrides in launch.json
- Verify file paths match exactly
- Restart Vite dev server

### Debug Environment Validation

Run the debug test script:

```bash
npm run test:debug
```

This validates:
- VSCode configuration files
- Debug port availability
- Source map generation
- Node.js inspector support

### Performance Considerations

- **Disable in production**: Remove debugger statements
- **Source maps**: Only enable in development
- **Console logging**: Use log levels appropriately
- **Memory usage**: Monitor for memory leaks during long debug sessions

## 📚 Additional Resources

### VSCode Extensions

Recommended extensions for debugging:

- **Debugger for Chrome** - Chrome debugging support
- **Vue Language Features (Volar)** - Vue.js debugging
- **Node.js Extension Pack** - Node.js debugging tools
- **REST Client** - Test API endpoints

### Browser Tools

- **Vue DevTools** - Vue component debugging
- **Chrome DevTools** - Advanced debugging features
- **Network tab** - Monitor API requests
- **Performance tab** - Profile application performance

### Documentation Links

- [VSCode Debugging Guide](https://code.visualstudio.com/docs/editor/debugging)
- [Node.js Inspector](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools)
- [Vue.js Debugging](https://vuejs.org/guide/scaling-up/tooling.html#debugging)

## 🎯 Best Practices

1. **Use meaningful breakpoints** - Don't just add them everywhere
2. **Leverage conditional breakpoints** - Only break when needed
3. **Use the Debug Console** - Inspect variables interactively
4. **Profile performance** - Identify bottlenecks early
5. **Test error scenarios** - Debug exception handling
6. **Document complex debugging** - Help future developers
7. **Clean up debug code** - Remove debugger statements before commit

---

Happy debugging! 🐛✨