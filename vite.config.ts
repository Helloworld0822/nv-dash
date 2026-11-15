import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// HTTP development uses a local backend; cookies retain their security attributes.
const target = process.env.NV_BACKEND ?? 'http://localhost:8080'
const proxy = {
  '/api': { target, changeOrigin: true, secure: true },
  '/health': { target, changeOrigin: true, secure: true },
}

export default defineConfig({
  base: '/nv-dash/',
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, proxy },
  preview: { host: '0.0.0.0', port: 4173, proxy },
})
