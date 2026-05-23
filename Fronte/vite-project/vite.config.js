import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    proxy: {
      // Mọi request /api/... → forward tới backend (không qua browser → không bị PNA block)
      '/api': {
        target: 'http://127.0.0.1:8080',  // dùng IP trực tiếp, tránh IPv6/IPv4 mismatch
        changeOrigin: true,
        secure: false,
        proxyTimeout: 10000,
        timeout: 10000,
      }
    }
  }
})
