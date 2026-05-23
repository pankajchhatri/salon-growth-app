'use client'

import React, { useState, useEffect } from 'react'
import { getCustomerHistory, updateCustomerNotes } from '@/app/dashboard/customers/actions'
import type { Customer, Appointment, CustomerSegment } from '@/lib/types'
import { SEGMENT_LABELS, SEGMENT_STYLES } from '@/lib/types'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  X,
  Phone,
  Calendar,
  Star,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MessageSquare,
  Cake,
  Heart,
  FileText,
} from 'lucide-react'

interface CustomerDrawerProps {
  customer: Customer | null
  segment: CustomerSegment | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const STATUS_ICONS: Record<string, React.ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
  confirmed: <Clock className="h-3.5 w-3.5 text-purple-400" />,
  created: <Clock className="h-3.5 w-3.5 text-blue-400" />,
  no_show: <XCircle className="h-3.5 w-3.5 text-rose-400" />,
  cancelled: <XCircle className="h-3.5 w-3.5 text-slate-500" />,
  rescheduled: <RefreshCw className="h-3.5 w-3.5 text-amber-400" />,
}

// ─── Inner content — remounted via key={customer.id} on each new customer ─────
function DrawerContent({
  customer,
  segment,
  onClose,
}: {
  customer: Customer
  segment: CustomerSegment | null
  onClose: () => void
}) {
  const [history, setHistory] = useState<Appointment[]>([])
  const [historyLoaded, setHistoryLoaded] = useState(false)
  // Initialize notes directly from prop — no useEffect needed
  const [notes, setNotes] = useState(customer.notes ?? '')
  const [notesSaved, setNotesSaved] = useState(false)

  // Fetch history once on mount — setState inside async callback is exempt from
  // the set-state-in-effect rule since it is inside a Promise continuation.
  useEffect(() => {
    let cancelled = false
    getCustomerHistory(customer.id).then((data) => {
      if (!cancelled) {
        setHistory(data)
        setHistoryLoaded(true)
      }
    })
    return () => { cancelled = true }
  }, [customer.id])

  const saveNotes = async () => {
    await updateCustomerNotes(customer.id, notes)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  const whatsappRecall = () => {
    const phone = customer.phone.replace(/[^0-9]/g, '')
    const text = encodeURIComponent(
      `Hi ${customer.name.split(' ')[0]}, we miss you at GlowFlow! It has been a while since your last visit. We would love to have you back — reply to book your next appointment. 💜`
    )
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank')
  }

  const daysSinceLastVisit = customer.last_visit_date
    ? Math.floor(
        (new Date().getTime() - new Date(customer.last_visit_date).getTime()) / (1000 * 60 * 60 * 24)
      )
    : null

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <>
      {/* Sticky Header */}
      <SheetHeader className="p-5 border-b border-slate-800/80 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-600/10 shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-white">{customer.name}</SheetTitle>
              <a
                href={`tel:${customer.phone}`}
                className="text-[11px] text-slate-400 flex items-center gap-1 hover:text-white transition-colors"
              >
                <Phone className="h-3 w-3" />
                {customer.phone}
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {segment && (
          <span
            className={`inline-flex w-fit text-[10px] font-bold border px-2.5 py-0.5 rounded-full mt-2 ${SEGMENT_STYLES[segment]}`}
          >
            {SEGMENT_LABELS[segment]}
          </span>
        )}
      </SheetHeader>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPI Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Visits</p>
            <p className="text-xl font-bold text-white mt-0.5">{customer.total_visits}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Total Spend</p>
            <p className="text-base font-bold text-white mt-0.5">
              ₹{(customer.total_spend / 1000).toFixed(1)}k
            </p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-3 text-center">
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">No-Shows</p>
            <p
              className={`text-xl font-bold mt-0.5 ${
                customer.no_show_count > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {customer.no_show_count}
            </p>
          </div>
        </div>

        {/* Quick Info */}
        <div className="space-y-2 text-xs">
          {customer.last_visit_date && (
            <div className="flex items-center justify-between text-slate-400 bg-slate-900/40 border border-slate-800/50 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                Last Visit
              </span>
              <span className="font-semibold text-white">
                {formatDate(customer.last_visit_date)}{' '}
                {daysSinceLastVisit !== null && (
                  <span className="text-slate-500 font-normal">({daysSinceLastVisit}d ago)</span>
                )}
              </span>
            </div>
          )}
          {customer.birthday && (
            <div className="flex items-center justify-between text-slate-400 bg-slate-900/40 border border-slate-800/50 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Cake className="h-3.5 w-3.5 text-pink-400" />
                Birthday
              </span>
              <span className="font-semibold text-white">
                {new Date(customer.birthday).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          )}
          {customer.anniversary && (
            <div className="flex items-center justify-between text-slate-400 bg-slate-900/40 border border-slate-800/50 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Heart className="h-3.5 w-3.5 text-rose-400" />
                Anniversary
              </span>
              <span className="font-semibold text-white">
                {new Date(customer.anniversary).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          )}
          {customer.preferred_staff && (
            <div className="flex items-center justify-between text-slate-400 bg-slate-900/40 border border-slate-800/50 px-3 py-2 rounded-xl">
              <span className="flex items-center gap-1.5">
                <Star className="h-3.5 w-3.5 text-yellow-400" />
                Preferred Stylist
              </span>
              <span className="font-semibold text-white">{customer.preferred_staff.name}</span>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Notes
          </p>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={saveNotes}
            placeholder="Allergies, preferences, special instructions..."
            className="w-full px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none transition-all"
          />
          {notesSaved && (
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Notes saved
            </p>
          )}
        </div>

        {/* WhatsApp Recall */}
        <button
          onClick={whatsappRecall}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/10 transition-all cursor-pointer"
        >
          <MessageSquare className="h-4 w-4" />
          Send WhatsApp Recall Message
        </button>

        {/* Appointment History */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
            Appointment History
          </p>
          {!historyLoaded ? (
            <div className="text-xs text-slate-600 animate-pulse">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-xs text-slate-600">No appointments found.</div>
          ) : (
            <div className="space-y-2">
              {history.map((appt) => (
                <div
                  key={appt.id}
                  className="bg-slate-900/60 border border-slate-800/60 rounded-2xl p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {new Date(appt.start_time).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold capitalize">
                      {STATUS_ICONS[appt.status]}
                      <span className="text-slate-400">{appt.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  {appt.services?.map((sl) => (
                    <p key={sl.service_id} className="text-[10px] text-slate-400">
                      {sl.service?.name ?? 'Service'} — ₹{sl.price.toLocaleString('en-IN')}
                    </p>
                  ))}
                  {appt.staff && (
                    <p className="text-[10px] text-slate-500">with {appt.staff.name}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// ─── Outer shell — manages Sheet open state, remounts inner content per customer
export default function CustomerDrawer({
  customer,
  segment,
  open,
  onOpenChange,
}: CustomerDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-md bg-slate-950 border-l border-slate-800 text-white p-0 flex flex-col overflow-hidden"
      >
        {customer && (
          // key forces full remount when customer changes — avoids useState-in-effect
          <DrawerContent
            key={customer.id}
            customer={customer}
            segment={segment}
            onClose={() => onOpenChange(false)}
          />
        )}
      </SheetContent>
    </Sheet>
  )
}
