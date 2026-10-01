import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// This Edge Function is triggered when a Customer requests a service (e.g. they pay, and the booking moves to 'paid_unassigned').
// It finds the closest eligible provider and creates an "Offer".

serve(async (req) => {
  try {
    // We expect the customer's request details in the POST body
    const { category, lat, lon, max_hourly_rate, booking_id } = await req.json()

    // Initialize Supabase client with the Service Role key to bypass RLS for administrative matchmaking
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Call the Postgres RPC function we created in the migration
    // This securely checks RLS, approval status, busy status, and PostGIS distance inside the database.
    const { data: eligibleProviders, error } = await supabaseClient
      .rpc('find_eligible_providers', {
        p_category: category,
        p_lat: lat,
        p_lon: lon,
        p_radius_meters: 5000, // 5km radius for V1
        p_max_hourly_rate: max_hourly_rate
      })

    if (error) throw error

    if (!eligibleProviders || eligibleProviders.length === 0) {
      // No providers found -> Trigger refund workflow
      await supabaseClient.from('bookings').update({ status: 'refund_pending' }).eq('id', booking_id)
      return new Response(JSON.stringify({ success: false, message: "No providers available. Refund initiated." }), { headers: { "Content-Type": "application/json" } })
    }

    // 2. Select the closest provider (RPC already orders by distance)
    const bestProvider = eligibleProviders[0]

    // 3. Create an Offer atomically with a 60-second server-side expiry
    const expiresAt = new Date(Date.now() + 60 * 1000).toISOString() // Exactly 60 seconds from server time

    const { error: offerError } = await supabaseClient.from('offers').insert({
      booking_id: booking_id,
      provider_id: bestProvider.id,
      status: 'pending',
      expires_at: expiresAt
    })

    if (offerError) throw offerError

    // 4. (Background Task) We would schedule a cron/worker to check this offer in exactly 60 seconds.
    // If status is still 'pending', it marks it 'expired' and calls this function again to find the NEXT provider.

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Offer sent to provider", 
      provider: bestProvider.full_name,
      expires_at: expiresAt
    }), { headers: { "Content-Type": "application/json" } })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 })
  }
})
