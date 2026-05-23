import { getStaffWithStats } from './actions'
import StaffClient from './StaffClient'

export default async function StaffPage() {
  const staff = await getStaffWithStats()
  return <StaffClient initialStaff={staff} />
}
