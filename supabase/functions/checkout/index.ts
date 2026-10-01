import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { serviceCategory, basePrice, addressId } = await req.json();

    // Tax Engine (Configurable per category)
    // In production, fetch this from a `tax_configuration` table
    let gstRate = 0;
    if (serviceCategory === 'chef') gstRate = 0.18; // 18% GST on services
    else if (serviceCategory === 'laundry') gstRate = 0.18;
    else if (serviceCategory === 'pest_control') gstRate = 0.18;

    const platformFee = 10; // Customer platform fee
    const providerFee = 10; // Deducted from provider payout later

    const taxableAmount = basePrice + platformFee;
    const gstAmount = Math.round(taxableAmount * gstRate);
    const totalCustomerCharge = taxableAmount + gstAmount;

    // 1. Create a Pending Booking in the Database
    const { data: booking, error: bookingError } = await supabaseClient
      .from('bookings')
      .insert({
        customer_id: user.id,
        category: serviceCategory,
        status: 'pending_payment',
        payment_status: 'pending',
        checkout_price: basePrice,
        platform_fee: platformFee,
        provider_fee: providerFee,
        checkout_tax: gstAmount
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // 2. Gateway Integration Adapter
    // If RAZORPAY_KEY_SECRET is missing, fallback to Deterministic Sandbox Mode
    const razorpaySecret = Deno.env.get('RAZORPAY_KEY_SECRET');
    let gatewayOrderId = `mock_order_${booking.id}`;
    let isSandbox = true;

    if (razorpaySecret) {
      // Call Razorpay API to generate a real order
      // const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', { ... })
      isSandbox = false;
      // gatewayOrderId = razorpayRes.id;
    }

    return new Response(JSON.stringify({
      bookingId: booking.id,
      gatewayOrderId,
      breakdown: {
        basePrice,
        platformFee,
        gstAmount,
        totalCustomerCharge
      },
      isSandbox
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
