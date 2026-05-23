'use client'

import React, { useState, useMemo } from 'react'
import type { Customer, CustomerSegment, StaffProfile } from '@/lib/types'
import { computeSegment, SEGMENT_LABELS, SEGMENT_STYLES } from '@/lib/types'
import AddCustomerDialog from '@/components/customers/AddCustomerDialog'
import CustomerDrawer from '@/components/customers/CustomerDrawer'
import { Plus, Search, Calendar, AlertTriangle } from 'lucide-react'

type FilterSegment =
  | 'all'
  | 'vip'
  | 'churn_risk_90'
  | 'churn_risk_60'
  | 'high_no_show'
  | 'birthday_this_month'
  | 'new'

const FILTER_TABS: { key: FilterSegment; label: string }[] = [
  { key: 'all', label: 'All Clients' },
  { key: 'vip', label: 'VIP' },
  { key: 'new', label: 'New' },
  { key: 'churn_risk_90', label: 'Lost 90d+' },
  { key: 'churn_risk_60', label: 'Churn Risk' },
  { key: 'high_no_show', label: 'No-Show Risk' },
  { key: 'birthday_this_month', label: '🎂 Birthdays' },
]

interface CustomersClientProps {
  initialCustomers: Customer[]
  staffList: Pick<StaffProfile, 'id' | 'name' | 'role_title'>[]
}

export default function CustomersClient({ initialCustomers, staffList }: CustomersClientProps) {
  const customers = initialCustomers
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState<FilterSegment>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Augment customers with their computed segment
  const customersWithSegments = useMemo(
    () => customers.map((c) => ({ ...c, _segment: computeSegment(c) as CustomerSegment })),
    [customers]
  )

  // Apply search + segment filter
  const filtered = useMemo(() => {
    return customersWithSegments.filter((c) => {
      const matchSearch =
        !searchQuery ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
      const matchFilter =
        activeFilter === 'all' || c._segment === activeFilter
      return matchSearch && matchFilter
    })
  }, [customersWithSegments, searchQuery, activeFilter])

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer)
    setDrawerOpen(true)
  }

  const handleSuccess = () => window.location.reload()

  const formatDate = (d?: string) =>
    d
      ? new Date(d).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : '—'

  return (
    <div className="space-y-6 relative z-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            Customer Directory
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            Manage client profiles, service history, and retention segments.
          </p>
        </div>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="px-5 py-2.5 glow-cta glow-cta-hover text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search and Filters box */}
      <div className="space-y-4 bg-slate-900/40 border border-slate-900/60 p-5 rounded-2xl shadow-inner">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="Search client database by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 glass-input glass-input-focus rounded-xl text-sm"
          />
        </div>

        {/* Segment Filter Tabs */}
        <div className="flex gap-2 flex-wrap pt-1">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.key === 'all'
                ? customers.length
                : customersWithSegments.filter((c) => c._segment === tab.key).length
            const isTabActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveFilter(tab.key)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                  isTabActive
                    ? 'bg-purple-500/10 text-purple-300 border-purple-500/25 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_0_10px_rgba(168,85,247,0.02)] font-extrabold'
                    : 'bg-slate-950/60 text-slate-400 border-slate-900 hover:text-slate-200'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold select-none ${
                      isTabActive ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Directory Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/20">
                <th className="py-4.5 px-6">Customer</th>
                <th className="py-4.5 px-6 text-center">Visits</th>
                <th className="py-4.5 px-6 text-center">Total Spend</th>
                <th className="py-4.5 px-6">Last Visit</th>
                <th className="py-4.5 px-6 text-center">No-Shows</th>
                <th className="py-4.5 px-6">Segment</th>
                <th className="py-4.5 px-6">Preferred Stylist</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-sm text-slate-300">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-550 italic">
                    No customers match your search or filter.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => handleRowClick(cust)}
                    className="hover:bg-white/[0.01] transition-colors cursor-pointer"
                  >
                    <td className="py-4 px-6 font-bold">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-purple-600/60 to-indigo-600/60 flex items-center justify-center text-xs text-white font-extrabold shrink-0 shadow-sm shadow-purple-500/10">
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-slate-200 text-sm font-bold">{cust.name}</div>
                          <div className="text-xs text-slate-400 font-semibold mt-0.5">{cust.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center font-bold">{cust.total_visits}</td>
                    <td className="py-4 px-6 text-center font-extrabold text-white">
                      ₹{cust.total_spend.toLocaleString('en-IN')}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-slate-400 font-semibold">
                        <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                        <span>{formatDate(cust.last_visit_date)}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-center">
                      {cust.no_show_count > 0 ? (
                        <span className="text-rose-400 font-bold flex items-center justify-center gap-1 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-lg select-none">
                          <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                          {cust.no_show_count}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-bold">0</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-3 py-1 rounded-full text-[11px] font-bold border uppercase tracking-wider select-none ${SEGMENT_STYLES[cust._segment]}`}
                      >
                        {SEGMENT_LABELS[cust._segment]}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {cust.preferred_staff ? (
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-md bg-indigo-500/10 flex items-center justify-center text-[11px] text-indigo-400 font-bold shrink-0 border border-indigo-500/15">
                            {cust.preferred_staff.name.charAt(0)}
                          </div>
                          <span className="text-slate-300 font-semibold text-sm">{cust.preferred_staff.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-slate-900/50 text-xs font-semibold text-slate-450 bg-slate-950/10">
          Showing {filtered.length} of {customers.length} profiles · Click row to open details panel
        </div>
      </div>

      {/* Add Customer Dialog */}
      <AddCustomerDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        staffList={staffList}
        onSuccess={handleSuccess}
      />

      {/* Customer Drawer */}
      <CustomerDrawer
        customer={selectedCustomer}
        segment={selectedCustomer ? computeSegment(selectedCustomer) : null}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  )
}
