-- ============================================
-- CUSTOMERS TABLE SETUP - VOER DIT UIT IN SUPABASE SQL EDITOR
-- ============================================
-- Deze code maakt de customers tabel aan of voegt nieuwe kolommen toe
-- voor alle klantgegevens uit het nieuwe formulier

-- ============================================
-- STAP 1: MAAK DE CUSTOMERS TABEL AAN (ALS DEZE NOG NIET BESTAAT)
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basis velden
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    city TEXT,
    
    -- Nieuwe velden voor uitgebreid klantformulier
    customer_type TEXT DEFAULT 'bedrijf' CHECK (customer_type IN ('bedrijf', 'persoon')),
    kvk_number TEXT,
    btw_number TEXT,
    phone_number TEXT,
    address_line_2 TEXT,
    postal_code TEXT,
    country TEXT,
    preferred_language TEXT DEFAULT 'Nederlands'
);

-- ============================================
-- STAP 2: VOEG NIEUWE KOLOMMEN TOE AAN BESTAANDE TABEL (ALS DEZE AL BESTAAT)
-- ============================================
-- Deze statements voegen alleen kolommen toe als ze nog niet bestaan

DO $$ 
BEGIN
    -- Voeg customer_type toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'customer_type'
    ) THEN
        ALTER TABLE public.customers 
        ADD COLUMN customer_type TEXT DEFAULT 'bedrijf' 
        CHECK (customer_type IN ('bedrijf', 'persoon'));
    END IF;

    -- Voeg kvk_number toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'kvk_number'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN kvk_number TEXT;
    END IF;

    -- Voeg btw_number toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'btw_number'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN btw_number TEXT;
    END IF;

    -- Voeg phone_number toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'phone_number'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN phone_number TEXT;
    END IF;

    -- Voeg address_line_2 toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'address_line_2'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN address_line_2 TEXT;
    END IF;

    -- Voeg postal_code toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'postal_code'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN postal_code TEXT;
    END IF;

    -- Voeg country toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'country'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN country TEXT;
    END IF;

    -- Voeg preferred_language toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'customers' 
        AND column_name = 'preferred_language'
    ) THEN
        ALTER TABLE public.customers ADD COLUMN preferred_language TEXT DEFAULT 'Nederlands';
    END IF;
END $$;

-- ============================================
-- STAP 3: MAAK INDEXES VOOR BETERE PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON public.customers(customer_type);

-- ============================================
-- STAP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAP 5: VERWIJDER OUDE POLICIES (ALS ZE BESTAAN)
-- ============================================
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;

-- ============================================
-- STAP 6: MAAK NIEUWE RLS POLICIES
-- ============================================

-- Policy: Gebruikers kunnen hun eigen klanten lezen
CREATE POLICY "Users can view own customers"
    ON public.customers
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen klanten aanmaken
CREATE POLICY "Users can insert own customers"
    ON public.customers
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen klanten updaten
CREATE POLICY "Users can update own customers"
    ON public.customers
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen klanten verwijderen
CREATE POLICY "Users can delete own customers"
    ON public.customers
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- STAP 7: GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.customers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO authenticated;

-- ============================================
-- STAP 8: VERIFICATIE
-- ============================================
DO $$
DECLARE
    column_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check kolommen
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'customers';
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
        AND tablename = 'customers';
    
    -- Check indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
        AND tablename = 'customers';
    
    RAISE NOTICE 'Customers tabel setup verificatie:';
    RAISE NOTICE '  - Aantal kolommen: %', column_count;
    RAISE NOTICE '  - Aantal policies: %', policy_count;
    RAISE NOTICE '  - Aantal indexes: %', index_count;
    
    IF column_count < 10 THEN
        RAISE WARNING 'Mogelijk te weinig kolommen (verwacht minimaal 10, gevonden: %)', column_count;
    END IF;
    
    IF policy_count < 4 THEN
        RAISE WARNING 'Mogelijk te weinig policies (verwacht minimaal 4, gevonden: %)', policy_count;
    END IF;
END $$;

-- ============================================
-- KLAAR!
-- ============================================
-- De customers tabel is nu klaar voor gebruik met alle nieuwe velden.
-- Alle klantgegevens uit het formulier kunnen nu worden opgeslagen.

