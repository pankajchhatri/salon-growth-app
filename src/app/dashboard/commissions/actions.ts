'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_COMMISSIONS } from '@/lib/mock-data'
import type { StaffCommission } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-util'


// ─── Fetch commissions (current month, or specified YYYY-MM) ──────────────────
export async function getCommissions(month?: string): Promise<StaffCommission[]> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return []

  if (!isSupabaseConfigured) {
    if (currentUser.role === 'stylist' && currentUser.staffProfileId) {
      return MOCK_COMMISSIONS.filter((c) => c.staff_id === currentUser.staffProfileId)
    }
    return MOCK_COMMISSIONS
  }

  const supabase = await createClient()
  const salonId = currentUser.salon_id

  // Determine month range (defaults to current calendar month)
  const now = new Date()
  const [year, mon] = month
    ? month.split('-').map(Number)
    : [now.getFullYear(), now.getMonth() + 1]
  const monthStart = new Date(year, mon - 1, 1).toISOString()
  const monthEnd = new Date(year, mon, 1).toISOString()

  let query = supabase
    .from('staff_commissions')
    .select(`
      *,
      staff:staff_profiles(id, name, role_title),
      appointment:appointments(id, start_time, customer:customers(id, name, phone, no_show_count), services:appointment_services(*, service:services(id, name, category, duration_minutes)))
    `)
    .gte('calculated_at', monthStart)
    .lt('calculated_at', monthEnd)

  if (currentUser.role === 'stylist' && currentUser.staffProfileId) {
    query = query.eq('staff_id', currentUser.staffProfileId)
  } else {
    query = query.in(
      'staff_id',
      (
        await supabase
          .from('staff_profiles')
          .select('id')
          .eq('salon_id', salonId)
      ).data?.map((s) => s.id) ?? []
    )
  }

  const { data, error } = await query.order('calculated_at', { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as StaffCommission[]
}

// ─── Approve commission (pending → approved) ──────────────────────────────────
export async function approveCommission(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot approve commissions.' }
  }

  if (!isSupabaseConfigured) {
    const comm = MOCK_COMMISSIONS.find((c) => c.id === id)
    if (comm) comm.status = 'approved'
    return { success: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('staff_commissions')
      .update({ status: 'approved' })
      .eq('id', id)
      .eq('status', 'pending') // only transition from pending
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/commissions')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Mark commission as paid (approved → paid) ────────────────────────────────
export async function markCommissionPaid(
  id: string
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot modify payout records.' }
  }

  if (!isSupabaseConfigured) {
    const comm = MOCK_COMMISSIONS.find((c) => c.id === id)
    if (comm) {
      comm.status = 'paid'
      comm.paid_at = new Date().toISOString()
    }
    return { success: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('staff_commissions')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'approved') // only transition from approved
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/commissions')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Adjust commission amount (Owner only override) ──────────────────────────
export async function adjustCommissionAmount(
  id: string,
  newAmount: number
): Promise<{ success: boolean; error?: string }> {
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot adjust commissions.' }
  }

  if (!isSupabaseConfigured) {
    const idx = MOCK_COMMISSIONS.findIndex((c) => c.id === id)
    if (idx !== -1) {
      MOCK_COMMISSIONS[idx].amount = newAmount
    }
    return { success: true }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('staff_commissions')
      .update({ amount: newAmount })
      .eq('id', id)
      .eq('status', 'pending') // Only adjust pending items

    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/commissions')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Auto-calculate and insert commission for a completed appointment ──────────
// Called when appointment status changes to 'completed'.
// Idempotent: skips if a commission record already exists for this appointment.
export async function calculateCommissionForAppointment(
  appointmentId: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()

    // Check idempotency: skip if commission already exists
    const { data: existing } = await supabase
      .from('staff_commissions')
      .select('id')
      .eq('appointment_id', appointmentId)
      .single()

    if (existing) return { success: true } // already calculated

    // Fetch appointment with service lines and staff commission rules
    const { data: appt, error: apptError } = await supabase
      .from('appointments')
      .select(`
        id, staff_id,
        staff:staff_profiles(id, commission_rules),
        services:appointment_services(service_id, price, staff_id, staff:staff_profiles(commission_rules))
      `)
      .eq('id', appointmentId)
      .single()

    if (apptError || !appt) return { success: false, error: 'Appointment not found' }

    // Calculate total commission across all service lines
    type CommissionRules = {
      type?: 'fixed' | 'service-wise'
      percentage?: number
      rates?: Record<string, number>
    }
    type ServiceLine = { 
      service_id: string
      price: number
      staff?: { commission_rules?: CommissionRules } 
    }
    type ApptWithJoins = typeof appt & {
      staff?: { commission_rules?: CommissionRules }
      services?: ServiceLine[]
    }
    const apptTyped = appt as ApptWithJoins
    let totalCommission = 0
    const serviceLines: ServiceLine[] = apptTyped.services ?? []

    for (const line of serviceLines) {
      const rules: CommissionRules = (line.staff?.commission_rules ?? apptTyped.staff?.commission_rules ?? { type: 'fixed', percentage: 10 }) as CommissionRules
      let pct = 10
      if (rules.type === 'service-wise' && rules.rates && typeof rules.rates === 'object') {
        const serviceRate = rules.rates[line.service_id]
        if (typeof serviceRate === 'number') {
          pct = serviceRate
        } else {
          pct = rules.percentage ?? 10
        }
      } else {
        pct = rules.percentage ?? 10
      }
      totalCommission += (Number(line.price) * pct) / 100
    }

    // Insert commission record with 'pending' status
    const { error: insertError } = await supabase.from('staff_commissions').insert({
      staff_id: appt.staff_id,
      appointment_id: appointmentId,
      amount: Math.round(totalCommission * 100) / 100,
      status: 'pending',
    })

    if (insertError) return { success: false, error: insertError.message }
    revalidatePath('/dashboard/commissions')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
