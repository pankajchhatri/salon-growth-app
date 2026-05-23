// ─── Enums ────────────────────────────────────────────────────────────────────

export type UserRole = 'owner' | 'manager' | 'receptionist' | 'stylist'

export type AppointmentStatus =
  | 'created'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed'
  | 'no_show'

export type BookingSource =
  | 'whatsapp'
  | 'call'
  | 'instagram'
  | 'walk_in'
  | 'online'

export type CommissionStatus = 'pending' | 'approved' | 'paid'

// ─── Commission Rules (JSONB) ─────────────────────────────────────────────────

export interface CommissionRules {
  type: 'fixed' | 'service_wise'
  percentage: number
}

// ─── Core Entities ────────────────────────────────────────────────────────────

export interface Salon {
  id: string
  name: string
  phone?: string
  created_at: string
}

export interface Profile {
  id: string
  salon_id: string
  email: string
  role: UserRole
  created_at: string
}

export interface StaffProfile {
  id: string
  user_id?: string
  salon_id: string
  name: string
  role_title?: string
  phone?: string
  commission_rules: CommissionRules
  monthly_target_revenue: number
  is_active: boolean
  created_at: string
  // Computed / aggregated
  month_revenue?: number
  rating?: string
}

export interface Service {
  id: string
  salon_id: string
  name: string
  category: string
  duration_minutes: number
  price: number
  repeat_cycle_days: number
  commission_percentage: number
  is_active: boolean
  created_at: string
}

export interface Customer {
  id: string
  salon_id: string
  name: string
  phone: string
  gender?: string
  birthday?: string
  anniversary?: string
  notes?: string
  no_show_count: number
  total_visits: number
  total_spend: number
  last_visit_date?: string
  preferred_staff_id?: string
  created_at: string
  // Joined
  preferred_staff?: Pick<StaffProfile, 'id' | 'name' | 'role_title'>
}

export interface Appointment {
  id: string
  salon_id: string
  customer_id: string
  staff_id: string
  start_time: string
  end_time: string
  status: AppointmentStatus
  source: BookingSource
  notes?: string
  created_at: string
  updated_at: string
  // Joined
  customer?: Pick<Customer, 'id' | 'name' | 'phone' | 'no_show_count'>
  staff?: Pick<StaffProfile, 'id' | 'name' | 'role_title'>
  services?: AppointmentServiceLine[]
}

export interface AppointmentServiceLine {
  appointment_id: string
  service_id: string
  price: number
  commission_paid: number
  staff_id: string
  service?: Pick<Service, 'id' | 'name' | 'category' | 'duration_minutes'>
}

export interface StaffCommission {
  id: string
  staff_id: string
  appointment_id: string
  amount: number
  status: CommissionStatus
  calculated_at: string
  paid_at?: string
  // Joined
  staff?: Pick<StaffProfile, 'id' | 'name' | 'role_title'>
  appointment?: Pick<Appointment, 'id' | 'start_time' | 'customer'> & {
    services?: AppointmentServiceLine[]
  }
}

// ─── Form Input Types ─────────────────────────────────────────────────────────

export interface CreateServiceInput {
  name: string
  category: string
  duration_minutes: number
  price: number
  repeat_cycle_days: number
  commission_percentage: number
}

export interface CreateStaffInput {
  name: string
  role_title: string
  phone: string
  commission_rules: CommissionRules
  monthly_target_revenue: number
}

export interface CreateCustomerInput {
  name: string
  phone: string
  gender?: string
  birthday?: string
  anniversary?: string
  notes?: string
  preferred_staff_id?: string
}

// ─── Customer Segment (computed) ──────────────────────────────────────────────

export type CustomerSegment =
  | 'vip'
  | 'frequent'
  | 'new'
  | 'churn_risk_90'
  | 'churn_risk_60'
  | 'churn_risk_30'
  | 'high_no_show'
  | 'due_for_service'
  | 'birthday_this_month'
  | 'regular'

export function computeSegment(customer: Customer): CustomerSegment {
  const now = new Date()

  // Birthday this month
  if (customer.birthday) {
    const bday = new Date(customer.birthday)
    if (bday.getMonth() === now.getMonth()) return 'birthday_this_month'
  }

  // High no-show risk
  if (customer.no_show_count >= 2) return 'high_no_show'

  // Churn risk by inactivity
  if (customer.last_visit_date) {
    const lastVisit = new Date(customer.last_visit_date)
    const daysSince = Math.floor((now.getTime() - lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    if (daysSince >= 90) return 'churn_risk_90'
    if (daysSince >= 60) return 'churn_risk_60'
    if (daysSince >= 30) return 'churn_risk_30'
  }

  // VIP: high spend + frequent visits
  if (customer.total_visits >= 10 && customer.total_spend >= 15000) return 'vip'

  // Frequent
  if (customer.total_visits >= 5) return 'frequent'

  // New
  if (customer.total_visits <= 1) return 'new'

  return 'regular'
}

export const SEGMENT_LABELS: Record<CustomerSegment, string> = {
  vip: 'VIP',
  frequent: 'Frequent',
  new: 'New Customer',
  churn_risk_90: 'Lost (90+ days)',
  churn_risk_60: 'Churn Risk (60d)',
  churn_risk_30: 'Churn Risk (30d)',
  high_no_show: 'High No-Show Risk',
  due_for_service: 'Due for Service',
  birthday_this_month: 'Birthday This Month',
  regular: 'Regular',
}

export const SEGMENT_STYLES: Record<CustomerSegment, string> = {
  vip: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  frequent: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  new: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  churn_risk_90: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  churn_risk_60: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  churn_risk_30: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  high_no_show: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  due_for_service: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  birthday_this_month: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  regular: 'bg-slate-800/60 text-slate-400 border-slate-700/50',
}
