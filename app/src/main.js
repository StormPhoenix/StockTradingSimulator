/**
 * Frontend Application Entry Point
 * 
 * @description Main entry file for the Vue.js application
 * with global configuration and app initialization.
 */

import { createApp } from 'vue';
import App from './App.vue';

// Global styles
import './assets/styles/global.css';

/**
 * Create and configure Vue application
 */
const app = createApp(App);

// Global error handler
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err);
  console.error('Component:', vm);
  console.error('Info:', info);
  
  // In production, you might want to send errors to a logging service
  if (import.meta.env.PROD) {
    // Send to error tracking service
    console.error('Production error:', { err, info });
  }
};

// Global warning handler (development only)
if (import.meta.env.DEV) {
  app.config.warnHandler = (msg, vm, trace) => {
    console.warn('Vue Warning:', msg);
    console.warn('Trace:', trace);
  };
}

// Global properties
app.config.globalProperties.$appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';
app.config.globalProperties.$appTitle = import.meta.env.VITE_APP_TITLE || 'Stock Trading Simulator';

// Performance monitoring (development only)
if (import.meta.env.DEV) {
  app.config.performance = true;
}

// Mount the application
app.mount('#app');

// Log application info
console.log(`🚀 ${app.config.globalProperties.$appTitle} v${app.config.globalProperties.$appVersion}`);
console.log(`📍 Environment: ${import.meta.env.MODE}`);
console.log(`🔧 Debug mode: ${import.meta.env.DEV ? 'enabled' : 'disabled'}`);