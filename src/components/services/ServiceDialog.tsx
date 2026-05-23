'use client'

import React, { useState } from 'react'
import { createService, updateService } from '@/app/dashboard/services/actions'
import type { Service, CreateServiceInput } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'

const SERVICE_CATEGORIES = [
  'Hair Styling',
  'Hair Coloring',
  'Hair Treatments',
  'Facial & Skincare',
  'Spa & Wellness',
  'Nail Salon',
  'Waxing',
  'Grooming',
  'Bridal & Makeup',
  'Other',
]

interface ServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editService?: Service | null
  onSuccess: () => void
}

export default function ServiceDialog({
  open,
  onOpenChange,
  editService,
  onSuccess,
}: ServiceDialogProps) {
  const isEdit = Boolean(editService)

  const [form, setForm] = useState<CreateServiceInput>({
    name: editService?.name ?? '',
    category: editService?.category ?? SERVICE_CATEGORIES[0],
    duration_minutes: editService?.duration_minutes ?? 30,
    price: editService?.price ?? 0,
    repeat_cycle_days: editService?.repeat_cycle_days ?? 30,
    commission_percentage: editService?.commission_percentage ?? 10,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = (key: keyof CreateServiceInput, value: string | number) =>
    setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = isEdit && editService
      ? await updateService(editService.id, form)
      : await createService(form)

    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Something went wrong.')
      return
    }
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
          <DialogTitle className="text-base font-bold text-white">
            {isEdit ? 'Edit Service' : 'Add New Service'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Name */}
          <div>
            <label className={labelClass}>Service Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Balayage & Hair Color"
              className={inputClass}
            />
          </div>

          {/* Category */}
          <div>
            <label className={labelClass}>Category</label>
            <select
              required
              value={form.category}
              onChange={(e) => set('category', e.target.value)}
              className={inputClass}
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-slate-950">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Duration + Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Duration (minutes)</label>
              <input
                required
                type="number"
                min={5}
                step={5}
                value={form.duration_minutes}
                onChange={(e) => set('duration_minutes', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Price (₹)</label>
              <input
                required
                type="number"
                min={0}
                value={form.price}
                onChange={(e) => set('price', parseFloat(e.target.value))}
                className={inputClass}
              />
            </div>
          </div>

          {/* Recall Cycle + Commission */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Recall Cycle (days)</label>
              <input
                required
                type="number"
                min={1}
                value={form.repeat_cycle_days}
                onChange={(e) => set('repeat_cycle_days', parseInt(e.target.value))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Default Commission (%)</label>
              <input
                required
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.commission_percentage}
                onChange={(e) => set('commission_percentage', parseFloat(e.target.value))}
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
              {isEdit ? 'Save Changes' : 'Add Service'}
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
