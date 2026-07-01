import { useState, useEffect, useCallback } from 'react'
import { Calendar, Plus, Edit, Trash2, Search, Clock, User } from 'lucide-react'
import { supabase, type GymClass, type Trainer } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input, Select, TextArea } from '../components/FormInput'
import { Table } from '../components/Table'
import { StatsCard } from '../components/StatsCard'

type ClassForm = {
  name: string
  description: string
  duration_minutes: string
  difficulty_level: string
  max_capacity: string
  trainer_id: string
  is_active: boolean
}

const initialForm: ClassForm = {
  name: '',
  description: '',
  duration_minutes: '60',
  difficulty_level: 'beginner',
  max_capacity: '20',
  trainer_id: '',
  is_active: true,
}

export function ClassesPage() {
  const [classes, setClasses] = useState<GymClass[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClass, setEditingClass] = useState<GymClass | null>(null)
  const [form, setForm] = useState<ClassForm>(initialForm)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [classesRes, trainersRes] = await Promise.all([
      supabase.from('gym_classes').select('*, trainer:trainers(*)').order('created_at', { ascending: false }),
      supabase.from('trainers').select('*').eq('status', 'active'),
    ])

    if (classesRes.data) setClasses(classesRes.data)
    if (trainersRes.data) setTrainers(trainersRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredClasses = classes.filter(
    c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = classes.filter(c => c.is_active).length

  const openModal = (gymClass?: GymClass) => {
    if (gymClass) {
      setEditingClass(gymClass)
      setForm({
        name: gymClass.name,
        description: gymClass.description || '',
        duration_minutes: String(gymClass.duration_minutes),
        difficulty_level: gymClass.difficulty_level || 'beginner',
        max_capacity: String(gymClass.max_capacity),
        trainer_id: gymClass.trainer_id || '',
        is_active: gymClass.is_active,
      })
    } else {
      setEditingClass(null)
      setForm(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name) return

    setSaving(true)
    try {
      const classData = {
        name: form.name,
        description: form.description || null,
        duration_minutes: parseInt(form.duration_minutes) || 60,
        difficulty_level: form.difficulty_level as 'beginner' | 'intermediate' | 'advanced',
        max_capacity: parseInt(form.max_capacity) || 20,
        trainer_id: form.trainer_id || null,
        is_active: form.is_active,
      }

      if (editingClass) {
        const { error } = await supabase
          .from('gym_classes')
          .update(classData)
          .eq('id', editingClass.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('gym_classes').insert(classData)
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving class:', error)
      alert('Failed to save class')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (gymClass: GymClass) => {
    if (!confirm(`Delete ${gymClass.name}?`)) return

    const { error } = await supabase.from('gym_classes').delete().eq('id', gymClass.id)
    if (!error) fetchData()
  }

  const difficultyColors = {
    beginner: 'bg-green-100 text-green-700',
    intermediate: 'bg-yellow-100 text-yellow-700',
    advanced: 'bg-red-100 text-red-700',
  }

  const columns = [
    { key: 'name', header: 'Class Name' },
    {
      key: 'trainer',
      header: 'Trainer',
      render: (c: GymClass) => (
        <span className="flex items-center gap-1">
          <User className="w-4 h-4 text-gray-400" />
          {c.trainer?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      key: 'duration',
      header: 'Duration',
      render: (c: GymClass) => (
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          {c.duration_minutes} min
        </span>
      ),
    },
    {
      key: 'difficulty',
      header: 'Difficulty',
      render: (c: GymClass) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[c.difficulty_level || 'beginner']}`}>
          {c.difficulty_level || 'beginner'}
        </span>
      ),
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (c: GymClass) => <span>{c.max_capacity} ppl</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (c: GymClass) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
          }`}
        >
          {c.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (c: GymClass) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openModal(c)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(c)
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
          title="Total Classes"
          value={classes.length}
          icon={<Calendar className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Active Classes"
          value={activeCount}
          icon={<Calendar className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Trainers Available"
          value={trainers.length}
          icon={<User className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Class
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredClasses}
          loading={loading}
          emptyMessage="No classes found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClass ? 'Edit Class' : 'Add New Class'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Class Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g., Power Yoga"
          />
          <TextArea
            id="description"
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Brief description of the class..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="duration"
              label="Duration (Minutes)"
              type="number"
              min="15"
              value={form.duration_minutes}
              onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
            />
            <Input
              id="capacity"
              label="Max Capacity"
              type="number"
              min="1"
              value={form.max_capacity}
              onChange={(e) => setForm({ ...form, max_capacity: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              id="difficulty"
              label="Difficulty Level"
              value={form.difficulty_level}
              onChange={(e) => setForm({ ...form, difficulty_level: e.target.value })}
              options={[
                { value: 'beginner', label: 'Beginner' },
                { value: 'intermediate', label: 'Intermediate' },
                { value: 'advanced', label: 'Advanced' },
              ]}
            />
            <Select
              id="trainer"
              label="Assigned Trainer"
              value={form.trainer_id}
              onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
              options={[
                { value: '', label: 'Select trainer' },
                ...trainers.map(t => ({ value: t.id, label: t.name })),
              ]}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_active"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <label htmlFor="is_active" className="text-sm text-gray-700">
              Class is active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingClass ? 'Update' : 'Add'} Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
