/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Member = {
  id: string
  name: string
  email: string
  phone: string | null
  gender: 'male' | 'female' | 'other' | null
  birth_date: string | null
  join_date: string
  status: 'active' | 'inactive'
  created_at: string
}

export type Trainer = {
  id: string
  name: string
  email: string
  phone: string | null
  specialty: string | null
  experience_years: number
  bio: string | null
  photo_url: string | null
  status: 'active' | 'inactive'
  created_at: string
}

export type Membership = {
  id: string
  name: string
  description: string | null
  price_monthly: number
  duration_months: number
  features: string[]
  is_active: boolean
  created_at: string
}

export type GymClass = {
  id: string
  name: string
  description: string | null
  duration_minutes: number
  difficulty_level: 'beginner' | 'intermediate' | 'advanced' | null
  max_capacity: number
  trainer_id: string | null
  is_active: boolean
  created_at: string
  trainer?: Trainer
}

export type ClassSchedule = {
  id: string
  class_id: string
  trainer_id: string | null
  schedule_date: string
  start_time: string
  end_time: string
  room: string | null
  capacity: number
  enrolled_count: number
  status: 'scheduled' | 'completed' | 'cancelled'
  created_at: string
  gym_class?: GymClass
  trainer?: Trainer
}

export type Enrollment = {
  id: string
  member_id: string
  schedule_id: string
  enrolled_at: string
  status: 'enrolled' | 'attended' | 'cancelled'
  created_at: string
  member?: Member
  schedule?: ClassSchedule
}

export type MemberMembership = {
  id: string
  member_id: string
  membership_id: string
  start_date: string
  end_date: string
  status: 'active' | 'expired' | 'cancelled'
  created_at: string
  member?: Member
  membership?: Membership
}
