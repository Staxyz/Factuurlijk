-- ============================================
-- SUPABASE DATABASE SETUP VOOR NIEUWE GEBRUIKERS
-- ============================================
-- Voer deze SQL queries uit in Supabase Dashboard > SQL Editor
-- Dit zorgt ervoor dat automatisch een profiel wordt aangemaakt voor nieuwe gebruikers

-- ============================================
-- 1. ZORG DAT DE PROFILES TABEL BESTAAT
-- ============================================
-- Controleer eerst of de tabel bestaat. Als deze niet bestaat, maak hem aan:

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    address TEXT NOT NULL DEFAULT '',
    kvk_number TEXT,
    btw_number TEXT,
    iban TEXT,
    phone_number TEXT,
    logo_url TEXT,
    template_style TEXT NOT NULL DEFAULT 'corporate',
    template_customizations JSONB,
    plan TEXT NOT NULL DEFAULT 'free',
    invoice_footer_text TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. POLICIES VOOR PROFILES TABEL
-- ============================================

-- Policy: Gebruikers kunnen hun eigen profiel lezen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Gebruikers kunnen hun eigen profiel aanmaken
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy: Gebruikers kunnen hun eigen profiel updaten
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Gebruikers kunnen hun eigen profiel verwijderen
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- 4. FUNCTIE OM AUTOMATISCH PROFIEL AAN TE MAKEN
-- ============================================
-- Deze functie wordt aangeroepen door de trigger wanneer een nieuwe gebruiker wordt aangemaakt

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Haal de naam op uit user_metadata of gebruik email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1),
        'Nieuwe Gebruiker'
    );
    
    -- Haal email op
    user_email := COALESCE(NEW.email, '');
    
    -- Maak een nieuw profiel aan
    INSERT INTO public.profiles (
        id,
        name,
        email,
        address,
        kvk_number,
        btw_number,
        iban,
        phone_number,
        logo_url,
        template_style,
        template_customizations,
        plan,
        invoice_footer_text,
        updated_at
    ) VALUES (
        NEW.id,
        user_name,
        user_email,
        '',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        'corporate',
        NULL,
        'free',
        NULL,
        NOW()
    )
    ON CONFLICT (id) DO NOTHING; -- Voorkom errors als profiel al bestaat
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. TRIGGER DIE FUNCTIE AANROEPT BIJ NIEUWE GEBRUIKER
-- ============================================
-- Deze trigger wordt automatisch uitgevoerd wanneer een nieuwe gebruiker wordt aangemaakt in auth.users

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 6. OPTIONEEL: UPDATE TRIGGER VOOR UPDATED_AT
-- ============================================
-- Zorgt ervoor dat updated_at automatisch wordt bijgewerkt

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 7. VERIFICATIE: CHECK OF ALLES WERKT
-- ============================================
-- Voer deze query uit om te controleren of de trigger en functie correct zijn aangemaakt:

-- SELECT 
--     trigger_name, 
--     event_manipulation, 
--     event_object_table,
--     action_statement
-- FROM information_schema.triggers
-- WHERE trigger_schema = 'auth' 
--     AND event_object_table = 'users';

-- SELECT 
--     routine_name, 
--     routine_type
-- FROM information_schema.routines
-- WHERE routine_schema = 'public' 
--     AND routine_name IN ('handle_new_user', 'handle_updated_at');

-- ============================================
-- KLAAR!
-- ============================================
-- Nu wordt automatisch een profiel aangemaakt voor elke nieuwe gebruiker
-- die zich registreert via email/password of Google OAuth.

