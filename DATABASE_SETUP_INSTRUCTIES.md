# Database Setup Instructies

## Probleem
Je krijgt de error "Database error saving new user" omdat er geen automatische trigger is die een profiel aanmaakt wanneer een nieuwe gebruiker wordt geregistreerd.

## Oplossing
Voer de SQL code uit in Supabase om automatisch een profiel aan te maken voor nieuwe gebruikers.

## Stappen

### 1. Open Supabase SQL Editor
1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Klik op **SQL Editor** in het linker menu
4. Klik op **New query**

### 2. Kopieer en Plak de SQL Code
Open het bestand `database_setup.sql` en kopieer de volledige inhoud.

**OF** gebruik deze korte versie hieronder:

```sql
-- ============================================
-- AUTOMATISCH PROFIEL AANMAKEN VOOR NIEUWE GEBRUIKERS
-- ============================================

-- 1. Zorg dat de profiles tabel bestaat
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

-- 2. Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Policies voor profiles tabel
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile"
    ON public.profiles FOR DELETE
    TO authenticated
    USING (auth.uid() = id);

-- 4. Functie om automatisch profiel aan te maken
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_name TEXT;
    user_email TEXT;
BEGIN
    user_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        SPLIT_PART(NEW.email, '@', 1),
        'Nieuwe Gebruiker'
    );
    user_email := COALESCE(NEW.email, '');
    
    INSERT INTO public.profiles (
        id, name, email, address, kvk_number, btw_number, iban,
        phone_number, logo_url, template_style, template_customizations,
        plan, invoice_footer_text, updated_at
    ) VALUES (
        NEW.id, user_name, user_email, '', NULL, NULL, NULL,
        NULL, NULL, 'corporate', NULL, 'free', NULL, NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Trigger die functie aanroept bij nieuwe gebruiker
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. Update trigger voor updated_at
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
```

### 3. Voer de Query Uit
1. Plak de SQL code in de SQL Editor
2. Klik op **Run** (of druk op Ctrl+Enter)
3. Wacht tot je "Success. No rows returned" ziet

### 4. Test het
1. Probeer een nieuw account aan te maken in je applicatie
2. Check in Supabase Dashboard > **Table Editor** > **profiles** of er een nieuw profiel is aangemaakt
3. De error "Database error saving new user" zou nu opgelost moeten zijn

## Wat doet deze SQL code?

1. **Maakt de profiles tabel aan** (als deze nog niet bestaat)
2. **Zet Row Level Security aan** voor beveiliging
3. **Maakt policies aan** zodat gebruikers alleen hun eigen profiel kunnen lezen/aanpassen
4. **Maakt een functie aan** (`handle_new_user`) die automatisch een profiel aanmaakt
5. **Maakt een trigger aan** die de functie aanroept wanneer een nieuwe gebruiker wordt aangemaakt
6. **Maakt een update trigger aan** die `updated_at` automatisch bijwerkt

## Troubleshooting

### Error: "relation already exists"
- Dit betekent dat de tabel al bestaat. Dat is OK, de `CREATE TABLE IF NOT EXISTS` zal dit overslaan.

### Error: "permission denied"
- Zorg dat je ingelogd bent als project owner in Supabase
- Of voer de queries uit als service_role (niet aanbevolen voor productie)

### Error: "function already exists"
- Dit is OK, de `CREATE OR REPLACE FUNCTION` zal de functie updaten.

### Trigger werkt niet
- Check of de trigger bestaat: Ga naar **Database** > **Triggers** in Supabase Dashboard
- Check of de functie bestaat: Ga naar **Database** > **Functions**

## Verificatie

Na het uitvoeren van de SQL code, kun je controleren of alles werkt:

```sql
-- Check of de trigger bestaat
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'auth' AND event_object_table = 'users';

-- Check of de functie bestaat
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user';
```

Als je resultaten ziet, werkt alles correct!




