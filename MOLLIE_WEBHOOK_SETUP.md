# Mollie Webhook Setup & Troubleshooting

## Probleem: Webhook werkt niet / Test verzoeken mislukken

Mollie accepteert **geen localhost URLs** voor webhooks. Dit is een beveiligingsmaatregel van Mollie.

## Oplossingen

### Oplossing 1: Gebruik ngrok voor Local Development (Aanbevolen)

**ngrok** maakt een publieke HTTPS URL die naar je localhost wijst.

#### Stappen:

1. **Installeer ngrok:**
   ```bash
   # Download van: https://ngrok.com/download
   # Of via npm:
   npm install -g ngrok
   ```

2. **Start je backend server:**
   ```bash
   npm run dev
   # Server draait op localhost:3001 (of je poort)
   ```

3. **Start ngrok in een nieuwe terminal:**
   ```bash
   ngrok http 3001
   ```

4. **Kopieer de HTTPS URL:**
   - Je krijgt een URL zoals: `https://abc123.ngrok.io`
   - Kopieer deze URL

5. **Stel de Webhook URL in in Mollie:**
   - Ga naar: https://my.mollie.com/dashboard
   - Ga naar je webhook instellingen
   - Stel de URL in als: `https://abc123.ngrok.io/api/mollie-webhook`
   - **BELANGRIJK:** De URL moet eindigen op `/api/mollie-webhook`

6. **Test de webhook:**
   - Klik op "Test" in Mollie dashboard
   - Check je server logs om te zien of de webhook binnenkomt

#### ngrok Gratis vs Betaald:
- **Gratis:** URL verandert elke keer dat je ngrok start (niet ideaal voor productie)
- **Betaald:** Vaste URL mogelijk (vanaf $8/maand)

---

### Oplossing 2: Gebruik je Vercel Deployment URL (Voor Productie)

Als je app al op Vercel staat:

1. **Vind je Vercel deployment URL:**
   - Ga naar: https://vercel.com/dashboard
   - Selecteer je project
   - Kopieer de deployment URL (bijv. `https://factuurlijk.vercel.app`)

2. **Stel de Webhook URL in in Mollie:**
   - URL: `https://factuurlijk.vercel.app/api/mollie-webhook`
   - **BELANGRIJK:** Moet eindigen op `/api/mollie-webhook`

3. **Zorg dat je backend op Vercel draait:**
   - Check of `server.js` correct is geconfigureerd
   - Check of de `/api/mollie-webhook` endpoint werkt

---

### Oplossing 3: Gebruik een andere Tunneling Service

Alternatieven voor ngrok:

- **Cloudflare Tunnel** (gratis, vaste URL mogelijk)
- **localtunnel** (gratis, npm package)
- **serveo.net** (gratis, geen installatie nodig)

#### localtunnel voorbeeld:
```bash
npm install -g localtunnel
lt --port 3001
# Geeft je een URL zoals: https://random-name.loca.lt
```

---

## Huidige Webhook Configuratie Check

### ✅ Correcte Webhook URL Format:
```
https://jouw-domein.com/api/mollie-webhook
```

### ❌ Verkeerde URLs:
```
http://localhost:3001/api/mollie-webhook  ❌ (localhost niet toegestaan)
https://factuurlijk.vercel.app/          ❌ (geen /api/mollie-webhook endpoint)
https://factuurlijk.vercel.app            ❌ (geen /api/mollie-webhook endpoint)
```

---

## Webhook Endpoint Verificatie

Je webhook endpoint staat in `server.js` op regel 340:

```javascript
app.post('/api/mollie-webhook', async (req, res) => {
  // Webhook handler code
});
```

### Test je endpoint handmatig:

1. **Start je server:**
   ```bash
   npm run dev
   ```

2. **Test met curl (in een nieuwe terminal):**
   ```bash
   curl -X POST http://localhost:3001/api/mollie-webhook \
     -H "Content-Type: application/json" \
     -d '{"id": "test_payment_id"}'
   ```

