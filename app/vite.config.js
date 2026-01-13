/**
 * Vite Configuration
 * 
 * @description Vite build configuration for Vue.js frontend
 * with development server, build optimization, and plugin setup.
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      // Vue plugin options
      reactivityTransform: true
    })
  ],
  
  // Development server configuration
  server: {
    port: parseInt(process.env.VITE_DEV_PORT) || 5173,
    host: true, // Allow external connections
    open: false, // Don't auto-open browser
    cors: true,
    
    // Proxy API requests to backend during development
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.method, req.url);
          });
        }
      },
      '/health': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true, // Always generate source maps for debugging
    
    // Build optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          vendor: ['vue'],
          api: ['axios']
        },
        // Source map configuration
        sourcemapExcludeSources: false
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4kb
    
    // Minification
    minify: process.env.NODE_ENV === 'production' ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: process.env.NODE_ENV === 'production'
      },
      sourceMap: true // Preserve source maps in minified code
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@components': resolve(__dirname, 'src/components'),
      '@services': resolve(__dirname, 'src/services'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@utils': resolve(__dirname, 'src/utils')
    }
  },
  
  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/assets/styles/variables.scss";`
      }
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  
  // Optimization
  optimizeDeps: {
    include: ['vue', 'axios'],
    exclude: []
  },
  
  // Preview server (for production build testing)
  preview: {
    port: parseInt(process.env.VITE_PREVIEW_PORT) || 4173,
    host: true,
    open: false
  },
  
  // Base public path
  base: process.env.VITE_BASE_PATH || '/',
  
  // Asset handling
  assetsInclude: ['**/*.svg', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.gif'],
  
  // Worker configuration
  worker: {
    format: 'es'
  }
});