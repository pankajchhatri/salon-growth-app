'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_SERVICES } from '@/lib/mock-data'
import type { Service, CreateServiceInput } from '@/lib/types'
import { revalidatePath } from 'next/cache'

// ─── Get salon_id for the authenticated user ──────────────────────────────────
async function getSalonId(): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')
  const { data: profile } = await supabase
    .from('profiles')
    .select('salon_id')
    .eq('id', user.id)
    .single()
  if (!profile?.salon_id) throw new Error('No salon found for user')
  return profile.salon_id
}

// ─── Fetch all active services ────────────────────────────────────────────────
export async function getServices(): Promise<Service[]> {
  if (!isSupabaseConfigured) return MOCK_SERVICES

  const supabase = await createClient()
  const salonId = await getSalonId()
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('salon_id', salonId)
    .order('category')
    .order('name')

  if (error) throw new Error(error.message)
  return (data ?? []) as Service[]
}

// ─── Create service ───────────────────────────────────────────────────────────
export async function createService(
  input: CreateServiceInput
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) {
    // In dev mode, just pretend it worked
    return { success: true }
  }

  try {
    const supabase = await createClient()
    const salonId = await getSalonId()
    const { error } = await supabase.from('services').insert({
      ...input,
      salon_id: salonId,
      is_active: true,
    })
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/services')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Update service ───────────────────────────────────────────────────────────
export async function updateService(
  id: string,
  input: Partial<CreateServiceInput>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from('services').update(input).eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/services')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Toggle service active/inactive (soft-delete) ────────────────────────────
export async function toggleServiceStatus(
  id: string,
  isActive: boolean
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured) return { success: true }

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('services')
      .update({ is_active: isActive })
      .eq('id', id)
    if (error) return { success: false, error: error.message }
    revalidatePath('/dashboard/services')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