3. **Check server logs:**
   - Je zou moeten zien: `📡 Mollie webhook received for payment: test_payment_id`

---

## Environment Variables

Zorg dat je `.env.local` of Vercel environment variables hebt:

```env
MOLLIE_API_KEY=live_xxxxx
MOLLIE_WEBHOOK_URL=https://jouw-domein.com/api/mollie-webhook
SUPABASE_SERVICE_ROLE_KEY=xxxxx
```

**Let op:** De code in `server.js` controleert of de webhook URL begint met `https://`:
- Als de URL met `https://` begint → wordt gebruikt
- Anders → wordt overgeslagen (voor localhost/testing)

---

## Troubleshooting

### Probleem: "Test verzoeken mislukken"

**Mogelijke oorzaken:**

1. **Webhook URL is niet correct:**
   - ✅ Moet eindigen op `/api/mollie-webhook`
   - ✅ Moet HTTPS zijn (geen HTTP)
   - ✅ Geen localhost

2. **Server is niet bereikbaar:**
   - Check of je server draait
   - Check of de poort correct is
   - Check firewall/network instellingen

3. **SSL Certificate problemen:**
   - ngrok en Vercel hebben automatisch SSL
   - Als je eigen server gebruikt, zorg voor geldig SSL certificaat

4. **Endpoint geeft error:**
   - Check server logs voor errors
   - Webhook moet altijd `200 OK` teruggeven (ook bij errors)

### Probleem: "Webhook wordt niet aangeroepen na betaling"

**Checklist:**

1. ✅ Webhook URL is correct ingesteld in Mollie
2. ✅ Webhook URL is publiek bereikbaar (geen localhost)
3. ✅ Server draait en is bereikbaar
4. ✅ `/api/mollie-webhook` endpoint bestaat en werkt
5. ✅ Mollie kan je server bereiken (geen firewall blokkering)
6. ✅ Check Mollie webhook logs in dashboard

### Probleem: "Betalingen worden niet automatisch verwerkt"

**Oplossing:**

De app heeft een **fallback mechanisme**:
- Als webhook niet werkt, wordt betaling gedetecteerd bij redirect
- Gebruiker wordt doorgestuurd naar dashboard
- Dashboard checkt automatisch of er recent betaald is (binnen 30 minuten)
- Account wordt dan alsnog geupgrade

**Maar webhook is beter omdat:**
- Werkt ook als gebruiker niet terugkomt
- Sneller (direct na betaling)
- Betrouwbaarder

---

## Snelle Fix voor Nu

**Voor directe testing:**

1. Gebruik je **Vercel URL** (als die al werkt):
   ```
   https://factuurlijk.vercel.app/api/mollie-webhook
   ```

2. Of installeer **ngrok** en gebruik:
   ```bash
   ngrok http 3001
   # Gebruik de gegenereerde URL + /api/mollie-webhook
   ```

3. **Update Mollie webhook URL:**
   - Ga naar Mollie dashboard
   - Update webhook URL naar: `https://jouw-url/api/mollie-webhook`
   - Test opnieuw

---

## Webhook Payload Format

Mollie stuurt dit naar je webhook:

```json
{
  "id": "tr_xxxxx"
}
```

Je endpoint haalt dan de volledige payment details op via Mollie API.

---

## Extra: Webhook Logging

Voeg extra logging toe om te debuggen:

```javascript
app.post('/api/mollie-webhook', async (req, res) => {
  console.log('📡 Webhook received:', {
    body: req.body,
    headers: req.headers,
    timestamp: new Date().toISOString()
  });
  // ... rest of code
});
```

---

## Samenvatting

1. **Voor Development:** Gebruik ngrok of localtunnel
2. **Voor Productie:** Gebruik je Vercel/deployment URL
3. **Webhook URL moet:** HTTPS zijn + eindigen op `/api/mollie-webhook`
4. **Test altijd:** Gebruik de "Test" knop in Mollie dashboard
5. **Check logs:** Server logs tonen of webhook binnenkomt

