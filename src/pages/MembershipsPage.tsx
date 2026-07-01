import { useState, useEffect, useCallback } from 'react'
import { CreditCard, Plus, Edit, Trash2, Search, Check } from 'lucide-react'
import { supabase, type Membership } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input, TextArea } from '../components/FormInput'
import { StatsCard } from '../components/StatsCard'

type MembershipForm = {
  name: string
  description: string
  price_monthly: string
  duration_months: string
  features: string
  is_active: boolean
}

const initialForm: MembershipForm = {
  name: '',
  description: '',
  price_monthly: '0',
  duration_months: '1',
  features: '',
  is_active: true,
}

export function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMembership, setEditingMembership] = useState<Membership | null>(null)
  const [form, setForm] = useState<MembershipForm>(initialForm)
  const [saving, setSaving] = useState(false)

  const fetchMemberships = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .order('price_monthly', { ascending: true })

    if (!error && data) {
      setMemberships(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMemberships()
  }, [fetchMemberships])

  const filteredMemberships = memberships.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = memberships.filter(m => m.is_active).length

  const openModal = (membership?: Membership) => {
    if (membership) {
      setEditingMembership(membership)
      setForm({
        name: membership.name,
        description: membership.description || '',
        price_monthly: String(membership.price_monthly),
        duration_months: String(membership.duration_months),
        features: Array.isArray(membership.features) ? (membership.features as string[]).join('\n') : '',
        is_active: membership.is_active,
      })
    } else {
      setEditingMembership(null)
      setForm(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return

    setSaving(true)
    try {
      const featuresArray = form.features
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0)

      const membershipData = {
        name: form.name,
        description: form.description || null,
        price_monthly: parseFloat(form.price_monthly) || 0,
        duration_months: parseInt(form.duration_months) || 1,
        features: featuresArray,
        is_active: form.is_active,
      }

      if (editingMembership) {
        const { error } = await supabase
          .from('memberships')
          .update(membershipData)
          .eq('id', editingMembership.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('memberships').insert(membershipData)
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchMemberships()
    } catch (error) {
      console.error('Error saving membership:', error)
      alert('Failed to save membership')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (membership: Membership) => {
    if (!confirm(`Delete ${membership.name}?`)) return

    const { error } = await supabase.from('memberships').delete().eq('id', membership.id)
    if (!error) fetchMemberships()
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Plans"
          value={memberships.length}
          icon={<CreditCard className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Active Plans"
          value={activeCount}
          icon={<CreditCard className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Avg Price/Month"
          value={`$${memberships.length ? Math.round(memberships.reduce((sum, m) => sum + Number(m.price_monthly), 0) / memberships.length) : 0}`}
          icon={<CreditCard className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <h2 className="text-lg font-semibold text-gray-900">Membership Plans</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4" />
            Add Plan
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMemberships.map((membership) => (
            <div
              key={membership.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-shadow hover:shadow-md ${
                membership.is_active ? 'border-gray-100' : 'border-gray-200 opacity-60'
              }`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{membership.name}</h3>
                    <p className="text-sm text-gray-500 mt-1">{membership.description}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      membership.is_active
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {membership.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ${Number(membership.price_monthly).toFixed(0)}
                  </span>
                  <span className="text-gray-500">/month</span>
                  <p className="text-sm text-gray-500 mt-1">
                    {membership.duration_months} month{membership.duration_months > 1 ? 's' : ''} duration
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {Array.isArray(membership.features) && (membership.features as string[]).map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => openModal(membership)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(membership)}
                    className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 inline mr-1" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && filteredMemberships.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
          <p>No membership plans found</p>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMembership ? 'Edit Membership Plan' : 'Add New Membership Plan'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Plan Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Premium"
          />
          <TextArea
            id="description"
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="price"
              label="Monthly Price ($)"
              type="number"
              min="0"
              step="0.01"
              value={form.price_monthly}
              onChange={(e) => setForm({ ...form, price_monthly: e.target.value })}
            />
            <Input
              id="duration"
              label="Duration (Months)"
              type="number"
              min="1"
              value={form.duration_months}
              onChange={(e) => setForm({ ...form, duration_months: e.target.value })}
            />
          </div>
          <TextArea
            id="features"
            label="Features (one per line)"
            rows={4}
            value={form.features}
            onChange={(e) => setForm({ ...form, features: e.target.value })}
            placeholder="Unlimited gym access&#10;Personal trainer sessions&#10;Locker access"
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active_plan"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_active_plan" className="text-sm text-gray-700">
              Plan is active and available for purchase
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingMembership ? 'Update' : 'Add'} Plan
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
