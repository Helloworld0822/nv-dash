import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { useLogin, useSession } from '../api/hooks'

const REMEMBER_KEY = 'nv-dash:username'

export function LoginPage() {
  const session = useSession()
  const login = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_KEY)
    if (saved) {
      setUsername(saved)
      setRemember(true)
    }
  }, [])

  if (session.data) {
    const from = (location.state as { from?: string } | null)?.from
    return <Navigate to={from && from !== '/login' ? from : '/'} replace />
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate(
      { username: username.trim(), password },
      {
        onSuccess: () => {
          if (remember) localStorage.setItem(REMEMBER_KEY, username.trim())
          else localStorage.removeItem(REMEMBER_KEY)
          const from = (location.state as { from?: string } | null)?.from
          navigate(from && from !== '/login' ? from : '/', { replace: true })
        },
      },
    )
  }

  return (
    <div className="login">
      <aside className="login-aside">
        <div className="brand-row">
          <span className="wordmark">배달</span>
          <span className="chip">관리자</span>
        </div>
        <h1>
          학교 안의 간식,
          <br />
          운영은 한눈에.
        </h1>
        <p>
          주문부터 드론 배송까지
          <br />
          교내 배달을 관리하세요.
        </p>
        <div className="login-art" role="presentation" />
        <span className="login-foot">SUNRIN INTERNET HIGH SCHOOL · 교내 배달</span>
      </aside>

      <section className="login-panel">
        <form className="login-form" onSubmit={onSubmit}>
          <div className="login-head">
            <div className="login-kicker">
              <Icon name="store" size={24} />
              <span>교내 배달 관리자</span>
            </div>
            <h2>관리자 로그인</h2>
            <p>매점 관리자 계정으로 로그인해 주세요.</p>
          </div>

          <div className="field">
            <label htmlFor="username">아이디</label>
            <input
              id="username"
              name="username"
              autoComplete="username"
              placeholder="admin"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              required
            />
          </div>

          <div className="field pwfield">
            <label htmlFor="password">비밀번호</label>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="비밀번호를 입력해 주세요"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              title={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            >
              <Icon name={showPassword ? 'eyeOff' : 'eye'} />
            </button>
          </div>

          <div className="login-row">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
              아이디 기억하기
            </label>
          </div>

          {login.error && <p className="error-bar">{(login.error as Error).message}</p>}

          <button type="submit" className="btn is-primary" disabled={login.isPending}>
            {login.isPending ? '로그인 중…' : '로그인'}
          </button>

          <p className="login-help">
            계정이 없거나 접속이 안 되나요?
            <br />
            학교 운영 담당자에게 문의해 주세요.
          </p>
        </form>

        <span className="login-copy">© 교내 배달 · 교내 드론 배달 운영 서비스</span>
      </section>
    </div>
  )
}
