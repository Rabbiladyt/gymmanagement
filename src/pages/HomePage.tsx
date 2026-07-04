import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Users, TrendingUp,
  ChevronRight, Clock, AlertCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Card, StatusBadge } from '../components/MobileUI'
import { MobileHeader } from '../components/MobileUI'

type Stats = {
  todayOrders: number
  pendingOrders: number
  totalCustomers: number
  todayRevenue: number
}

type RecentOrder = {
  id: string
  order_number: string
  status: string
  total: number
  customer: { name: string }[] | null
  created_at: string
}

export function HomePage() {
  const navigate = useNavigate()
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    pendingOrders: 0,
    totalCustomers: 0,
    todayRevenue: 0,
  })
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    try {
      const [ordersRes, pendingRes, customersRes, todayRes, recentRes] = await Promise.all([
        supabase.from('orders').select('id').gte('created_at', today),
        supabase.from('orders').select('id').eq('status', 'pending'),
        supabase.from('customers').select('id'),
        supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', today),
        supabase
          .from('orders')
          .select('id, order_number, status, total, created_at, customer:customers(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setStats({
        todayOrders: ordersRes.data?.length || 0,
        pendingOrders: pendingRes.data?.length || 0,
        totalCustomers: customersRes.data?.length || 0,
        todayRevenue: todayRes.data?.reduce((sum, o) => sum + Number(o.total), 0) || 0,
      })

      setRecentOrders(recentRes.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const quickStats = [
    { label: 'Order Hari Ini', value: stats.todayOrders, icon: ShoppingBag, color: 'bg-cyan-100 text-cyan-600' },
    { label: 'Menunggu Proses', value: stats.pendingOrders, icon: Clock, color: 'bg-amber-100 text-amber-600' },
    { label: 'Total Pelanggan', value: stats.totalCustomers, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'Pendapatan Hari Ini', value: `Rp ${stats.todayRevenue.toLocaleString('id')}`, icon: TrendingUp, color: 'bg-green-100 text-green-600' },
  ]

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="LaundryKu"
        subtitle="Selamat datang kembali"
      />

      <div className="px-4 py-4 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3">
          {quickStats.map((stat, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Aksi Cepat</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/orders/new')}
              className="flex flex-col items-center gap-2 p-4 bg-cyan-50 rounded-xl hover:bg-cyan-100 active:bg-cyan-200"
            >
              <ShoppingBag className="w-6 h-6 text-cyan-600" />
              <span className="text-sm font-medium text-cyan-700">Order Baru</span>
            </button>
            <button
              onClick={() => navigate('/customers/new')}
              className="flex flex-col items-center gap-2 p-4 bg-purple-50 rounded-xl hover:bg-purple-100 active:bg-purple-200"
            >
              <Users className="w-6 h-6 text-purple-600" />
              <span className="text-sm font-medium text-purple-700">Pelanggan Baru</span>
            </button>
          </div>
        </Card>

        {/* Recent Orders */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Pesanan Terbaru</h3>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-cyan-600 font-medium flex items-center gap-1"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-600" />
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-gray-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Belum ada pesanan</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {recentOrders.map((order) => (
                <button
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 active:bg-gray-100"
                >
                  <div className="text-left">
                    <p className="font-medium text-gray-900">{order.order_number}</p>
                    <p className="text-sm text-gray-500">{order.customer?.[0]?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-sm text-gray-500 mt-1">
                      Rp {Number(order.total).toLocaleString('id')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Status Legend */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Panduan Status</h3>
          <div className="space-y-2">
            {[
              { status: 'pending', desc: 'Menunggu diambil/diproses' },
              { status: 'processing', desc: 'Sedang dalam antrian' },
              { status: 'washing', desc: 'Sedang dicuci' },
              { status: 'ready', desc: 'Siap diambil/antar' },
              { status: 'delivered', desc: 'Selesai' },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <span className="text-sm text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
