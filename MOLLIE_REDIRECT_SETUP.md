# Mollie Payment Link Redirect Setup

## Probleem
Na betaling kom je op de Mollie status pagina: `https://payment-links.mollie.com/nl/status/019a96c8-686f-7384-a620-4137d127c92b`

## Oplossing: Stel Redirect URL in

### Stap 1: Ga naar Mollie Dashboard
1. Log in op https://my.mollie.com/dashboard
2. Ga naar **Payment Links**
3. Klik op je Payment Link: `erYCHDF3fXvq4zBJPVpTW`

### Stap 2: Stel Redirect URL in
1. Scroll naar **"After payment"** of **"Redirect URL"** sectie
2. Stel de redirect URL in:

   **Voor productie (Vercel):**
   ```
   https://factuurlijk.vercel.app/#/dashboard
   ```

   **Voor localhost (testing):**
   ```
   http://localhost:3000/#/dashboard
   ```

3. **Sla op**

**BELANGRIJK:** De redirect URL moet naar het dashboard gaan (`/#/dashboard`). Het dashboard detecteert automatisch wanneer je terugkomt na betaling en upgrade je account naar Pro.

### Stap 3: Verifieer Webhook
Zorg dat de webhook URL ook correct is ingesteld:
- **Productie:** `https://factuurlijk.vercel.app/api/mollie-webhook`
- **Test:** Gebruik ngrok voor localhost

## Wat gebeurt er nu?

1. Gebruiker klikt "Upgrade naar Pro"
2. Gebruiker wordt doorgestuurd naar Mollie
3. Gebruiker betaalt
4. **Mollie redirect naar:** `https://factuurlijk.vercel.app/#/dashboard`
5. **Dashboard detecteert automatisch:**
   - Recente betaling via sessionStorage (binnen 30 minuten)
   - Upgrade account direct naar Pro
   - Toont success melding op dashboard
   - Webhook verwerkt betaling op de achtergrond

## Als Redirect URL niet werkt

Als je nog steeds op de Mollie status pagina komt:

1. **Kopieer de payment link ID** uit de URL (bijv. `019a96c8-686f-7384-a620-4137d127c92b`)
2. **Ga handmatig naar:** `https://factuurlijk.vercel.app/#/checkout-success`
3. De app detecteert automatisch de betaling en upgrade je account

## Troubleshooting

### Account wordt niet geüpgraded
1. Check webhook logs in Vercel
2. Check `mollie_payments` tabel in Supabase
3. Check `profiles` tabel - is `plan` = `'pro'`?
4. Ververs de pagina na 30 seconden (webhook kan vertraging hebben)

### Webhook werkt niet
1. Verifieer webhook URL in Mollie dashboard
2. Test webhook met Mollie's test functie
3. Check Vercel function logs
4. Verifieer `SUPABASE_SERVICE_ROLE_KEY` is correct ingesteld

