# Vercel Webhook Setup voor Mollie

## Webhook URL
```
https://factuurlijk.vercel.app/api/mollie-webhook
```

## Stappen om alles werkend te krijgen

### STAP 1: Environment Variables instellen in Vercel

1. **Ga naar je Vercel Dashboard:**
   - https://vercel.com/dashboard
   - Selecteer je project: `factuurlijk`

2. **Ga naar Settings > Environment Variables**

3. **Voeg de volgende environment variables toe:**

   ```
   MOLLIE_API_KEY=live_xxxxx
   ```
   *(Vervang `live_xxxxx` met je echte Mollie API key)*

   ```
   MOLLIE_WEBHOOK_URL=https://factuurlijk.vercel.app/api/mollie-webhook
   ```

   ```
   SUPABASE_SERVICE_ROLE_KEY=xxxxx
   ```
   *(Je Supabase service role key)*

   ```
   SUPABASE_URL=https://pprqqanddnixolmbwile.supabase.co
   ```
   *(Of je eigen Supabase URL)*

4. **Selecteer Environment:**
   - ✅ Production
   - ✅ Preview (optioneel, voor test deployments)
   - ✅ Development (optioneel)

5. **Klik op "Save"**

### STAP 2: Herdeploy je applicatie

Na het toevoegen van environment variables moet je de app herdeployen:

1. **Option 1: Via Vercel Dashboard**
   - Ga naar je project
   - Klik op "Deployments"
   - Klik op de 3 dots naast je laatste deployment
   - Klik op "Redeploy"

2. **Option 2: Via Git**
   ```bash
   git commit --allow-empty -m "Trigger redeploy for webhook setup"
   git push
   ```

### STAP 3: Webhook instellen in Mollie Dashboard

1. **Log in op Mollie Dashboard:**
   - https://my.mollie.com/dashboard

2. **Ga naar je Webhook instellingen:**
   - Klik op "Webhooks" in het menu
   - Of ga naar je Payment Link instellingen

3. **Stel de Webhook URL in:**
   ```
   https://factuurlijk.vercel.app/api/mollie-webhook
   ```

4. **Selecteer Event Types:**
   - ✅ Payment Link API (of de events die je nodig hebt)

5. **Sla op**

### STAP 4: Test de Webhook

1. **In Mollie Dashboard:**
   - Ga naar je webhook instellingen
   - Klik op "Test" naast je webhook URL
   - Mollie stuurt een test verzoek naar je endpoint

2. **Check Vercel Logs:**
   - Ga naar Vercel Dashboard > je project > "Logs"
   - Je zou moeten zien: `📡 Mollie webhook received`
   - Check of er errors zijn

3. **Check of het werkt:**
   - Maak een test betaling
   - Check of de betaling wordt gelogd in Supabase
   - Check of het account wordt geupgrade naar Pro

### STAP 5: Verificatie

**Check of alles werkt:**

1. ✅ Webhook URL is correct ingesteld in Mollie
2. ✅ Environment variables zijn ingesteld in Vercel
3. ✅ App is herdeployed na het toevoegen van env vars
4. ✅ Test webhook werkt (check Vercel logs)
5. ✅ Echte betalingen worden verwerkt

---

## Troubleshooting

### Probleem: Webhook wordt niet aangeroepen

**Check:**
1. ✅ Is de webhook URL correct in Mollie? (moet exact zijn: `https://factuurlijk.vercel.app/api/mollie-webhook`)
2. ✅ Is de app herdeployed na het toevoegen van env vars?
3. ✅ Check Vercel logs voor errors
4. ✅ Check of de endpoint bereikbaar is: `curl https://factuurlijk.vercel.app/api/mollie-webhook`

### Probleem: "No payment ID provided" error

**Oplossing:**
- De webhook handler is verbeterd om verschillende payload formaten te accepteren
- Check Vercel logs om te zien welk format Mollie stuurt
- De handler probeert nu meerdere manieren om de payment ID te vinden

### Probleem: Betalingen worden niet verwerkt

**Check:**
1. ✅ Is `SUPABASE_SERVICE_ROLE_KEY` correct ingesteld?
2. ✅ Bestaat de `mollie_payments` tabel in Supabase?
3. ✅ Zijn de RLS policies correct ingesteld?
4. ✅ Check Vercel logs voor sync errors

### Probleem: Account wordt niet geupgrade

**Check:**
1. ✅ Wordt de betaling gelogd in `mollie_payments` tabel?
2. ✅ Heeft de betaling `status = 'paid'`?
3. ✅ Is de `supabase_user_id` correct in de payment metadata?
4. ✅ Check Vercel logs voor upgrade errors

---

## Webhook Endpoint Details

**URL:** `https://factuurlijk.vercel.app/api/mollie-webhook`

**Method:** POST

**Expected Payload:**
```json
{
  "id": "tr_xxxxx"
}
```

**Response:**
```json
{
  "received": true,
  "paymentId": "tr_xxxxx",
  "status": "paid",
  "processed": true
}
```

**Status Codes:**
- `200 OK` - Webhook ontvangen en verwerkt (ook bij errors, om retries te voorkomen)

---

## Logging

De webhook handler logt nu uitgebreid:
- 📡 Wanneer webhook wordt ontvangen
- 🔍 Welke payment ID wordt geëxtraheerd
- 📊 Payment details van Mollie API
- ✅ Of payment succesvol is gesynced
- ❌ Eventuele errors

**Check logs in:**
- Vercel Dashboard > Project > Logs
- Of via Vercel CLI: `vercel logs`

---

## Security

- ✅ Webhook endpoint accepteert alleen POST requests
- ✅ Payment wordt altijd geverifieerd via Mollie API (niet alleen vertrouwen op payload)
- ✅ Errors worden gelogd maar geven altijd 200 terug (om Mollie retries te voorkomen)
- ✅ Service role key wordt gebruikt voor Supabase (bypass RLS voor betalingen)

---

## Test Checklist

- [ ] Environment variables ingesteld in Vercel
- [ ] App herdeployed
- [ ] Webhook URL ingesteld in Mollie: `https://factuurlijk.vercel.app/api/mollie-webhook`
- [ ] Test webhook uitgevoerd in Mollie dashboard
- [ ] Webhook ontvangen (check Vercel logs)
- [ ] Test betaling gemaakt
- [ ] Betaling gelogd in Supabase `mollie_payments` tabel
- [ ] Account geupgrade naar Pro na betaling

---

## Klaar!

Als alles correct is ingesteld, zouden betalingen nu automatisch moeten worden verwerkt via de webhook, zelfs als de gebruiker niet terugkomt naar de app na betaling.

