'use client'

import React, { useState } from 'react'
import { createCustomer } from '@/app/dashboard/customers/actions'
import type { CreateCustomerInput, StaffProfile } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

interface AddCustomerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffList: Pick<StaffProfile, 'id' | 'name' | 'role_title'>[]
  onSuccess: () => void
}

export default function AddCustomerDialog({
  open,
  onOpenChange,
  staffList,
  onSuccess,
}: AddCustomerDialogProps) {
  const [form, setForm] = useState<CreateCustomerInput>({
    name: '',
    phone: '',
    gender: '',
    birthday: '',
    anniversary: '',
    notes: '',
    preferred_staff_id: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof CreateCustomerInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    // Strip empty optional fields
    const input: CreateCustomerInput = {
      name: form.name,
      phone: form.phone,
      ...(form.gender && { gender: form.gender }),
      ...(form.birthday && { birthday: form.birthday }),
      ...(form.anniversary && { anniversary: form.anniversary }),
      ...(form.notes && { notes: form.notes }),
      ...(form.preferred_staff_id && { preferred_staff_id: form.preferred_staff_id }),
    }
    const result = await createCustomer(input)
    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
    setForm({ name: '', phone: '', gender: '', birthday: '', anniversary: '', notes: '', preferred_staff_id: '' })
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
          <DialogTitle className="text-base font-bold text-white">Add New Customer</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name + Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Full Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="e.g. Priya Sen"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input
                required
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+91 98765 43210"
                className={inputClass}
              />
            </div>
          </div>

          {/* Gender + Preferred Staff */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Gender</label>
              <select
                value={form.gender}
                onChange={(e) => set('gender', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-slate-950">Not specified</option>
                <option value="Female" className="bg-slate-950">Female</option>
                <option value="Male" className="bg-slate-950">Male</option>
                <option value="Other" className="bg-slate-950">Other</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Preferred Stylist</label>
              <select
                value={form.preferred_staff_id}
                onChange={(e) => set('preferred_staff_id', e.target.value)}
                className={inputClass}
              >
                <option value="" className="bg-slate-950">No preference</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id} className="bg-slate-950">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Birthday + Anniversary */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Birthday</label>
              <input
                type="date"
                value={form.birthday}
                onChange={(e) => set('birthday', e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Anniversary</label>
              <input
                type="date"
                value={form.anniversary}
                onChange={(e) => set('anniversary', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Allergies, preferences, special instructions..."
              className={`${inputClass} resize-none`}
            />
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
              Add Customer
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
