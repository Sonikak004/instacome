-- 1. ADD LOCATION FRESHNESS TO PROVIDERS
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ DEFAULT NOW();

-- 2. BOOKINGS TABLE (To associate customers, providers, and trips)
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES auth.users(id),
    provider_id UUID REFERENCES public.providers(id),
    category TEXT,
    status TEXT NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'accepted', 'travelling', 'arrived', 'active', 'completed', 'cancelled')),
    service_location GEOGRAPHY(POINT, 4326),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRIP LOCATIONS (Live tracking, strictly siloed)
CREATE TABLE public.trip_locations (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    current_location GEOGRAPHY(POINT, 4326),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY (RLS) FOR TRIPS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_locations ENABLE ROW LEVEL SECURITY;

-- Customers can view their own bookings
CREATE POLICY "Customers view own bookings" ON public.bookings 
    FOR SELECT USING (auth.uid() = customer_id);

-- Providers can view assigned bookings
CREATE POLICY "Providers view assigned bookings" ON public.bookings 
    FOR SELECT USING (auth.uid() = provider_id);

-- TRIP LOCATION RLS: 
-- Only visible to the customer and provider assigned to THIS specific booking, 
-- and ONLY when the status is exactly 'travelling'.
CREATE POLICY "Participants view live trip location" ON public.trip_locations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = trip_locations.booking_id 
            AND (b.customer_id = auth.uid() OR b.provider_id = auth.uid())
            AND b.status = 'travelling'
        )
    );

-- Only the assigned provider can UPDATE the trip location
CREATE POLICY "Provider updates live trip location" ON public.trip_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = trip_locations.booking_id 
            AND b.provider_id = auth.uid()
            AND b.status = 'travelling'
        )
    );

-- 5. MATCHMAKING RPC UPDATE (Radius, Stale Data, and Online Status)
CREATE OR REPLACE FUNCTION find_eligible_providers(
    p_category TEXT,
    p_lat DOUBLE PRECISION,
    p_lon DOUBLE PRECISION,
    p_max_hourly_rate DECIMAL
) 
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    hourly_rate DECIMAL,
    distance_meters DOUBLE PRECISION
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
        p.is_online = true AND
        p.is_busy = false AND
        p.hourly_rate <= p_max_hourly_rate AND
        -- STRICT LOCATION FRESHNESS: Reject if older than 15 minutes
        p.last_location_update > NOW() - INTERVAL '15 minutes' AND
        -- DYNAMIC RADIUS: Provider's individual service area (converted to meters)
        ST_DWithin(
            p.current_location, 
            ST_SetSRID(ST_MakePoint(p_lon, p_lat), 4326)::geography, 
            p.service_radius_km * 1000
        )
    ORDER BY distance_meters ASC;
END;
$$;
