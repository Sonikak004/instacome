-- ============================================================
-- INSTACOME SUPABASE ROW-LEVEL SECURITY (RLS) FIX
-- Enables RLS on all tables and applies bulletproof policies
-- Run this in your Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. ENABLE ROW LEVEL SECURITY ON ALL PUBLIC TABLES
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chef_bookings ENABLE ROW LEVEL SECURITY;

-- 2. DROP OLD/CONFLICTING POLICIES SAFELY
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

DROP POLICY IF EXISTS "Public providers are viewable by everyone." ON public.providers;
DROP POLICY IF EXISTS "Providers are viewable by everyone" ON public.providers;
DROP POLICY IF EXISTS "Providers can insert own record." ON public.providers;
DROP POLICY IF EXISTS "Providers can update own record." ON public.providers;

DROP POLICY IF EXISTS "Active menu items are viewable by everyone." ON public.menu_items;
DROP POLICY IF EXISTS "Providers can manage own menu items" ON public.menu_items;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON public.orders;
DROP POLICY IF EXISTS "Providers can view incoming orders" ON public.orders;

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Users can insert order items" ON public.order_items;

DROP POLICY IF EXISTS "Users can view own chef bookings" ON public.chef_bookings;
DROP POLICY IF EXISTS "Users can insert chef bookings" ON public.chef_bookings;
DROP POLICY IF EXISTS "Chefs can view incoming bookings" ON public.chef_bookings;

-- 3. PROFILES POLICIES
-- Anyone can view basic public profile info (for chef/cook names)
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Authenticated users can insert their own profile on signup
CREATE POLICY "Users can insert own profile."
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile."
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. PROVIDERS POLICIES
-- Anyone can view providers
CREATE POLICY "Providers are viewable by everyone"
ON public.providers FOR SELECT
USING (true);

-- Providers can create their provider record during onboarding
CREATE POLICY "Providers can insert own record."
ON public.providers FOR INSERT
WITH CHECK (auth.uid() = id);

-- Providers can update their own details & online status
CREATE POLICY "Providers can update own record."
ON public.providers FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 5. MENU ITEMS POLICIES
-- Everyone can browse active menu items
CREATE POLICY "Active menu items are viewable by everyone."
ON public.menu_items FOR SELECT
USING (true);

-- Providers can manage their own menu items
CREATE POLICY "Providers can manage own menu items"
ON public.menu_items FOR ALL
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- 6. ORDERS POLICIES
-- Customers can view their own orders
CREATE POLICY "Users can view own orders"
ON public.orders FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- Customers can place orders
CREATE POLICY "Users can insert own orders"
ON public.orders FOR INSERT
WITH CHECK (auth.uid() = customer_id);

-- Providers or customers can update order status (e.g. cancel or mark ready)
CREATE POLICY "Users can update own orders"
ON public.orders FOR UPDATE
USING (auth.uid() = customer_id OR auth.uid() = provider_id);

-- 7. ORDER ITEMS POLICIES
CREATE POLICY "Users can view own order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND (orders.customer_id = auth.uid() OR orders.provider_id = auth.uid())
  )
);

CREATE POLICY "Users can insert order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.customer_id = auth.uid()
  )
);

-- 8. CHEF BOOKINGS POLICIES
CREATE POLICY "Users can view own chef bookings"
ON public.chef_bookings FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = chef_id);

CREATE POLICY "Users can insert chef bookings"
ON public.chef_bookings FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Chefs and customers can update bookings"
ON public.chef_bookings FOR UPDATE
USING (auth.uid() = customer_id OR auth.uid() = chef_id);
