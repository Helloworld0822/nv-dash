import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { Icon, type IconName } from './Icon'
import { useLogout, useSession } from '../api/hooks'
import { useAlerts } from '../lib/useAlerts'
import { formatToday } from '../lib/format'
import { ErrorBar } from './ui'

interface NavEntry {
  to: string
  label: string
  short: string
  icon: IconName
  end?: boolean
}

const NAV: NavEntry[] = [
  { to: '/', label: '운영 현황', short: '운영', icon: 'dashboard', end: true },
  { to: '/orders', label: '주문 관리', short: '주문', icon: 'orders' },
  { to: '/products', label: '상품 관리', short: '상품', icon: 'products' },
  { to: '/drones', label: '드론 현황', short: '드론', icon: 'drone' },
  { to: '/alerts', label: '알림·점검', short: '알림', icon: 'bell' },
]

const CRUMBS: { match: RegExp; label: string }[] = [
  { match: /^\/$/, label: '운영 현황' },
  { match: /^\/orders/, label: '주문 관리' },
  { match: /^\/products\/new/, label: '상품 등록' },
  { match: /^\/products\/[^/]+\/edit/, label: '상품 수정' },
  { match: /^\/products/, label: '상품 관리' },
  { match: /^\/drones\/[^/]+/, label: '드론 상세' },
  { match: /^\/drones/, label: '드론 현황' },
  { match: /^\/alerts/, label: '알림·점검' },
]

export function Shell() {
  const { pathname } = useLocation()
  const session = useSession()
  const logout = useLogout()
  const { actionCount } = useAlerts()

  const crumb = CRUMBS.find((entry) => entry.match.test(pathname))?.label ?? '운영 현황'
  const username = session.data?.username ?? '관리자'
  const initial = username.slice(0, 1).toUpperCase()

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-row">
            <span className="wordmark">배달</span>
            <span className="chip">관리자</span>
          </div>
          <span className="brand-sub">선린인터넷고등학교</span>
        </div>

        <nav className="nav">
          {NAV.map((entry) => (
            <NavLink
              key={entry.to}
              to={entry.to}
              end={entry.end}
              className={({ isActive }) => (isActive ? 'nav-item is-active' : 'nav-item')}
            >
              <Icon name={entry.icon} size={20} />
              <span>{entry.label}</span>
              {entry.to === '/alerts' && actionCount > 0 && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <a className="side-link" href="https://neurovector-backend.forge-lang.org/swagger-ui/" target="_blank" rel="noreferrer">
            <Icon name="help" />
            <span>운영 가이드</span>
          </a>
          <div className="divider" />
          <div className="account">
            <span className="avatar">{initial}</span>
            <div>
              <div className="account-name">{username}</div>
              <div className="account-role">매점 관리자</div>
            </div>
            <button
              type="button"
              className="account-out"
              title="로그아웃"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="topbar">
          <span className="crumb">교내 배달 관리자  /  {crumb}</span>
          <div className="topbar-right">
            <span className="open-state">
              <span className="dot" />
              매점 운영 중
            </span>
            <span className="today">{formatToday()}</span>
            <NavLink to="/alerts" title="알림" className="topbar-bell">
              <Icon name="bell" size={20} />
            </NavLink>
            <span className="avatar">{initial}</span>
          </div>
        </header>

        <header className="mobile-bar">
          <span className="wordmark">배달</span>
          <h2>{crumb}</h2>
          <button
            type="button"
            className="account-out"
            title="로그아웃"
            disabled={logout.isPending}
              onClick={() => logout.mutate()}
          >
            <Icon name="logout" size={21} />
          </button>
        </header>

        <main className="content">
          <ErrorBar error={logout.error} />
          <Outlet />
        </main>
      </div>

      <nav className="tabbar">
        {NAV.map((entry) => (
          <NavLink
            key={entry.to}
            to={entry.to}
            end={entry.end}
            className={({ isActive }) => (isActive ? 'is-active' : undefined)}
          >
            <Icon name={entry.icon} size={21} />
            <span>{entry.short}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
