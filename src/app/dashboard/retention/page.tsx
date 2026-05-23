import React from 'react'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-util'
import { getCustomers } from '@/app/dashboard/customers/actions'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_CUSTOMERS } from '@/lib/mock-data'
import type { Customer } from '@/lib/types'
import RetentionClient from './RetentionClient'

export default async function RetentionPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    redirect('/login')
  }

  let customersList: Customer[] = []

  if (!isSupabaseConfigured) {
    customersList = MOCK_CUSTOMERS
  } else {
    try {
      customersList = await getCustomers()
    } catch (e) {
      console.error('Error fetching customers for retention campaigns:', e)
    }
  }

  return <RetentionClient customers={customersList} />
}
