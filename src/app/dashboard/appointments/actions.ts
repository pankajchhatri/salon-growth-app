'use server'

import { createClient } from '@/lib/supabase/server'
import { isSupabaseConfigured } from '@/lib/supabase/is-configured'
import { MOCK_APPOINTMENTS, MOCK_CUSTOMERS, MOCK_SERVICES, MOCK_COMMISSIONS, MOCK_STAFF } from '@/lib/mock-data'
import type { Appointment, AppointmentStatus, BookingSource } from '@/lib/types'
import { revalidatePath } from 'next/cache'
import { calculateCommissionForAppointment } from '../commissions/actions'

import { getCurrentUser } from '@/lib/auth-util'


async function getSalonId(): Promise<string> {
  const user = await getCurrentUser()
  if (!user || !user.salon_id) throw new Error('No salon found')
  return user.salon_id
}

// ─── Fetch appointments ───────────────────────────────────────────────────────
export async function getAppointments(role?: string, staffProfileId?: string): Promise<Appointment[]> {
  if (!isSupabaseConfigured) {
    if (role === 'stylist' && staffProfileId) {
      return MOCK_APPOINTMENTS.filter((a) => a.staff_id === staffProfileId)
    }
    return MOCK_APPOINTMENTS
  }

  const supabase = await createClient()
  const salonId = await getSalonId()

  let query = supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, no_show_count),
      staff:staff_profiles(id, name, role_title),
      services:appointment_services(*, service:services(id, name, category, duration_minutes))
    `)
    .eq('salon_id', salonId)

  // Enforce stylist permission check: stylist only sees their own appointments
  if (role === 'stylist' && staffProfileId) {
    query = query.eq('staff_id', staffProfileId)
  }

  const { data, error } = await query.order('start_time', { ascending: true })
  if (error) throw new Error(error.message)
  return (data ?? []) as Appointment[]
}

// ─── Staff Availability Check ─────────────────────────────────────────────────
export async function checkStaffAvailability(
  staffId: string,
  startTime: string,
  endTime: string,
  ignoreAppointmentId?: string
): Promise<{ available: boolean; error?: string }> {
  // Parse input timestamps
  const newStart = new Date(startTime).getTime()
  const newEnd = new Date(endTime).getTime()

  if (isNaN(newStart) || isNaN(newEnd)) {
    return { available: false, error: 'Invalid start or end time.' }
  }

  if (newStart >= newEnd) {
    return { available: false, error: 'End time must be after start time.' }
  }

  if (!isSupabaseConfigured) {
    const overlaps = MOCK_APPOINTMENTS.some((appt) => {
      if (appt.staff_id !== staffId) return false
      if (appt.status === 'cancelled') return false
      if (ignoreAppointmentId && appt.id === ignoreAppointmentId) return false

      const apptStart = new Date(appt.start_time).getTime()
      const apptEnd = new Date(appt.end_time).getTime()

      return apptStart < newEnd && apptEnd > newStart
    })
    return { available: !overlaps }
  }

  const supabase = await createClient()
  
  // Find overlaps: existing.start_time < new.end_time AND existing.end_time > new.start_time
  let query = supabase
    .from('appointments')
    .select('id, start_time, end_time')
    .eq('staff_id', staffId)
    .neq('status', 'cancelled')
    .lt('start_time', endTime)
    .gt('end_time', startTime)

  if (ignoreAppointmentId) {
    query = query.neq('id', ignoreAppointmentId)
  }

  const { data, error } = await query

  if (error) {
    return { available: false, error: error.message }
  }

  return { available: (data?.length ?? 0) === 0 }
}

// ─── Create appointment ───────────────────────────────────────────────────────
export async function createAppointment(input: {
  customerId: string
  serviceId: string
  staffId: string
  startTime: string
  endTime: string
  source: BookingSource
  notes?: string
}): Promise<{ success: boolean; appointmentId?: string; error?: string }> {
  // 1. Permission Check
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot book appointments.' }
  }

  // 2. Availability Check
  const availability = await checkStaffAvailability(input.staffId, input.startTime, input.endTime)
  if (!availability.available) {
    return { success: false, error: availability.error ?? 'Staff member is already booked during this time.' }
  }

  if (!isSupabaseConfigured) {
    // Dev-Mode In-Memory Creation
    const mockSvc = MOCK_SERVICES.find((s) => s.id === input.serviceId)
    const mockCust = MOCK_CUSTOMERS.find((c) => c.id === input.customerId)
    const mockStaff = MOCK_STAFF.find((s) => s.id === input.staffId)

    if (!mockSvc || !mockCust || !mockStaff) {
      return { success: false, error: 'Customer, service, or staff member not found in mock database.' }
    }

    const apptId = `apt-mock-${Date.now()}`
    const newAppt: Appointment = {
      id: apptId,
      salon_id: 'mock-salon-id',
      customer_id: input.customerId,
      staff_id: input.staffId,
      start_time: input.startTime,
      end_time: input.endTime,
      status: 'created',
      source: input.source,
      notes: input.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer: { id: mockCust.id, name: mockCust.name, phone: mockCust.phone, no_show_count: mockCust.no_show_count },
      staff: { id: mockStaff.id, name: mockStaff.name, role_title: mockStaff.role_title },
      services: [
        {
          appointment_id: apptId,
          service_id: input.serviceId,
          price: mockSvc.price,
          commission_paid: 0,
          staff_id: input.staffId,
          service: { id: mockSvc.id, name: mockSvc.name, category: mockSvc.category, duration_minutes: mockSvc.duration_minutes },
        },
      ],
    }

    MOCK_APPOINTMENTS.push(newAppt)
    return { success: true, appointmentId: apptId }
  }

  // Supabase Transaction-Safe Rollback Flow
  const supabase = await createClient()
  const salonId = await getSalonId()

  // Fetch service price
  const { data: service, error: svcErr } = await supabase
    .from('services')
    .select('price')
    .eq('id', input.serviceId)
    .single()

  if (svcErr || !service) {
    return { success: false, error: 'Selected service not found or inactive.' }
  }

  // Create appointment record
  const { data: newAppt, error: apptErr } = await supabase
    .from('appointments')
    .insert({
      salon_id: salonId,
      customer_id: input.customerId,
      staff_id: input.staffId,
      start_time: input.startTime,
      end_time: input.endTime,
      status: 'created',
      source: input.source,
      notes: input.notes,
    })
    .select('id')
    .single()

  if (apptErr || !newAppt) {
    return { success: false, error: apptErr?.message ?? 'Failed to create appointment.' }
  }

  // Create appointment services record (rollback-safe)
  const { error: serviceLineErr } = await supabase
    .from('appointment_services')
    .insert({
      appointment_id: newAppt.id,
      service_id: input.serviceId,
      price: service.price,
      commission_paid: 0.00,
      staff_id: input.staffId,
    })

  if (serviceLineErr) {
    // Rollback the appointment creation if the line creation fails
    await supabase.from('appointments').delete().eq('id', newAppt.id)
    return { success: false, error: 'Failed to assign service. Rollback complete.' }
  }

  revalidatePath('/dashboard/appointments')
  revalidatePath('/dashboard')
  return { success: true, appointmentId: newAppt.id }
}

// ─── Update Status ───────────────────────────────────────────────────────────
export async function updateAppointmentStatus(
  appointmentId: string,
  status: AppointmentStatus
): Promise<{ success: boolean; error?: string }> {
  // 1. Permission Check
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot update appointment status.' }
  }

  if (!isSupabaseConfigured) {
    const appt = MOCK_APPOINTMENTS.find((a) => a.id === appointmentId)
    if (!appt) return { success: false, error: 'Appointment not found.' }

    const oldStatus = appt.status
    if (oldStatus === status) return { success: true } // Idempotent

    // Update status
    appt.status = status
    appt.updated_at = new Date().toISOString()

    // No-Show side effect
    if (status === 'no_show' && oldStatus !== 'no_show') {
      const cust = MOCK_CUSTOMERS.find((c) => c.id === appt.customer_id)
      if (cust) {
        cust.no_show_count += 1
        if (appt.customer) appt.customer.no_show_count = cust.no_show_count
      }
    }

    // Completed side effect
    if (status === 'completed' && oldStatus !== 'completed') {
      const cust = MOCK_CUSTOMERS.find((c) => c.id === appt.customer_id)
      if (cust) {
        cust.total_visits += 1
        cust.last_visit_date = appt.start_time

        // Sum service price
        const totalSpend = appt.services?.reduce((sum, s) => sum + s.price, 0) || 0
        cust.total_spend += totalSpend

        // Dev mock commission ledger entry
        const staff = MOCK_STAFF.find((s) => s.id === appt.staff_id)
        const svcId = appt.services?.[0]?.service_id
        const mockSvc = MOCK_SERVICES.find((s) => s.id === svcId)
        const commPercentage = mockSvc?.commission_percentage || staff?.commission_rules?.percentage || 10
        const price = appt.services?.[0]?.price || 0
        const commAmount = (price * commPercentage) / 100

        MOCK_COMMISSIONS.push({
          id: `com-mock-${Date.now()}`,
          staff_id: appt.staff_id,
          appointment_id: appt.id,
          amount: Math.round(commAmount * 100) / 100,
          status: 'pending',
          calculated_at: new Date().toISOString(),
          staff: { id: staff?.id || appt.staff_id, name: staff?.name || 'Stylist', role_title: staff?.role_title },
          appointment: { id: appt.id, start_time: appt.start_time, customer: appt.customer },
        })
      }
    }

    return { success: true }
  }

  try {
    const supabase = await createClient()

    // Fetch existing status and details
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('status, customer_id, start_time')
      .eq('id', appointmentId)
      .single()

    if (fetchErr || !appt) {
      return { success: false, error: fetchErr?.message || 'Appointment not found.' }
    }

    const oldStatus = appt.status
    if (oldStatus === status) return { success: true } // Idempotent

    // Perform side-effects
    if (status === 'no_show' && oldStatus !== 'no_show') {
      // Increment no_show_count
      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .select('no_show_count')
        .eq('id', appt.customer_id)
        .single()

      if (!custErr && cust) {
        await supabase
          .from('customers')
          .update({ no_show_count: cust.no_show_count + 1 })
          .eq('id', appt.customer_id)
      }
    }

    if (status === 'completed' && oldStatus !== 'completed') {
      // Calculate total spend and update customer
      const { data: services } = await supabase
        .from('appointment_services')
        .select('price')
        .eq('appointment_id', appointmentId)

      const apptTotalSpend = services?.reduce((sum, line) => sum + Number(line.price), 0) || 0

      const { data: cust, error: custErr } = await supabase
        .from('customers')
        .select('total_visits, total_spend')
        .eq('id', appt.customer_id)
        .single()

      if (!custErr && cust) {
        await supabase
          .from('customers')
          .update({
            total_visits: cust.total_visits + 1,
            total_spend: Number(cust.total_spend) + apptTotalSpend,
            last_visit_date: appt.start_time,
          })
          .eq('id', appt.customer_id)
      }

      // Trigger staff commission ledger insert (idempotency built-in)
      await calculateCommissionForAppointment(appointmentId)
    }

    // Update appointment status
    const { error: updateErr } = await supabase
      .from('appointments')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', appointmentId)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/dashboard/appointments')
    revalidatePath('/dashboard/commissions')
    revalidatePath('/dashboard/customers')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}

// ─── Reschedule appointment ──────────────────────────────────────────────────
export async function rescheduleAppointment(
  appointmentId: string,
  startTime: string,
  endTime: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Permission Check
  const currentUser = await getCurrentUser()
  if (!currentUser) return { success: false, error: 'Unauthenticated.' }
  if (currentUser.role === 'stylist') {
    return { success: false, error: 'Permission denied. Stylists cannot reschedule appointments.' }
  }

  if (!isSupabaseConfigured) {
    const appt = MOCK_APPOINTMENTS.find((a) => a.id === appointmentId)
    if (!appt) return { success: false, error: 'Appointment not found.' }

    // Check availability (ignoring this appointment)
    const availability = await checkStaffAvailability(appt.staff_id, startTime, endTime, appointmentId)
    if (!availability.available) {
      return { success: false, error: 'Staff member is already booked during this time.' }
    }

    appt.start_time = startTime
    appt.end_time = endTime
    appt.status = 'rescheduled'
    appt.updated_at = new Date().toISOString()

    return { success: true }
  }

  try {
    const supabase = await createClient()

    // Fetch staff_id of the appointment
    const { data: appt, error: fetchErr } = await supabase
      .from('appointments')
      .select('staff_id')
      .eq('id', appointmentId)
      .single()

    if (fetchErr || !appt) {
      return { success: false, error: 'Appointment not found.' }
    }

    // Check availability
    const availability = await checkStaffAvailability(appt.staff_id, startTime, endTime, appointmentId)
    if (!availability.available) {
      return { success: false, error: 'Staff member is already booked during this time.' }
    }

    // Update appointment
    const { error: updateErr } = await supabase
      .from('appointments')
      .update({
        start_time: startTime,
        end_time: endTime,
        status: 'rescheduled',
        updated_at: new Date().toISOString(),
      })
      .eq('id', appointmentId)

    if (updateErr) {
      return { success: false, error: updateErr.message }
    }

    revalidatePath('/dashboard/appointments')
    return { success: true }
  } catch (e) {
    return { success: false, error: String(e) }
  }
}
