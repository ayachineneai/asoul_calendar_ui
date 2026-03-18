import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/bilibili': {
        target: 'https://api.bilibili.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/bilibili/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36');
            proxyReq.setHeader('Origin', 'https://www.bilibili.com');
            proxyReq.setHeader('Referer', 'https://www.bilibili.com/');
          });
        },
      },
    },
  },
})
