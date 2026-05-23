'use client'

import React, { useState, useTransition, useEffect } from 'react'
import type { Customer, Service, StaffProfile, Appointment, AppointmentStatus } from '@/lib/types'
import { updateAppointmentStatus, rescheduleAppointment } from './actions'
import AppointmentDialog from '@/components/appointments/AppointmentDialog'
import {
  Calendar as CalendarIcon,
  List,
  Plus,
  Clock,
  User,
  Scissors,
  Check,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Loader2
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useRouter, useSearchParams } from 'next/navigation'

interface AppointmentsClientProps {
  currentUser: {
    id: string
    role: string
    displayName: string
    salonName: string
    staffProfileId?: string
  }
  initialAppointments: Appointment[]
  staffList: StaffProfile[]
  servicesList: Service[]
  customersList: Customer[]
}

export default function AppointmentsClient({
  currentUser,
  initialAppointments,
  staffList,
  servicesList,
  customersList,
}: AppointmentsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })
  
  // Mounted state for client-only rendering of absolute items to avoid timezone mismatches
  const [isMounted, setIsMounted] = useState(false)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Modals state
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)

  // Listen to search params to open dialog
  useEffect(() => {
    if (searchParams && searchParams.get('new') === 'true') {
      setBookingDialogOpen(true)
      const params = new URLSearchParams(searchParams.toString())
      params.delete('new')
      const query = params.toString()
      router.replace(`/dashboard/appointments${query ? `?${query}` : ''}`)
    }
  }, [searchParams, router])
  
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null)
  
  // Pre-fill parameters for slot clicks
  const [prefilledStaff, setPrefilledStaff] = useState<string | undefined>(undefined)
  const [prefilledTime, setPrefilledTime] = useState<string | undefined>(undefined)
  
  // Reschedule form state
  const [rescheduleDate, setRescheduleDate] = useState('')
  const [rescheduleStartTime, setRescheduleStartTime] = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError] = useState<string | null>(null)

  const [isPending, startTransition] = useTransition()
  const isStylist = currentUser.role === 'stylist'

  // Date controls
  const handlePrevDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() - 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleNextDay = () => {
    const d = new Date(selectedDate)
    d.setDate(d.getDate() + 1)
    setSelectedDate(d.toISOString().split('T')[0])
  }

  const handleSetToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0])
  }

  // Filter appointments for the selected date
  const appointmentsForDate = initialAppointments.filter((appt) => {
    const apptDate = new Date(appt.start_time).toISOString().split('T')[0]
    return apptDate === selectedDate
  })

  // Handle slot click in Daily Calendar
  const handleSlotClick = (staffId: string, timeStr: string) => {
    if (isStylist) return // stylists cannot book
    setPrefilledStaff(staffId)
    setPrefilledTime(timeStr)
    setBookingDialogOpen(true)
  }

  // Handle Quick Status Action
  const handleStatusChange = async (appointmentId: string, status: AppointmentStatus) => {
    if (isStylist) return
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointmentId, status)
      if (result.success) {
        router.refresh()
      } else {
        alert(result.error ?? 'Failed to update status.')
      }
    })
  }

  // Handle Reschedule Dialog Open
  const openRescheduleModal = (appt: Appointment) => {
    if (isStylist) return
    setRescheduleTarget(appt)
    setRescheduleDate(new Date(appt.start_time).toISOString().split('T')[0])
    
    // Parse time
    const localDate = new Date(appt.start_time)
    const h = String(localDate.getHours()).padStart(2, '0')
    const m = String(localDate.getMinutes()).padStart(2, '0')
    setRescheduleStartTime(`${h}:${m}`)
    setRescheduleError(null)
    setRescheduleDialogOpen(true)
  }

  // Submit Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!rescheduleTarget) return
    setRescheduleLoading(true)
    setRescheduleError(null)

    // Calculate end time using service duration
    const serviceDuration = rescheduleTarget.services?.[0]?.service?.duration_minutes || 30
    const startObj = new Date(`${rescheduleDate}T${rescheduleStartTime}:00`)
    const endObj = new Date(startObj.getTime() + serviceDuration * 60 * 1000)

    const result = await rescheduleAppointment(
      rescheduleTarget.id,
      startObj.toISOString(),
      endObj.toISOString()
    )

    setRescheduleLoading(false)
    if (!result.success) {
      setRescheduleError(result.error ?? 'Reschedule failed.')
      return
    }

    setRescheduleDialogOpen(false)
    setRescheduleTarget(null)
    router.refresh()
  }

  // Status Styling Helpers
  const getStatusStyle = (status: AppointmentStatus) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_0_15px_rgba(16,185,129,0.02)]'
      case 'confirmed': return 'bg-purple-500/10 border-purple-500/25 text-purple-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03),0_0_15px_rgba(168,85,247,0.02)]'
      case 'created': return 'bg-blue-500/10 border-blue-500/25 text-blue-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]'
      case 'rescheduled': return 'bg-amber-500/10 border-amber-500/25 text-amber-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]'
      case 'no_show': return 'bg-rose-500/10 border-rose-500/25 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.03)]'
      case 'cancelled': return 'bg-slate-900/60 border-slate-800 text-slate-500'
      default: return 'bg-slate-900 border-slate-800 text-slate-300'
    }
  }

  // Calendar Placement Helpers
  const startHour = 9  // 9:00 AM
  const endHour = 21   // 9:00 PM
  const totalMinutes = (endHour - startHour) * 60 // 720 minutes
  const rowHeight = 46 // px per 30-minutes, so 92px per hour
  const slotHeight = 23 // px per 15-minutes, so 92px per hour

  // Timezone helper to get date details in Asia/Kolkata (Salon's default timezone)
  const getSalonTimeDetails = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const timeStr = formatter.format(date) // e.g. "15:30"
      const [hStr, mStr] = timeStr.split(':')
      return {
        h: parseInt(hStr, 10),
        m: parseInt(mStr, 10)
      }
    } catch (e) {
      // Fallback
      const d = new Date(isoString)
      return { h: d.getHours(), m: d.getMinutes() }
    }
  }

  const getMinuteOffset = (isoString: string) => {
    const { h, m } = getSalonTimeDetails(isoString)
    const offset = (h - startHour) * 60 + m
    return Math.max(0, Math.min(totalMinutes, offset))
  }

  const getDurationMinutes = (startIso: string, endIso: string) => {
    const diff = new Date(endIso).getTime() - new Date(startIso).getTime()
    return Math.max(15, Math.floor(diff / (1000 * 60)))
  }

  const formatTimeRange = (startIso: string, endIso: string) => {
    const formatTime = (iso: string) => {
      const { h, m } = getSalonTimeDetails(iso)
      const ampm = h >= 12 ? 'PM' : 'AM'
      let displayHour = h % 12
      displayHour = displayHour ? displayHour : 12
      const minStr = m < 10 ? '0' + m : m
      return `${displayHour}:${minStr} ${ampm}`
    }
    return `${formatTime(startIso)} - ${formatTime(endIso)}`
  }

  // Generate slots for display on the left side
  const timeLabels: string[] = []
  for (let h = startHour; h < endHour; h++) {
    const dispHour = h > 12 ? h - 12 : h
    const ampm = h >= 12 ? 'PM' : 'AM'
    timeLabels.push(`${dispHour}:00 ${ampm}`)
    timeLabels.push(`${dispHour}:30 ${ampm}`)
  }

  // Generate 15-minute grid slots
  interface GridSlot {
    timeStr: string;
    isMajor: boolean;
    isHalf: boolean;
    minutesFromStart: number;
  }
  const gridSlots: GridSlot[] = []
  for (let h = startHour; h < endHour; h++) {
    for (let m of [0, 15, 30, 45]) {
      gridSlots.push({
        timeStr: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`,
        isMajor: m === 0,
        isHalf: m === 30,
        minutesFromStart: (h - startHour) * 60 + m,
      })
    }
  }

  // Filter columns of staff. Stylists only see themselves.
  const visibleStaff = isStylist
    ? staffList.filter((s) => s.id === currentUser.staffProfileId)
    : staffList

  // Format date nicely
  const formattedDate = new Date(selectedDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  // Options for time slots in reschedule
  const generateRescheduleSlots = () => {
    const slots = []
    for (let h = 9; h <= 20; h++) {
      const hStr = String(h).padStart(2, '0')
      slots.push(`${hStr}:00`)
      slots.push(`${hStr}:30`)
    }
    return slots
  }

  return (
    <div className="space-y-6 relative z-10">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Appointments Book
            {isPending && <Loader2 className="h-4 w-4 animate-spin text-purple-400" />}
          </h2>
          <p className="text-sm text-slate-400 mt-1.5">
            {isStylist
              ? 'View your assigned appointment book and calendar slots.'
              : 'Schedule and manage client bookings, walk-ins, and stylist shifts.'}
          </p>
        </div>
        {!isStylist && (
          <button
            onClick={() => {
              setPrefilledStaff(undefined)
              setPrefilledTime(undefined)
              setBookingDialogOpen(true)
            }}
            className="px-5 py-2.5 glow-cta glow-cta-hover text-white rounded-xl text-sm font-bold shadow-lg transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>New Appointment</span>
          </button>
        )}
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-slate-900/40 backdrop-blur-xl border border-slate-900/60 p-2.5 rounded-2xl shadow-inner">
        {/* Toggle list/calendar */}
        <div className="bg-slate-950/80 border border-slate-900/60 p-1 rounded-xl flex gap-1 self-start shadow-inner">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'calendar'
                ? 'bg-slate-900 text-white border border-slate-800 shadow-[0_1px_1px_rgba(255,255,255,0.05)]'
                : 'text-slate-450 hover:text-slate-200 border border-transparent'
            }`}
          >
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white border border-slate-800 shadow-[0_1px_1px_rgba(255,255,255,0.05)]'
                : 'text-slate-455 hover:text-slate-200 border border-transparent'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            <span>List Log</span>
          </button>
        </div>

        {/* Date Selector */}
        <div className="flex items-center justify-between sm:justify-end gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 border border-slate-900 hover:border-slate-800 text-slate-450 hover:text-white rounded-xl bg-slate-950/60 transition-all cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handleSetToday}
            className="px-3 py-2 text-xs font-semibold text-slate-350 hover:text-white border border-slate-900 hover:border-slate-800 rounded-xl bg-slate-950/60 transition-all cursor-pointer"
          >
            Today
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
          />
          <button
            onClick={handleNextDay}
            className="p-2 border border-slate-900 hover:border-slate-800 text-slate-450 hover:text-white rounded-xl bg-slate-950/60 transition-all cursor-pointer"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'calendar' ? (
        /* ──── CALENDAR VIEW ──── */
        <div className="glass-card rounded-3xl overflow-hidden">
          {/* Calendar Header with Selected Date */}
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/30 flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formattedDate}
            </span>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-900/50 border border-slate-700/60 px-2 py-0.5 rounded-full select-none">
              {appointmentsForDate.length} Bookings Scheduled
            </span>
          </div>

          <div className="relative flex overflow-x-auto min-h-[600px]">
            {/* Timeline hour axis */}
            <div 
              className="w-20 shrink-0 border-r border-slate-800 bg-slate-950/15 flex flex-col pt-[50px] relative select-none"
              style={{ height: `${50 + timeLabels.length * rowHeight}px` }}
            >
              {timeLabels.map((label, idx) => (
                <div
                  key={idx}
                  style={{ height: `${rowHeight}px`, flexShrink: 0 }}
                  className="pr-4 text-[9px] font-bold text-slate-500 text-right flex items-start justify-end shrink-0 relative"
                >
                  <div className="relative -top-2 flex items-center justify-end">
                    {idx % 2 === 0 ? label.split(' ')[0] : ''} {/* Only print full hours */}
                    <span className="ml-0.5 text-[7px] text-slate-650">{idx % 2 === 0 ? label.split(' ')[1] : ''}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Staff columns grid */}
            <div className="flex-1 flex min-w-[600px] relative">
              {/* Current Time Indicator Line */}
              {(() => {
                const getSalonTodayDate = () => {
                  try {
                    const formatter = new Intl.DateTimeFormat('en-CA', {
                      timeZone: 'Asia/Kolkata',
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                    })
                    return formatter.format(new Date())
                  } catch (e) {
                    return new Date().toISOString().split('T')[0]
                  }
                }
                
                const isToday = selectedDate === getSalonTodayDate()
                if (!isToday || !isMounted) return null

                // Current time in Asia/Kolkata
                const now = new Date()
                const { h, m } = getSalonTimeDetails(now.toISOString())
                
                if (h >= startHour && h < endHour) {
                  const currentMinutes = (h - startHour) * 60 + m
                  const currentTopPx = 50 + (currentMinutes * (slotHeight / 15))
                  
                  return (
                    <div 
                      className="absolute left-0 right-0 border-t-2 border-rose-500/80 z-30 pointer-events-none flex items-center"
                      style={{ top: `${currentTopPx}px` }}
                    >
                      <div className="bg-rose-500 text-white text-[7.5px] font-extrabold px-1.5 py-0.5 rounded-r shadow-md">
                        {h > 12 ? h - 12 : h}:{String(m).padStart(2, '0')} {h >= 12 ? 'PM' : 'AM'}
                      </div>
                    </div>
                  )
                }
                return null
              })()}

              {visibleStaff.map((staff) => {
                const staffAppointments = appointmentsForDate.filter(
                  (a) => a.staff_id === staff.id
                )

                return (
                  <div
                    key={staff.id}
                    className="flex-1 min-w-[150px] border-r border-slate-800 relative last:border-r-0"
                  >
                    {/* Staff Sticky Header */}
                    <div className="h-[50px] border-b border-slate-800 bg-slate-950/40 px-3 flex flex-col justify-center items-center select-none sticky top-0 z-10 backdrop-blur-md">
                      <span className="text-xs font-bold text-slate-200">{staff.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{staff.role_title}</span>
                    </div>

                    {/* Timeline slots */}
                    <div 
                      className="relative"
                      style={{ height: `${gridSlots.length * slotHeight}px` }}
                    >
                      {gridSlots.map((slot, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            if (isStylist) return
                            handleSlotClick(staff.id, slot.timeStr)
                          }}
                          style={{ height: `${slotHeight}px` }}
                          className={`hover:bg-purple-500/[0.02] transition-colors relative ${
                            isStylist ? 'cursor-default' : 'cursor-pointer'
                          } ${
                            slot.isMajor 
                              ? 'border-b border-slate-800/75' 
                              : slot.isHalf
                                ? 'border-b border-slate-850/40'
                                : 'border-b border-dashed border-slate-900/15'
                          }`}
                        />
                      ))}

                      {/* Absolute-positioned appointments cards */}
                      {isMounted && staffAppointments.map((appt) => {
                        const topOffset = getMinuteOffset(appt.start_time)
                        const duration = getDurationMinutes(appt.start_time, appt.end_time)
                        
                        const topPx = topOffset * (slotHeight / 15)
                        const heightPx = duration * (slotHeight / 15)

                        const customerName = appt.customer?.name || 'Walk In Customer'
                        const serviceNames = appt.services?.map(s => s.service?.name).join(', ') || 'Service'

                        // Debug validation log
                        console.log(`[DEBUG_ALIGNMENT] ${appt.id} (${customerName}):`, {
                          startTime: appt.start_time,
                          formattedRange: formatTimeRange(appt.start_time, appt.end_time),
                          topOffsetMinutes: topOffset,
                          durationMinutes: duration,
                          computedTopPx: `${topPx}px`,
                          computedHeightPx: `${heightPx}px`,
                        })

                        return (
                          <div
                            key={appt.id}
                            style={{
                              top: `${topPx}px`,
                              height: `${heightPx}px`,
                            }}
                            className={`absolute left-[2px] right-[2px] p-2 rounded-lg border flex flex-col justify-between transition-all hover:scale-[1.01] hover:shadow-xl z-20 ${getStatusStyle(
                              appt.status
                            )}`}
                            title={`Debug: startOffset=${topOffset}m, top=${Math.round(topPx)}px, height=${Math.round(heightPx)}px`}
                          >
                            <div className="overflow-hidden min-h-0 flex-1">
                              {/* Customer Name */}
                              <div className="text-[10px] font-bold truncate text-slate-100 flex items-center gap-1">
                                <User className="h-2.5 w-2.5 opacity-60 shrink-0" />
                                <span className="truncate">{customerName}</span>
                              </div>
                              {/* Time Range */}
                              <div className="text-[8px] font-bold opacity-75 mt-0.5 text-slate-350">
                                {formatTimeRange(appt.start_time, appt.end_time)}
                              </div>
                              {/* Service Name */}
                              {duration > 30 && (
                                <div className="text-[9px] opacity-75 truncate mt-1 flex items-center gap-1 font-semibold">
                                  <Scissors className="h-2.5 w-2.5 opacity-60 shrink-0" />
                                  <span className="truncate">{serviceNames}</span>
                                </div>
                              )}
                            </div>

                            {/* bottom row info */}
                            {duration > 30 && (
                              <div className="flex justify-between items-center mt-1 pt-1 border-t border-white/5 shrink-0">
                                <span className="text-[7.5px] font-extrabold opacity-80 uppercase tracking-wider">
                                  {appt.status.replace('_', ' ')}
                                </span>
                                {!isStylist && appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                  <div className="flex items-center gap-1 bg-slate-950/40 p-0.5 rounded-md border border-white/5">
                                    {appt.status === 'created' && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          handleStatusChange(appt.id, 'confirmed')
                                        }}
                                        title="Confirm"
                                        className="p-0.5 hover:bg-purple-500/20 rounded text-emerald-400 cursor-pointer"
                                      >
                                        <Check className="h-3 w-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openRescheduleModal(appt)
                                      }}
                                      title="Reschedule"
                                      className="p-0.5 hover:bg-purple-500/20 rounded text-amber-400 cursor-pointer"
                                    >
                                      <Clock className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(appt.id, 'completed')
                                      }}
                                      title="Complete"
                                      className="p-0.5 hover:bg-purple-500/20 rounded text-purple-400 cursor-pointer"
                                    >
                                      <Check className="h-3 w-3" />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        handleStatusChange(appt.id, 'no_show')
                                      }}
                                      title="No-Show"
                                      className="p-0.5 hover:bg-purple-500/20 rounded text-rose-450 cursor-pointer"
                                    >
                                      <AlertTriangle className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      ) : (
        /* ──── LIST VIEW ──── */
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-900/60 bg-slate-950/30 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Booking Log — {formattedDate}
            </h3>
            <span className="text-[10px] text-slate-500 font-bold bg-slate-900/50 border border-slate-850 px-2 py-0.5 rounded-full">
              Showing {appointmentsForDate.length} Bookings
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900/50 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-950/20">
                  <th className="py-4.5 px-6">Customer</th>
                  <th className="py-4 px-6">Service</th>
                  <th className="py-4 px-6">Stylist</th>
                  <th className="py-4 px-6">Time / Duration</th>
                  <th className="py-4 px-6">Source</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Est. Price</th>
                  {!isStylist && <th className="py-4 px-6 text-center">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/40 text-sm text-slate-300">
                {appointmentsForDate.length === 0 ? (
                  <tr>
                    <td colSpan={isStylist ? 7 : 8} className="py-8 px-6 text-center text-slate-500 italic">
                      No appointments scheduled for this date.
                    </td>
                  </tr>
                ) : (
                  appointmentsForDate.map((appt) => {
                    const startLocal = new Date(appt.start_time)
                    const duration = getDurationMinutes(appt.start_time, appt.end_time)
                    
                    const timeStr = startLocal.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    const totalAmt = appt.services?.reduce((sum, s) => sum + s.price, 0) || 0
                    const customerName = appt.customer?.name || 'Walk In Customer'
                    const customerPhone = appt.customer?.phone || 'No Phone'
                    const serviceNames = appt.services?.map(s => s.service?.name).join(', ') || 'Service'

                    return (
                      <tr key={appt.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="py-4 px-6 font-bold text-slate-200">
                          <div>{customerName}</div>
                          <div className="text-[10px] text-slate-550 font-semibold mt-0.5">{customerPhone}</div>
                        </td>
                        <td className="py-4 px-6 font-semibold">{serviceNames}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[10px] text-indigo-400 font-bold border border-indigo-500/15">
                              {appt.staff?.name.charAt(0)}
                            </div>
                            <span className="font-semibold">{appt.staff?.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-500" />
                            <span className="font-semibold">{timeStr}</span>
                            <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded-md font-bold select-none">
                              {duration}m
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6 capitalize font-semibold text-slate-400">
                          {appt.source.replace('_', ' ')}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold border capitalize tracking-wider select-none ${getStatusStyle(appt.status)}`}>
                            {appt.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-extrabold text-white">
                          ₹{totalAmt.toLocaleString('en-IN')}
                        </td>
                        {!isStylist && (
                          <td className="py-4 px-6">
                            <div className="flex justify-center items-center gap-1">
                              {appt.status === 'created' && (
                                <button
                                  onClick={() => handleStatusChange(appt.id, 'confirmed')}
                                  className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                >
                                  Confirm
                                </button>
                              )}
                              {appt.status !== 'completed' && appt.status !== 'cancelled' && appt.status !== 'no_show' && (
                                <>
                                  <button
                                    onClick={() => openRescheduleModal(appt)}
                                    className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(appt.id, 'completed')}
                                    className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(appt.id, 'no_show')}
                                    className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-355 hover:bg-rose-500/20 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    No-Show
                                  </button>
                                  <button
                                    onClick={() => handleStatusChange(appt.id, 'cancelled')}
                                    className="px-2.5 py-1 bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-850 text-[9px] font-bold rounded-lg transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              )}
                              {(appt.status === 'completed' || appt.status === 'cancelled' || appt.status === 'no_show') && (
                                <span className="text-[10px] text-slate-500 font-semibold italic">Resolved</span>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Booking Scheduling Dialog */}
      {bookingDialogOpen && (
        <AppointmentDialog
          open={bookingDialogOpen}
          onOpenChange={setBookingDialogOpen}
          staffList={staffList}
          servicesList={servicesList}
          customersList={customersList}
          existingAppointments={initialAppointments}
          prefilledStaffId={prefilledStaff}
          prefilledDate={selectedDate}
          prefilledTime={prefilledTime}
          onSuccess={() => {
            router.refresh()
          }}
        />
      )}

      {/* Reschedule Dialog Modal */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent className="bg-slate-950 border border-slate-900 text-white max-w-sm rounded-3xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          <DialogHeader className="relative z-10">
            <DialogTitle className="text-sm font-bold text-white uppercase tracking-wider">Reschedule Appointment</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleRescheduleSubmit} className="space-y-4 pt-2 relative z-10">
            <div>
              <label className="block text-[9px] font-bold text-slate-550 uppercase tracking-wider mb-1">
                New Date
              </label>
              <input
                required
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-slate-550 uppercase tracking-wider mb-1">
                New Start Time
              </label>
              <select
                required
                value={rescheduleStartTime}
                onChange={(e) => setRescheduleStartTime(e.target.value)}
                className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
              >
                {generateRescheduleSlots().map((slot) => (
                  <option key={slot} value={slot} className="bg-slate-950">
                    {slot}
                  </option>
                ))}
              </select>
            </div>

            {rescheduleError && (
              <p className="text-xs text-rose-350 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-xl">
                {rescheduleError}
              </p>
            )}

            <DialogFooter className="gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRescheduleDialogOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-205 border border-slate-900 rounded-xl hover:bg-slate-900/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rescheduleLoading}
                className="px-4 py-2 bg-gradient-to-r from-amber-600 to-yellow-600 hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {rescheduleLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                Save Changes
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  )
}
