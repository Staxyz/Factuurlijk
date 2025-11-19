# Troubleshooting: "Database error saving new user"

## Stap 1: Verifieer Database Setup

Voer het verificatie script uit in Supabase SQL Editor:

1. Open `verify_database_setup.sql`
2. Kopieer de volledige inhoud
3. Plak in Supabase Dashboard > SQL Editor
4. Klik op **Run**
5. Controleer de resultaten

**Verwachte resultaten:**
- ✅ `profiles` tabel bestaat
- ✅ Row Level Security is `true`
- ✅ Minimaal 4 policies bestaan
- ✅ `handle_new_user` functie bestaat
- ✅ `on_auth_user_created` trigger bestaat
- ✅ `handle_updated_at` functie bestaat
- ✅ `set_updated_at` trigger bestaat

## Stap 2: Check Browser Console

Open de browser console (F12) en kijk naar:

1. **Signup errors:**
   - Zoek naar "Signup error details"
   - Noteer de exacte error message, status, en name

2. **Profile creation errors:**
   - Zoek naar "Error fetching profile"
   - Zoek naar "Profile not found for user"
   - Zoek naar "Error creating user profile"

3. **Auth state changes:**
   - Zoek naar "Auth state changed"
   - Check of de user ID correct is

## Stap 3: Check Supabase Logs

1. Ga naar Supabase Dashboard > **Logs** > **Postgres Logs**
2. Filter op "ERROR" of "WARNING"
3. Kijk naar errors rond de tijd van signup

## Stap 4: Veelvoorkomende Problemen

### Probleem 1: Trigger bestaat niet

**Symptoom:** Verificatie script toont geen trigger

**Oplossing:**
```sql
-- Voer dit opnieuw uit:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
```

### Probleem 2: Functie heeft geen permissions

**Symptoom:** Error "permission denied" in logs

**Oplossing:**
```sql
-- Zorg dat de functie SECURITY DEFINER heeft:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
-- ... functie code ...
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Probleem 3: Policies blokkeren insert

**Symptoom:** Profile wordt niet aangemaakt, geen error

**Oplossing:**
```sql
-- Check of INSERT policy bestaat:
SELECT * FROM pg_policies 
WHERE tablename = 'profiles' 
AND cmd = 'INSERT';

-- Als deze niet bestaat, maak hem aan:
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);
```

### Probleem 4: Tabel structuur klopt niet

**Symptoom:** Error over ontbrekende kolommen

**Oplossing:**
```sql
-- Check tabel structuur:
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'profiles';

-- Vergelijk met verwachte structuur in database_setup.sql
```

### Probleem 5: Email verificatie blokkeert signup

**Symptoom:** User wordt aangemaakt maar kan niet inloggen

**Oplossing:**
1. Ga naar Supabase Dashboard > **Authentication** > **Settings**
2. Scroll naar **Email Auth**
3. Zet **Enable email confirmations** UIT (voor development)
4. Klik op **Save**

## Stap 5: Test de Trigger Manueel

Test of de trigger werkt door een test user aan te maken:

```sql
-- Let op: Dit is alleen voor testing!
-- Maak een test user aan in auth.users (via Supabase Dashboard > Authentication > Users)
-- Of gebruik deze query (alleen als je weet wat je doet):

-- Check of de trigger werkt door te kijken naar recent aangemaakte users:
SELECT 
    u.id,
    u.email,
    u.created_at,
    p.id as profile_id,
    p.name as profile_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;
```

Als je users ziet zonder profile_id, werkt de trigger niet.

## Stap 6: Debug de Functie

Test de functie direct:

```sql
-- Vervang 'USER_ID_HIER' met een echte user ID
SELECT public.handle_new_user() FROM (
    SELECT * FROM auth.users WHERE id = 'USER_ID_HIER'
) AS test_user;
```

**Let op:** Dit werkt niet direct omdat het een trigger functie is. Gebruik in plaats daarvan:

```sql
-- Check of de functie correct is gedefinieerd:
SELECT pg_get_functiondef(oid)
FROM pg_proc
WHERE proname = 'handle_new_user';
```

## Stap 7: Check voor Conflicten

Soms kan de client-side code conflicteren met de trigger:

1. **Tijdelijke fix:** Verwijder de client-side profiel creatie tijdelijk
2. **Permanente fix:** Zorg dat de trigger altijd eerst draait (wat nu het geval is)

## Stap 8: Reset en Opnieuw Instellen

Als niets werkt, reset de setup:

```sql
-- 1. Verwijder de trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 2. Verwijder de functie
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 3. Voer database_setup.sql opnieuw uit
```

## Stap 9: Contact Support

Als het probleem blijft bestaan:

1. Verzamel alle error messages uit browser console
2. Verzamel Postgres logs uit Supabase Dashboard
3. Maak screenshots van de verificatie script resultaten
4. Noteer de exacte stappen om het probleem te reproduceren

## Snelle Checklist

- [ ] `verify_database_setup.sql` uitgevoerd en alle checks slagen
- [ ] Browser console gecontroleerd voor specifieke errors
- [ ] Supabase Postgres logs gecontroleerd
- [ ] Email verificatie uitgeschakeld (voor development)
- [ ] Trigger bestaat en is actief
- [ ] Functie heeft SECURITY DEFINER
- [ ] Policies zijn correct ingesteld
- [ ] Tabel structuur klopt
- [ ] Test user aangemaakt en profiel gecontroleerd




