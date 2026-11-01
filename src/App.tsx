import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useSession } from './api/hooks'
import { Shell } from './components/Shell'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { OrdersPage } from './pages/OrdersPage'
import { ProductsPage } from './pages/ProductsPage'
import { ProductNewPage } from './pages/ProductNewPage'
import { ProductEditPage } from './pages/ProductEditPage'
import { DronesPage } from './pages/DronesPage'
import { DroneDetailPage } from './pages/DroneDetailPage'
import { AlertsPage } from './pages/AlertsPage'

function RequireSession() {
  const session = useSession()
  const location = useLocation()

  if (session.isPending) return <div className="empty">불러오는 중…</div>
  if (!session.data) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  return <Shell />
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireSession />}>
        <Route index element={<DashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductNewPage />} />
        <Route path="products/:id/edit" element={<ProductEditPage />} />
        <Route path="drones" element={<DronesPage />} />
        <Route path="drones/:id" element={<DroneDetailPage />} />
        <Route path="alerts" element={<AlertsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
