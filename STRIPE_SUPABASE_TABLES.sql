-- STRIPE SUPABASE TABLES SETUP
-- Voer dit uit in je Supabase SQL Editor

-- 1. Create stripe_payment_events table
CREATE TABLE IF NOT EXISTS public.stripe_payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  payment_intent TEXT,
  payment_status TEXT,
  amount_total NUMERIC,
  currency TEXT,
  customer_email TEXT,
  supabase_user_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create stripe_customers table
CREATE TABLE IF NOT EXISTS public.stripe_customers (
  stripe_customer_id TEXT PRIMARY KEY,
  supabase_user_id UUID,
  email TEXT,
  last_payment_intent TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_session_id ON public.stripe_payment_events(session_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_user_id ON public.stripe_payment_events(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payment_events_email ON public.stripe_payment_events(customer_email);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id ON public.stripe_customers(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_customers_email ON public.stripe_customers(email);

-- 4. Enable Row Level Security (RLS) - allow service role to insert/update
ALTER TABLE public.stripe_payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stripe_customers ENABLE ROW LEVEL SECURITY;

-- 5. Create policies to allow service role full access
CREATE POLICY IF NOT EXISTS "Service role can manage payment events"
  ON public.stripe_payment_events
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role can manage customers"
  ON public.stripe_customers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 6. Grant permissions
GRANT ALL ON public.stripe_payment_events TO service_role;
GRANT ALL ON public.stripe_customers TO service_role;

-- 7. Verify profiles table has plan column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'plan'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN plan TEXT DEFAULT 'free';
  END IF;
END $$;

-- 8. Verify profiles table has updated_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

