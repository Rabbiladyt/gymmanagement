import { useState, useEffect, useCallback } from 'react'
import { Dumbbell, Plus, Edit, Trash2, Search, Mail, Phone, Award } from 'lucide-react'
import { supabase, type Trainer } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/FormInput'
import { Table } from '../components/Table'
import { StatsCard } from '../components/StatsCard'

type TrainerForm = {
  name: string
  email: string
  phone: string
  specialty: string
  experience_years: string
  bio: string
  status: string
}

const initialForm: TrainerForm = {
  name: '',
  email: '',
  phone: '',
  specialty: '',
  experience_years: '0',
  bio: '',
  status: 'active',
}

const specialties = [
  'Weight Training',
  'CrossFit',
  'Yoga',
  'Pilates',
  'Cardio',
  'Martial Arts',
  'Swimming',
  'Personal Training',
]

export function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null)
  const [form, setForm] = useState<TrainerForm>(initialForm)
  const [saving, setSaving] = useState(false)

  const fetchTrainers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('trainers')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTrainers(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrainers()
  }, [fetchTrainers])

  const filteredTrainers = trainers.filter(
    t =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.specialty?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = trainers.filter(t => t.status === 'active').length

  const openModal = (trainer?: Trainer) => {
    if (trainer) {
      setEditingTrainer(trainer)
      setForm({
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone || '',
        specialty: trainer.specialty || '',
        experience_years: String(trainer.experience_years),
        bio: trainer.bio || '',
        status: trainer.status,
      })
    } else {
      setEditingTrainer(null)
      setForm(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return

    setSaving(true)
    try {
      if (editingTrainer) {
        const { error } = await supabase
          .from('trainers')
          .update({
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            specialty: form.specialty || null,
            experience_years: parseInt(form.experience_years) || 0,
            bio: form.bio || null,
            status: form.status as 'active' | 'inactive',
          })
          .eq('id', editingTrainer.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('trainers').insert({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          specialty: form.specialty || null,
          experience_years: parseInt(form.experience_years) || 0,
          bio: form.bio || null,
          status: form.status as 'active' | 'inactive',
        })
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchTrainers()
    } catch (error) {
      console.error('Error saving trainer:', error)
      alert('Failed to save trainer')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (trainer: Trainer) => {
    if (!confirm(`Delete ${trainer.name}?`)) return

    const { error } = await supabase.from('trainers').delete().eq('id', trainer.id)
    if (!error) fetchTrainers()
  }

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'contact',
      header: 'Contact',
      render: (t: Trainer) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-600">
            <Mail className="w-3 h-3" />
            <span>{t.email}</span>
          </div>
          {t.phone && (
            <div className="flex items-center gap-1 text-gray-500">
              <Phone className="w-3 h-3" />
              <span>{t.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'specialty',
      header: 'Specialty',
      render: (t: Trainer) => (
        <span className="flex items-center gap-1">
          <Award className="w-4 h-4 text-amber-500" />
          {t.specialty || '-'}
        </span>
      ),
    },
    {
      key: 'experience',
      header: 'Experience',
      render: (t: Trainer) => <span>{t.experience_years} years</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t: Trainer) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            t.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {t.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (t: Trainer) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openModal(t)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(t)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Trainers"
          value={trainers.length}
          icon={<Dumbbell className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Active Trainers"
          value={activeCount}
          icon={<Dumbbell className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Avg Experience"
          value={trainers.length ? Math.round(trainers.reduce((sum, t) => sum + t.experience_years, 0) / trainers.length) : 0}
          subtitle="years"
          icon={<Award className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Trainers</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trainers..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Trainer
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredTrainers}
          loading={loading}
          emptyMessage="No trainers found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTrainer ? 'Edit Trainer' : 'Add New Trainer'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Full Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Smith"
          />
          <Input
            id="email"
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@gym.com"
          />
          <Input
            id="phone"
            label="Phone Number"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1 234 567 8900"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="specialty"
              label="Specialty"
              value={form.specialty}
              onChange={(e) => setForm({ ...form, specialty: e.target.value })}
              options={[{ value: '', label: 'Select specialty' }, ...specialties.map(s => ({ value: s, label: s }))]}
            />
            <Input
              id="experience"
              label="Experience (Years)"
              type="number"
              min="0"
              value={form.experience_years}
              onChange={(e) => setForm({ ...form, experience_years: e.target.value })}
            />
          </div>
          <TextArea
            id="bio"
            label="Bio"
            rows={3}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder="Brief description about the trainer..."
          />
          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingTrainer ? 'Update' : 'Add'} Trainer
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
