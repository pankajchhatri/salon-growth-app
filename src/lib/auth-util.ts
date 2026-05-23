import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { cookies } from 'next/headers'

export async function getCurrentUser() {
  if (!isSupabaseConfigured) {
    // Read the mock_role cookie to dynamically simulate Owner vs Stylist role locally
    const cookieStore = await cookies()
    const mockRole = cookieStore.get('mock_role')?.value
    if (mockRole === 'stylist') {
      return {
        id: 'mock-stylist-id',
        email: 'stylist@salongrowth.com',
        role: 'stylist' as const,
        salon_id: 'mock-salon-id',
        displayName: 'Amit Sharma',
        salonName: 'GlowFlow Salon',
        staffProfileId: 'stf-001', // Amit Sharma
      }
    }
    return {
      id: 'mock-owner-id',
      email: 'owner@salongrowth.com',
      role: 'owner' as const,
      salon_id: 'mock-salon-id',
      displayName: 'Salon Owner',
      salonName: 'GlowFlow Salon',
      staffProfileId: undefined,
    }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, salon_id, email')
      .eq('id', user.id)
      .single()

    let displayName = user.email?.split('@')[0] || 'User'
    let staffProfileId: string | undefined

    if (profile?.role === 'stylist') {
      const { data: staff } = await supabase
        .from('staff_profiles')
        .select('id, name')
        .eq('user_id', user.id)
        .single()
      if (staff) {
        displayName = staff.name
        staffProfileId = staff.id
      }
    } else {
      displayName = user.user_metadata?.name || displayName
    }

    // Get salon name
    let salonName = 'GlowFlow Salon'
    if (profile?.salon_id) {
      const { data: salon } = await supabase
        .from('salons')
        .select('name')
        .eq('id', profile.salon_id)
        .single()
      if (salon) {
        salonName = salon.name
      }
    }

    return {
      id: user.id,
      email: user.email || '',
      role: (profile?.role || 'stylist') as 'owner' | 'manager' | 'receptionist' | 'stylist',
      salon_id: profile?.salon_id || '',
      displayName,
      salonName,
      staffProfileId,
    }
  } catch (e) {
    console.error('Error fetching user context:', e)
    return null
  }
}
