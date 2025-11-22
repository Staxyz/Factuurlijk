# Mollie Payment Logging naar Supabase - Complete Gids

Deze gids helpt je om ervoor te zorgen dat alle Mollie payments automatisch worden gelogd in je Supabase database.

## ✅ Wat werkt al automatisch

Je codebase heeft al de volgende functionaliteit:
- ✅ Database tabel `mollie_payments` setup script
- ✅ Webhook handler in `server.js` (`/api/mollie-webhook`)
- ✅ Automatisch loggen van payments via webhook
- ✅ Automatisch upgraden van gebruikers naar Pro bij betaalde payments
- ✅ Fallback logging bij redirects

## 📋 Stap-voor-stap Setup

### Stap 1: Database Tabel Aanmaken

1. **Ga naar Supabase Dashboard:**
   - https://app.supabase.com
   - Log in en selecteer je project

2. **Open SQL Editor:**
   - Klik op "SQL Editor" in het linker menu
   - Klik op "New query"

3. **Voer het SQL script uit:**
   - Open het bestand `MOLLIE_SUPABASE_TABLES.sql`
   - Kopieer de volledige inhoud
   - Plak in de SQL Editor
   - Klik op "Run" of druk op `Ctrl+Enter`

4. **Verifieer dat de tabel bestaat:**
   - Ga naar "Table Editor" in het linker menu
   - Je zou de tabel `mollie_payments` moeten zien

### Stap 2: Environment Variables Instellen

#### Voor Local Development (.env.local):

```env
# Mollie API Key (van Mollie Dashboard)
MOLLIE_API_KEY=live_xxxxx  # of test_xxxxx voor testen

# Supabase Configuratie
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx  # BELANGRIJK! Service role key (niet anon key)

# Webhook URL (voor productie)
MOLLIE_WEBHOOK_URL=https://factuurlijk.vercel.app/api/mollie-webhook
```

#### Voor Vercel Deployment:

1. Ga naar Vercel Dashboard → Je Project → Settings → Environment Variables
2. Voeg dezelfde variabelen toe:
   - `MOLLIE_API_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY` ⚠️ **BELANGRIJK!**
   - `MOLLIE_WEBHOOK_URL`

### Stap 3: Supabase Service Role Key Ophalen

⚠️ **Dit is cruciaal voor het automatisch loggen!**

1. Ga naar Supabase Dashboard → Settings → API
2. Scroll naar "Project API keys"
3. Kopieer de **"service_role" key** (NIET de "anon" key!)
4. Deze key heeft admin rechten nodig om payments te loggen

**Waarom service_role key?**
- De webhook draait op de server (niet in de browser)
- Heeft admin rechten nodig om in `mollie_payments` te schrijven
- Bypass RLS (Row Level Security) policies

### Stap 4: Mollie Webhook URL Instellen

1. **Ga naar Mollie Dashboard:**
   - https://my.mollie.com/dashboard
   - Log in met je account

2. **Ga naar Webhook Instellingen:**
   - Settings → Webhooks (of via API settings)
   - Of ga direct naar: https://my.mollie.com/dashboard/settings/profiles

3. **Stel de Webhook URL in:**
   ```
   https://factuurlijk.vercel.app/api/mollie-webhook
   ```
   
   **Belangrijk:**
   - ✅ Moet HTTPS zijn (geen HTTP)
   - ✅ Moet eindigen op `/api/mollie-webhook`
   - ✅ Geen localhost (gebruik ngrok voor lokaal testen)

4. **Test de Webhook:**
   - Mollie heeft meestal een "Test" knop
   - Check je server logs om te zien of de webhook binnenkomt

### Stap 5: Verifieer dat Metadata wordt Meegestuurd

De code stuurt automatisch metadata mee bij het aanmaken van een payment. Dit gebeurt in:
- `server.js` regel 325-329: Voegt `supabase_user_id` en `customer_email` toe aan metadata
- `services/mollieService.ts`: Stuurt metadata door naar de API

**Check of dit werkt:**
1. Maak een test payment aan
2. Check in Mollie Dashboard → Payments → [Payment ID] → Metadata
3. Je zou moeten zien:
   ```json
   {
     "supabase_user_id": "uuid-van-gebruiker",
     "customer_email": "gebruiker@example.com"
   }
   ```

## 🔍 Hoe het Werkt

### Automatisch Loggen via Webhook (Aanbevolen)

1. **Gebruiker betaalt via Mollie**
2. **Mollie stuurt webhook** naar `/api/mollie-webhook`
3. **Server haalt payment details op** van Mollie API
4. **Payment wordt gelogd** in `mollie_payments` tabel
5. **Gebruiker wordt geupgrade** naar Pro (als status = "paid")

**Code locatie:** `server.js` regel 384-508

### Fallback Logging (Als webhook niet werkt)

Als de webhook niet werkt, wordt er ook gelogd bij:
- Redirect na betaling (`App.tsx` regel 378-405)
- Checkout success page (`CheckoutSuccessPage.tsx` regel 27-56)

## 📊 Betalingen Bekijken

### Via Supabase Dashboard:

