import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Base path: usa '/' in sviluppo, '/PtPro/' solo in produzione
  base: process.env.NODE_ENV === 'production' ? '/PtPro/' : '/',

  // CORS per dev in Codespaces
  server: {
    host: '0.0.0.0', // Ascolta su tutte le interfacce di rete
    port: 5173,
    strictPort: true,
    allowedHosts: ['sale-commentary-priority-inns.trycloudflare.com', '.trycloudflare.com'], // Permette tunnel Cloudflare
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