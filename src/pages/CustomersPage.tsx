import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus, Search, Users, Phone, Edit, Trash2, MapPin,
  ShoppingBag, TrendingUp
} from 'lucide-react'
import { supabase, type Customer } from '../lib/supabase'
import { Modal, ConfirmDialog } from '../components/Modal'
import { Input, TextArea, Button } from '../components/FormUI'
import { Card, EmptyState } from '../components/MobileUI'
import { MobileHeader } from '../components/MobileUI'

export function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Customer | null>(null)

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCustomers(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  const filteredCustomers = customers.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery)
  )

  const openModal = (customer?: Customer) => {
    if (customer) {
      setEditingCustomer(customer)
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        notes: customer.notes || '',
      })
    } else {
      setEditingCustomer(null)
      setForm({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.phone) return

    setSaving(true)
    try {
      const data = {
        name: form.name,
        phone: form.phone,
        email: form.email || null,
        address: form.address || null,
        notes: form.notes || null,
      }

      if (editingCustomer) {
        const { error } = await supabase
          .from('customers')
          .update(data)
          .eq('id', editingCustomer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('customers').insert(data)
        if (error) throw error
      }

      setIsModalOpen(false)
      fetchCustomers()
    } catch (error: any) {
      console.error('Error saving customer:', error)
      if (error.code === '23505') {
        alert('Nomor telepon sudah terdaftar')
      } else {
        alert('Gagal menyimpan data pelanggan')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (customer: Customer) => {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', customer.id)

    if (!error) {
      fetchCustomers()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Pelanggan"
        subtitle={`${customers.length} pelanggan`}
      />

      {/* Search */}
      <div className="px-4 py-3 sticky top-[57px] bg-gray-50 z-30">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama atau nomor telepon..."
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Customer List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
          </div>
        ) : filteredCustomers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-gray-400" />}
            title="Belum ada pelanggan"
            description="Daftarkan pelanggan baru untuk mulai menerima pesanan"
            action={
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4" />
                Tambah Pelanggan
              </Button>
            }
          />
        ) : (
          filteredCustomers.map((customer) => (
            <Card
              key={customer.id}
              className="overflow-hidden"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-lg">
                      {customer.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{customer.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.address && (
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{customer.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <ShoppingBag className="w-4 h-4 text-gray-400" />
                    <span>{customer.total_orders} order</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4 text-gray-400" />
                    <span>{formatPrice(customer.total_spent)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/orders/new?customer=${customer.id}`)
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Order
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal(customer)
                    }}
                    className="p-2 text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(customer)
                    }}
                    className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => openModal()}
        className="fixed bottom-20 right-4 w-14 h-14 bg-cyan-600 text-white rounded-full shadow-lg flex items-center justify-center hover:bg-cyan-700 active:scale-95 transition-all z-40"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Nama Lengkap *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Masukkan nama pelanggan"
          />
          <Input
            id="phone"
            label="Nomor Telepon *"
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="08xxxxxxxxxx"
            leftIcon={<Phone className="w-4 h-4" />}
          />
          <Input
            id="email"
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="email@example.com"
          />
          <TextArea
            id="address"
            label="Alamat"
            rows={2}
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            placeholder="Alamat lengkap..."
          />
          <TextArea
            id="notes"
            label="Catatan"
            rows={2}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="Catatan tambahan..."
          />
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button fullWidth onClick={handleSave} loading={saving}>
              {editingCustomer ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Hapus Pelanggan"
        message={`Apakah Anda yakin ingin menghapus "${deleteConfirm?.name}"? Semua pesanan terkait juga akan dihapus.`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  )
}
