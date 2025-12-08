import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // IMPORTANTE: base sempre '/' su Vercel (mai /PtPro/)
  base: '/',
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // Solo per sviluppo locale (Codespaces, Cloudflare Tunnel, ecc.)
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    hmr: {
      clientPort: 443,
      protocol: 'wss',
    },
    allowedHosts: [
      'sale-commentary-priority-inns.trycloudflare.com',
      '.trycloudflare.com',
      '.app.github.dev',
      'miniature-cod-6vvj6wv5rxr2597w-5173.app.github.dev',
      'github.dev'
    ],
    cors: true,
    fs: {
      strict: false,
      allow: ['..']
    },
  },

  build: {
    chunkSizeWarningLimit: 1500,
    // Rimuove console.log in produzione
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
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