import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Phone, MapPin, Clock, ShoppingBag, Check, Edit
} from 'lucide-react'
import { supabase, type Order } from '../lib/supabase'
import { Card, StatusBadge, PaymentBadge } from '../components/MobileUI'
import { ActionSheet, Modal, ConfirmDialog } from '../components/Modal'
import { Button } from '../components/FormUI'

export function OrderDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStatusSheet, setShowStatusSheet] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)

  const fetchOrder = useCallback(async () => {
    if (!id) return
    setLoading(true)
    const { data, error } = await supabase
      .from('orders')
      .select('*, customer:customers(*), service:services(*)')
      .eq('id', id)
      .maybeSingle()

    if (!error && data) {
      setOrder(data)
    }
    setLoading(false)
  }, [id])

  useEffect(() => {
    fetchOrder()
  }, [fetchOrder])

  const updateStatus = async (newStatus: string) => {
    if (!order) return
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id)

    if (!error) {
      fetchOrder()
    }
  }

  const updatePayment = async (newStatus: string) => {
    if (!order) return
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: newStatus })
      .eq('id', order.id)

    if (!error) {
      fetchOrder()
    }
  }

  const cancelOrder = async () => {
    if (!order) return
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    if (!error) {
      navigate('/orders')
    }
  }

  const statusOptions = [
    { value: 'pending', label: 'Menunggu', icon: Clock },
    { value: 'processing', label: 'Diproses', icon: ShoppingBag },
    { value: 'washing', label: 'Dicuci', icon: '💧' },
    { value: 'drying', label: 'Dikeringkan', icon: '🌬️' },
    { value: 'ironing', label: 'Disetrika', icon: '👔' },
    { value: 'ready', label: 'Siap Ambil', icon: Check },
    { value: 'delivered', label: 'Selesai', icon: '✅' },
  ]

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
        <p className="text-gray-600 mb-4">Pesanan tidak ditemukan</p>
        <Button onClick={() => navigate('/orders')}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-cyan-600 text-white">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-cyan-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-bold">{order.order_number}</h1>
              <p className="text-sm text-cyan-100">{formatDate(order.created_at)}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Status Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-600">Status Pesanan</span>
            <StatusBadge status={order.status} size="md" />
          </div>

          {/* Status Timeline */}
          <div className="flex items-center gap-1 mb-4">
            {['pending', 'processing', 'washing', 'ready', 'delivered'].map((s) => {
              const statusOrder = ['pending', 'processing', 'washing', 'drying', 'ironing', 'ready', 'delivered']
              const currentIndex = statusOrder.indexOf(order.status)
              const statusIndex = statusOrder.indexOf(s)
              const isActive = statusIndex <= currentIndex && order.status !== 'cancelled'
              const isCurrent = s === order.status

              return (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full ${
                    isCurrent ? 'bg-cyan-600' : isActive ? 'bg-cyan-300' : 'bg-gray-200'
                  }`}
                />
              )
            })}
          </div>

          <Button
            fullWidth
            onClick={() => setShowStatusSheet(true)}
            disabled={order.status === 'delivered' || order.status === 'cancelled'}
          >
            <Edit className="w-4 h-4" />
            Ubah Status
          </Button>
        </Card>

        {/* Customer Info */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Pelanggan</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
              {order.customer?.name?.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{order.customer?.name}</p>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Phone className="w-3 h-3" />
                <span>{order.customer?.phone}</span>
              </div>
              {order.customer?.address && (
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate">{order.customer.address}</span>
                </div>
              )}
            </div>
            <a
              href={`tel:${order.customer?.phone}`}
              className="p-3 bg-green-100 rounded-full text-green-600"
            >
              <Phone className="w-5 h-5" />
            </a>
          </div>
        </Card>

        {/* Service Info */}
        <Card className="p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Layanan</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Jenis</span>
              <span className="font-medium text-gray-900">{order.service?.name}</span>
            </div>
            {order.weight > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Berat</span>
                <span className="font-medium text-gray-900">{order.weight} kg</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Jumlah</span>
              <span className="font-medium text-gray-900">{order.quantity} item</span>
            </div>
            {order.notes && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-sm text-gray-600">Catatan: {order.notes}</p>
              </div>
            )}
          </div>
        </Card>

        {/* Payment */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Pembayaran</h3>
            <PaymentBadge status={order.payment_status} />
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-gray-900">{formatPrice(order.subtotal)}</span>
            </div>
            {order.delivery_fee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Biaya Antar</span>
                <span className="text-gray-900">{formatPrice(order.delivery_fee)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Diskon</span>
                <span className="text-red-600">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-gray-100">
              <span className="font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-cyan-600">{formatPrice(order.total)}</span>
            </div>
          </div>

          {order.payment_status !== 'paid' && order.status !== 'cancelled' && (
            <Button
              fullWidth
              variant="secondary"
              onClick={() => setShowPaymentModal(true)}
            >
              Tandai Sudah Bayar
            </Button>
          )}
        </Card>

        {/* Cancel button */}
        {order.status === 'pending' && (
          <Button
            fullWidth
            variant="danger"
            onClick={() => setShowCancelConfirm(true)}
          >
            Batalkan Pesanan
          </Button>
        )}
      </div>

      {/* Status Sheet */}
      <ActionSheet
        isOpen={showStatusSheet}
        onClose={() => setShowStatusSheet(false)}
        title="Ubah Status"
      >
        <div className="px-4 space-y-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                updateStatus(opt.value)
                setShowStatusSheet(false)
              }}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                order.status === opt.value
                  ? 'bg-cyan-50 border-2 border-cyan-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              {typeof opt.icon === 'string' ? (
                <span className="text-xl">{opt.icon}</span>
              ) : (
                <opt.icon className="w-5 h-5 text-gray-700" />
              )}
              <span className={`flex-1 text-left ${order.status === opt.value ? 'font-medium text-cyan-700' : ''}`}>
                {opt.label}
              </span>
              {order.status === opt.value && (
                <Check className="w-5 h-5 text-cyan-600" />
              )}
            </button>
          ))}
        </div>
      </ActionSheet>

      {/* Payment Modal */}
      <Modal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Konfirmasi Pembayaran"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Tandai pesanan <strong>{order.order_number}</strong> sudah dibayar sebesar{' '}
            <strong className="text-cyan-600">{formatPrice(order.total)}</strong>?
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowPaymentModal(false)}
            >
              Batal
            </Button>
            <Button
              fullWidth
              onClick={() => {
                updatePayment('paid')
                setShowPaymentModal(false)
              }}
            >
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={cancelOrder}
        title="Batalkan Pesanan"
        message={`Apakah Anda yakin ingin membatalkan pesanan ${order.order_number}?`}
        confirmText="Ya, Batalkan"
        variant="danger"
      />
    </div>
  )
}
