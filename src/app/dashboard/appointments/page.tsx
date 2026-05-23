import { getAppointments } from './actions'
import { getCurrentUser } from '@/lib/auth-util'
import { getStaffWithStats } from '@/app/dashboard/staff/actions'
import { getServices } from '@/app/dashboard/services/actions'
import { getCustomers } from '@/app/dashboard/customers/actions'
import AppointmentsClient from './AppointmentsClient'

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
    <AppointmentsClient
      currentUser={currentUser || { id: '', role: 'stylist', displayName: 'Guest', salonName: 'GlowFlow Salon' }}
      initialAppointments={appointments}
      staffList={activeStaff}
      servicesList={activeServices}
      customersList={customers}
    />
  )
}
