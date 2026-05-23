'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth-actions'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  UserSquare2, 
  Scissors, 
  TrendingUp, 
  Percent, 
  Settings, 
  LogOut,
  Sparkles,
  X
} from 'lucide-react'

interface SidebarProps {
  user: {
    email: string
    role: string
    displayName: string
    salonName: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  const allLinks = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, roles: ['owner', 'manager', 'receptionist', 'stylist'] },
    { name: 'Appointments', href: '/dashboard/appointments', icon: Calendar, roles: ['owner', 'manager', 'receptionist', 'stylist'] },
    { name: 'Customers', href: '/dashboard/customers', icon: Users, roles: ['owner', 'manager', 'receptionist'] },
    { name: 'Staff', href: '/dashboard/staff', icon: UserSquare2, roles: ['owner', 'manager'] },
    { name: 'Services', href: '/dashboard/services', icon: Scissors, roles: ['owner', 'manager'] },
    { name: 'Retention', href: '/dashboard/retention', icon: TrendingUp, roles: ['owner', 'manager'] },
    { name: 'Commissions', href: '/dashboard/commissions', icon: Percent, roles: ['owner', 'stylist'] },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['owner'] },
  ]

  // Filter links based on user role
  const navigationLinks = allLinks.filter(link => link.roles.includes(user.role))

  return (
    <aside className="fixed md:static inset-y-0 left-0 z-30 w-64 bg-slate-950/80 md:bg-slate-950/40 backdrop-blur-2xl border-r border-slate-900/60 flex flex-col h-full shrink-0 -translate-x-full md:translate-x-0 transition-transform duration-300 ease-in-out peer-checked:translate-x-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-900/40 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl shadow-lg shadow-purple-500/10">
            <Scissors className="h-4.5 w-4.5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-white tracking-tight leading-tight">
              {user.salonName}
            </span>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1 mt-0.5">
              <Sparkles className="h-3 w-3 text-purple-400 animate-pulse" />
              {user.role} Workspace
            </span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <label htmlFor="mobile-sidebar-toggle" className="p-1 text-slate-450 hover:text-white md:hidden cursor-pointer">
          <X className="h-4.5 w-4.5" />
        </label>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navigationLinks.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3.5 px-4 py-3 rounded-xl text-[15px] font-semibold transition-all group duration-200 cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-purple-500/10 to-indigo-500/5 text-white border border-purple-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_15px_rgba(168,85,247,0.03)]'
                  : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200 border border-transparent'
              }`}
            >
              <Icon 
                className={`h-5 w-5 shrink-0 transition-all duration-200 group-hover:scale-110 ${
                  isActive ? 'text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]' : 'text-slate-500 group-hover:text-slate-300'
                }`} 
              />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-slate-900/40 shrink-0 bg-slate-950/20">
        <div className="bg-slate-900/40 border border-slate-900/60 p-3.5 rounded-2xl mb-3 flex items-center gap-3 shadow-inner">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-indigo-600/15 shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-200 truncate">{user.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate font-semibold mt-0.5">{user.email}</p>
          </div>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border border-slate-900 hover:border-rose-950/30 rounded-xl text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-rose-950/15 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
