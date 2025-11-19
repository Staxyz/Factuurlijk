# Betalingsbeveiliging - Stappenplan

## ✅ Wat is gefixt

1. **"Ik heb al betaald" knop verwijderd** - Deze knop liet gebruikers upgraden zonder betalingsverificatie
2. **Automatische upgrade in Dashboard verwijderd** - Upgrade gebeurde automatisch op basis van sessionStorage
3. **Automatische upgrade in App.tsx verwijderd** - Upgrade gebeurde automatisch zonder betalingsverificatie
4. **Upgrades gebeuren NU ALLEEN via Mollie webhook** - Na verificatie van betaling via Mollie API

## 🔒 Hoe het nu werkt

1. Gebruiker klikt op "Upgrade naar Pro"
2. Gebruiker wordt doorgestuurd naar Mollie betalingspagina
3. Gebruiker betaalt via Mollie
4. **Mollie stuurt webhook naar server** (`/api/mollie-webhook`)
5. **Server verifieert betaling via Mollie API**
6. **Alleen als betaling status "paid" is, wordt account geüpgraded**

## 📋 Stappenplan om te testen

### Stap 1: Verifieer webhook configuratie

1. Ga naar je **Mollie Dashboard** → **Developers** → **Webhooks**
2. Controleer dat de webhook URL correct is ingesteld:
   - **Production**: `https://factuurlijk.vercel.app/api/mollie-webhook`
   - **Test**: Gebruik ngrok voor localhost testing
3. Controleer dat de webhook **actief** is

### Stap 2: Verifieer environment variables op Vercel

Ga naar **Vercel Dashboard** → **Project Settings** → **Environment Variables** en controleer:

```
MOLLIE_API_KEY=live_xxxxx (of test_xxxxx)
SUPABASE_URL=https://pprqqanddnixolmbwile.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
MOLLIE_WEBHOOK_URL=https://factuurlijk.vercel.app/api/mollie-webhook
```

### Stap 3: Test de betaling flow

1. **Log in** op je account (zorg dat je op "free" plan staat)
2. Ga naar **Upgrade pagina**
3. Klik op **"Upgrade naar Pro"**
4. **BELANGRIJK**: Betaal NIET, maar sluit de Mollie pagina
5. **Verifieer**: Je account moet nog steeds op "free" staan
6. **Test opnieuw**: Betaal nu WEL via Mollie
7. **Wacht 10-30 seconden** (webhook kan even duren)
8. **Ververs de pagina** - Je account moet nu op "pro" staan

### Stap 4: Controleer webhook logs

#### Op Vercel:
1. Ga naar **Vercel Dashboard** → **Deployments** → **Functions** → **View Function Logs**
2. Zoek naar `/api/mollie-webhook` logs
3. Je zou moeten zien:
   ```
   📡 Mollie webhook received
   🔄 Fetching payment from Mollie API...
   📊 Payment retrieved from Mollie: { status: 'paid', ... }
   💾 Updating profile to Pro for user: ...
   ✅ Profile updated to Pro successfully!
   ```

#### In server.js (localhost):
- Check de terminal output voor webhook logs

### Stap 5: Controleer database

1. Ga naar **Supabase Dashboard** → **Table Editor** → **profiles**
2. Zoek je gebruiker
3. Controleer dat `plan` = `'pro'` alleen na succesvolle betaling
4. Ga naar **mollie_payments** tabel
5. Controleer dat betalingen worden gelogd met status `'paid'`

## 🚨 Troubleshooting

### Probleem: Account wordt nog steeds geüpgraded zonder betaling

**Oplossing:**
1. Controleer dat alle code changes zijn doorgevoerd
2. Hard refresh browser (Ctrl+Shift+R)
3. Clear browser cache
4. Controleer dat er geen oude sessionStorage items zijn:
   - Open DevTools (F12) → Application → Session Storage
   - Verwijder alle `factuurlijk:payment*` items

### Probleem: Webhook werkt niet

**Oplossing:**
1. Controleer webhook URL in Mollie dashboard
2. Test webhook met Mollie's test functie
3. Controleer Vercel function logs voor errors
4. Verifieer dat `SUPABASE_SERVICE_ROLE_KEY` correct is ingesteld

### Probleem: Betaling is gedaan maar account is niet geüpgraded

**Oplossing:**
1. Wacht 30-60 seconden (webhook kan vertraging hebben)
2. Ververs de pagina
3. Check webhook logs in Vercel
4. Check `mollie_payments` tabel in Supabase
5. Als betaling wel gelogd is maar account niet geüpgraded:
   - Check RLS policies in Supabase
   - Check of `supabase_user_id` correct is in payment metadata

## ✅ Verificatie Checklist

- [ ] "Ik heb al betaald" knop is verwijderd
- [ ] Klikken op "Upgrade naar Pro" zonder te betalen → account blijft "free"
- [ ] Betalen via Mollie → account wordt "pro" (na webhook)
- [ ] Webhook logs tonen betalingsverificatie
- [ ] Database toont correcte plan status
- [ ] Geen client-side upgrade code meer actief

## 📝 Belangrijke opmerkingen

1. **Upgrades gebeuren NU ALLEEN via webhook** - Dit is de enige veilige manier
2. **Webhook verifieert betaling via Mollie API** - Geen client-side verificatie meer
3. **SessionStorage wordt alleen gebruikt voor tracking** - Niet voor upgrades
4. **Alle upgrade code is server-side** - In `server.js` webhook handler

## 🔄 Als je nog steeds problemen hebt

1. Check alle files zijn correct geüpdatet:
   - `components/UpgradePage.tsx` - Geen "Ik heb al betaald" knop
   - `components/Dashboard.tsx` - Geen auto-upgrade logica
   - `App.tsx` - Geen auto-upgrade logica
   - `server.js` - Webhook verifieert betalingen

2. Deploy opnieuw naar Vercel:
   ```bash
   git add .
   git commit -m "Fix: Remove unsafe client-side upgrade logic"
   git push origin master
   ```

3. Wacht tot Vercel deployment klaar is

4. Test opnieuw met bovenstaand stappenplan

