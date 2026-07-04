import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, User, ShoppingBag, Scale, Calculator, Tag, Clock
} from 'lucide-react'
import { supabase, type Customer, type Service } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Input, TextArea, Select, Button } from '../components/FormUI'
import { Card } from '../components/MobileUI'

export function NewOrderPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const preselectedCustomerId = searchParams.get('customer')

  const [step, setStep] = useState(1)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    customer_id: preselectedCustomerId || '',
    service_id: '',
    weight: '',
    quantity: '1',
    subtotal: 0,
    delivery_fee: '0',
    discount: '0',
    promo_code: '',
    notes: '',
  })

  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    address: '',
  })

  useEffect(() => {
    const fetchData = async () => {
      const [customersRes, servicesRes] = await Promise.all([
        supabase.from('customers').select('*').order('name'),
        supabase.from('services').select('*').eq('is_active', true).order('name'),
      ])

      if (customersRes.data) setCustomers(customersRes.data)
      if (servicesRes.data) {
        setServices(servicesRes.data)
        if (servicesRes.data.length > 0) {
          setForm(prev => ({ ...prev, service_id: servicesRes.data[0].id }))
        }
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  useEffect(() => {
    const service = services.find(s => s.id === form.service_id)
    if (service) {
      let subtotal = 0
      if (service.unit === 'kg') {
        subtotal = Number(form.weight || 0) * service.base_price
      } else {
        subtotal = Number(form.quantity || 1) * service.base_price
      }
      setForm(prev => ({ ...prev, subtotal }))
    }
  }, [form.service_id, form.weight, form.quantity, services])

  const total = form.subtotal + Number(form.delivery_fee || 0) - Number(form.discount || 0)

  const handleCreateOrder = async () => {
    if (!form.customer_id || !form.service_id) return

    setSaving(true)
    try {
      // Generate order number
      const { data: orderNumber } = await supabase.rpc('generate_order_number')

      const orderData = {
        order_number: orderNumber,
        customer_id: form.customer_id,
        service_id: form.service_id,
        weight: Number(form.weight || 0),
        quantity: Number(form.quantity || 1),
        subtotal: form.subtotal,
        delivery_fee: Number(form.delivery_fee || 0),
        discount: Number(form.discount || 0),
        total: total,
        notes: form.notes || null,
        status: 'pending' as const,
        payment_status: 'unpaid' as const,
        pickup_date: new Date().toISOString().split('T')[0],
      }

      const { error } = await supabase.from('orders').insert(orderData)

      if (error) throw error

      // Update customer stats
      const customer = customers.find(c => c.id === form.customer_id)
      if (customer) {
        await supabase
          .from('customers')
          .update({
            total_orders: customer.total_orders + 1,
            total_spent: customer.total_spent + total,
          })
          .eq('id', form.customer_id)
      }

      navigate('/orders')
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Gagal membuat pesanan')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.phone) return

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert({
          name: newCustomer.name,
          phone: newCustomer.phone,
          address: newCustomer.address || null,
        })
        .select()

      if (error) throw error

      if (data && data[0]) {
        setCustomers(prev => [data[0], ...prev])
        setForm(prev => ({ ...prev, customer_id: data[0].id }))
        setShowNewCustomer(false)
        setNewCustomer({ name: '', phone: '', address: '' })
      }
    } catch (error: any) {
      if (error.code === '23505') {
        alert('Nomor telepon sudah terdaftar')
      } else {
        alert('Gagal menambah pelanggan')
      }
    }
  }

  const selectedService = services.find(s => s.id === form.service_id)
  const selectedCustomer = customers.find(c => c.id === form.customer_id)

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">Pesanan Baru</h1>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
        </div>
      ) : (
        <div className="px-4 py-4 space-y-4">
          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= s
                    ? 'bg-cyan-600 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>

          {/* Step 1: Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Pilih Pelanggan</h2>

              <Select
                id="customer"
                label="Pelanggan"
                value={form.customer_id}
                onChange={(e) => setForm({ ...form, customer_id: e.target.value })}
                options={[
                  { value: '', label: 'Pilih pelanggan' },
                  ...customers.map((c) => ({ value: c.id, label: `${c.name} (${c.phone})` })),
                ]}
              />

              {selectedCustomer && (
                <Card className="p-4 bg-cyan-50 border-cyan-200">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{selectedCustomer.name}</p>
                      <p className="text-sm text-gray-600">{selectedCustomer.phone}</p>
                    </div>
                  </div>
                </Card>
              )}

              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowNewCustomer(true)}
              >
                <User className="w-4 h-4" />
                Tambah Pelanggan Baru
              </Button>

              <Button
                fullWidth
                disabled={!form.customer_id}
                onClick={() => setStep(2)}
              >
                Lanjut
              </Button>
            </div>
          )}

          {/* Step 2: Select Service & Details */}
          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Detail Layanan</h2>

              <Select
                id="service"
                label="Layanan"
                value={form.service_id}
                onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                options={services.map((s) => ({
                  value: s.id,
                  label: `${s.name} - ${formatPrice(s.base_price)}/${s.unit}`,
                }))}
              />

              {selectedService && (
                <>
                  {selectedService.unit === 'kg' ? (
                    <Input
                      id="weight"
                      label="Berat (kg)"
                      type="number"
                      step="0.1"
                      min="0"
                      value={form.weight}
                      onChange={(e) => setForm({ ...form, weight: e.target.value })}
                      leftIcon={<Scale className="w-4 h-4" />}
                    />
                  ) : (
                    <Input
                      id="quantity"
                      label="Jumlah Item"
                      type="number"
                      min="1"
                      value={form.quantity}
                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                      leftIcon={<ShoppingBag className="w-4 h-4" />}
                    />
                  )}

                  <Card className="p-4 bg-gray-100">
                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                      <Clock className="w-4 h-4" />
                      Estimasi selesai: {selectedService.estimated_hours} jam
                    </div>
                    <p className="text-xs text-gray-500">
                      Layanan: {selectedService.description || selectedService.name}
                    </p>
                  </Card>
                </>
              )}

              <TextArea
                id="notes"
                label="Catatan"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Catatan tambahan untuk pesanan ini..."
              />

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setStep(1)}
                >
                  Kembali
                </Button>
                <Button
                  fullWidth
                  disabled={!form.service_id}
                  onClick={() => setStep(3)}
                >
                  Lanjut
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Summary & Payment */}
          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Ringkasan</h2>

              <Card className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Pelanggan</span>
                  <span className="font-medium text-gray-900">{selectedCustomer?.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Layanan</span>
                  <span className="font-medium text-gray-900">{selectedService?.name}</span>
                </div>
                {selectedService?.unit === 'kg' && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Berat</span>
                    <span className="font-medium text-gray-900">{form.weight} kg</span>
                  </div>
                )}
              </Card>

              <Input
                id="delivery_fee"
                label="Biaya Antar/Jemput (Rp)"
                type="number"
                value={form.delivery_fee}
                onChange={(e) => setForm({ ...form, delivery_fee: e.target.value })}
                leftIcon={<Calculator className="w-4 h-4" />}
              />

              <Input
                id="discount"
                label="Diskon (Rp)"
                type="number"
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                leftIcon={<Tag className="w-4 h-4" />}
              />

              <Card className="p-4 bg-cyan-50 border-cyan-200">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">{formatPrice(form.subtotal)}</span>
                  </div>
                  {Number(form.delivery_fee) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Biaya Antar</span>
                      <span className="text-gray-900">{formatPrice(Number(form.delivery_fee))}</span>
                    </div>
                  )}
                  {Number(form.discount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Diskon</span>
                      <span className="text-red-600">-{formatPrice(Number(form.discount))}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-cyan-200">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-cyan-600">{formatPrice(total)}</span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  fullWidth
                  onClick={() => setStep(2)}
                >
                  Kembali
                </Button>
                <Button
                  fullWidth
                  onClick={handleCreateOrder}
                  loading={saving}
                >
                  Buat Pesanan
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* New Customer Modal */}
      <Modal
        isOpen={showNewCustomer}
        onClose={() => setShowNewCustomer(false)}
        title="Tambah Pelanggan Baru"
      >
        <div className="space-y-4">
          <Input
            id="cust_name"
            label="Nama *"
            value={newCustomer.name}
            onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
            placeholder="Nama pelanggan"
          />
          <Input
            id="cust_phone"
            label="Nomor Telepon *"
            type="tel"
            value={newCustomer.phone}
            onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
            placeholder="08xxxxxxxxxx"
          />
          <Input
            id="cust_address"
            label="Alamat"
            value={newCustomer.address}
            onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
            placeholder="Alamat"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowNewCustomer(false)}
            >
              Batal
            </Button>
            <Button
              fullWidth
              onClick={handleCreateCustomer}
              disabled={!newCustomer.name || !newCustomer.phone}
            >
              Tambah
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
