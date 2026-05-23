'use client'

import React, { useState } from 'react'
import { createStaffMember } from '@/app/dashboard/staff/actions'
import type { CreateStaffInput, CommissionRules } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface AddStaffDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddStaffDialog({ open, onOpenChange, onSuccess }: AddStaffDialogProps) {
  const [form, setForm] = useState<CreateStaffInput>({
    name: '',
    role_title: '',
    phone: '',
    commission_rules: { type: 'fixed', percentage: 10 },
    monthly_target_revenue: 50000,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = (key: keyof CreateStaffInput, value: string | number | CommissionRules) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await createStaffMember(form)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    // Reset form
    setForm({ name: '', role_title: '', phone: '', commission_rules: { type: 'fixed', percentage: 10 }, monthly_target_revenue: 50000 })
    onSuccess()
    onOpenChange(false)
  }

  const inputClass =
    'w-full px-3 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all'
  const labelClass = 'block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border border-slate-800 text-white max-w-lg rounded-3xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-white">Add Staff Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <label className={labelClass}>Full Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="e.g. Amit Sharma"
              className={inputClass}
            />
          </div>

          {/* Role Title + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Role / Designation</label>
              <input
                required
                value={form.role_title}
                onChange={(e) => setField('role_title', e.target.value)}
                placeholder="e.g. Senior Stylist"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                required
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>
          </div>

          {/* Commission Rules */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Commission Structure
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Commission Type</label>
                <select
                  value={form.commission_rules.type}
                  onChange={(e) =>
                    setField('commission_rules', {
                      ...form.commission_rules,
                      type: e.target.value as CommissionRules['type'],
                    })
                  }
                  className={inputClass}
                >
                  <option value="fixed" className="bg-slate-950">Fixed %</option>
                  <option value="service_wise" className="bg-slate-950">Service-wise %</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Percentage (%)</label>
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  step={0.5}
                  value={form.commission_rules.percentage}
                  onChange={(e) =>
                    setField('commission_rules', {
                      ...form.commission_rules,
                      percentage: parseFloat(e.target.value),
                    })
                  }
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Monthly Revenue Target (₹)</label>
              <input
                required
                type="number"
                min={0}
                step={1000}
                value={form.monthly_target_revenue}
                onChange={(e) => setField('monthly_target_revenue', parseFloat(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2 gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl hover:bg-slate-900/50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {loading && <Loader2 className="h-3 w-3 animate-spin" />}
              Add Staff Member
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
