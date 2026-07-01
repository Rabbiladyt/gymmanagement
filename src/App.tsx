import { useState } from 'react'
import {
  LayoutDashboard, Users, Dumbbell, Calendar,
  CreditCard, Menu, X, Dumbbell as LogoIcon
} from 'lucide-react'
import { Dashboard } from './pages/Dashboard'
import { MembersPage } from './pages/MembersPage'
import { TrainersPage } from './pages/TrainersPage'
import { ClassesPage } from './pages/ClassesPage'
import { SchedulesPage } from './pages/SchedulesPage'
import { MembershipsPage } from './pages/MembershipsPage'

type Page = 'dashboard' | 'members' | 'trainers' | 'classes' | 'schedules' | 'memberships'

const navItems: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'members', label: 'Members', icon: <Users className="w-5 h-5" /> },
  { id: 'trainers', label: 'Trainers', icon: <Dumbbell className="w-5 h-5" /> },
  { id: 'classes', label: 'Classes', icon: <Calendar className="w-5 h-5" /> },
  { id: 'schedules', label: 'Schedules', icon: <Calendar className="w-5 h-5" /> },
  { id: 'memberships', label: 'Memberships', icon: <CreditCard className="w-5 h-5" /> },
]

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'members':
        return <MembersPage />
      case 'trainers':
        return <TrainersPage />
      case 'classes':
        return <ClassesPage />
      case 'schedules':
        return <SchedulesPage />
      case 'memberships':
        return <MembershipsPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600">
              <LogoIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">FitPro</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentPage(item.id)
                setSidebarOpen(false)
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentPage === item.id
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div className="flex-1 lg:hidden" />
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">Gym Admin</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                A
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6 lg:p-8 animate-fade-in">{renderPage()}</main>
      </div>
    </div>
  )
}
