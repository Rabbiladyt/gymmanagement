import { useState, useEffect, useCallback } from 'react'
import {
  Users, Dumbbell, Calendar, CreditCard,
  TrendingUp, Clock, Activity, UserCheck
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { StatsCard } from '../components/StatsCard'
import type { Member, Trainer, GymClass, ClassSchedule } from '../lib/supabase'

export function Dashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    activeMembers: 0,
    totalTrainers: 0,
    activeTrainers: 0,
    totalClasses: 0,
    activeClasses: 0,
    todaySchedules: 0,
    totalEnrollments: 0,
    newMembersThisMonth: 0,
  })
  const [recentMembers, setRecentMembers] = useState<Member[]>([])
  const [todaySchedule, setTodaySchedule] = useState<(ClassSchedule & { gym_class?: GymClass; trainer?: Trainer })[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]

      const [
        membersRes,
        trainersRes,
        classesRes,
        schedulesRes,
        enrollmentsRes,
        recentMembersRes,
        todaySchedulesRes,
      ] = await Promise.all([
        supabase.from('members').select('id, status, join_date'),
        supabase.from('trainers').select('id, status'),
        supabase.from('gym_classes').select('id, is_active'),
        supabase.from('class_schedules').select('id').eq('schedule_date', today),
        supabase.from('enrollments').select('id'),
        supabase.from('members').select('*').order('created_at', { ascending: false }).limit(5),
        supabase
          .from('class_schedules')
          .select('*, gym_class:gym_classes(*), trainer:trainers(*)')
          .eq('schedule_date', today)
          .order('start_time', { ascending: true }),
      ])

      setStats({
        totalMembers: membersRes.data?.length || 0,
        activeMembers: membersRes.data?.filter(m => m.status === 'active').length || 0,
        totalTrainers: trainersRes.data?.length || 0,
        activeTrainers: trainersRes.data?.filter(t => t.status === 'active').length || 0,
        totalClasses: classesRes.data?.length || 0,
        activeClasses: classesRes.data?.filter(c => c.is_active).length || 0,
        todaySchedules: schedulesRes.data?.length || 0,
        totalEnrollments: enrollmentsRes.data?.length || 0,
        newMembersThisMonth: membersRes.data?.filter(m => m.join_date >= firstDayOfMonth).length || 0,
      })

      setRecentMembers(recentMembersRes.data || [])
      setTodaySchedule(todaySchedulesRes.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome to FitPro Gym Management</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="w-4 h-4" />
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Members"
          value={stats.totalMembers}
          subtitle={`${stats.activeMembers} active`}
          icon={<Users className="w-6 h-6" />}
          color="emerald"
        />
        <StatsCard
          title="Total Trainers"
          value={stats.totalTrainers}
          subtitle={`${stats.activeTrainers} active`}
          icon={<Dumbbell className="w-6 h-6" />}
          color="blue"
        />
        <StatsCard
          title="Active Classes"
          value={stats.activeClasses}
          subtitle={`of ${stats.totalClasses} total`}
          icon={<Activity className="w-6 h-6" />}
          color="orange"
        />
        <StatsCard
          title="Today's Classes"
          value={stats.todaySchedules}
          subtitle="scheduled"
          icon={<Calendar className="w-6 h-6" />}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Schedule</h2>
          {todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Calendar className="w-12 h-12 text-gray-300 mb-2" />
              <p>No classes scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedule.map((schedule) => (
                <div
                  key={schedule.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100">
                      <Clock className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{schedule.gym_class?.name || 'Unknown'}</h3>
                      <p className="text-sm text-gray-500">
                        {schedule.start_time} - {schedule.end_time} | {schedule.trainer?.name || 'TBD'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{schedule.room || 'TBD'}</p>
                    <p className="text-xs text-gray-500">
                      {schedule.enrolled_count}/{schedule.capacity} enrolled
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Members</h2>
            <span className="text-xs text-gray-500">Last 5</span>
          </div>
          {recentMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <UserCheck className="w-12 h-12 text-gray-300 mb-2" />
              <p>No members yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 font-medium">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      member.status === 'active'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm">New Members This Month</p>
              <p className="text-3xl font-bold mt-1">{stats.newMembersThisMonth}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-emerald-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Enrollments</p>
              <p className="text-3xl font-bold mt-1">{stats.totalEnrollments}</p>
            </div>
            <CreditCard className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Member Activity Rate</p>
              <p className="text-3xl font-bold mt-1">
                {stats.totalMembers > 0
                  ? Math.round((stats.activeMembers / stats.totalMembers) * 100)
                  : 0}%
              </p>
            </div>
            <Activity className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>
    </div>
  )
}
