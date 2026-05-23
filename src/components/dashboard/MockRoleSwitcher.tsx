'use client'

import React, { useState } from 'react'

export default function MockRoleSwitcher() {
  const [role, setRole] = useState<string>(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(^| )mock_role=([^;]+)/)
      if (match) return match[2]
    }
    return 'owner'
  })

  const switchRole = (newRole: string) => {
    document.cookie = `mock_role=${newRole}; path=/; max-age=31536000`
    setRole(newRole)
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 glass-card p-3 rounded-2xl border border-purple-500/20 shadow-lg shadow-purple-500/5 flex items-center gap-3">
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
        <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Dev Mock Mode</span>
      </div>
      <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-900">
        <button
          onClick={() => switchRole('owner')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all uppercase tracking-wider ${
            role === 'owner'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Owner
        </button>
        <button
          onClick={() => switchRole('stylist')}
          className={`px-2.5 py-1 text-[11px] font-bold rounded transition-all uppercase tracking-wider ${
            role === 'stylist'
              ? 'bg-purple-600 text-white shadow-sm shadow-purple-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Stylist
        </button>
      </div>
    </div>
  )
}
