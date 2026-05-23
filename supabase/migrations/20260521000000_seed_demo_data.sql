-- ─────────────────────────────────────────────────────────────────────────────
-- DEMO SEED DATA for SalonGrowthApp MVP
-- Run this AFTER creating a salon via the sign-up flow to populate sample data.
-- Replace 'YOUR_SALON_ID_HERE' with the actual salon id from public.salons.
-- ─────────────────────────────────────────────────────────────────────────────

DO $$
DECLARE
  v_salon_id UUID;
  v_staff_amit UUID;
  v_staff_neha UUID;
  v_staff_rohan UUID;
  v_staff_sonia UUID;
  v_cust_priya UUID;
  v_cust_anil UUID;
  v_cust_riya UUID;
  v_cust_karan UUID;
  v_cust_vikram UUID;
  v_cust_meera UUID;
  v_cust_anjali UUID;
  v_svc_balayage UUID;
  v_svc_haircut UUID;
  v_svc_hydrafacial UUID;
  v_svc_massage UUID;
  v_svc_mani UUID;
  v_svc_keratin UUID;
  v_svc_gents UUID;
  v_svc_wax UUID;
  v_appt1 UUID;
  v_appt2 UUID;
  v_appt3 UUID;
  v_appt4 UUID;
BEGIN
  -- Use the first salon in the database (created during sign-up)
  SELECT id INTO v_salon_id FROM public.salons LIMIT 1;

  IF v_salon_id IS NULL THEN
    RAISE EXCEPTION 'No salon found. Sign up first to create a salon, then run this seed.';
  END IF;

  -- ── Staff ─────────────────────────────────────────────────────────────────
  INSERT INTO public.staff_profiles (salon_id, name, role_title, phone, commission_rules, monthly_target_revenue)
  VALUES
    (v_salon_id, 'Amit Sharma',   'Senior Stylist',   '+91 99887 76655', '{"type":"service_wise","percentage":12}', 100000),
    (v_salon_id, 'Neha Patel',    'Hair Color Expert', '+91 98765 43210', '{"type":"fixed","percentage":10}',        120000),
    (v_salon_id, 'Rohan Das',     'Junior Stylist',    '+91 91234 56789', '{"type":"fixed","percentage":8}',         75000),
    (v_salon_id, 'Sonia Rao',     'Esthetician',       '+91 95555 44444', '{"type":"fixed","percentage":10}',        50000);


  -- Capture individual staff IDs
  SELECT id INTO v_staff_amit  FROM public.staff_profiles WHERE salon_id = v_salon_id AND name = 'Amit Sharma';
  SELECT id INTO v_staff_neha  FROM public.staff_profiles WHERE salon_id = v_salon_id AND name = 'Neha Patel';
  SELECT id INTO v_staff_rohan FROM public.staff_profiles WHERE salon_id = v_salon_id AND name = 'Rohan Das';
  SELECT id INTO v_staff_sonia FROM public.staff_profiles WHERE salon_id = v_salon_id AND name = 'Sonia Rao';

  -- ── Services ──────────────────────────────────────────────────────────────
  INSERT INTO public.services (salon_id, name, category, duration_minutes, price, repeat_cycle_days, commission_percentage)
  VALUES
    (v_salon_id, 'Balayage & Hair Color',          'Hair Coloring',    90,  4500, 30, 12),
    (v_salon_id, 'Standard Haircut & Blowdry',     'Hair Styling',     35,   800, 35,  8),
    (v_salon_id, 'HydraFacial Treatment',          'Facial & Skincare',60,  3500, 30, 10),
    (v_salon_id, 'Full Body Deep Tissue Massage',  'Spa & Wellness',   75,  2800, 45, 10),
    (v_salon_id, 'Premium Manicure & Gel Polish',  'Nail Salon',       45,  1500, 25,  8),
    (v_salon_id, 'Hair Straightening (Keratin)',   'Hair Treatments', 120,  6000, 90, 12),
    (v_salon_id, 'Gentlemen''s Haircut & Shave',  'Grooming',         45,  1200, 25,  8),
    (v_salon_id, 'Waxing (Full Arms & Legs)',      'Waxing',           60,  1800, 28,  8);


  SELECT id INTO v_svc_balayage    FROM public.services WHERE salon_id = v_salon_id AND name = 'Balayage & Hair Color';
  SELECT id INTO v_svc_haircut     FROM public.services WHERE salon_id = v_salon_id AND name = 'Standard Haircut & Blowdry';
  SELECT id INTO v_svc_hydrafacial FROM public.services WHERE salon_id = v_salon_id AND name = 'HydraFacial Treatment';
  SELECT id INTO v_svc_massage     FROM public.services WHERE salon_id = v_salon_id AND name = 'Full Body Deep Tissue Massage';
  SELECT id INTO v_svc_mani        FROM public.services WHERE salon_id = v_salon_id AND name = 'Premium Manicure & Gel Polish';
  SELECT id INTO v_svc_keratin     FROM public.services WHERE salon_id = v_salon_id AND name = 'Hair Straightening (Keratin)';
  SELECT id INTO v_svc_gents       FROM public.services WHERE salon_id = v_salon_id AND name LIKE 'Gentlemen%';
  SELECT id INTO v_svc_wax         FROM public.services WHERE salon_id = v_salon_id AND name = 'Waxing (Full Arms & Legs)';

  -- ── Customers ─────────────────────────────────────────────────────────────
  INSERT INTO public.customers (salon_id, name, phone, gender, birthday, notes, no_show_count, total_visits, total_spend, last_visit_date, preferred_staff_id)
  VALUES
    (v_salon_id, 'Priya Sen',     '+91 98765 43210', 'Female', '1992-03-15', 'Prefers Neha for color. Allergic to certain dyes.', 0, 14, 22400, now() - interval '11 days', v_staff_neha),
    (v_salon_id, 'Anil Mehta',    '+91 99887 76655', 'Male',   null,         null,                                                  0,  8,  9800, now() - interval '1 day',  v_staff_amit),
    (v_salon_id, 'Riya Gupta',    '+91 91234 56789', 'Female', '1995-05-28', 'High no-show history. Confirm 1 day before.',        2,  3,  6200, now() - interval '50 days', v_staff_sonia),
    (v_salon_id, 'Karan Malhotra','+91 98989 89898', 'Male',   null,         null,                                                  0,  1,  2200, now(),                      v_staff_rohan),
    (v_salon_id, 'Vikram Seth',   '+91 98888 77777', 'Male',   null,         null,                                                  1, 12, 18500, now() - interval '95 days', v_staff_amit),
    (v_salon_id, 'Meera Nair',    '+91 97777 66666', 'Female', (date_trunc('year', now()) + interval '4 months' + interval '12 days')::date, null, 0, 6, 8200, now() - interval '26 days', null),
    (v_salon_id, 'Anjali Verma',  '+91 91111 22222', 'Female', null,         null,                                                  0,  4,  5600, now() - interval '72 days', null);


  SELECT id INTO v_cust_priya  FROM public.customers WHERE salon_id = v_salon_id AND name = 'Priya Sen';
  SELECT id INTO v_cust_anil   FROM public.customers WHERE salon_id = v_salon_id AND name = 'Anil Mehta';
  SELECT id INTO v_cust_riya   FROM public.customers WHERE salon_id = v_salon_id AND name = 'Riya Gupta';
  SELECT id INTO v_cust_karan  FROM public.customers WHERE salon_id = v_salon_id AND name = 'Karan Malhotra';
  SELECT id INTO v_cust_vikram FROM public.customers WHERE salon_id = v_salon_id AND name = 'Vikram Seth';
  SELECT id INTO v_cust_meera  FROM public.customers WHERE salon_id = v_salon_id AND name = 'Meera Nair';
  SELECT id INTO v_cust_anjali FROM public.customers WHERE salon_id = v_salon_id AND name = 'Anjali Verma';

  -- ── Sample Appointments ────────────────────────────────────────────────────
  INSERT INTO public.appointments (salon_id, customer_id, staff_id, start_time, end_time, status, source)
  VALUES
    (v_salon_id, v_cust_priya,  v_staff_neha,  now() + interval '2 hours',   now() + interval '3 hours 30 minutes', 'confirmed', 'whatsapp'),
    (v_salon_id, v_cust_anil,   v_staff_amit,  now() - interval '2 hours',   now() - interval '1 hour 15 minutes',  'completed', 'call'),
    (v_salon_id, v_cust_riya,   v_staff_sonia, now() + interval '4 hours',   now() + interval '5 hours',            'confirmed', 'instagram'),
    (v_salon_id, v_cust_karan,  v_staff_rohan, now() + interval '6 hours',   now() + interval '7 hours 15 minutes', 'created',   'walk_in');


  SELECT id INTO v_appt1 FROM public.appointments WHERE salon_id = v_salon_id AND customer_id = v_cust_priya ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appt2 FROM public.appointments WHERE salon_id = v_salon_id AND customer_id = v_cust_anil  ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appt3 FROM public.appointments WHERE salon_id = v_salon_id AND customer_id = v_cust_riya  ORDER BY created_at DESC LIMIT 1;
  SELECT id INTO v_appt4 FROM public.appointments WHERE salon_id = v_salon_id AND customer_id = v_cust_karan ORDER BY created_at DESC LIMIT 1;

  -- ── Appointment Service Lines ──────────────────────────────────────────────
  INSERT INTO public.appointment_services (appointment_id, service_id, price, staff_id)
  VALUES
    (v_appt1, v_svc_balayage, 4500, v_staff_neha),
    (v_appt2, v_svc_gents,    1200, v_staff_amit),
    (v_appt3, v_svc_hydrafacial, 3500, v_staff_sonia),
    (v_appt4, v_svc_massage,  2800, v_staff_rohan);

  -- ── Commission Ledger (for the completed appointment) ─────────────────────
  INSERT INTO public.staff_commissions (staff_id, appointment_id, amount, status)
  VALUES
    (v_staff_amit, v_appt2, 144, 'pending');  -- 12% of ₹1200

  RAISE NOTICE 'Seed data inserted successfully for salon: %', v_salon_id;
END;
$$;
