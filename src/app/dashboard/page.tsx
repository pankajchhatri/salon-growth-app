import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-util'
import { getAppointments } from '@/app/dashboard/appointments/actions'
import { getCustomers } from '@/app/dashboard/customers/actions'
import { getCommissions } from '@/app/dashboard/commissions/actions'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import {
  MOCK_APPOINTMENTS,
  MOCK_CUSTOMERS,
  MOCK_STAFF,
  MOCK_COMMISSIONS
} from '@/lib/mock-data'
import type { Appointment, StaffProfile, Customer, StaffCommission } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  let appointmentsList: Appointment[] = []
  let staffList: StaffProfile[] = []
  let customersList: Customer[] = []
  let commissionsList: StaffCommission[] = []

  if (!isSupabaseConfigured) {
    // ─── Local Mock Fallback ───────────────────────────────────────────────
    appointmentsList = MOCK_APPOINTMENTS
    staffList = MOCK_STAFF
    customersList = MOCK_CUSTOMERS
    commissionsList = MOCK_COMMISSIONS
  } else {
    // ─── Supabase Data Fetching ─────────────────────────────────────────────
    try {
      const supabase = await createClient()
      const salonId = currentUser.salon_id

      // 1. Fetch appointments (filtered on database level if stylist)
      appointmentsList = await getAppointments(currentUser.role, currentUser.staffProfileId)

      // 2. Fetch active staff profiles
      const { data: dbStaff } = await supabase
        .from('staff_profiles')
        .select('*')
        .eq('salon_id', salonId)
        .eq('is_active', true)
      staffList = (dbStaff || []) as StaffProfile[]

      // 3. Fetch customers list
      customersList = await getCustomers()

      // 4. Fetch commissions (filtered on database level if stylist)
      commissionsList = await getCommissions()
    } catch (e) {
      console.error('Error fetching dashboard database datasets:', e)
    }
  }

  return (
    <DashboardClient
      currentUser={currentUser}
      appointments={appointmentsList}
      staffProfiles={staffList}
      customers={customersList}
      commissions={commissionsList}
    />
  )
}
