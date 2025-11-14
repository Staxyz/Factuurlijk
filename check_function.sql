-- Check of de handle_new_user functie correct is ingesteld
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
    AND routine_name = 'handle_new_user';

-- Check ook of de functie SECURITY DEFINER heeft (belangrijk!)
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname = 'handle_new_user';




