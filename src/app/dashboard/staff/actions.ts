'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_STAFF } from '@/lib/mock-data'
import type { StaffProfile, CreateStaffInput, CommissionRules } from '@/lib/types'
import { revalidatePath } from 'next/cache'

async function getSalonId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()
  if (!profile?.salon_id) throw new Error('No salon found')
  return profile.salon_id
}

// ─── Get staff with aggregated monthly stats ──────────────────────────────────
export async function getStaffWithStats(): Promise<StaffProfile[]> {
  if (!isSupabaseConfigured) return MOCK_STAFF

  const supabase = await createClient()
  const salonId = await getSalonId()

  // Start of current month
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: staff, error } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('salon_id', salonId)
    .eq('is_active', true)
    .order('name')

  if (error) throw new Error(error.message)

  // Fetch monthly revenue totals per staff member from commissions ledger
  const { data: commissions } = await supabase
    .from('staff_commissions')
    .select('staff_id, amount')
    .gte('calculated_at', monthStart)
    .in('status', ['approved', 'paid'])
    .in('staff_id', (staff ?? []).map((s) => s.id))

  const revenueMap: Record<string, number> = {}
  for (const c of commissions ?? []) {
    revenueMap[c.staff_id] = (revenueMap[c.staff_id] ?? 0) + c.amount
  }

  return (staff ?? []).map((s) => ({
    ...s,
    month_revenue: revenueMap[s.id] ?? 0,
  })) as StaffProfile[]
}

// ─── Create staff member ──────────────────────────────────────────────────────
export async function createStaffMember(
  input: CreateStaffInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const salonId = await getSalonId()
    const { error } = await supabase.from('staff_profiles').insert({
      ...input,
      salon_id: salonId,
      is_active: true,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Update commission rules ──────────────────────────────────────────────────
export async function updateCommissionRules(
  staffId: string,
  rules: CommissionRules,
  monthlyTarget: number
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('staff_profiles')
      .update({ commission_rules: rules, monthly_target_revenue: monthlyTarget })
      .eq('id', staffId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Toggle staff active status ───────────────────────────────────────────────
export async function toggleStaffStatus(
  staffId: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('staff_profiles')
      .update({ is_active: isActive })
      .eq('id', staffId)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/staff')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
