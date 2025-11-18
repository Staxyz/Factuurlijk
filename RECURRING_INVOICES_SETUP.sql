-- ============================================
-- RECURRING INVOICES SETUP - VOER DIT UIT IN SUPABASE SQL EDITOR
-- ============================================
-- Deze code maakt de recurring_invoice_templates tabel aan voor terugkerende facturen

-- ============================================
-- STAP 1: MAAK DE RECURRING_INVOICE_TEMPLATES TABEL AAN
-- ============================================
CREATE TABLE IF NOT EXISTS public.recurring_invoice_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    customer JSONB NOT NULL,
    lines JSONB NOT NULL,
    btw_percentage NUMERIC NOT NULL DEFAULT 21,
    recurring_interval TEXT NOT NULL CHECK (recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly')),
    recurring_start_date DATE NOT NULL,
    recurring_end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STAP 2: VOEG NIEUWE KOLOMMEN TOE AAN INVOICES TABEL
-- ============================================
-- Voeg kolommen toe voor terugkerende facturen aan de bestaande invoices tabel

DO $$ 
BEGIN
    -- Voeg is_recurring toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'is_recurring'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN is_recurring BOOLEAN DEFAULT FALSE;
    END IF;

    -- Voeg recurring_template_id toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'recurring_template_id'
    ) THEN
        ALTER TABLE public.invoices 
        ADD COLUMN recurring_template_id UUID REFERENCES public.recurring_invoice_templates(id) ON DELETE SET NULL;
    END IF;

    -- Voeg recurring_interval toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'recurring_interval'
    ) THEN
        ALTER TABLE public.invoices 
        ADD COLUMN recurring_interval TEXT 
        CHECK (recurring_interval IN ('weekly', 'monthly', 'quarterly', 'yearly'));
    END IF;

    -- Voeg recurring_start_date toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'recurring_start_date'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN recurring_start_date DATE;
    END IF;

    -- Voeg recurring_end_date toe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'invoices' 
        AND column_name = 'recurring_end_date'
    ) THEN
        ALTER TABLE public.invoices ADD COLUMN recurring_end_date DATE;
    END IF;
END $$;

-- ============================================
-- STAP 3: MAAK INDEXES VOOR BETERE PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_recurring_templates_user_id ON public.recurring_invoice_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_templates_interval ON public.recurring_invoice_templates(recurring_interval);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_template_id ON public.invoices(recurring_template_id);
CREATE INDEX IF NOT EXISTS idx_invoices_is_recurring ON public.invoices(is_recurring);

-- ============================================
-- STAP 4: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.recurring_invoice_templates ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAP 5: VERWIJDER OUDE POLICIES (ALS ZE BESTAAN)
-- ============================================
DROP POLICY IF EXISTS "Users can view own recurring templates" ON public.recurring_invoice_templates;
DROP POLICY IF EXISTS "Users can insert own recurring templates" ON public.recurring_invoice_templates;
DROP POLICY IF EXISTS "Users can update own recurring templates" ON public.recurring_invoice_templates;
DROP POLICY IF EXISTS "Users can delete own recurring templates" ON public.recurring_invoice_templates;

-- ============================================
-- STAP 6: MAAK NIEUWE RLS POLICIES
-- ============================================

-- Policy: Gebruikers kunnen hun eigen terugkerende factuur templates lezen
CREATE POLICY "Users can view own recurring templates"
    ON public.recurring_invoice_templates
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen terugkerende factuur templates aanmaken
CREATE POLICY "Users can insert own recurring templates"
    ON public.recurring_invoice_templates
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen terugkerende factuur templates updaten
CREATE POLICY "Users can update own recurring templates"
    ON public.recurring_invoice_templates
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Gebruikers kunnen hun eigen terugkerende factuur templates verwijderen
CREATE POLICY "Users can delete own recurring templates"
    ON public.recurring_invoice_templates
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- ============================================
-- STAP 7: UPDATE TRIGGER VOOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_recurring_template_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_recurring_template_updated_at ON public.recurring_invoice_templates;
CREATE TRIGGER set_recurring_template_updated_at
    BEFORE UPDATE ON public.recurring_invoice_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_recurring_template_updated_at();

-- ============================================
-- STAP 8: GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.recurring_invoice_templates TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.recurring_invoice_templates TO authenticated;

-- ============================================
-- STAP 9: VERIFICATIE
-- ============================================
DO $$
DECLARE
    column_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
BEGIN
    -- Check kolommen in recurring_invoice_templates
    SELECT COUNT(*) INTO column_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
        AND table_name = 'recurring_invoice_templates';
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
        AND tablename = 'recurring_invoice_templates';
    
    -- Check indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
        AND tablename = 'recurring_invoice_templates';
    
    RAISE NOTICE 'Recurring invoices setup verificatie:';
    RAISE NOTICE '  - Aantal kolommen in templates tabel: %', column_count;
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
-- De recurring invoices functionaliteit is nu klaar voor gebruik.
-- Gebruikers kunnen nu terugkerende facturen aanmaken en bestaande templates selecteren.

