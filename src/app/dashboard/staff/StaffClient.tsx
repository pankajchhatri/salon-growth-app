'use client'

import React, { useState } from 'react'
import type { StaffProfile, CommissionRules } from '@/lib/types'
import AddStaffDialog from '@/components/staff/AddStaffDialog'
import { updateCommissionRules } from './actions'
import {
  Plus,
  TrendingUp,
  Phone,
  Percent,
  Edit2,
  Check,
  X,
  Star
} from 'lucide-react'

interface StaffClientProps {
  initialStaff: StaffProfile[]
}

export default function StaffClient({ initialStaff }: StaffClientProps) {
  const [staff, setStaff] = useState<StaffProfile[]>(initialStaff)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  // Track which card is in "edit commission" mode
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editRules, setEditRules] = useState<CommissionRules>({ type: 'fixed', percentage: 10 })
  const [editTarget, setEditTargetAmt] = useState<number>(50000)
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleSuccess = () => window.location.reload()

  const startEdit = (member: StaffProfile) => {
    setEditingId(member.id)
    setEditRules(member.commission_rules)
    setEditTargetAmt(member.monthly_target_revenue)
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (memberId: string) => {
    setSavingId(memberId)
    const result = await updateCommissionRules(memberId, editRules, editTarget)
    setSavingId(null)
    if (result.success) {
      setStaff((prev) =>
        prev.map((s) =>
          s.id === memberId
            ? { ...s, commission_rules: editRules, monthly_target_revenue: editTarget }
            : s
        )
      )
      setEditingId(null)
    }
  }

  const inputClass =
    'w-full px-3 py-2 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-purple-500/40 focus:border-purple-500/40 transition-all'

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Staff Roster
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            View team productivity, commission rules, and monthly performance targets.
          </p>
        </div>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="px-5 py-2.5 glow-cta glow-cta-hover text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Staff Member</span>
        </button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {staff.map((member) => {
          const percentage =
            member.monthly_target_revenue > 0
              ? Math.min(100, Math.round(((member.month_revenue ?? 0) / member.monthly_target_revenue) * 100))
              : 0
          const isEditing = editingId === member.id

          return (
            <div
              key={member.id}
              className="glass-card glass-card-hover p-6 rounded-3xl flex flex-col justify-between space-y-5"
            >
              {/* Header Info */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-sm font-extrabold shadow-lg shadow-purple-500/10 shrink-0 select-none">
                    {member.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-[17px] font-bold text-white leading-snug">{member.name}</h3>
                    <p className="text-[13px] text-slate-450 font-bold uppercase tracking-wider mt-0.5">{member.role_title}</p>
                  </div>
                </div>
                <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 select-none">
                  Active
                </span>
              </div>

              {/* Commission Rules Panel */}
              <div className="bg-slate-950/40 p-4 rounded-2xl border border-slate-900/60 space-y-3 shadow-inner">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 font-semibold uppercase tracking-wider">
                    Commission Rules
                  </span>
                  {!isEditing ? (
                    <button
                      onClick={() => startEdit(member)}
                      className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-0.5 cursor-pointer font-bold uppercase tracking-wide transition-colors"
                    >
                      <Edit2 className="h-3 w-3" />
                      Edit
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveEdit(member.id)}
                        disabled={savingId === member.id}
                        className="text-xs text-emerald-450 hover:text-emerald-350 flex items-center gap-0.5 cursor-pointer"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="text-xs text-rose-455 hover:text-rose-350 flex items-center gap-0.5 cursor-pointer"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-2">
                    <select
                      value={editRules.type}
                      onChange={(e) =>
                        setEditRules((r) => ({ ...r, type: e.target.value as CommissionRules['type'] }))
                      }
                      className={inputClass}
                    >
                      <option value="fixed" className="bg-slate-950">Fixed %</option>
                      <option value="service_wise" className="bg-slate-950">Service-wise %</option>
                    </select>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.5}
                        value={editRules.percentage}
                        onChange={(e) =>
                          setEditRules((r) => ({ ...r, percentage: parseFloat(e.target.value) }))
                        }
                        className={`${inputClass} w-1/2`}
                        placeholder="Comm %"
                      />
                      <input
                        type="number"
                        min={0}
                        step={1000}
                        value={editTarget}
                        onChange={(e) => setEditTargetAmt(parseFloat(e.target.value))}
                        className={`${inputClass} w-1/2`}
                        placeholder="Target ₹"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-[15px] font-bold text-purple-300 flex items-center gap-1.5">
                      <Percent className="h-4 w-4 text-purple-405" />
                      {member.commission_rules.type === 'fixed' ? 'Fixed' : 'Service-wise'}{' '}
                      {member.commission_rules.percentage}% payout
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-900/60 font-semibold">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Phone className="h-3.5 w-3.5 opacity-60" />
                        {member.phone}
                      </span>
                      {member.rating && (
                        <span className="text-amber-400 font-bold flex items-center gap-0.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">
                          <Star className="h-3 w-3 fill-current" />
                          {member.rating}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Monthly target progress */}
              <div className="space-y-2 pt-1">
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4" />
                    Month Target
                  </span>
                  <span className="text-slate-400">
                    ₹{((member.month_revenue ?? 0) / 1000).toFixed(0)}k / ₹{(member.monthly_target_revenue / 1000).toFixed(0)}k
                  </span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                  <div
                    className={`h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(168,85,247,0.4)] ${
                      percentage >= 80
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-gradient-to-r from-purple-500 to-indigo-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-[13px] font-bold block text-right text-indigo-400 uppercase tracking-wider">
                  {percentage}% achieved
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <AddStaffDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
