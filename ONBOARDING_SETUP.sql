-- ============================================
-- ONBOARDING STATUS SETUP
-- ============================================
-- Voeg onboarding status velden toe aan de profiles tabel
-- Voer dit uit in Supabase Dashboard > SQL Editor

-- ============================================
-- STAP 1: VOEG ONBOARDING VELDEN TOE AAN PROFILES TABEL
-- ============================================

-- Voeg kolommen toe voor onboarding status
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_profile_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_template_completed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS onboarding_invoice_completed BOOLEAN DEFAULT FALSE;

-- ============================================
-- STAP 2: UPDATE BESTAANDE GEBRUIKERS (OPTIONEEL)
-- ============================================
-- Als je wilt dat bestaande gebruikers de rondleiding niet zien,
-- kun je deze query uitvoeren:

-- UPDATE public.profiles
-- SET onboarding_completed = TRUE
-- WHERE onboarding_completed IS NULL OR onboarding_completed = FALSE;

-- ============================================
-- STAP 3: CREATE INDEX VOOR PERFORMANCE (OPTIONEEL)
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding 
ON public.profiles(id) 
WHERE onboarding_completed = FALSE;

-- ============================================
-- KLAAR!
-- ============================================
-- De onboarding status wordt nu opgeslagen in de profiles tabel.
-- Nieuwe gebruikers hebben standaard alle onboarding velden op FALSE,
-- wat betekent dat ze de rondleiding zullen zien.


