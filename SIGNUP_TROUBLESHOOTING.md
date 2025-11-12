# Signup Troubleshooting

Als nieuwe gebruikers geen account kunnen aanmaken, controleer deze punten:

## 1. Email Verificatie Instellingen

Supabase kan email verificatie vereisen voordat gebruikers kunnen inloggen.

### Email Verificatie Uitschakelen (voor Development)

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **Settings**
4. Scroll naar **Email Auth**
5. Zet **Enable email confirmations** UIT (voor development)
6. Klik op **Save**

**Let op:** Voor productie moet email verificatie AAN staan voor beveiliging.

### Email Verificatie AAN (Productie)

Als email verificatie aan staat:
- Gebruikers krijgen een verificatielink in hun email
- Ze moeten op de link klikken voordat ze kunnen inloggen
- De verificatielink leidt terug naar je applicatie

## 2. Database Profiel Aanmaken

De applicatie maakt nu automatisch een profiel aan voor nieuwe gebruikers. Als dit niet werkt:

### Controleer Database Permissions

1. Ga naar Supabase Dashboard > **Table Editor** > **profiles**
2. Controleer of de tabel bestaat
3. Ga naar **Database** > **Policies**
4. Zorg dat er een INSERT policy is voor authenticated users:

```sql
-- Allow users to insert their own profile
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);
```

### Controleer Tabel Structuur

De `profiles` tabel moet deze kolommen hebben:
- `id` (uuid, primary key, references auth.users)
- `name` (text)
- `email` (text)
- `address` (text)
- `kvk_number` (text, nullable)
- `btw_number` (text, nullable)
- `iban` (text, nullable)
- `logo_url` (text, nullable)
- `template_style` (text)
- `template_customizations` (jsonb, nullable)
- `plan` (text, default 'free')
- `invoice_footer_text` (text, nullable)
- `phone_number` (text, nullable)
- `updated_at` (timestamp)

## 3. Veelvoorkomende Problemen

### "User already registered"
**Oplossing:** Het email adres is al geregistreerd. Gebruik een ander email of log in met het bestaande account.

### "Email not confirmed"
**Oplossing:** 
- Controleer je email inbox (ook spam folder)
- Klik op de verificatielink
- Of schakel email verificatie uit voor development

### "Profile creation failed"
**Oplossing:**
- Controleer database permissions (zie boven)
- Controleer of de profiles tabel bestaat
- Kijk in de browser console voor specifieke errors

### Gebruiker kan niet inloggen na registratie
**Oplossing:**
- Als email verificatie aan staat: wacht op verificatielink
- Als email verificatie uit staat: controleer of de sessie correct wordt opgehaald
- Kijk in browser console voor errors

## 4. Test Stappen

1. **Probeer een nieuw account aan te maken:**
   - Vul naam, email en wachtwoord in
   - Klik op "Registreren"
   - Check browser console voor errors

2. **Check wat er gebeurt:**
   - Als email verificatie UIT staat: je zou direct ingelogd moeten zijn
   - Als email verificatie AAN staat: je krijgt een melding om je email te checken

3. **Check database:**
   - Ga naar Supabase Dashboard > **Table Editor** > **profiles**
   - Kijk of er een nieuw profiel is aangemaakt met je user ID

## 5. Debug Informatie

De applicatie logt nu uitgebreide informatie:
- Open browser console (F12)
- Kijk naar:
  - `Profile not found, creating new profile for user: [id]`
  - `New user profile created: [data]`
  - Eventuele errors

## 6. Snelle Fix Checklist

- [ ] Email verificatie uitgeschakeld (voor development) OF email verificatielink ontvangen
- [ ] Profiles tabel bestaat in database
- [ ] INSERT policy bestaat voor authenticated users op profiles tabel
- [ ] Browser console toont geen errors
- [ ] Profiel wordt automatisch aangemaakt (check in database)

