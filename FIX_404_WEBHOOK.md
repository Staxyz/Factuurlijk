# Fix 404 Error voor Mollie Webhook

## Probleem
Je krijgt 404 errors in het Mollie webhook dashboard omdat Vercel de endpoint niet kan vinden.

## Oorzaak
Vercel verwacht serverless functions in een `api/` folder, maar de webhook handler stond alleen in `server.js` (Express server).

## Oplossing
Ik heb een Vercel-compatibele serverless function gemaakt in `api/mollie-webhook.js`.

## Wat je nu moet doen

### Stap 1: Deploy naar Vercel
1. Commit en push de nieuwe `api/` folder naar GitHub:
   ```bash
   git add api/mollie-webhook.js
   git commit -m "Add Vercel serverless function for Mollie webhook"
   git push
   ```

2. Vercel zal automatisch een nieuwe deployment maken

### Stap 2: Verifieer Environment Variables
Zorg dat deze environment variables zijn ingesteld in Vercel:
- `MOLLIE_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_URL`

### Stap 3: Test de Webhook
1. Ga naar Mollie Dashboard → Webhooks
2. Klik op "Test" naast je webhook URL
3. Check Vercel Logs om te zien of de webhook wordt ontvangen

## Hoe het werkt nu

**Voor Vercel (Productie):**
- Webhook wordt afgehandeld door: `api/mollie-webhook.js` (serverless function)
- URL: `https://factuurlijk.vercel.app/api/mollie-webhook`

**Voor Local Development:**
- Webhook wordt afgehandeld door: `server.js` (Express server)
- URL: `http://localhost:3001/api/mollie-webhook` (met ngrok voor Mollie)

## Verificatie

Na deployment zou je moeten zien:
- ✅ Geen 404 errors meer in Mollie dashboard
- ✅ Webhook events worden succesvol verwerkt (200 status)
- ✅ Payments worden gelogd in Supabase `mollie_payments` tabel
- ✅ Gebruikers worden automatisch geupgrade naar Pro

## Troubleshooting

### Nog steeds 404 errors?
1. Check of de `api/` folder is gedeployed naar Vercel
2. Check Vercel Logs voor errors
3. Verifieer dat environment variables zijn ingesteld
4. Probeer de webhook opnieuw te testen in Mollie dashboard

### Webhook werkt maar payments worden niet gelogd?
1. Check of `SUPABASE_SERVICE_ROLE_KEY` is ingesteld
2. Check of `mollie_payments` tabel bestaat in Supabase
3. Check Vercel Logs voor sync errors

