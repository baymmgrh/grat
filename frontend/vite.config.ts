import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Skip type checking during build (use tsc separately for type checking)
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "use client" warnings from libraries
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return
        warn(warning)
      }
    }
  },
  esbuild: {
    // Ignore TypeScript errors during build
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  server: {
    port: 3000,
    host: '0.0.0.0',  // Allow LAN access
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      'erp.graterp.my.id',
      'api.graterp.my.id',
      '.graterp.my.id',  // Allow all subdomains
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
})
