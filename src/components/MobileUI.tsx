import React from 'react'
import { Home, ClipboardList, Sparkles, Users } from 'lucide-react'

type BottomNavProps = {
  activeTab: string
  onTabChange: (tab: string) => void
}

const tabs = [
  { id: 'home', label: 'Beranda', icon: Home },
  { id: 'orders', label: 'Pesanan', icon: ClipboardList },
  { id: 'services', label: 'Layanan', icon: Sparkles },
  { id: 'customers', label: 'Pelanggan', icon: Users },
]

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-bottom z-50">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
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

type MobileHeaderProps = {
  title: string
  subtitle?: string
  rightAction?: React.ReactNode
}

export function MobileHeader({ title, subtitle, rightAction }: MobileHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
      <div className="flex items-center justify-between px-4 py-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        {rightAction}
      </div>
    </header>
  )
}

type FloatingActionButtonProps = {
  onClick: () => void
  icon: React.ReactNode
  label?: string
}

export function FloatingActionButton({ onClick, icon, label }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-20 right-4 flex items-center gap-2 px-4 py-3 bg-cyan-600 text-white rounded-full shadow-lg hover:bg-cyan-700 active:scale-95 transition-all z-40"
    >
      {icon}
      {label && <span className="text-sm font-medium pr-1">{label}</span>}
    </button>
  )
}

type CardProps = {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function Card({ children, className = '', onClick }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

type BadgeProps = {
  status: string
  size?: 'sm' | 'md'
}

const statusLabels: Record<string, string> = {
  pending: 'Menunggu',
  processing: 'Diproses',
  washing: 'Dicuci',
  drying: 'Dikeringkan',
  ironing: 'Disetrika',
  ready: 'Siap Ambil',
  delivered: 'Selesai',
  cancelled: 'Dibatalkan',
}

export function StatusBadge({ status, size = 'sm' }: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full'
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'

  return (
    <span className={`status-${status} ${baseClasses} ${sizeClasses}`}>
      {statusLabels[status] || status}
    </span>
  )
}

type PaymentBadgeProps = {
  status: string
}

export function PaymentBadge({ status }: PaymentBadgeProps) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    unpaid: { bg: 'bg-red-100', text: 'text-red-700', label: 'Belum Bayar' },
    paid: { bg: 'bg-green-100', text: 'text-green-700', label: 'Lunas' },
    partial: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Sebagian' },
  }

  const { bg, text, label } = config[status] || config.unpaid

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${bg} ${text}`}>
      {label}
    </span>
  )
}

type EmptyStateProps = {
  icon: React.ReactNode
  title: string
  description: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      {action}
    </div>
  )
}

type LoadingSpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className={`${sizes[size]} border-2 border-gray-200 border-t-cyan-600 rounded-full animate-spin`} />
  )
}
