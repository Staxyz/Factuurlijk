# 🔍 Payment Debug Guide - Waarom gebeurt er niets na betaling?

## **Het Probleem**
Je voltooit de betaling, maar:
- ❌ Je account wordt niet geüpdatet naar Pro
- ❌ Er wordt geen data gelogd in Supabase tabellen
- ❌ Je blijft op het Free plan

## **Mogelijke Oorzaken**

### **1. SUPABASE_SERVICE_ROLE_KEY ontbreekt (MEEST WAARSCHIJNLIJK)**
De server heeft een **service role key** nodig om Supabase te updaten.

**Check:**
1. Open `.env.local` in je project root
2. Zoek naar `SUPABASE_SERVICE_ROLE_KEY`
3. Als deze **NIET** bestaat, is dit het probleem!

**Fix:**
1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Settings** → **API**
4. Kopieer de **`service_role` key** (NIET de anon key!)
5. Voeg toe aan `.env.local`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
6. **Herstart de server** (`npm run dev:all`)

---

### **2. Supabase Tabellen Bestaan Niet**
De tabellen `stripe_payment_events` en `stripe_customers` moeten bestaan.

**Check:**
1. Ga naar Supabase Dashboard → **SQL Editor**
2. Voer uit:
   ```sql
   SELECT * FROM stripe_payment_events LIMIT 1;
   SELECT * FROM stripe_customers LIMIT 1;
   ```
3. Als je errors krijgt, bestaan de tabellen niet.

**Fix:**
1. Open `STRIPE_SUPABASE_TABLES.sql` in je project
2. Kopieer de hele inhoud
3. Plak in Supabase SQL Editor
4. Klik **Run**

---

### **3. RLS Policies Blokkeren Updates**
Row Level Security policies kunnen updates blokkeren.

**Check:**
1. Ga naar Supabase Dashboard → **Authentication** → **Policies**
2. Check de `profiles` table policies
3. Als er alleen policies zijn voor `authenticated` users, blokkeert dit de service role!

**Fix:**
De service role key **bypassed RLS**, dus dit zou niet moeten gebeuren. Maar check of:
- De service role key correct is
- Er geen custom policies zijn die service role blokkeren

---

### **4. Email Mismatch**
De server zoekt de gebruiker op email. Als het email in Stripe niet overeenkomt met Supabase, wordt de gebruiker niet gevonden.

**Check:**
- In Stripe checkout: welk email wordt gebruikt?
- In Supabase `profiles` table: welk email staat er?

**Fix:**
Zorg dat `supabase_user_id` in de Stripe session metadata wordt meegegeven (dit gebeurt automatisch in `create-checkout-session`).

---

### **5. Frontend gebruikt nog `http://localhost:3001` in productie**
De browser kan de backend alleen bereiken via een publiek domein. Als je app op Vercel staat maar `VITE_API_BASE_URL` niet is ingesteld, dan probeert de frontend nog steeds `http://localhost:3001/...` aan te roepen → dat bestaat niet online.

**Fix:**
1. Voeg een nieuwe env var toe aan `.env.local`:
   ```env
   VITE_API_BASE_URL=http://localhost:3001
   ```
2. Voeg op Vercel (of waar je production frontend draait) **dezelfde variabele** toe maar met je publieke backend URL, bijv.:
   ```
   VITE_API_BASE_URL=https://factuurlijk.vercel.app
   ```
   of het domein waar jouw Express-server draait.
3. Deploy opnieuw. De frontend gebruikt nu automatisch de juiste URL per omgeving (lokaal vs. productie).

---

## **Diagnose Stappen**

### **Stap 1: Check Server Logs**
Na een betaling, kijk in de terminal waar `npm run dev:all` draait. Je ziet nu uitgebreide logging:

```
🔍 syncPaymentToSupabase called with: ...
🔄 Syncing payment to Supabase...
📋 Payment details: ...
💾 Updating profile to Pro for user: ...
✅ Profile updated to Pro successfully!
```

Als je ziet:
- `❌ SUPABASE_SERVICE_ROLE_KEY not set` → **Probleem 1**
- `❌ Unable to update profile plan` → **Probleem 2 of 3**
- `⚠️ No matching Supabase profile found` → **Probleem 4**

### **Stap 2: Test Supabase Connectie**
Open in je browser:
```
http://localhost:3001/api/debug/supabase
```

Dit geeft je:
- ✅ Of Supabase admin client is geïnitialiseerd
- ✅ Of de tabellen bestaan en toegankelijk zijn
- ✅ Sample data uit de tabellen

**Verwacht resultaat:**
```json
{
  "supabaseUrl": "https://...",
  "hasServiceKey": true,
  "tests": {
    "profiles": { "accessible": true, "count": 5 },
    "stripe_payment_events": { "accessible": true, "count": 0 },
    "stripe_customers": { "accessible": true, "count": 0 }
  }
}
```

**Als `hasServiceKey: false`** → Voeg `SUPABASE_SERVICE_ROLE_KEY` toe aan `.env.local`

**Als `accessible: false`** → De tabel bestaat niet of RLS blokkeert toegang

### **Stap 3: Check Health Endpoint**
```
http://localhost:3001/api/health
```

Dit geeft je:
- ✅ Of de server draait
- ✅ Of Supabase is geconfigureerd
- ✅ Of de service key aanwezig is

---

## **Complete Fix Checklist**

- [ ] `SUPABASE_SERVICE_ROLE_KEY` toegevoegd aan `.env.local`
- [ ] Server herstart na toevoegen van service key
- [ ] `stripe_payment_events` tabel bestaat in Supabase
- [ ] `stripe_customers` tabel bestaat in Supabase
- [ ] `/api/debug/supabase` geeft `hasServiceKey: true`
- [ ] `/api/debug/supabase` geeft `accessible: true` voor alle tabellen
- [ ] Test betaling gedaan
- [ ] Server logs bekeken na betaling
- [ ] Data gecontroleerd in Supabase tabellen

---

## **Na Fix: Test Opnieuw**

1. **Herstart de server:**
   ```bash
   # Stop de server (Ctrl+C)
   npm run dev:all
   ```

2. **Doe een testbetaling:**
   - Gebruik Stripe test card: `4242 4242 4242 4242`
   - Elke toekomstige datum voor expiry
   - Elke 3-cijferige CVC

3. **Check de logs:**
   - Kijk in de terminal voor uitgebreide logging
   - Zoek naar `✅ Profile updated to Pro successfully!`
   - Zoek naar `✅ Payment event logged successfully!`

4. **Check Supabase:**
   - Ga naar Supabase Dashboard → **Table Editor**
   - Check `profiles` table → Je plan moet `pro` zijn
   - Check `stripe_payment_events` → Er moet een nieuwe row zijn
   - Check `stripe_customers` → Er moet een nieuwe row zijn

---

## **Als Het Nog Steeds Niet Werkt**

1. **Deel de server logs** (na een betaling)
2. **Deel de output van** `/api/debug/supabase`
3. **Deel de output van** `/api/health`
4. **Check of je `.env.local` deze regels heeft:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

---

## **Belangrijk: Service Role Key vs Anon Key**

- ❌ **ANON KEY** (`VITE_SUPABASE_ANON_KEY`) → Voor frontend, heeft beperkte rechten
- ✅ **SERVICE ROLE KEY** (`SUPABASE_SERVICE_ROLE_KEY`) → Voor backend, bypassed RLS, kan alles updaten

**Je hebt BEIDE nodig:**
- Anon key voor frontend (al aanwezig)
- Service role key voor backend (waarschijnlijk ontbreekt!)

