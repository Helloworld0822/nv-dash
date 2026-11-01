import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드는 쿠키 세션(nv_admin_session)을 쓰므로 같은 출처로 보이도록 프록시한다.
// 그래야 SameSite 쿠키가 저장되고, 0.0.0.0 바인드 후 외부 IP로 접속해도 CORS 화이트리스트에 걸리지 않는다.
const BACKEND = process.env.NV_BACKEND ?? 'https://neurovector-backend.forge-lang.org'

const proxy = {
  '/api': { target: BACKEND, changeOrigin: true, secure: true },
  '/health': { target: BACKEND, changeOrigin: true, secure: true },
}

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, proxy },
  preview: { host: '0.0.0.0', port: 4173, proxy },
})
