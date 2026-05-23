-- Create public schema tables for Salon Growth & Operations SaaS MVP

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SALONS TABLE
CREATE TABLE IF NOT EXISTS public.salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for salons
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- 2. USER ROLES ENUM & PROFILES TABLE
-- Handles app logins and links to Supabase Auth
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'receptionist', 'stylist');

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'stylist',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. STAFF PROFILES TABLE
-- Details of salon employees (stylists, therapists, etc.)
CREATE TABLE IF NOT EXISTS public.staff_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role_title TEXT,
    phone TEXT,
    commission_rules JSONB NOT NULL DEFAULT '{"type": "fixed", "percentage": 10}', -- Fixed % or Service-wise %
    monthly_target_revenue NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for staff_profiles
ALTER TABLE public.staff_profiles ENABLE ROW LEVEL SECURITY;

-- 4. SERVICES TABLE
-- Services offered by salons
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    repeat_cycle_days INTEGER NOT NULL DEFAULT 30, -- Haircut: 30-45, color: 30, etc.
    commission_percentage NUMERIC(5, 2) DEFAULT 10.00, -- Default if not overridden
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- 5. CUSTOMERS TABLE
-- CRM profile card
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gender TEXT,
    birthday DATE,
    anniversary DATE,
    notes TEXT,
    no_show_count INTEGER NOT NULL DEFAULT 0,
    total_visits INTEGER NOT NULL DEFAULT 0,
    total_spend NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    last_visit_date TIMESTAMPTZ,
    preferred_staff_id UUID REFERENCES public.staff_profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 6. APPOINTMENTS TABLE
-- Booking records
CREATE TYPE appointment_status AS ENUM ('created', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'no_show');
CREATE TYPE booking_source AS ENUM ('whatsapp', 'call', 'instagram', 'walk_in', 'online');

CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT, -- Main stylist
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status appointment_status NOT NULL DEFAULT 'created',
    source booking_source NOT NULL DEFAULT 'walk_in',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- 7. APPOINTMENT SERVICES (Junction table for multi-service support)
CREATE TABLE IF NOT EXISTS public.appointment_services (
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission_paid NUMERIC(12, 2) NOT NULL DEFAULT 0.00, -- Calculated on completion
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE RESTRICT, -- Stylist doing this service
    PRIMARY KEY (appointment_id, service_id)
);

-- Enable RLS for appointment_services
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;

-- 8. STAFF COMMISSIONS LEDGER
CREATE TYPE commission_status AS ENUM ('pending', 'approved', 'paid');

