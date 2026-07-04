import { useState, useEffect, useCallback } from 'react'
import {
  Plus, Edit, Trash2, Sparkles, Clock, Scale
} from 'lucide-react'
import { supabase, type Service } from '../lib/supabase'
import { Modal, ConfirmDialog } from '../components/Modal'
import { Input, TextArea, Select, Button } from '../components/FormUI'
import { Card, EmptyState } from '../components/MobileUI'
import { MobileHeader } from '../components/MobileUI'

export function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<Service | null>(null)

  const [form, setForm] = useState({
    name: '',
    description: '',
    base_price: '',
    unit: 'kg',
    estimated_hours: '24',
    is_active: true,
  })

  const fetchServices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .order('base_price', { ascending: true })

    if (!error && data) {
      setServices(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  const openModal = (service?: Service) => {
    if (service) {
      setEditingService(service)
      setForm({
        name: service.name,
        description: service.description || '',
        base_price: String(service.base_price),
        unit: service.unit,
        estimated_hours: String(service.estimated_hours),
        is_active: service.is_active,
      })
    } else {
      setEditingService(null)
      setForm({
        name: '',
        description: '',
        base_price: '',
        unit: 'kg',
        estimated_hours: '24',
        is_active: true,
      })
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.base_price) return

    setSaving(true)
    try {
      const data = {
        name: form.name,
        description: form.description || null,
        base_price: parseFloat(form.base_price),
        unit: form.unit,
        estimated_hours: parseInt(form.estimated_hours) || 24,
        is_active: form.is_active,
      }

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', editingService.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('services').insert(data)
        if (error) throw error
      }

      setIsModalOpen(false)
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Gagal menyimpan layanan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (service: Service) => {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', service.id)

    if (!error) {
      fetchServices()
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price)
  }

  const unitLabels: Record<string, string> = {
    kg: 'Per Kilogram',
    piece: 'Per Item',
    pair: 'Per Pasang',
    set: 'Per Set',
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <MobileHeader
        title="Layanan"
        subtitle={`${services.filter(s => s.is_active).length} layanan aktif`}
      />

      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600" />
          </div>
        ) : services.length === 0 ? (
          <EmptyState
            icon={<Sparkles className="w-8 h-8 text-gray-400" />}
            title="Belum ada layanan"
            description="Tambahkan layanan laundry yang tersedia"
            action={
              <Button onClick={() => openModal()}>
                <Plus className="w-4 h-4" />
                Tambah Layanan
              </Button>
            }
          />
        ) : (
          services.map((service) => (
            <Card key={service.id} className="overflow-hidden">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900">{service.name}</h3>
                      {!service.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          Nonaktif
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-sm text-gray-500 mb-2">{service.description}</p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Scale className="w-4 h-4 text-gray-400" />
                        <span>{unitLabels[service.unit] || service.unit}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{service.estimated_hours} jam</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <p className="text-lg font-bold text-cyan-600">{formatPrice(service.base_price)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      openModal(service)
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-cyan-600 bg-cyan-50 rounded-lg hover:bg-cyan-100"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeleteConfirm(service)
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                    Hapus
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add button fixed */}
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
        title={editingService ? 'Edit Layanan' : 'Tambah Layanan'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Nama Layanan *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Contoh: Cuci Setrika"
          />
          <TextArea
            id="description"
            label="Deskripsi"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Deskripsi singkat layanan..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="base_price"
              label="Harga Dasar (Rp) *"
              type="number"
              value={form.base_price}
              onChange={(e) => setForm({ ...form, base_price: e.target.value })}
              placeholder="10000"
            />
            <Select
              id="unit"
              label="Satuan"
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
              options={[
                { value: 'kg', label: 'Per Kilogram' },
                { value: 'piece', label: 'Per Item' },
                { value: 'pair', label: 'Per Pasang' },
                { value: 'set', label: 'Per Set' },
              ]}
            />
          </div>
          <Input
            id="estimated_hours"
            label="Estimasi Selesai (Jam)"
            type="number"
            value={form.estimated_hours}
            onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })}
            placeholder="24"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-cyan-600"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Layanan aktif
            </label>
          </div>
          <div className="flex gap-3 pt-4">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button fullWidth onClick={handleSave} loading={saving}>
              {editingService ? 'Simpan' : 'Tambah'}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Hapus Layanan"
        message={`Apakah Anda yakin ingin menghapus layanan "${deleteConfirm?.name}"?`}
        confirmText="Hapus"
        variant="danger"
      />
    </div>
  )
}
