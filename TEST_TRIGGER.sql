-- ============================================
-- TEST SCRIPT VOOR TRIGGER
-- ============================================
-- Voer dit uit om te testen of de trigger werkt

-- 1. Check of de trigger bestaat
SELECT 
    'Trigger check' as test,
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'auth' 
    AND event_object_table = 'users'
    AND trigger_name = 'on_auth_user_created';

-- 2. Check of de functie bestaat en SECURITY DEFINER heeft
SELECT 
    'Function check' as test,
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    CASE 
        WHEN p.prosecdef THEN '✓ SECURITY DEFINER is correct'
        ELSE '✗ SECURITY DEFINER ontbreekt!'
    END as security_status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname = 'handle_new_user';

-- 3. Check policies
SELECT 
    'Policy check' as test,
    policyname,
    cmd,
    roles,
    CASE 
        WHEN cmd = 'INSERT' THEN '✓'
        ELSE ''
    END as insert_policy
FROM pg_policies
WHERE schemaname = 'public' 
    AND tablename = 'profiles'
ORDER BY cmd;

-- 4. Check Row Level Security
SELECT 
    'RLS check' as test,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '✓ RLS is enabled'
        ELSE '✗ RLS is disabled!'
    END as rls_status
FROM pg_tables
WHERE schemaname = 'public' 
    AND tablename = 'profiles';

-- 5. Check recent users en hun profielen
SELECT 
    'Recent users check' as test,
    u.id as user_id,
    u.email,
    u.created_at as user_created,
    p.id as profile_id,
    p.name as profile_name,
    p.created_at as profile_created,
    CASE 
        WHEN p.id IS NOT NULL THEN '✓ Profiel bestaat'
        ELSE '✗ Geen profiel!'
    END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 5;

-- 6. Test de functie direct (alleen als je een test user ID hebt)
-- Vervang 'USER_ID_HIER' met een echte user ID
-- SELECT public.handle_new_user() FROM (
--     SELECT * FROM auth.users WHERE id = 'USER_ID_HIER' LIMIT 1
-- ) AS test;

