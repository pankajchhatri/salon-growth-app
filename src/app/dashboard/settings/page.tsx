'use client'

import React from 'react'
import { Building, Bell, Percent, ShieldCheck } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl relative z-10">
      
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          System Settings
        </h2>
        <p className="text-sm text-slate-400 mt-1.5">Configure business parameters, default commission parameters, and system rules.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings Navigation */}
        <div className="space-y-1">
          <button className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-purple-300 bg-purple-500/10 border border-purple-500/20 text-left shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
            <Building className="h-4 w-4 text-purple-400" />
            <span>Salon Profile</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] text-left border border-transparent transition-all">
            <Percent className="h-4 w-4 text-slate-500" />
            <span>Default Commissions</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] text-left border border-transparent transition-all">
            <Bell className="h-4 w-4 text-slate-500" />
            <span>Reminders Notifications</span>
          </button>
          <button className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-white/[0.02] text-left border border-transparent transition-all">
            <ShieldCheck className="h-4 w-4 text-slate-500" />
            <span>Access Control</span>
          </button>
        </div>

        {/* Settings Panels */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Panel 1: Salon Profile */}
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2 border-b border-slate-900/60 pb-3 uppercase">
              <Building className="h-4 w-4 text-purple-400" />
              Salon Business Information
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-450 uppercase tracking-wider">Salon / Branch Name</label>
                <input 
                  type="text" 
                  defaultValue="GlowFlow Salon" 
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-450 uppercase tracking-wider">Contact Phone Number</label>
                <input 
                  type="text" 
                  defaultValue="+91 99887 76655" 
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-450 uppercase tracking-wider">Primary Currency</label>
                <input 
                  type="text" 
                  defaultValue="INR (₹)" 
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-900 text-slate-550 rounded-xl cursor-not-allowed select-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-[13px] font-bold text-slate-450 uppercase tracking-wider">Default Timezone</label>
                <input 
                  type="text" 
                  defaultValue="Asia/Kolkata (IST)" 
                  disabled
                  className="w-full px-3 py-2 bg-slate-950/40 border border-slate-900 text-slate-550 rounded-xl cursor-not-allowed select-none"
                />
              </div>
            </div>
          </div>

          {/* Panel 2: Commission Thresholds */}
          <div className="glass-card p-5 rounded-3xl space-y-4">
            <h3 className="text-xs font-bold text-white tracking-wider flex items-center gap-2 border-b border-slate-900/60 pb-3 uppercase">
              <Percent className="h-4 w-4 text-purple-400" />
              Global Commission Defaults
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-950/35 p-3.5 rounded-2xl border border-slate-900/60 shadow-inner">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-205">Default Fixed Service Percentage</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Standard commission applied if stylist-specific override is missing.</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input 
                    type="number" 
                    defaultValue="10" 
                    className="w-16 px-2.5 py-1.5 bg-slate-950 border border-slate-900 rounded-xl text-white text-center font-bold"
                  />
                  <span className="text-slate-400 font-bold text-xs">%</span>
                </div>
              </div>

              <div className="flex justify-between items-center bg-slate-950/35 p-3.5 rounded-2xl border border-slate-900/60 shadow-inner">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-slate-205">Enable Product Sales Commission</h4>
                  <p className="text-[10px] text-slate-500 font-semibold">Calculate styling product recommendations commissions.</p>
                </div>
                <div className="relative shrink-0 flex items-center pr-2">
                  <input type="checkbox" defaultChecked className="h-4 w-4 accent-purple-600 rounded cursor-pointer" />
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <button className="px-5 py-2.5 border border-slate-900 text-sm font-bold text-slate-405 hover:text-slate-200 rounded-xl hover:bg-white/[0.02] transition-all cursor-pointer">
              Discard Changes
            </button>
            <button className="px-5 py-2.5 glow-cta glow-cta-hover text-white rounded-xl text-sm font-bold shadow-lg transition-all cursor-pointer">
              Save Configuration
            </button>
          </div>

        </div>

      </div>

    </div>
  )
}