1. Ga naar Supabase Dashboard → Table Editor
2. Open de tabel `mollie_payments`
3. Je ziet alle gelogde payments

### Via SQL Query:

```sql
-- Alle payments
SELECT 
  id,
  payment_id,
  payment_status,
  amount_value,
  amount_currency,
  customer_email,
  supabase_user_id,
  paid_at,
  created_at
FROM mollie_payments
ORDER BY created_at DESC
LIMIT 50;
```

### Via SQL Query voor specifieke gebruiker:

```sql
-- Vervang 'USER_EMAIL' met het email adres
SELECT *
FROM mollie_payments
WHERE customer_email = 'USER_EMAIL'
ORDER BY created_at DESC;
```

## 🐛 Troubleshooting

### Probleem: Payments worden niet gelogd

**Checklist:**

1. ✅ **Database tabel bestaat:**
   ```sql
   SELECT * FROM mollie_payments LIMIT 1;
   ```
   Als dit een error geeft, voer dan `MOLLIE_SUPABASE_TABLES.sql` opnieuw uit.

2. ✅ **Service Role Key is ingesteld:**
   - Check `.env.local` (lokaal) of Vercel environment variables
   - Moet `SUPABASE_SERVICE_ROLE_KEY` zijn (niet `SUPABASE_ANON_KEY`)

3. ✅ **Webhook wordt aangeroepen:**
   - Check server logs voor: `📡 Mollie webhook received`
   - Check Mollie Dashboard → Webhooks → Logs

4. ✅ **Webhook URL is correct:**
   - Moet HTTPS zijn
   - Moet eindigen op `/api/mollie-webhook`
   - Server moet bereikbaar zijn

5. ✅ **Metadata wordt meegestuurd:**
   - Check Mollie Dashboard → Payment → Metadata
   - Moet `supabase_user_id` en `customer_email` bevatten

### Probleem: "SUPABASE_SERVICE_ROLE_KEY not set"

**Oplossing:**
1. Haal de service role key op uit Supabase Dashboard
2. Voeg toe aan `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Herstart je server

### Probleem: Webhook werkt niet (localhost)

**Oplossing:** Gebruik ngrok voor lokaal testen:

```bash
# Installeer ngrok
npm install -g ngrok

# Start je server
npm run dev  # Draait op localhost:3001

# Start ngrok in nieuwe terminal
ngrok http 3001

# Gebruik de ngrok URL in Mollie:
# https://abc123.ngrok.io/api/mollie-webhook
```

### Probleem: Payment wordt gelogd maar gebruiker niet geupgrade

**Mogelijke oorzaken:**

1. **Geen supabase_user_id in metadata:**
   - Check Mollie Dashboard → Payment → Metadata
   - Moet `supabase_user_id` bevatten

2. **Email mismatch:**
   - Email in Mollie moet overeenkomen met email in Supabase
   - Check case-sensitivity (wordt automatisch lowercased)

3. **RLS policies:**
   - Service role key bypass RLS, maar check of `profiles` tabel bestaat
   - Check of user profile bestaat

## ✅ Verificatie Checklist

Na het volgen van deze stappen, zou je moeten kunnen:

- [ ] Database tabel `mollie_payments` bestaat in Supabase
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is ingesteld in environment variables
- [ ] Webhook URL is ingesteld in Mollie Dashboard
- [ ] Test payment wordt gelogd in `mollie_payments` tabel
- [ ] Gebruiker wordt automatisch geupgrade naar Pro na betaling
- [ ] Payments zijn zichtbaar in Supabase Table Editor

## 📝 Handmatig Payment Loggen (voor testing)

Als je een payment handmatig wilt loggen voor testing:

```sql
INSERT INTO mollie_payments (
  payment_id,
  payment_status,
  amount_value,
  amount_currency,
  description,
  customer_email,
  supabase_user_id,
  metadata,
  paid_at
) VALUES (
  'test_payment_' || extract(epoch from now())::text,
  'paid',
  39.50,
  'EUR',
  'Test betaling',
  'gebruiker@example.com',
  'USER_UUID_HIER',
  '{"source": "manual_test"}'::jsonb,
  now()
);
```

## 🔗 Gerelateerde Bestanden

- `MOLLIE_SUPABASE_TABLES.sql` - Database setup script
- `server.js` - Webhook handler en payment logging
- `services/mollieService.ts` - Payment creation service
- `VIEW_PAYMENTS_IN_SUPABASE.md` - Hoe payments te bekijken
- `MOLLIE_WEBHOOK_SETUP.md` - Webhook setup details

## 💡 Tips

1. **Gebruik test API key voor development:**
   - Mollie test key begint met `test_`
   - Test payments worden niet echt afgeschreven

2. **Check logs regelmatig:**
   - Server logs tonen alle webhook activiteit
   - Supabase logs tonen database queries

3. **Monitor webhook success rate:**
   - Mollie Dashboard → Webhooks → Logs
   - Check of alle webhooks succesvol zijn (200 status)

4. **Backup je service role key:**
   - Bewaar deze veilig
   - Gebruik nooit in frontend code!