CREATE TABLE IF NOT EXISTS public.staff_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES public.staff_profiles(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status commission_status NOT NULL DEFAULT 'pending',
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- Enable RLS for staff_commissions
ALTER TABLE public.staff_commissions ENABLE ROW LEVEL SECURITY;

-- 9. REMINDERS LOG
CREATE TABLE IF NOT EXISTS public.reminders_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'reminder_24h', 'reminder_2h', 'retention_recall', 'birthday_offer'
    status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed'
    sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS for reminders_log
ALTER TABLE public.reminders_log ENABLE ROW LEVEL SECURITY;


-- -------------------------------------------------------------
-- HELPER FUNCTIONS FOR SECURITY (To avoid RLS infinite recursion)
-- -------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_user_salon_id()
RETURNS UUID AS $$
    SELECT salon_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;


-- -------------------------------------------------------------
-- ROW LEVEL SECURITY (RLS) POLICIES
-- -------------------------------------------------------------

-- Profiles Policies
CREATE POLICY "Users can view profiles in their own salon"
    ON public.profiles FOR SELECT
    USING (id = auth.uid() OR salon_id = public.get_user_salon_id());

CREATE POLICY "Owners can update any profile in their salon"
    ON public.profiles FOR UPDATE
    USING (
        salon_id = public.get_user_salon_id()
        AND public.get_user_role() = 'owner'
    );

-- Salons Policies
CREATE POLICY "Users can view their own salon"
    ON public.salons FOR SELECT
    USING (id = public.get_user_salon_id());

CREATE POLICY "Owners can update their own salon details"
    ON public.salons FOR UPDATE
    USING (
        id = public.get_user_salon_id()
        AND public.get_user_role() = 'owner'
    );

-- Staff Profiles Policies
CREATE POLICY "Users can view staff profiles in their salon"
    ON public.staff_profiles FOR SELECT
    USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Owners can manage staff profiles in their salon"
    ON public.staff_profiles FOR ALL
    USING (
        salon_id = public.get_user_salon_id()
        AND public.get_user_role() = 'owner'
    );

-- Services Policies
CREATE POLICY "Users can view services in their salon"
    ON public.services FOR SELECT
    USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Owners and Managers can manage services"
    ON public.services FOR ALL
    USING (
        salon_id = public.get_user_salon_id()
        AND public.get_user_role() IN ('owner', 'manager')
    );

-- Customers Policies
CREATE POLICY "Users can view customers in their salon"
    ON public.customers FOR SELECT
    USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Users except stylists can manage customer profiles"
    ON public.customers FOR ALL
    USING (
        salon_id = public.get_user_salon_id()
        AND public.get_user_role() IN ('owner', 'manager', 'receptionist')
    );

-- Appointments Policies
CREATE POLICY "Users can view appointments in their salon"
    ON public.appointments FOR SELECT
    USING (salon_id = public.get_user_salon_id());

CREATE POLICY "Users except stylists can manage appointments"
    ON public.appointments FOR ALL
    USING (
        salon_id = public.get_user_salon_id()
        AND public.get_user_role() IN ('owner', 'manager', 'receptionist')
    );

-- Appointment Services Policies
CREATE POLICY "Users can view appointment services in their salon"
    ON public.appointment_services FOR SELECT
    USING (
        public.get_user_salon_id() = 
        (SELECT salon_id FROM public.appointments WHERE id = appointment_id)
    );

CREATE POLICY "Users except stylists can manage appointment services"
    ON public.appointment_services FOR ALL
    USING (
        public.get_user_salon_id() = 
        (SELECT salon_id FROM public.appointments WHERE id = appointment_id)
        AND public.get_user_role() IN ('owner', 'manager', 'receptionist')
    );

-- Staff Commissions Policies
CREATE POLICY "Stylists can view their own commissions"
    ON public.staff_commissions FOR SELECT
    USING (
        staff_id = (SELECT id FROM public.staff_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Owners can manage all commissions in their salon"
    ON public.staff_commissions FOR ALL
    USING (
        public.get_user_role() = 'owner'
        AND staff_id IN (SELECT id FROM public.staff_profiles WHERE salon_id = public.get_user_salon_id())
    );

-- Reminders Log Policies
CREATE POLICY "Users can view reminders log in their salon"
    ON public.reminders_log FOR SELECT
    USING (
        customer_id IN (SELECT id FROM public.customers WHERE salon_id = public.get_user_salon_id())
    );


-- -------------------------------------------------------------
-- AUTOMATED USER SYNCHRONIZATION TRIGGER (auth.users -> public.profiles)
-- -------------------------------------------------------------

-- Create user synchronizer function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_salon_id UUID;
    v_salon_name TEXT;
    v_role public.user_role;
BEGIN
    -- Check if metadata provides a salon_id. If not, create a default salon.
    IF (new.raw_user_meta_data->>'salon_id') IS NOT NULL THEN
        v_salon_id := (new.raw_user_meta_data->>'salon_id')::UUID;
    ELSE
        -- If signing up without a salon_id (e.g. creating a new salon), create a new salon record
        v_salon_name := COALESCE(new.raw_user_meta_data->>'salon_name', 'My Salon');
        INSERT INTO public.salons (name)
        VALUES (v_salon_name)
        RETURNING id INTO v_salon_id;
    END IF;

    -- Extract role from metadata, default to 'owner' if it's the salon creator, or 'stylist'
    v_role := COALESCE((new.raw_user_meta_data->>'role')::public.user_role, 'owner');

    -- Insert into public.profiles
    INSERT INTO public.profiles (id, salon_id, email, role)
    VALUES (new.id, v_salon_id, new.email, v_role);

    -- If the user role is 'stylist', also auto-create a staff profile
    IF v_role = 'stylist' THEN
        INSERT INTO public.staff_profiles (user_id, salon_id, name, role_title, phone)
        VALUES (
            new.id, 
            v_salon_id, 
            COALESCE(new.raw_user_meta_data->>'name', 'Stylist'), 
            'Stylist', 
            new.raw_user_meta_data->>'phone'
        );
    END IF;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
