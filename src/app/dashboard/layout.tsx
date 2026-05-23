import React from 'react'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/dashboard/Sidebar'
import Header from '@/components/dashboard/Header'
import { getCurrentUser } from '@/lib/auth-util'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import MockRoleSwitcher from '@/components/dashboard/MockRoleSwitcher'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-[#030712] text-slate-100 overflow-hidden font-sans relative antialiased">
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/10 via-slate-950 to-slate-950 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />
      
      <div className="relative z-10 flex h-full w-full overflow-hidden">
        <Sidebar user={currentUser} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={currentUser} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Mock Role Switcher for local development test runs */}
      {!isSupabaseConfigured && <MockRoleSwitcher />}
    </div>
  )
}
