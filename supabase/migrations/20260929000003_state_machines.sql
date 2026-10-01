-- Migration: State Machines and Cascading Offers

-- 1. Create the Offers table for the 60-second atomic acceptance
CREATE TABLE public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    UNIQUE(booking_id, provider_id) -- A provider can only get one offer per booking
);

-- Ensure RLS on offers
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

-- Providers can see their own offers
CREATE POLICY "Providers can see their own offers" ON public.offers
    FOR SELECT USING (auth.uid() = provider_id);

-- Customers can see offers for their bookings
CREATE POLICY "Customers can see offers for their bookings" ON public.offers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.bookings b 
            WHERE b.id = offers.booking_id AND b.customer_id = auth.uid()
        )
    );

-- 2. Update the Bookings table to support the new state machines
-- We add specific columns for the different service types
ALTER TABLE public.bookings
    ADD COLUMN category TEXT NOT NULL DEFAULT 'chef' CHECK (category IN ('chef', 'laundry', 'pest_control')),
    ADD COLUMN checkout_price NUMERIC, -- The price customer authorized
    ADD COLUMN checkout_tax NUMERIC,
    ADD COLUMN platform_fee NUMERIC DEFAULT 10,
    ADD COLUMN provider_fee NUMERIC DEFAULT 10,
    ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'authorised', 'captured', 'refund_pending', 'refunded')),
    -- Chef specific
    ADD COLUMN chef_arrival_otp TEXT,
    ADD COLUMN chef_service_type TEXT CHECK (chef_service_type IN ('hourly', 'per_member')),
    -- Laundry specific
    ADD COLUMN laundry_status TEXT CHECK (laundry_status IN ('pending_pickup', 'picked_up', 'processing', 'ready', 'out_for_delivery', 'delivered')),
    -- Pest Control specific
    ADD COLUMN pest_treatment_type TEXT;

-- 3. The Atomic Acceptance RPC
-- This function allows a provider to accept an offer ONLY IF it hasn't expired and the booking hasn't been taken.
CREATE OR REPLACE FUNCTION accept_offer(offer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offer public.offers%ROWTYPE;
    v_booking public.bookings%ROWTYPE;
BEGIN
    -- 1. Lock the offer row for update to prevent concurrent accepts
    SELECT * INTO v_offer FROM public.offers WHERE id = offer_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Offer not found';
    END IF;

    IF v_offer.provider_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized';
    END IF;

    IF v_offer.status != 'pending' THEN
        RAISE EXCEPTION 'Offer is already %', v_offer.status;
    END IF;

    IF NOW() > v_offer.expires_at THEN
        -- Auto-expire it
        UPDATE public.offers SET status = 'expired' WHERE id = offer_id;
        RAISE EXCEPTION 'Offer has expired';
    END IF;

    -- 2. Lock the booking row
    SELECT * INTO v_booking FROM public.bookings WHERE id = v_offer.booking_id FOR UPDATE;

    IF v_booking.status != 'searching' THEN
        RAISE EXCEPTION 'Booking is no longer available';
    END IF;

    -- 3. Atomic success: Update both tables
    UPDATE public.offers SET status = 'accepted' WHERE id = offer_id;
    
    UPDATE public.bookings 
    SET status = 'travelling', provider_id = v_offer.provider_id 
    WHERE id = v_booking.id;

    RETURN TRUE;
END;
$$;
