import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // CORRETTO: Base path per GitHub Codespaces
  base: '/PtPro/',

  // CORS per dev in Codespaces
  server: {
    port: 5173,
    strictPort: true,
    cors: {
      origin: true, // Permette richieste da github.dev
      credentials: true,
    },
    // Proxy per manifest.json e altri asset
    proxy: {
      '/manifest.json': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
      },
      '/favicon.ico': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0].toString();
          }
        }
      }
    }
  },
})