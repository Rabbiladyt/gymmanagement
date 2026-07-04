/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Customer = {
  id: string
  name: string
  phone: string
  email: string | null
  address: string | null
  notes: string | null
  total_orders: number
  total_spent: number
  created_at: string
}

export type Service = {
  id: string
  name: string
  description: string | null
  base_price: number
  unit: string
  estimated_hours: number
  icon: string
  is_active: boolean
  created_at: string
}

export type Order = {
  id: string
  order_number: string
  customer_id: string
  service_id: string
  weight: number
  quantity: number
  notes: string | null
  subtotal: number
  delivery_fee: number
  discount: number
  total: number
  status: 'pending' | 'processing' | 'washing' | 'drying' | 'ironing' | 'ready' | 'delivered' | 'cancelled'
  payment_status: 'unpaid' | 'paid' | 'partial'
  pickup_date: string | null
  pickup_time: string | null
  delivery_date: string | null
  delivery_time: string | null
  est_completion: string | null
  created_at: string
  customer?: Customer
  service?: Service
}

export type OrderItem = {
  id: string
  order_id: string
  item_name: string
  quantity: number
  price: number
  notes: string | null
  created_at: string
}

export type Promo = {
  id: string
  code: string
  name: string
  discount_percent: number
  discount_amount: number
  min_order: number
  max_discount: number | null
  valid_from: string
  valid_until: string
  is_active: boolean
  usage_count: number
  created_at: string
}
