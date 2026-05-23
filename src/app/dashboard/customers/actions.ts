'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_CUSTOMERS, MOCK_APPOINTMENTS } from '@/lib/mock-data'
import type { Customer, CreateCustomerInput, Appointment } from '@/lib/types'
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

// ─── Fetch all customers ──────────────────────────────────────────────────────
export async function getCustomers(): Promise<Customer[]> {
  if (!isSupabaseConfigured) return MOCK_CUSTOMERS

  const supabase = await createClient()
  const salonId = await getSalonId()

  const { data, error } = await supabase
    .from('customers')
    .select('*, preferred_staff:staff_profiles(id, name, role_title)')
    .eq('salon_id', salonId)
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Customer[]
}

// ─── Create customer ──────────────────────────────────────────────────────────
export async function createCustomer(
  input: CreateCustomerInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const salonId = await getSalonId()
    const { error } = await supabase.from('customers').insert({
      ...input,
      salon_id: salonId,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Update customer ──────────────────────────────────────────────────────────
export async function updateCustomer(
  id: string,
  input: Partial<CreateCustomerInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('customers').update(input).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Update customer notes (quick save) ──────────────────────────────────────
export async function updateCustomerNotes(
  id: string,
  notes: string
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('customers').update({ notes }).eq('id', id)
    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Fetch customer appointment history ───────────────────────────────────────
export async function getCustomerHistory(customerId: string): Promise<Appointment[]> {
  if (!isSupabaseConfigured) {
    return MOCK_APPOINTMENTS.filter((a) => a.customer_id === customerId)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      staff:staff_profiles(id, name, role_title),
      services:appointment_services(*, service:services(id, name, category, duration_minutes))
    `)
    .eq('customer_id', customerId)
    .order('start_time', { ascending: false })
    .limit(20)

  if (error) throw new Error(error.message)
  return (data ?? []) as Appointment[]
}
