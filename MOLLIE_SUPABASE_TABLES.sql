-- MOLLIE SUPABASE TABLES SETUP
-- Run this script in Supabase SQL editor (or psql) to prepare Mollie payment logging.

BEGIN;

-- Optional: remove legacy Stripe tables if they still exist
DROP TABLE IF EXISTS public.stripe_payment_events;
DROP TABLE IF EXISTS public.stripe_customers;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.mollie_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id text UNIQUE NOT NULL,
  payment_status text NOT NULL,
  amount_value numeric(10,2),
  amount_currency text,
  description text,
  customer_email text,
  supabase_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata jsonb,
  method text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_mollie_payments_payment_id ON public.mollie_payments(payment_id);
CREATE INDEX IF NOT EXISTS idx_mollie_payments_user_id ON public.mollie_payments(supabase_user_id);
CREATE INDEX IF NOT EXISTS idx_mollie_payments_email ON public.mollie_payments(customer_email);

ALTER TABLE public.mollie_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mollie payments service write" ON public.mollie_payments;
DROP POLICY IF EXISTS "mollie payments user read" ON public.mollie_payments;

-- Allow the service role (used by the backend) full access
CREATE POLICY "mollie payments service write"
  ON public.mollie_payments
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read their own payments (optional)
CREATE POLICY "mollie payments user read"
  ON public.mollie_payments
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (auth.uid() = supabase_user_id);

COMMIT;

