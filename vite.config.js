import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // IMPORTANTE: base sempre '/' su Vercel (mai /PtPro/)
  base: '/',

  // Solo per sviluppo locale (Codespaces, Cloudflare Tunnel, ecc.)
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'sale-commentary-priority-inns.trycloudflare.com',
      '.trycloudflare.com',
      '.app.github.dev',
      'miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev',
      'github.dev'
    ],
    cors: {
      origin: [
        'http://localhost:5173',
        'https://miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev',
        /\.app\.github\.dev$/,
        'https://github.dev'
      ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['*'],
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
    proxy: {
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
        },
      },
    },
  },
})