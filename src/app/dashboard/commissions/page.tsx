import { getCommissions } from './actions'
import CommissionsClient from './CommissionsClient'
import { getCurrentUser } from '@/lib/auth-util'
import { redirect } from 'next/navigation'

export default async function CommissionsPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  const commissions = await getCommissions()
  return <CommissionsClient initialCommissions={commissions} currentUser={currentUser} />
}
