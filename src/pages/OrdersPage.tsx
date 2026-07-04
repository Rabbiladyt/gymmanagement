import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Filter, ShoppingBag, Phone, User
} from 'lucide-react'
import { supabase, type Order } from '../lib/supabase'
import { Card, StatusBadge, PaymentBadge, FloatingActionButton, EmptyState } from '../components/MobileUI'
import { MobileHeader } from '../components/MobileUI'
import { ActionSheet } from '../components/Modal'
import { Button } from '../components/FormUI'

export function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const [showFilter, setShowFilter] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('orders')
      .select('*, customer:customers(*), service:services(*)')
      .order('created_at', { ascending: false })

    if (filterStatus) {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (!error && data) {
      setOrders(data)
    }
    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const filteredOrders = orders.filter(
    o =>
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer?.phone?.includes(searchQuery)
  )

  const statusOptions = [
    { value: '', label: 'Semua Status' },
    { value: 'pending', label: 'Menunggu' },
    { value: 'processing', label: 'Diproses' },
    { value: 'washing', label: 'Dicuci' },
    { value: 'ready', label: 'Siap Ambil' },
    { value: 'delivered', label: 'Selesai' },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Hari ini, ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Kemarin, ' + date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Pesanan"
        subtitle={`${filteredOrders.length} pesanan`}
        rightAction={
          <button
            onClick={() => setShowFilter(true)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        }
      />

      {/* Search */}
      <div className="px-4 py-3 sticky top-[57px] bg-gray-50 z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nomor order atau pelanggan..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
          </div>
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8 text-gray-400" />}
            title="Belum ada pesanan"
            description="Pesanan akan muncul di sini setelah pelanggan melakukan order"
            action={
              <Button onClick={() => navigate('/orders/new')}>
                <Plus className="w-4 h-4" />
                Buat Order Baru
              </Button>
            }
          />
        ) : (
          filteredOrders.map((order) => (
            <Card
              key={order.id}
              className="overflow-hidden"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{order.order_number}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <StatusBadge status={order.status} />
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-700">{order.customer?.name}</span>
                  <Phone className="w-4 h-4 text-gray-400 ml-2" />
                  <span className="text-sm text-gray-500">{order.customer?.phone}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                  <ShoppingBag className="w-4 h-4 text-gray-400" />
                  <span>{order.service?.name}</span>
                  {order.weight > 0 && <span>• {order.weight} kg</span>}
                  <span>• {order.quantity} item</span>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    <PaymentBadge status={order.payment_status} />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-gray-900">{formatPrice(order.total)}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <FloatingActionButton
        onClick={() => navigate('/orders/new')}
        icon={<Plus className="w-5 h-5" />}
      />

      {/* Filter Sheet */}
      <ActionSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter Pesanan"
      >
        <div className="px-4 space-y-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setFilterStatus(opt.value || null)
                setShowFilter(false)
              }}
              className={`w-full p-3 text-left rounded-xl transition-colors ${
                (filterStatus || '') === opt.value
                  ? 'bg-cyan-50 text-cyan-700'
                  : 'hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </ActionSheet>
    </div>
  )
}
