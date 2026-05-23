import { getAppointments } from './actions'
import { getCurrentUser } from '@/lib/auth-util'
import { getStaffWithStats } from '@/app/dashboard/staff/actions'
import { getServices } from '@/app/dashboard/services/actions'
import { getCustomers } from '@/app/dashboard/customers/actions'
import AppointmentsClient from './AppointmentsClient'
import { Suspense } from 'react'

export default async function AppointmentsPage() {
  const currentUser = await getCurrentUser()
  const role = currentUser?.role || 'stylist'
  const staffProfileId = currentUser?.staffProfileId

  // Fetch all parallel requirements
  const [appointments, staff, services, customers] = await Promise.all([
    getAppointments(role, staffProfileId),
    getStaffWithStats(),
    getServices(),
    getCustomers(),
  ])

  // Filter staff list to only show active ones
  const activeStaff = staff.filter((s) => s.is_active)
  // Filter services to only show active ones
  const activeServices = services.filter((s) => s.is_active)

  return (
    <Suspense fallback={
      <div className="h-full w-full flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    }>
      <AppointmentsClient
        currentUser={currentUser || { id: '', role: 'stylist', displayName: 'Guest', salonName: 'GlowFlow Salon' }}
        initialAppointments={appointments}
        staffList={activeStaff}
        servicesList={activeServices}
        customersList={customers}
      />
    </Suspense>
  )
}
