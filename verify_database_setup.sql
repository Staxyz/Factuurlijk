-- ============================================
-- VERIFICATIE SCRIPT VOOR DATABASE SETUP
-- ============================================
-- Voer dit uit in Supabase SQL Editor om te controleren of alles correct is ingesteld

-- 1. Check of de profiles tabel bestaat
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'public' 
    AND table_name = 'profiles';

-- 2. Check of Row Level Security is ingeschakeld
SELECT 
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'profiles';

-- 3. Check of de policies bestaan
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'profiles'
ORDER BY policyname;

-- 4. Check of de functie handle_new_user bestaat
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user';

-- 5. Check of de trigger bestaat
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    event_object_schema,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';

-- 6. Check of de handle_updated_at functie bestaat
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND routine_name = 'handle_updated_at';

-- 7. Check of de set_updated_at trigger bestaat
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public' 
    AND event_object_table = 'profiles'
    AND trigger_name = 'set_updated_at';

-- 8. Test: Check recent aangemaakte profielen
SELECT 
    id,
    name,
    email,
    created_at,
    updated_at
FROM public.profiles
ORDER BY updated_at DESC
LIMIT 5;

-- ============================================
-- VERWACHTE RESULTATEN:
-- ============================================
-- 1. profiles tabel moet bestaan
-- 2. rowsecurity moet 'true' zijn
-- 3. Er moeten minimaal 4 policies zijn (SELECT, INSERT, UPDATE, DELETE)
-- 4. handle_new_user functie moet bestaan
-- 5. on_auth_user_created trigger moet bestaan op auth.users
-- 6. handle_updated_at functie moet bestaan
-- 7. set_updated_at trigger moet bestaan op public.profiles
-- 8. Recente profielen moeten zichtbaar zijn

