'use client'

import React, { useState } from 'react'
import type { Customer, Service, StaffProfile, BookingSource, Appointment } from '@/lib/types'
import { createCustomer } from '@/app/dashboard/customers/actions'
import { createAppointment } from '@/app/dashboard/appointments/actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Loader2, UserPlus, AlertCircle } from 'lucide-react'

interface AppointmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  staffList: StaffProfile[]
  servicesList: Service[]
  customersList: Customer[]
  existingAppointments: Appointment[]
  onSuccess: () => void
  prefilledStaffId?: string
  prefilledDate?: string
  prefilledTime?: string
}

export default function AppointmentDialog({
  open,
  onOpenChange,
  staffList,
  servicesList,
  customersList,
  existingAppointments,
  onSuccess,
  prefilledStaffId,
  prefilledDate,
  prefilledTime,
}: AppointmentDialogProps) {
  // Local quick-added customers list to append to props
  const [addedCustomers, setAddedCustomers] = useState<Customer[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [showQuickAdd, setShowQuickAdd] = useState(false)

  // Main Form state (initialized with prefilled values or defaults)
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState(servicesList[0]?.id || '')
  const [selectedStaffId, setSelectedStaffId] = useState(prefilledStaffId || staffList[0]?.id || '')
  const [bookingDate, setBookingDate] = useState(prefilledDate || new Date().toISOString().split('T')[0])
  const [startTime, setStartTime] = useState(prefilledTime || '10:00')
  const [bookingSource, setBookingSource] = useState<BookingSource>('walk_in')
  const [notes, setNotes] = useState('')

  // Quick Add customer state
  const [qaName, setQaName] = useState('')
  const [qaPhone, setQaPhone] = useState('')
  const [qaLoading, setQaLoading] = useState(false)
  const [qaError, setQaError] = useState<string | null>(null)

  // Operations state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Combined customers list
  const allCustomers = [...customersList, ...addedCustomers]

  // Generate 30-minute time slots (09:00 to 20:30)
  const generateTimeSlots = () => {
    const slots = []
    for (let hour = 9; hour <= 20; hour++) {
      const hourStr = String(hour).padStart(2, '0')
      slots.push(`${hourStr}:00`)
      slots.push(`${hourStr}:30`)
    }
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Find selected service object
  const selectedService = servicesList.find((s) => s.id === selectedServiceId)

  // Derive End Time during render
  let endTime = ''
  if (startTime && selectedService) {
    const [h, m] = startTime.split(':').map(Number)
    const duration = selectedService.duration_minutes
    const totalMinutes = h * 60 + m + duration
    const endH = Math.floor(totalMinutes / 60) % 24
    const endM = totalMinutes % 60
    endTime = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
  }

  // Derive Availability Warning during render
  let availabilityWarning: string | null = null
  if (selectedStaffId && bookingDate && startTime && endTime) {
    const checkStart = new Date(`${bookingDate}T${startTime}:00`).getTime()
    const checkEnd = new Date(`${bookingDate}T${endTime}:00`).getTime()

    if (!isNaN(checkStart) && !isNaN(checkEnd) && checkStart < checkEnd) {
      const overlaps = existingAppointments.some((appt) => {
        if (appt.staff_id !== selectedStaffId) return false
        if (appt.status === 'cancelled') return false

        const apptStart = new Date(appt.start_time).getTime()
        const apptEnd = new Date(appt.end_time).getTime()

        return apptStart < checkEnd && apptEnd > checkStart
      })

      if (overlaps) {
        const staffName = staffList.find((s) => s.id === selectedStaffId)?.name || 'Selected staff'
        availabilityWarning = `${staffName} has another booking during this slot (${startTime} - ${endTime}).`
      }
    }
  }

  // Handle Quick Add Customer
  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qaName.trim() || !qaPhone.trim()) {
      setQaError('Name and phone number are required.')
      return
    }
    setQaLoading(true)
    setQaError(null)

    const result = await createCustomer({
      name: qaName.trim(),
      phone: qaPhone.trim(),
    })

    setQaLoading(false)
    if (!result.success) {
      setQaError(result.error ?? 'Failed to add customer.')
      return
    }

    // Refresh local customers list with the new customer
    const newCust: Customer = {
      id: `cust-temp-${Date.now()}`,
      salon_id: 'temp',
      name: qaName.trim(),
      phone: qaPhone.trim(),
      no_show_count: 0,
      total_visits: 0,
      total_spend: 0,
      created_at: new Date().toISOString(),
    }

    setAddedCustomers((prev) => [...prev, newCust])
    setSelectedCustomerId(newCust.id)
    setShowQuickAdd(false)
    setQaName('')
    setQaPhone('')
  }

  // Handle Submit Booking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomerId) {
      setError('Please select a customer.')
      return
    }
    if (!selectedServiceId) {
      setError('Please select a service.')
      return
    }
    if (!selectedStaffId) {
      setError('Please select a stylist.')
      return
    }
    if (!bookingDate || !startTime || !endTime) {
      setError('Please specify slot date and time.')
      return
    }

    setLoading(true)
    setError(null)

    const startIso = new Date(`${bookingDate}T${startTime}:00`).toISOString()
    const endIso = new Date(`${bookingDate}T${endTime}:00`).toISOString()

    const result = await createAppointment({
      customerId: selectedCustomerId.startsWith('cust-temp-') 
        ? allCustomers.find(c => c.phone === allCustomers.find(lc => lc.id === selectedCustomerId)?.phone)?.id || selectedCustomerId 
        : selectedCustomerId,
      serviceId: selectedServiceId,
      staffId: selectedStaffId,
      startTime: startIso,
      endTime: endIso,
      source: bookingSource,
      notes: notes || undefined,
    })

    setLoading(false)
    if (!result.success) {
      setError(result.error ?? 'Failed to book appointment.')
      return
    }

    onSuccess()
    onOpenChange(false)
  }

  // Filter customers by search input
  const filteredCustomers = allCustomers.filter(
    (c) =>
      c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      c.phone.includes(customerSearch)
  )

  const labelClass = 'block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-950 border border-slate-900 text-white max-w-xl rounded-3xl shadow-2xl overflow-hidden">
        {/* Decorative backdrop light */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/5 via-transparent to-transparent pointer-events-none" />

        <DialogHeader className="relative z-10 border-b border-slate-900/60 pb-3 mb-1">
          <DialogTitle className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Schedule New Booking
          </DialogTitle>
        </DialogHeader>

        {showQuickAdd ? (
          /* Inline Quick Add Customer Form */
          <form onSubmit={handleQuickAdd} className="space-y-4 py-2 relative z-10">
            <div className="bg-slate-900/25 border border-slate-900/60 p-4 rounded-2xl space-y-3 shadow-inner">
              <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1">
                New Customer Profile
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Customer Name</label>
                  <input
                    required
                    value={qaName}
                    onChange={(e) => setQaName(e.target.value)}
                    placeholder="e.g. Priya Sen"
                    className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number</label>
                  <input
                    required
                    value={qaPhone}
                    onChange={(e) => setQaPhone(e.target.value)}
                    placeholder="e.g. +91 98765 43210"
                    className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                  />
                </div>
              </div>
              {qaError && <p className="text-[10px] font-semibold text-rose-400">{qaError}</p>}
            </div>

            <DialogFooter className="gap-2">
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 border border-slate-900 rounded-xl hover:bg-slate-900/50 transition-all cursor-pointer"
              >
                Back to Booking
              </button>
              <button
                type="submit"
                disabled={qaLoading}
                className="px-4 py-2 glow-cta glow-cta-hover text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {qaLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Add Profile
              </button>
            </DialogFooter>
          </form>
        ) : (
          /* Main Appointment Scheduling Form */
          <form onSubmit={handleSubmit} className="space-y-4 pt-2 relative z-10">
            {/* Customer Search & Select */}
            <div className="bg-slate-900/20 border border-slate-900/60 p-3.5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className={labelClass}>Select Customer</label>
                <button
                  type="button"
                  onClick={() => setShowQuickAdd(true)}
                  className="text-[9px] text-purple-400 font-bold hover:text-purple-300 flex items-center gap-1 cursor-pointer transition-colors uppercase tracking-wider"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>+ Quick Add Customer</span>
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder="Filter name/phone..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs col-span-1"
                />
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs col-span-2"
                >
                  <option value="" className="bg-slate-950">
                    -- Select Customer ({filteredCustomers.length} matching) --
                  </option>
                  {filteredCustomers.map((c) => (
                    <option key={c.id} value={c.id} className="bg-slate-950">
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Service & Stylist */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Select Service</label>
                <select
                  required
                  value={selectedServiceId}
                  onChange={(e) => setSelectedServiceId(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                >
                  <option value="" className="bg-slate-950">Select service...</option>
                  {servicesList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-950">
                      {s.name} ({s.duration_minutes}m - ₹{s.price})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Assigned Stylist</label>
                <select
                  required
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                >
                  <option value="" className="bg-slate-950">Select stylist...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id} className="bg-slate-950">
                      {s.name} ({s.role_title})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date & Start Time + Auto End Time */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Booking Date</label>
                <input
                  required
                  type="date"
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                />
              </div>
              <div>
                <label className={labelClass}>Start Time</label>
                <select
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                >
                  <option value="" className="bg-slate-950">Start...</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot} className="bg-slate-950">
                      {slot}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>End Time (Auto)</label>
                <div className="w-full px-3 py-2 bg-slate-950/40 border border-slate-900 text-slate-400 rounded-xl text-xs flex items-center justify-between font-bold h-[38px] select-none shadow-inner">
                  <span>{endTime || '--:--'}</span>
                  {selectedService && (
                    <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-bold uppercase">
                      {selectedService.duration_minutes}m
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Source & Notes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className={labelClass}>Booking Source</label>
                <select
                  required
                  value={bookingSource}
                  onChange={(e) => setBookingSource(e.target.value as BookingSource)}
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                >
                  <option value="walk_in" className="bg-slate-950">Walk In</option>
                  <option value="call" className="bg-slate-950">Phone Call</option>
                  <option value="whatsapp" className="bg-slate-950">WhatsApp</option>
                  <option value="instagram" className="bg-slate-950">Instagram</option>
                  <option value="online" className="bg-slate-950">Online Web</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className={labelClass}>Notes / Instructions</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Allergies, coffee preference, etc."
                  className="w-full px-3 py-2 glass-input glass-input-focus rounded-xl text-xs"
                />
              </div>
            </div>

            {/* Double-Booking Warnings */}
            {availabilityWarning && (
              <div className="bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded-2xl p-3 flex gap-2 text-xs relative overflow-hidden">
                <div className="absolute inset-0 bg-amber-500/[0.02]" />
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span className="font-semibold relative z-10">{availabilityWarning}</span>
              </div>
            )}

            {error && (
              <div className="bg-rose-500/5 border border-rose-500/20 text-rose-300 rounded-2xl p-3 flex gap-2 text-xs relative overflow-hidden">
                <div className="absolute inset-0 bg-rose-500/[0.02]" />
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                <span className="font-semibold relative z-10">{error}</span>
              </div>
            )}

            <DialogFooter className="pt-2 gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-205 border border-slate-900 rounded-xl hover:bg-slate-900/50 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !!availabilityWarning}
                className="px-4 py-2 glow-cta glow-cta-hover text-white rounded-xl text-xs font-bold shadow-lg transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
              >
                {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Confirm Booking
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
