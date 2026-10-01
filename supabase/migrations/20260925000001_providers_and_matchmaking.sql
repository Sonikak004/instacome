-- Enable PostGIS for radius matching
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. PROVIDERS TABLE (Publicly visible fields)
CREATE TABLE public.providers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    categories TEXT[] NOT NULL, -- 'chef', 'maid', 'laundry', 'wash', 'driver'
    languages TEXT[],
    years_experience INTEGER,
    hourly_rate DECIMAL,
    
    -- Status
    kyc_status TEXT NOT NULL DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'approved', 'rejected')),
    admin_approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (admin_approval_status IN ('pending', 'approved', 'suspended')),
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    is_busy BOOLEAN NOT NULL DEFAULT FALSE, -- Set to true when they accept an offer
    
    -- Geospatial
    current_location GEOGRAPHY(POINT, 4326), 
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. PROVIDER BANK DETAILS (Strictly Private)
CREATE TABLE public.provider_bank_details (
    provider_id UUID PRIMARY KEY REFERENCES public.providers(id) ON DELETE CASCADE,
    bank_account_number TEXT NOT NULL,
    bank_ifsc TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_bank_details ENABLE ROW LEVEL SECURITY;

-- 4. RLS POLICIES FOR PROVIDERS
-- Providers can read and update their own public profile
CREATE POLICY "Providers manage own profile" ON public.providers 
    FOR ALL USING (auth.uid() = id);

-- Customers can only read approved, online providers
CREATE POLICY "Customers view approved providers" ON public.providers 
    FOR SELECT USING (
        admin_approval_status = 'approved' 
        -- We don't strictly enforce is_online here because customers need to see provider history/receipts,
        -- but matchmaking logic will enforce is_online.
    );

-- 5. RLS POLICIES FOR BANK DETAILS
-- STRICT: Only the provider who owns the bank details can read/write them.
-- (Admins will bypass RLS via the Service Role Key on the backend).
CREATE POLICY "Providers manage own bank details" ON public.provider_bank_details
    FOR ALL USING (auth.uid() = provider_id);

-- 6. MATCHMAKING FUNCTION (Postgres RPC)
-- Finds nearby, approved, online, non-busy providers for a specific category within a budget
CREATE OR REPLACE FUNCTION find_eligible_providers(
    p_category TEXT,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_radius_meters DOUBLE PRECISION,
    p_max_hourly_rate DECIMAL
) 
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    hourly_rate DECIMAL,
    distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to check everything efficiently
AS $$
BEGIN
    RETURN QUERY 
    SELECT 
        p.id, 
        p.full_name, 
        p.hourly_rate,
        ST_Distance(p.current_location, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography) AS distance_meters
    FROM public.providers p
    WHERE 
        p_category = ANY(p.categories) AND
        p.admin_approval_status = 'approved' AND
        p.kyc_status = 'approved' AND
        p.is_online = true AND
        p.is_busy = false AND
        p.hourly_rate <= p_max_hourly_rate AND
        ST_DWithin(p.current_location, ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography, p_radius_meters)
    ORDER BY distance_meters ASC;
END;
$$;
