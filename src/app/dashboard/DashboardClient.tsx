'use client'

import React, { useState, useMemo } from 'react'
import type { Appointment, StaffProfile, Customer, StaffCommission } from '@/lib/types'
import {
  IndianRupee,
  Users,
  CalendarDays,
  AlertTriangle,
  Scissors,
  ChevronRight,
  Award
} from 'lucide-react'
import Link from 'next/link'

interface DashboardClientProps {
  currentUser: {
    id: string
    role: string
    displayName: string
    salonName: string
    staffProfileId?: string
  }
  appointments: Appointment[]
  staffProfiles: StaffProfile[]
  customers: Customer[]
  commissions: StaffCommission[]
}

export default function DashboardClient({
  currentUser,
  appointments,
  staffProfiles,
  customers,
  commissions
}: DashboardClientProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'month'>('month')
  const isStylist = currentUser.role === 'stylist'
  const isOwner = currentUser.role === 'owner' || currentUser.role === 'manager'

  // Get current dates
  const now = useMemo(() => new Date(), [])
  const todayStr = now.toDateString()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  // ─── Filter Data Based on Timeframe ─────────────────────────────────────────
  const filteredAppointments = useMemo(() => {
    return appointments.filter((a) => {
      const apptDate = new Date(a.start_time)
      if (timeframe === 'today') {
        return apptDate.toDateString() === todayStr
      } else {
        return apptDate.getMonth() === currentMonth && apptDate.getFullYear() === currentYear
      }
    })
  }, [appointments, timeframe, todayStr, currentMonth, currentYear])

  const filteredCommissions = useMemo(() => {
    return commissions.filter((c) => {
      const date = new Date(c.calculated_at)
      if (timeframe === 'today') {
        return date.toDateString() === todayStr
      } else {
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear
      }
    })
  }, [commissions, timeframe, todayStr, currentMonth, currentYear])

  // ─── Owner Dashboard Computations ───────────────────────────────────────────
  const ownerStats = useMemo(() => {
    if (!isOwner) return null

    // 1. Revenue
    const completed = filteredAppointments.filter((a) => a.status === 'completed')
    let totalRevenue = 0
    completed.forEach((a) => {
      a.services?.forEach((s) => {
        totalRevenue += Number(s.price || 0)
      })
    })

    // 2. Status Counter
    const statusCounts = {
      created: 0,
      confirmed: 0,
      rescheduled: 0,
      cancelled: 0,
      completed: 0,
      no_show: 0
    }
    filteredAppointments.forEach((a) => {
      if (a.status in statusCounts) {
        statusCounts[a.status as keyof typeof statusCounts]++
      }
    })

    // 3. Lost Revenue Estimate
    let lostRevenue = 0
    const lostAppts = filteredAppointments.filter((a) => a.status === 'no_show' || a.status === 'cancelled')
    lostAppts.forEach((a) => {
      a.services?.forEach((s) => {
        lostRevenue += Number(s.price || 0)
      })
    })

    // 4. Commissions Summary
    let pendingCommissions = 0
    let totalCommissions = 0
    filteredCommissions.forEach((c) => {
      totalCommissions += c.amount
      if (c.status === 'pending') {
        pendingCommissions += c.amount
      }
    })

    // 5. Repeat Customer Rate
    const repeatCust = customers.filter((c) => (c.total_visits || 0) > 1)
    const repeatRate = customers.length
      ? `${Math.round((repeatCust.length / customers.length) * 100)}%`
      : '0%'

    // 6. Category Revenue Breakdown
    const categoryTotals: Record<string, number> = {}
    completed.forEach((a) => {
      a.services?.forEach((s) => {
        const cat = s.service?.category || 'General'
        categoryTotals[cat] = (categoryTotals[cat] ?? 0) + Number(s.price || 0)
      })
    })
    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // 7. Staff Performance List
    const staffPerformance = staffProfiles.map((staff) => {
      const staffAppts = filteredAppointments.filter(
        (a) => a.staff_id === staff.id && a.status === 'completed'
      )
      let revenue = 0
      staffAppts.forEach((a) => {
        a.services?.forEach((s) => {
          revenue += Number(s.price || 0)
        })
      })
      const target = Number(staff.monthly_target_revenue || 50000)
      const targetProgress = Math.min(Math.round((revenue / target) * 100), 100)

      const staffComms = filteredCommissions.filter((c) => c.staff_id === staff.id)
      const totalComms = staffComms.reduce((sum, c) => sum + c.amount, 0)

      return {
        id: staff.id,
        name: staff.name,
        role: staff.role_title || 'Stylist',
        revenue,
        bookings: staffAppts.length,
        rating: staff.rating || '4.8',
        targetProgress,
        commission: totalComms
      }
    })

    const topStylist = staffPerformance.length
      ? [...staffPerformance].sort((a, b) => b.revenue - a.revenue)[0]
      : null
    const underperformer = staffPerformance.length
      ? [...staffPerformance].sort((a, b) => a.targetProgress - b.targetProgress)[0]
      : null

    // 8. Retention Statistics
    const lostClients = customers.filter((c) => {
      if (!c.last_visit_date) return false
      const lastVisit = new Date(c.last_visit_date)
      const diffTime = Math.abs(now.getTime() - lastVisit.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 30 && diffDays <= 90
    }).length

    const dueClients = customers.filter((c) => {
      if (!c.last_visit_date) return false
      const lastVisit = new Date(c.last_visit_date)
      const diffTime = Math.abs(now.getTime() - lastVisit.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 20 && diffDays < 30
    }).length

    const reactivatedClients = customers.filter((c) => {
      if ((c.total_visits || 0) <= 1 || !c.last_visit_date) return false
      const lastVisit = new Date(c.last_visit_date)
      const isThisMonth = lastVisit.getMonth() === currentMonth && lastVisit.getFullYear() === currentYear
      return isThisMonth
    }).length

    return {
      totalRevenue,
      statusCounts,
      lostRevenue,
      lostApptsCount: lostAppts.length,
      pendingCommissions,
      totalCommissions,
      repeatRate,
      categoryBreakdown,
      staffPerformance,
      topStylist,
      underperformer,
      retention: {
        active: customers.length,
        lost: lostClients,
        due: dueClients,
        reactivated: reactivatedClients
      }
    }
  }, [isOwner, filteredAppointments, filteredCommissions, staffProfiles, customers, now, currentMonth, currentYear])

  // ─── Stylist Dashboard Computations ─────────────────────────────────────────
  const stylistStats = useMemo(() => {
    if (!isStylist || !currentUser.staffProfileId) return null

    const myAppts = filteredAppointments.filter((a) => a.staff_id === currentUser.staffProfileId)
    const completed = myAppts.filter((a) => a.status === 'completed')

    let sales = 0
    completed.forEach((a) => {
      a.services?.forEach((s) => {
        sales += Number(s.price || 0)
      })
    })

    const repeatIds = new Set(myAppts.map((a) => a.customer_id))
    const servedCusts = customers.filter((c) => repeatIds.has(c.id))
    const repeat = servedCusts.filter((c) => (c.total_visits || 0) > 1)
    const repeatRate = servedCusts.length
      ? `${Math.round((repeat.length / servedCusts.length) * 100)}%`
      : '0%'

    const activeCount = myAppts.filter((a) => a.status === 'completed' || a.status === 'confirmed').length
    const targetSlots = timeframe === 'today' ? 3 : 15
    const slotPercent = Math.min(Math.round((activeCount / targetSlots) * 100), 100)

    const noShows = myAppts.filter((a) => a.status === 'no_show').length
    const noShowRate = myAppts.length
      ? `${((noShows / myAppts.length) * 100).toFixed(1)}%`
      : '0.0%'

    const profile = staffProfiles.find((s) => s.id === currentUser.staffProfileId)
    const monthlyTarget = profile?.monthly_target_revenue || 50000
    const targetProgress = Math.min(Math.round((sales / monthlyTarget) * 100), 100)

    return {
      sales,
      repeatRate,
      activeCount,
      targetSlots,
      slotPercent,
      noShowRate,
      targetProgress,
      rating: profile?.rating || '4.9',
      appointmentsCount: myAppts.length
    }
  }, [isStylist, currentUser.staffProfileId, filteredAppointments, staffProfiles, customers, timeframe])

  // ─── Shared Alerts Feed ─────────────────────────────────────────────────────
  const alertsFeed = useMemo(() => {
    const list: Array<{ id: number; type: 'critical' | 'warning' | 'info'; text: string; time: string }> = []
    
    if (isStylist && currentUser.staffProfileId) {
      const pendingCount = commissions.filter(
        (c) => c.staff_id === currentUser.staffProfileId && c.status === 'pending'
      ).length
      if (pendingCount > 0) {
        list.push({
          id: 1,
          type: 'info',
          text: `You have ${pendingCount} pending commission ledger lines awaiting Owner approval.`,
          time: 'Just now'
        })
      }
      list.push({
        id: 2,
        type: 'warning',
        text: 'Review and update your completed service sessions to avoid payout delays.',
        time: '1h ago'
      })
    } else if (isOwner && ownerStats) {
      // Old unresolved check
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const unresolvedCount = appointments.filter(
        (a) => (a.status === 'created' || a.status === 'confirmed') && new Date(a.start_time) < yesterday
      ).length
      if (unresolvedCount > 0) {
        list.push({
          id: 1,
          type: 'critical',
          text: `${unresolvedCount} old appointments require status resolution (Completed/No-Show).`,
          time: '12h ago'
        })
      }

      // High Risk No Shows check
      const highRiskCount = appointments.filter((a) => {
        const c = customers.find((cust) => cust.id === a.customer_id)
        return a.status === 'confirmed' && c && c.no_show_count >= 2
      }).length
      if (highRiskCount > 0) {
        list.push({
          id: 2,
          type: 'warning',
          text: `${highRiskCount} confirmed bookings today are flagged as High No-Show Risk.`,
          time: '1h ago'
        })
      }

      // Birthdays check
      const bdayCount = customers.filter((c) => {
        if (!c.birthday) return false
        const bday = new Date(c.birthday)
        return bday.getMonth() === now.getMonth()
      }).length
      if (bdayCount > 0) {
        list.push({
          id: 3,
          type: 'info',
          text: `${bdayCount} clients celebrate their birthday this month. Send recall campaign.`,
          time: 'Just now'
        })
      }

      // Pending Payouts check
      const pendingCount = commissions.filter((c) => c.status === 'pending').length
      if (pendingCount > 0) {
        list.push({
          id: 4,
          type: 'info',
          text: `${pendingCount} commission payouts require review and approval in Ledger.`,
          time: '3h ago'
        })
      }
    }

    return list
  }, [isStylist, isOwner, currentUser.staffProfileId, commissions, appointments, customers, ownerStats, now])

  return (
    <div className="space-y-8 relative z-10">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            {isStylist ? `Welcome Back, ${currentUser.displayName}` : 'Overview Dashboard'}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isStylist
              ? 'Monitor your appointments, targets, and earnings for this month.'
              : `Monitor and optimize your salon's performance and revenue.`}
          </p>
        </div>

        {/* Timeframe selector pill */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-900 self-start sm:self-center">
          <button
            onClick={() => setTimeframe('today')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              timeframe === 'today'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeframe('month')}
            className={`px-5 py-2 text-xs font-bold rounded-xl transition-all uppercase tracking-wider cursor-pointer ${
              timeframe === 'month'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      {/* ─── OWNER INSIGHTS VIEW ────────────────────────────────────────────── */}
      {isOwner && ownerStats && (
        <>
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Sales Revenue */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">Gross Sales</p>
                <h3 className="mt-3.5 text-[42px] font-black text-white tracking-tight leading-none flex items-center gap-0.5">
                  <IndianRupee className="h-7 w-7 text-slate-300 shrink-0" />
                  {ownerStats.totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-slate-800/80 text-slate-350 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Revenue
                </span>
                <span>Active ledger period</span>
              </div>
            </div>

            {/* KPI 2: Repeat rate */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">Repeat Client Rate</p>
                <h3 className="mt-3.5 text-[42px] font-black text-white tracking-tight leading-none">
                  {ownerStats.repeatRate}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Loyalty
                </span>
                <span>Overall customer pool</span>
              </div>
            </div>

            {/* KPI 3: Loss Estimate */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">No-Show Loss</p>
                <h3 className="mt-3.5 text-[42px] font-black text-rose-450 tracking-tight leading-none flex items-center gap-0.5">
                  <IndianRupee className="h-7 w-7 text-rose-350 shrink-0" />
                  {ownerStats.lostRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-rose-500/5 text-rose-300 border border-rose-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  {ownerStats.lostApptsCount} missed
                </span>
                <span>Cancelled / No-shows</span>
              </div>
            </div>

            {/* KPI 4: Commissions Payable */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">Commissions Due</p>
                <h3 className="mt-3.5 text-[42px] font-black text-blue-400 tracking-tight leading-none flex items-center gap-0.5">
                  <IndianRupee className="h-7 w-7 text-blue-300 shrink-0" />
                  {ownerStats.pendingCommissions.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-blue-500/5 text-blue-300 border border-blue-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Commissions
                </span>
                <span>Ledger pending state</span>
              </div>
            </div>
          </div>

          {/* Detailed analytics sections */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Category breakdown (Progress bars) */}
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <Scissors className="h-4.5 w-4.5 text-slate-400" />
                  Sales by Service Category
                </h3>
              </div>
              <div className="space-y-4 pt-1">
                {ownerStats.categoryBreakdown.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-6">No completed service lines in range.</p>
                ) : (
                  ownerStats.categoryBreakdown.map(({ name, value }) => {
                    const pct = Math.round((value / (ownerStats.totalRevenue || 1)) * 100)
                    return (
                      <div key={name} className="space-y-2 bg-white/[0.02] border border-slate-800/60 p-4 rounded-2xl shadow-inner">
                        <div className="flex justify-between text-sm">
                          <span className="font-bold text-slate-200">{name}</span>
                          <span className="font-extrabold text-white">₹{value.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold text-right uppercase tracking-wider">
                            {pct}% OF SALES
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Bookings Status Counter */}
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <CalendarDays className="h-4.5 w-4.5 text-indigo-400" />
                  Booking Status Distribution
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3 pt-1">
                {[
                  { key: 'completed', label: 'Completed', val: ownerStats.statusCounts.completed, style: 'border-emerald-500/15 bg-emerald-500/[0.03] text-emerald-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-emerald-500' },
                  { key: 'confirmed', label: 'Confirmed', val: ownerStats.statusCounts.confirmed, style: 'border-blue-500/15 bg-blue-500/[0.03] text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-blue-500' },
                  { key: 'no_show', label: 'No-Shows', val: ownerStats.statusCounts.no_show, style: 'border-rose-500/15 bg-rose-500/[0.03] text-rose-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-rose-500' },
                  { key: 'cancelled', label: 'Cancelled', val: ownerStats.statusCounts.cancelled, style: 'border-slate-800 bg-slate-900/40 text-slate-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-slate-500' },
                  { key: 'rescheduled', label: 'Rescheduled', val: ownerStats.statusCounts.rescheduled, style: 'border-amber-500/15 bg-amber-500/[0.03] text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-amber-500' },
                  { key: 'created', label: 'Created Only', val: ownerStats.statusCounts.created, style: 'border-slate-800 bg-slate-900/40 text-slate-350 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]', dot: 'bg-slate-400' }
                ].map((st) => (
                  <div key={st.key} className={`border p-4 rounded-2xl flex flex-col justify-between min-h-[90px] ${st.style}`}>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider select-none">
                      <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                      <span>{st.label}</span>
                    </div>
                    <div className="text-[28px] font-black tracking-tight leading-none mt-2 text-white">
                      {st.val}
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Appointments Counter */}
              <div className="p-4 bg-white/[0.01] border border-slate-800/60 rounded-2xl flex justify-between items-center text-xs font-bold shadow-inner">
                <span className="text-slate-400 uppercase tracking-wider">Total Operations:</span>
                <span className="text-white text-sm font-black">{filteredAppointments.length} bookings</span>
              </div>
            </div>

            {/* Retention statistics */}
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <Users className="h-4.5 w-4.5 text-emerald-400" />
                  Client Retention Indicators
                </h3>
              </div>
              
              <div className="space-y-3.5 pt-1">
                {[
                  { label: 'Active Clients', val: ownerStats.retention.active, desc: 'Registered pool', style: 'border border-slate-800 bg-slate-900/40 text-slate-200' },
                  { label: 'Lost Clients', val: ownerStats.retention.lost, desc: 'Inactive 30–90 days', style: 'border border-rose-500/10 bg-rose-500/[0.02] text-rose-350' },
                  { label: 'Due for Recall', val: ownerStats.retention.due, desc: 'Due for visit cycle', style: 'border border-amber-500/10 bg-amber-500/[0.02] text-amber-350' },
                  { label: 'Reactivated Clients', val: ownerStats.retention.reactivated, desc: 'Returned this month', style: 'border border-emerald-500/10 bg-emerald-500/[0.02] text-emerald-350' }
                ].map((c) => (
                  <div key={c.label} className={`p-4 rounded-2xl flex justify-between items-center ${c.style}`}>
                    <div>
                      <p className="font-bold text-sm text-slate-200">{c.label}</p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">{c.desc}</p>
                    </div>
                    <span className="text-2xl font-black text-white">{c.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts feed */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  Actionable Alerts
                </h3>
                <span className="text-xs text-slate-300 font-bold bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-full">
                  {alertsFeed.length} Alerts
                </span>
              </div>

              <div className="space-y-3.5">
                {alertsFeed.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-6">All clear! No alerts to resolve.</p>
                ) : (
                  alertsFeed.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border text-sm flex justify-between items-start gap-4 transition-all hover:bg-white/[0.01] hover:translate-x-0.5 ${
                        alert.type === 'critical'
                          ? 'bg-rose-500/[0.03] border-rose-500/15 text-rose-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/[0.03] border-amber-500/15 text-amber-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                          : 'bg-blue-500/[0.03] border-blue-500/15 text-blue-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-2 h-2 w-2 rounded-full shrink-0 ${
                            alert.type === 'critical'
                              ? 'bg-rose-500'
                              : alert.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-350 leading-relaxed">{alert.text}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-bold whitespace-nowrap shrink-0 mt-0.5">
                        {alert.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Performance Ranking scoreboard */}
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <Award className="h-4.5 w-4.5 text-indigo-400" />
                  Stylist Standings
                </h3>
                <Link
                  href="/dashboard/staff"
                  className="text-[10px] text-slate-400 hover:text-white flex items-center gap-0.5 font-bold uppercase tracking-wider transition-colors"
                >
                  View all <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              <div className="space-y-4 pt-1">
                {ownerStats.staffPerformance.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-6">No active staff profiles.</p>
                ) : (
                  ownerStats.staffPerformance
                     .sort((a, b) => b.revenue - a.revenue)
                    .map((staff) => (
                      <div
                        key={staff.id}
                        className="space-y-3 bg-white/[0.02] border border-slate-800/60 p-4 rounded-2xl shadow-inner"
                      >
                        <div className="flex justify-between items-start text-sm">
                          <div>
                            <p className="font-bold text-slate-200 text-[14px]">
                              {staff.name} {ownerStats.topStylist?.id === staff.id && '👑'}
                            </p>
                            <p className="text-xs text-slate-500 font-semibold mt-0.5">{staff.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-extrabold text-white text-[14px]">₹{staff.revenue.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-amber-400 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                              ★ {staff.rating}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                            <span>CAPACITY TARGET</span>
                            <span>{staff.targetProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                            <div
                              className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full"
                              style={{ width: `${staff.targetProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── STYLIST PORTAL VIEW ────────────────────────────────────────────── */}
      {isStylist && stylistStats && (
        <>
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* KPI 1: Sales */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">My Sales</p>
                <h3 className="mt-3.5 text-[42px] font-black text-white tracking-tight leading-none flex items-center gap-0.5">
                  <IndianRupee className="h-7 w-7 text-slate-300 shrink-0" />
                  {stylistStats.sales.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-slate-800/80 text-slate-350 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Personal Earnings
                </span>
                <span>Active ledger period</span>
              </div>
            </div>

            {/* KPI 2: Repeat Rate */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">Repeat Clients</p>
                <h3 className="mt-3.5 text-[42px] font-black text-white tracking-tight leading-none">
                  {stylistStats.repeatRate}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Loyalty
                </span>
                <span>My customers pool</span>
              </div>
            </div>

            {/* KPI 3: Slot Utilization */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">Slot Utilization</p>
                <h3 className="mt-3.5 text-[42px] font-black text-emerald-400 tracking-tight leading-none">
                  {stylistStats.activeCount} / {stylistStats.targetSlots}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-emerald-500/5 text-emerald-300 border border-emerald-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  {stylistStats.slotPercent}% Capacity
                </span>
                <span>Today vs Target limit</span>
              </div>
            </div>

            {/* KPI 4: No-Show Rate */}
            <div className="glass-card p-6 rounded-3xl flex flex-col justify-between min-h-[170px]">
              <div>
                <p className="text-xs font-semibold text-slate-400/80 uppercase tracking-wider">No-Show Rate</p>
                <h3 className="mt-3.5 text-[42px] font-black text-rose-450 tracking-tight leading-none">
                  {stylistStats.noShowRate}
                </h3>
              </div>
              <div className="border-t border-slate-800/50 my-4" />
              <div className="flex items-center justify-between text-xs font-medium text-slate-400/70">
                <span className="bg-rose-500/5 text-rose-300 border border-rose-500/10 px-2 py-0.5 rounded-full uppercase text-[10px] font-bold">
                  Loss Control
                </span>
                <span>My assigned bookings</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Alerts Section */}
            <div className="lg:col-span-2 glass-card p-6 rounded-3xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <AlertTriangle className="h-4.5 w-4.5 text-amber-500" />
                  Actionable Alerts
                </h3>
                <span className="text-xs text-slate-300 font-bold bg-slate-800 border border-slate-700/60 px-2.5 py-1 rounded-full">
                  {alertsFeed.length} Alerts
                </span>
              </div>

              <div className="space-y-3.5">
                {alertsFeed.length === 0 ? (
                  <p className="text-sm text-slate-500 italic text-center py-6">All clear! No alerts to resolve.</p>
                ) : (
                  alertsFeed.map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-2xl border text-sm flex justify-between items-start gap-4 transition-all hover:bg-white/[0.01] hover:translate-x-0.5 ${
                        alert.type === 'critical'
                          ? 'bg-rose-500/[0.03] border-rose-500/15 text-rose-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/[0.03] border-amber-500/15 text-amber-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                          : 'bg-blue-500/[0.03] border-blue-500/15 text-blue-250 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <span
                          className={`mt-2 h-2 w-2 rounded-full shrink-0 ${
                            alert.type === 'critical'
                              ? 'bg-rose-500'
                              : alert.type === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-semibold text-slate-350 leading-relaxed">{alert.text}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-bold whitespace-nowrap shrink-0 mt-0.5">
                        {alert.time}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Stylist progress / targets */}
            <div className="glass-card p-6 rounded-3xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <h3 className="text-sm font-bold text-white tracking-wider flex items-center gap-2.5 uppercase">
                  <Award className="h-4.5 w-4.5 text-indigo-400" />
                  My Monthly Target progress
                </h3>
              </div>

              <div className="space-y-4 pt-1">
                <div className="space-y-3 bg-white/[0.02] border border-slate-800/60 p-4 rounded-2xl shadow-inner">
                  <div className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-bold text-slate-200 text-[14px]">
                        {currentUser.displayName} (You)
                      </p>
                      <p className="text-xs text-slate-500 font-semibold mt-0.5">Senior Stylist</p>
                    </div>
                    <div className="text-right">
                      <p className="font-extrabold text-white text-[14px]">₹{stylistStats.sales.toLocaleString('en-IN')}</p>
                      <p className="text-xs text-amber-400 font-bold flex items-center justify-end gap-0.5 mt-0.5">
                        ★ {stylistStats.rating}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      <span>CAPACITY TARGET</span>
                      <span>{stylistStats.targetProgress}%</span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full rounded-full"
                        style={{ width: `${stylistStats.targetProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
