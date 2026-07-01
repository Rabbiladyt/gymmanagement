import { useState, useEffect, useCallback } from 'react'
import { CalendarDays, Plus, Edit, Trash2, Search, Clock, MapPin, User } from 'lucide-react'
import { supabase, type ClassSchedule, type GymClass, type Trainer } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input, Select } from '../components/FormInput'
import { Table } from '../components/Table'
import { StatsCard } from '../components/StatsCard'

type ScheduleForm = {
  class_id: string
  trainer_id: string
  schedule_date: string
  start_time: string
  end_time: string
  room: string
  capacity: string
  status: string
}

const initialForm: ScheduleForm = {
  class_id: '',
  trainer_id: '',
  schedule_date: new Date().toISOString().split('T')[0],
  start_time: '09:00',
  end_time: '10:00',
  room: '',
  capacity: '20',
  status: 'scheduled',
}

export function SchedulesPage() {
  const [schedules, setSchedules] = useState<ClassSchedule[]>([])
  const [classes, setClasses] = useState<GymClass[]>([])
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<ClassSchedule | null>(null)
  const [form, setForm] = useState<ScheduleForm>(initialForm)
  const [saving, setSaving] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [schedulesRes, classesRes, trainersRes] = await Promise.all([
      supabase
        .from('class_schedules')
        .select('*, gym_class:gym_classes(*), trainer:trainers(*)')
        .order('schedule_date', { ascending: true })
        .order('start_time', { ascending: true }),
      supabase.from('gym_classes').select('*').eq('is_active', true),
      supabase.from('trainers').select('*').eq('status', 'active'),
    ])

    if (schedulesRes.data) setSchedules(schedulesRes.data)
    if (classesRes.data) setClasses(classesRes.data)
    if (trainersRes.data) setTrainers(trainersRes.data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filteredSchedules = schedules.filter(s => {
    if (!searchQuery) return true
    const classObj = s.gym_class
    const trainer = s.trainer
    return (
      classObj?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trainer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.room?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  const today = new Date().toISOString().split('T')[0]
  const todayCount = schedules.filter(s => s.schedule_date === today).length
  const upcomingCount = schedules.filter(s => s.schedule_date >= today && s.status === 'scheduled').length

  const openModal = (schedule?: ClassSchedule) => {
    if (schedule) {
      setEditingSchedule(schedule)
      setForm({
        class_id: schedule.class_id,
        trainer_id: schedule.trainer_id || '',
        schedule_date: schedule.schedule_date,
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        room: schedule.room || '',
        capacity: String(schedule.capacity),
        status: schedule.status,
      })
    } else {
      setEditingSchedule(null)
      setForm(initialForm)
      if (classes.length > 0) {
        setForm(prev => ({ ...prev, class_id: classes[0].id }))
      }
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.class_id || !form.schedule_date || !form.start_time || !form.end_time) return

    setSaving(true)
    try {
      const scheduleData = {
        class_id: form.class_id,
        trainer_id: form.trainer_id || null,
        schedule_date: form.schedule_date,
        start_time: form.start_time,
        end_time: form.end_time,
        room: form.room || null,
        capacity: parseInt(form.capacity) || 20,
        status: form.status as 'scheduled' | 'completed' | 'cancelled',
      }

      if (editingSchedule) {
        const { error } = await supabase
          .from('class_schedules')
          .update(scheduleData)
          .eq('id', editingSchedule.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('class_schedules').insert(scheduleData)
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchData()
    } catch (error) {
      console.error('Error saving schedule:', error)
      alert('Failed to save schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (schedule: ClassSchedule) => {
    if (!confirm('Delete this scheduled class?')) return

    const { error } = await supabase.from('class_schedules').delete().eq('id', schedule.id)
    if (!error) fetchData()
  }

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700',
    completed: 'bg-gray-100 text-gray-600',
    cancelled: 'bg-red-100 text-red-700',
  }

  const columns = [
    {
      key: 'class',
      header: 'Class',
      render: (s: ClassSchedule) => (
        <span className="font-medium">{s.gym_class?.name || '-'}</span>
      ),
    },
    {
      key: 'trainer',
      header: 'Trainer',
      render: (s: ClassSchedule) => (
        <span className="flex items-center gap-1">
          <User className="w-4 h-4 text-gray-400" />
          {s.trainer?.name || 'TBD'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (s: ClassSchedule) => new Date(s.schedule_date).toLocaleDateString(),
    },
    {
      key: 'time',
      header: 'Time',
      render: (s: ClassSchedule) => (
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-400" />
          {s.start_time} - {s.end_time}
        </span>
      ),
    },
    {
      key: 'room',
      header: 'Room',
      render: (s: ClassSchedule) => (
        <span className="flex items-center gap-1">
          <MapPin className="w-4 h-4 text-gray-400" />
          {s.room || 'TBD'}
        </span>
      ),
    },
    {
      key: 'enrollment',
      header: 'Enrolled',
      render: (s: ClassSchedule) => (
        <span>
          {s.enrolled_count}/{s.capacity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s: ClassSchedule) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[s.status]}`}>
          {s.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (s: ClassSchedule) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openModal(s)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(s)
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
          title="Today's Classes"
          value={todayCount}
          icon={<CalendarDays className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Upcoming Classes"
          value={upcomingCount}
          icon={<CalendarDays className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Total Schedules"
          value={schedules.length}
          icon={<CalendarDays className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Class Schedules</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search schedules..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Schedule Class
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredSchedules}
          loading={loading}
          emptyMessage="No scheduled classes"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSchedule ? 'Edit Schedule' : 'Schedule New Class'}
      >
        <div className="space-y-4">
          <Select
            id="class"
            label="Class *"
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            options={[
              { value: '', label: 'Select class' },
              ...classes.map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          <Select
            id="trainer"
            label="Trainer"
            value={form.trainer_id}
            onChange={(e) => setForm({ ...form, trainer_id: e.target.value })}
            options={[
              { value: '', label: 'Select trainer' },
              ...trainers.map(t => ({ value: t.id, label: t.name })),
            ]}
          />
          <Input
            id="date"
            label="Date *"
            type="date"
            value={form.schedule_date}
            onChange={(e) => setForm({ ...form, schedule_date: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="start_time"
              label="Start Time *"
              type="time"
              value={form.start_time}
              onChange={(e) => setForm({ ...form, start_time: e.target.value })}
            />
            <Input
              id="end_time"
              label="End Time *"
              type="time"
              value={form.end_time}
              onChange={(e) => setForm({ ...form, end_time: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              id="room"
              label="Room/Location"
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              placeholder="e.g., Studio A"
            />
            <Input
              id="capacity"
              label="Capacity"
              type="number"
              min="1"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: e.target.value })}
            />
          </div>
          <Select
            id="status"
            label="Status"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving}>
              {editingSchedule ? 'Update' : 'Schedule'} Class
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
