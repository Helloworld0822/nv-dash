import { defineConfig, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'

// 백엔드는 쿠키 세션(nv_admin_session)을 쓰므로 같은 출처로 보이도록 프록시한다.
// 그래야 SameSite 쿠키가 저장되고, 0.0.0.0 바인드 후 외부 IP로 접속해도 CORS 화이트리스트에 걸리지 않는다.
const BACKEND = process.env.NV_BACKEND ?? 'https://neurovector-backend.forge-lang.org'

// 백엔드는 Secure + SameSite=Strict 쿠키를 내려준다. 이 대시보드는 HTTP(LAN IP)로
// 열리므로 브라우저가 Secure 쿠키를 버려 로그인 직후 /me · 주문 API 가 401이 된다.
function rewriteSessionCookie(cookie: string) {
  return cookie
    .replace(/;\s*Secure/gi, '')
    .replace(/;\s*SameSite=Strict/gi, '; SameSite=Lax')
}

function backendProxy(): ProxyOptions {
  return {
    target: BACKEND,
    changeOrigin: true,
    secure: true,
    cookieDomainRewrite: '',
    configure(proxy) {
      proxy.on('proxyRes', (proxyRes) => {
        const header = proxyRes.headers['set-cookie']
        if (!header) return
        const cookies = Array.isArray(header) ? header : [header]
        proxyRes.headers['set-cookie'] = cookies.map(rewriteSessionCookie)
      })
    },
  }
}

const proxy = {
  '/api': backendProxy(),
  '/health': backendProxy(),
}

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173, proxy },
  preview: { host: '0.0.0.0', port: 4173, proxy },
})
