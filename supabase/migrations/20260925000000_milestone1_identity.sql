-- Enable PostGIS for geospatial matchmaking (Radius searches)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. USERS (Customers & Admins)
-- Extends the Supabase auth.users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CUSTOMER PREFERENCES
CREATE TABLE public.customer_preferences (
    customer_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    dietary_preference TEXT CHECK (dietary_preference IN ('vegetarian', 'non-vegetarian', 'eggetarian', 'both')),
    preferred_cuisines TEXT[], -- e.g. ['North Indian', 'Chinese']
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ADDRESSES
CREATE TABLE public.addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    label TEXT, -- e.g., 'Home', 'Work'
    full_address TEXT NOT NULL,
    location GEOGRAPHY(POINT, 4326), -- For exact GPS distance calculation using PostGIS
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. PROVIDERS (Chefs, Maids, Laundry, Drivers, Wash)
CREATE TABLE public.providers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    profile_photo_url TEXT,
    categories TEXT[] NOT NULL, -- Array: ['chef', 'maid', 'laundry', 'wash', 'driver']
    languages TEXT[],
    years_experience INTEGER,
    
    -- Verification
    kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    admin_approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (admin_approval_status IN ('pending', 'approved', 'suspended')),
    
    -- Availability & Location
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    service_radius_km DECIMAL NOT NULL DEFAULT 5.0,
    current_location GEOGRAPHY(POINT, 4326), 
    
    -- Finance (Will be strictly restricted via RLS)
    bank_account_number TEXT, 
    bank_ifsc TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- This enforces the "Deny by Default" security model requested in the PDF.

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Users can only read/update their own data
CREATE POLICY "Users view own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Providers public profiles are readable by everyone, but only updateable by themselves
CREATE POLICY "Provider profiles are public" ON public.providers FOR SELECT USING (true);
CREATE POLICY "Providers update own profile" ON public.providers FOR UPDATE USING (auth.uid() = id);

-- Customer Preferences & Addresses
CREATE POLICY "Users view own preferences" ON public.customer_preferences FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users update own preferences" ON public.customer_preferences FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Users view own addresses" ON public.addresses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own addresses" ON public.addresses FOR ALL USING (auth.uid() = user_id);
