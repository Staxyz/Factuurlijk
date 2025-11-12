# Fix: Database Error bij Signup

## Stap 1: Voer de Complete Database Setup uit

1. Open Supabase Dashboard > **SQL Editor**
2. Open het bestand `COMPLETE_DATABASE_SETUP.sql`
3. Kopieer de **VOLLEDIGE** inhoud
4. Plak in de SQL Editor
5. Klik op **Run**
6. Wacht tot je "Success" ziet

**BELANGRIJK:** Deze code reset alles en stelt het opnieuw in. Dit is veilig en lost de meeste problemen op.

## Stap 2: Verifieer dat alles werkt

1. Open het bestand `TEST_TRIGGER.sql`
2. Kopieer de volledige inhoud
3. Plak in Supabase SQL Editor
4. Klik op **Run**
5. Check de resultaten:
   - ✓ Trigger moet bestaan
   - ✓ Functie moet SECURITY DEFINER hebben
   - ✓ Policies moeten bestaan (minimaal 4)
   - ✓ RLS moet enabled zijn

## Stap 3: Test Signup

1. Open je webapp in de browser
2. Open de browser console (F12)
3. Ga naar de signup pagina
4. Vul gegevens in en klik op "Registreren"
5. Kijk naar de console logs

## Stap 4: Check Database

Na signup:
1. Ga naar Supabase Dashboard > **Table Editor** > **profiles**
2. Check of er een nieuw profiel is aangemaakt
3. Ga naar **Authentication** > **Users**
4. Check of de nieuwe user bestaat

## Veelvoorkomende Problemen

### Probleem: "permission denied for table profiles"
**Oplossing:** De functie heeft geen SECURITY DEFINER. Voer `COMPLETE_DATABASE_SETUP.sql` opnieuw uit.

### Probleem: Trigger bestaat maar werkt niet
**Oplossing:** 
1. Check of de functie `SECURITY DEFINER` heeft (gebruik TEST_TRIGGER.sql)
2. Check of er een INSERT policy is voor service_role
3. Voer COMPLETE_DATABASE_SETUP.sql opnieuw uit

### Probleem: "relation profiles does not exist"
**Oplossing:** De tabel bestaat niet. Voer COMPLETE_DATABASE_SETUP.sql uit (stap 2 maakt de tabel aan).

### Probleem: User wordt aangemaakt maar geen profiel
**Oplossing:**
1. Check de Supabase logs: Dashboard > **Logs** > **Postgres Logs**
2. Zoek naar errors rond de tijd van signup
3. Check of de trigger correct is ingesteld (gebruik TEST_TRIGGER.sql)

## Als het nog steeds niet werkt

1. **Verzamel informatie:**
   - Screenshot van de error in de browser
   - Console logs (F12)
   - Resultaten van TEST_TRIGGER.sql
   - Postgres logs uit Supabase

2. **Check deze dingen:**
   - Is email verificatie uitgeschakeld? (Authentication > Settings > Email Auth)
   - Bestaat de profiles tabel?
   - Zijn er policies ingesteld?
   - Heeft de functie SECURITY DEFINER?

3. **Reset alles:**
   - Voer COMPLETE_DATABASE_SETUP.sql opnieuw uit
   - Test opnieuw

