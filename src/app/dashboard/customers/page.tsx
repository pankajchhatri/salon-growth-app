import { getCustomers } from './actions'
import { getStaffWithStats } from '../staff/actions'
import CustomersClient from './CustomersClient'

export default async function CustomersPage() {
  const [customers, staff] = await Promise.all([getCustomers(), getStaffWithStats()])
  const staffList = staff.map((s) => ({ id: s.id, name: s.name, role_title: s.role_title ?? '' }))
  return <CustomersClient initialCustomers={customers} staffList={staffList} />
}
