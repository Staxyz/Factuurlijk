-- ============================================
-- STRIPE PAYMENTS DATABASE SETUP
-- ============================================

-- 1. Create stripe_customers table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create stripe_subscriptions table
CREATE TABLE IF NOT EXISTS public.stripe_subscriptions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL, -- 'active', 'past_due', 'trialing', 'canceled', 'paused', 'incomplete'
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create stripe_payment_events table (for audit trail)
CREATE TABLE IF NOT EXISTS public.stripe_payment_events (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'charge.succeeded', 'invoice.paid', 'customer.subscription.created', etc.
  stripe_object_id TEXT,
  amount INTEGER, -- in cents
  currency TEXT,
  status TEXT,
  raw_data JSONB,
  processed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_payment_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- stripe_customers policies
DROP POLICY IF EXISTS "Users can view own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can view own stripe customer"
  ON public.stripe_customers FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Authenticated users can insert stripe customer" ON public.stripe_customers;
CREATE POLICY "Authenticated users can insert stripe customer"
  ON public.stripe_customers FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own stripe customer" ON public.stripe_customers;
CREATE POLICY "Users can update own stripe customer"
  ON public.stripe_customers FOR UPDATE
  USING (auth.uid() = id);

-- stripe_subscriptions policies
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.stripe_subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.stripe_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert subscriptions" ON public.stripe_subscriptions;
CREATE POLICY "Service role can insert subscriptions"
  ON public.stripe_subscriptions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can update subscriptions" ON public.stripe_subscriptions;
CREATE POLICY "Service role can update subscriptions"
  ON public.stripe_subscriptions FOR UPDATE
  USING (true);

-- stripe_payment_events policies
DROP POLICY IF EXISTS "Users can view own payment events" ON public.stripe_payment_events;
CREATE POLICY "Users can view own payment events"
  ON public.stripe_payment_events FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert payment events" ON public.stripe_payment_events;
CREATE POLICY "Service role can insert payment events"
  ON public.stripe_payment_events FOR INSERT
  WITH CHECK (true);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_user_id 
  ON public.stripe_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_stripe_customer_id 
  ON public.stripe_subscriptions(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status 
  ON public.stripe_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_user_id 
  ON public.stripe_payment_events(user_id);

CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_event_type 
  ON public.stripe_payment_events(event_type);

CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_processed 
  ON public.stripe_payment_events(processed);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update profile plan based on subscription status
CREATE OR REPLACE FUNCTION public.update_profile_plan_from_subscription()
RETURNS TRIGGER AS $$
BEGIN
  -- Update profile plan to 'pro' if subscription is active
  UPDATE public.profiles
  SET plan = CASE 
    WHEN NEW.status = 'active' OR NEW.status = 'trialing' THEN 'pro'
    WHEN NEW.status = 'canceled' OR NEW.status = 'paused' THEN 'free'
    ELSE plan
  END,
  updated_at = NOW()
  WHERE id = NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update profile when subscription changes
DROP TRIGGER IF EXISTS stripe_subscription_status_change ON public.stripe_subscriptions;
CREATE TRIGGER stripe_subscription_status_change
  AFTER INSERT OR UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_profile_plan_from_subscription();

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_stripe_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at on stripe_subscriptions
DROP TRIGGER IF EXISTS stripe_subscriptions_updated_at ON public.stripe_subscriptions;
CREATE TRIGGER stripe_subscriptions_updated_at
  BEFORE UPDATE ON public.stripe_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_subscriptions_updated_at();

-- Similar for stripe_customers
DROP TRIGGER IF EXISTS stripe_customers_updated_at ON public.stripe_customers;
CREATE TRIGGER stripe_customers_updated_at
  BEFORE UPDATE ON public.stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_stripe_subscriptions_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION public.get_user_subscription(user_id UUID)
RETURNS TABLE (
  subscription_id TEXT,
  status TEXT,
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    stripe_subscriptions.id,
    stripe_subscriptions.status,
    stripe_subscriptions.current_period_start,
    stripe_subscriptions.current_period_end,
    stripe_subscriptions.cancel_at_period_end
  FROM public.stripe_subscriptions
  WHERE stripe_subscriptions.user_id = $1
  ORDER BY stripe_subscriptions.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION public.is_pro_member(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  subscription_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO subscription_count
  FROM public.stripe_subscriptions
  WHERE stripe_subscriptions.user_id = $1
  AND (stripe_subscriptions.status = 'active' OR stripe_subscriptions.status = 'trialing');
  
  RETURN subscription_count > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VERIFICATION QUERY (Run this to verify setup)
-- ============================================

-- This query will show you all tables and their status
/*
SELECT 
  tablename,
  'EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('stripe_customers', 'stripe_subscriptions', 'stripe_payment_events');

-- Check RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename LIKE 'stripe_%';

-- Test the is_pro_member function with a user_id:
-- SELECT public.is_pro_member('00000000-0000-0000-0000-000000000000'::uuid);
*/

