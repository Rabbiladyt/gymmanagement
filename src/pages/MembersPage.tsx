import { useState, useEffect, useCallback } from 'react'
import { Users, Plus, Edit, Trash2, Search, Mail, Phone } from 'lucide-react'
import { supabase, type Member } from '../lib/supabase'
import { Modal } from '../components/Modal'
import { Button } from '../components/Button'
import { Input, Select } from '../components/FormInput'
import { Table } from '../components/Table'
import { StatsCard } from '../components/StatsCard'

type MemberForm = {
  name: string
  email: string
  phone: string
  gender: string
  birth_date: string
  status: string
}

const initialForm: MemberForm = {
  name: '',
  email: '',
  phone: '',
  gender: 'male',
  birth_date: '',
  status: 'active',
}

export function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form, setForm] = useState<MemberForm>(initialForm)
  const [saving, setSaving] = useState(false)
  const [activeCount, setActiveCount] = useState(0)

  const fetchMembers = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setMembers(data)
      setActiveCount(data.filter(m => m.status === 'active').length)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const filteredMembers = members.filter(
    m =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const openModal = (member?: Member) => {
    if (member) {
      setEditingMember(member)
      setForm({
        name: member.name,
        email: member.email,
        phone: member.phone || '',
        gender: member.gender || 'male',
        birth_date: member.birth_date || '',
        status: member.status,
      })
    } else {
      setEditingMember(null)
      setForm(initialForm)
    }
    setIsModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name || !form.email) return

    setSaving(true)
    try {
      if (editingMember) {
        const { error } = await supabase
          .from('members')
          .update({
            name: form.name,
            email: form.email,
            phone: form.phone || null,
            gender: form.gender || null,
            birth_date: form.birth_date || null,
            status: form.status as 'active' | 'inactive',
          })
          .eq('id', editingMember.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('members').insert({
          name: form.name,
          email: form.email,
          phone: form.phone || null,
          gender: form.gender || null,
          birth_date: form.birth_date || null,
          status: form.status as 'active' | 'inactive',
        })
        if (error) throw error
      }
      setIsModalOpen(false)
      fetchMembers()
    } catch (error) {
      console.error('Error saving member:', error)
      alert('Failed to save member')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (member: Member) => {
    if (!confirm(`Delete ${member.name}?`)) return

    const { error } = await supabase.from('members').delete().eq('id', member.id)
    if (!error) fetchMembers()
  }

  const columns = [
    { key: 'name', header: 'Name' },
    {
      key: 'contact',
      header: 'Contact',
      render: (m: Member) => (
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-gray-600">
            <Mail className="w-3 h-3" />
            <span>{m.email}</span>
          </div>
          {m.phone && (
            <div className="flex items-center gap-1 text-gray-500">
              <Phone className="w-3 h-3" />
              <span>{m.phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (m: Member) => (
        <span className="capitalize">{m.gender || '-'}</span>
      ),
    },
    {
      key: 'join_date',
      header: 'Join Date',
      render: (m: Member) => new Date(m.join_date).toLocaleDateString(),
    },
    {
      key: 'status',
      header: 'Status',
      render: (m: Member) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            m.status === 'active'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {m.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (m: Member) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openModal(m)
            }}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-emerald-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleDelete(m)
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
          title="Total Members"
          value={members.length}
          icon={<Users className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Active Members"
          value={activeCount}
          icon={<Users className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Inactive Members"
          value={members.length - activeCount}
          icon={<Users className="w-6 h-6" />}
          color="orange"
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Members</h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search members..."
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4" />
              Add Member
            </Button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredMembers}
          loading={loading}
          emptyMessage="No members found"
        />
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
      >
        <div className="space-y-4">
          <Input
            id="name"
            label="Full Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="John Doe"
          />
          <Input
            id="email"
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="john@example.com"
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
              id="gender"
              label="Gender"
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              id="birth_date"
              label="Birth Date"
              type="date"
              value={form.birth_date}
              onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
            />
          </div>
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
              {editingMember ? 'Update' : 'Add'} Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
