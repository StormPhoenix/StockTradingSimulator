import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env file
dotenv.config()

export default defineConfig(() => {
  // Extract backend URL from VITE_API_BASE_URL or use default
  const apiBaseUrl = process.env.VITE_API_BASE_URL || 'http://localhost:3000'
  const devPort = parseInt(process.env.VITE_DEV_PORT || '5173')

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, '../shared/types'),
      },
    },
    server: {
      port: devPort,
      proxy: {
        '/api': {
          target: apiBaseUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['vue', 'vue-router', 'pinia'],
            ui: ['element-plus'],
            utils: ['axios', 'vee-validate', 'yup'],
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
    },
  }
})