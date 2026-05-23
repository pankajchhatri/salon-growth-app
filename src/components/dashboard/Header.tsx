'use client'

import React from 'react'
import { Bell, Search, Calendar, Sparkles, Menu } from 'lucide-react'
import Link from 'next/link'

interface HeaderProps {
  user: {
    email: string
    role: string
    displayName: string
    salonName: string
  }
}

export default function Header({ user }: HeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
  }

  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <header className="h-16 border-b border-slate-900/50 bg-slate-950/25 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-10">
      
      {/* Mobile Toggle & Greeting */}
      <div className="flex items-center gap-3">
        {/* Mobile menu label */}
        <label htmlFor="mobile-sidebar-toggle" className="p-2 -ml-2 text-slate-450 hover:text-white md:hidden cursor-pointer">
          <Menu className="h-5 w-5" />
        </label>

        {/* Greeting and Date */}
        <div className="flex flex-col">
          <h1 className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5 leading-tight">
            {getGreeting()}, {user.displayName.split(' ')[0]}!
            <span className="text-[9px] bg-purple-500/10 text-purple-300 border border-purple-500/20 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5 select-none uppercase tracking-wider">
              <Sparkles className="h-2 w-2 text-purple-400" />
              {user.role}
            </span>
          </h1>
          <p className="text-[9px] text-slate-500 font-bold flex items-center gap-1 mt-0.5">
            <Calendar className="h-3 w-3 opacity-60" />
            {formatDate()}
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-3">
        
        {/* Search Bar */}
        <div className="relative max-w-xs hidden md:block">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-500">
            <Search className="h-3.5 w-3.5" />
          </div>
          <input
            type="text"
            placeholder="Search customers, bookings..."
            className="w-48 xl:w-64 pl-8 pr-3 py-1.5 glass-input glass-input-focus rounded-xl text-[11px] placeholder-slate-600 focus:outline-none"
          />
        </div>

        {/* Notifications Icon */}
        <button className="p-2 text-slate-400 hover:text-white glass-input rounded-xl hover:bg-white/[0.04] transition-all relative cursor-pointer">
          <Bell className="h-4 w-4" />
          {/* Notification count dot */}
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-purple-500 border border-slate-950" />
        </button>

        {/* Quick Action Button */}
        {user.role !== 'stylist' && (
          <Link 
            href="/dashboard/appointments?new=true"
            className="px-3.5 py-1.5 glow-cta glow-cta-hover text-white rounded-xl text-[10px] font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>+ New Booking</span>
          </Link>
        )}
      </div>
    </header>
  )
}
