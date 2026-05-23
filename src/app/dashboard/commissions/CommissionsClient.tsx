'use client'

import React, { useState, useMemo } from 'react'
import type { StaffCommission, CommissionStatus } from '@/lib/types'
import { approveCommission, markCommissionPaid, adjustCommissionAmount } from './actions'
import { Download, CheckCircle2, IndianRupee, Clock, BadgeCheck } from 'lucide-react'

interface CommissionsClientProps {
  initialCommissions: StaffCommission[]
  currentUser: {
    id: string
    role: string
    displayName: string
    staffProfileId?: string
  }
}

const STATUS_CONFIG: Record<
  CommissionStatus,
  { label: string; style: string; icon: React.ReactNode }
> = {
  pending: {
    label: 'Pending',
    style: 'bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]',
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: 'Approved',
    style: 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]',
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  paid: {
    label: 'Paid',
    style: 'bg-emerald-500/10 text-emerald-450 border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]',
    icon: <BadgeCheck className="h-3 w-3" />,
  },
}

export default function CommissionsClient({ initialCommissions, currentUser }: CommissionsClientProps) {
  const [commissions, setCommissions] = useState<StaffCommission[]>(initialCommissions)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')

  const isOwner = currentUser.role === 'owner' || currentUser.role === 'manager'

  // Summary totals
  const totals = useMemo(() => {
    return commissions.reduce(
      (acc, c) => {
        acc[c.status] = (acc[c.status] ?? 0) + c.amount
        return acc
      },
      { pending: 0, approved: 0, paid: 0 } as Record<CommissionStatus, number>
    )
  }, [commissions])

  const handleApprove = async (id: string) => {
    setLoadingId(id)
    const result = await approveCommission(id)
    setLoadingId(null)
    if (result.success) {
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, status: 'approved' } : c))
      )
    }
  }

  const handleMarkPaid = async (id: string) => {
    setLoadingId(id)
    const result = await markCommissionPaid(id)
    setLoadingId(null)
    if (result.success) {
      setCommissions((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, status: 'paid', paid_at: new Date().toISOString() } : c
        )
      )
    }
  }

  const handleStartEdit = (id: string, amount: number) => {
    setEditingId(id)
    setEditValue(amount.toString())
  }

  const handleSaveEdit = async (id: string) => {
    const val = Number(editValue)
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid positive number.')
      return
    }
    setLoadingId(id)
    const res = await adjustCommissionAmount(id, val)
    setLoadingId(null)
    if (res.success) {
      setCommissions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, amount: val } : c))
      )
      setEditingId(null)
    } else {
      alert(res.error || 'Failed to update commission.')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
  }

  // CSV export
  const exportCSV = () => {
    const headers = ['Staff Name', 'Role', 'Appointment Date', 'Customer', 'Amount (₹)', 'Status', 'Paid At']
    const rows = commissions.map((c) => [
      c.staff?.name ?? '',
      c.staff?.role_title ?? '',
      c.appointment?.start_time
        ? new Date(c.appointment.start_time).toLocaleDateString('en-IN')
        : '',
      c.appointment?.customer?.name ?? '',
      c.amount,
      c.status,
      c.paid_at ? new Date(c.paid_at).toLocaleDateString('en-IN') : '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `commissions_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return dateStr
    }
  }

  const currentMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-8 relative z-10">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {isOwner ? 'Commission Ledger & Payroll' : 'My Commissions'}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {currentMonth} · {isOwner ? 'Approve and track stylist payouts' : 'Monitor your personal earnings'}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-5 py-3 border border-slate-900 hover:border-slate-800 text-sm font-bold text-slate-450 hover:text-white rounded-xl bg-slate-950/60 transition-all cursor-pointer uppercase tracking-wider"
        >
          <Download className="h-4 w-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-5">
        {(
          [
            { key: 'pending', label: 'Pending Payouts', color: 'text-amber-400', bg: 'from-amber-600/10 to-amber-500/5', border: 'border-amber-500/20' },
            { key: 'approved', label: 'Approved Payouts', color: 'text-blue-400', bg: 'from-blue-600/10 to-blue-500/5', border: 'border-blue-500/20' },
            { key: 'paid', label: 'Paid This Month', color: 'text-emerald-400', bg: 'from-emerald-600/10 to-emerald-500/5', border: 'border-emerald-500/20' },
          ] as const
        ).map(({ key, label, color, bg, border }) => (
          <div
            key={key}
            className={`glass-card bg-gradient-to-br ${bg} border ${border} p-6 rounded-3xl`}
          >
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
            <p className={`text-[38px] font-extrabold ${color} mt-2.5 flex items-center gap-0.5 tracking-tight`}>
              <IndianRupee className="h-6 w-6 opacity-80" />
              {totals[key as CommissionStatus].toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </p>
            <p className="text-[13px] text-slate-500 mt-3 font-bold uppercase tracking-wider select-none">
              {commissions.filter((c) => c.status === key).length} operations
            </p>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/20">
                <th className="py-4.5 px-6">Stylist</th>
                <th className="py-4.5 px-6">Appointment</th>
                <th className="py-4.5 px-6">Customer</th>
                <th className="py-4.5 px-6">Calculated</th>
                <th className="py-4.5 px-6 text-right">Commission</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm text-slate-300">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 italic">
                    No commission entries recorded for this ledger period.
                  </td>
                </tr>
              ) : (
                commissions.map((com) => {
                  const statusCfg = STATUS_CONFIG[com.status]
                  const isLoading = loadingId === com.id
                  return (
                    <tr key={com.id} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-purple-600/60 to-indigo-600/60 flex items-center justify-center text-xs text-white font-extrabold shrink-0 shadow-sm shadow-purple-500/10">
                            {(com.staff?.name ?? '?').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-200 text-sm">{com.staff?.name ?? '—'}</div>
                            <div className="text-xs text-slate-400 font-semibold mt-0.5">{com.staff?.role_title}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-semibold">
                        {com.appointment?.start_time
                          ? formatDate(com.appointment.start_time)
                          : '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-400 font-semibold">
                        {com.appointment?.customer?.name ?? '—'}
                      </td>
                      <td className="py-4 px-6 text-slate-550 font-semibold">{formatDate(com.calculated_at)}</td>
                      <td className="py-4 px-6 text-right font-extrabold text-white text-[14px]">
                        ₹{com.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider select-none ${statusCfg.style}`}
                        >
                          {statusCfg.icon}
                          <span>{statusCfg.label}</span>
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2.5">
                          {!isOwner ? (
                            <span className="text-xs text-slate-550 italic uppercase font-bold tracking-wider select-none">
                              ReadOnly
                            </span>
                          ) : (
                            <>
                              {com.status === 'pending' && (
                                <>
                                  {editingId === com.id ? (
                                    <div className="flex items-center gap-1.5 justify-end">
                                      <input
                                        type="number"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        className="w-20 px-2 py-1 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
                                        autoFocus
                                      />
                                      <button
                                        onClick={() => handleSaveEdit(com.id)}
                                        disabled={isLoading}
                                        className="p-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg"
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={handleCancelEdit}
                                        className="p-1.5 text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-lg"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <button
                                        onClick={() => handleStartEdit(com.id, com.amount)}
                                        className="px-3 py-2 text-[12px] font-bold text-slate-450 border border-slate-900 hover:border-slate-850 hover:text-white bg-slate-950/60 hover:bg-slate-900 rounded-lg transition-all cursor-pointer uppercase tracking-wider"
                                      >
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => handleApprove(com.id)}
                                        disabled={isLoading}
                                        className="px-4.5 py-2 text-sm font-bold text-blue-400 border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                                      >
                                        {isLoading ? '...' : 'Approve'}
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {com.status === 'approved' && (
                                <button
                                  onClick={() => handleMarkPaid(com.id)}
                                  disabled={isLoading}
                                  className="px-4.5 py-2 text-sm font-bold text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-all cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                                >
                                  {isLoading ? '...' : 'Mark Paid'}
                                </button>
                              )}
                              {com.status === 'paid' && (
                                <span className="text-sm text-slate-500 font-semibold italic">
                                  {com.paid_at ? `Paid ${formatDate(com.paid_at)}` : 'Paid'}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-900/50 text-xs font-semibold text-slate-500 bg-slate-950/10">
          Showing {commissions.length} transaction rows
        </div>
      </div>
    </div>
  )
}
