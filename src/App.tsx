import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, Sparkles, Users } from 'lucide-react'
import { HomePage } from './pages/HomePage'
import { OrdersPage } from './pages/OrdersPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { NewOrderPage } from './pages/NewOrderPage'
import { ServicesPage } from './pages/ServicesPage'
import { CustomersPage } from './pages/CustomersPage'

function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()

  const tabs = [
    { id: 'home', path: '/', label: 'Beranda', icon: Home },
    { id: 'orders', path: '/orders', label: 'Pesanan', icon: ClipboardList },
    { id: 'services', path: '/services', label: 'Layanan', icon: Sparkles },
    { id: 'customers', path: '/customers', label: 'Pelanggan', icon: Users },
  ]

  const currentTab = tabs.find(t => location.pathname.startsWith(t.path) || (t.path === '/' && location.pathname === '/'))?.id || 'home'

  if (location.pathname.includes('/orders/new') || location.pathname.includes('/orders/')) {
    return null
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = currentTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`flex flex-col items-center justify-center w-16 h-full transition-colors ${
                isActive ? 'text-cyan-600' : 'text-gray-400'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className="text-xs mt-1 font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/orders/new" element={<NewOrderPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/customers" element={<CustomersPage />} />
        <Route path="/customers/new" element={<CustomersPage />} />
      </Routes>
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
