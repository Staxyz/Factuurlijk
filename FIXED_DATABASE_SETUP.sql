-- ============================================
-- FIXED DATABASE SETUP - VOER DIT UIT IN SUPABASE SQL EDITOR
-- ============================================
-- Deze versie lost de CASCADE error op

-- ============================================
-- STAP 1: VERWIJDER BESTAANDE TRIGGERS EN FUNCTIES
-- ============================================
-- Verwijder eerst alle triggers die afhankelijk zijn van de functies
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS on_profiles_updated ON public.profiles;

-- Verwijder alle mogelijke triggers op profiles tabel
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers 
              WHERE event_object_schema = 'public' 
              AND event_object_table = 'profiles') 
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON public.profiles';
    END LOOP;
END $$;

-- Nu kunnen we de functies veilig verwijderen (met CASCADE voor veiligheid)
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- ============================================
-- STAP 2: ZORG DAT DE PROFILES TABEL BESTAAT
-- ============================================
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
-- STAP 3: ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STAP 4: VERWIJDER OUDE POLICIES EN MAAK NIEUWE
-- ============================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;

-- Policy: Gebruikers kunnen hun eigen profiel lezen
CREATE POLICY "Users can view own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Policy: Gebruikers kunnen hun eigen profiel aanmaken
CREATE POLICY "Users can insert own profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

-- Policy: Service role kan profielen aanmaken (voor trigger)
CREATE POLICY "Service role can insert profiles"
    ON public.profiles
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Gebruikers kunnen hun eigen profiel updaten
CREATE POLICY "Users can update own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy: Gebruikers kunnen hun eigen profiel verwijderen
CREATE POLICY "Users can delete own profile"
    ON public.profiles
    FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- ============================================
-- STAP 5: FUNCTIE OM AUTOMATISCH PROFIEL AAN TE MAKEN
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
BEGIN
    -- Haal de naam op uit user_metadata of gebruik email prefix
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(COALESCE(NEW.email, ''), '@', 1),
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
    ON CONFLICT (id) DO UPDATE SET
        updated_at = NOW();
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log de error maar gooi hem niet door
        RAISE WARNING 'Error creating profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- ============================================
-- STAP 6: TRIGGER DIE FUNCTIE AANROEPT BIJ NIEUWE GEBRUIKER
-- ============================================
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- STAP 7: UPDATE TRIGGER VOOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STAP 8: GRANT PERMISSIONS
-- ============================================
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.profiles TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- ============================================
-- STAP 9: VERIFICATIE
-- ============================================
DO $$
DECLARE
    trigger_count INTEGER;
    function_count INTEGER;
    policy_count INTEGER;
BEGIN
    -- Check trigger
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'auth' 
        AND event_object_table = 'users'
        AND trigger_name = 'on_auth_user_created';
    
    -- Check functie
    SELECT COUNT(*) INTO function_count
    FROM information_schema.routines
    WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user';
    
    -- Check policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public' 
        AND tablename = 'profiles';
    
    RAISE NOTICE 'Setup verificatie:';
    RAISE NOTICE '  - Trigger bestaat: %', CASE WHEN trigger_count > 0 THEN 'JA' ELSE 'NEE' END;
    RAISE NOTICE '  - Functie bestaat: %', CASE WHEN function_count > 0 THEN 'JA' ELSE 'NEE' END;
    RAISE NOTICE '  - Aantal policies: %', policy_count;
    
    IF trigger_count = 0 THEN
        RAISE EXCEPTION 'Trigger on_auth_user_created bestaat niet!';
    END IF;
    
    IF function_count = 0 THEN
        RAISE EXCEPTION 'Functie handle_new_user bestaat niet!';
    END IF;
    
    IF policy_count < 4 THEN
        RAISE WARNING 'Mogelijk te weinig policies (verwacht minimaal 4, gevonden: %)', policy_count;
    END IF;
END $$;

-- ============================================
-- KLAAR!
-- ============================================
-- De setup is nu compleet. Test door een nieuwe gebruiker aan te maken.




