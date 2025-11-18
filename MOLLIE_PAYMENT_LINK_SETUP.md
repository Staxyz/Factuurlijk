# Mollie Payment Link Setup Instructies

## Belangrijk: Configureer je Mollie Payment Link

Om ervoor te zorgen dat gebruikers automatisch worden doorgestuurd na betaling, moet je de **Redirect URL** instellen in je Mollie Dashboard.

### Stappen:

1. **Log in op je Mollie Dashboard**
   - Ga naar: https://my.mollie.com/dashboard

2. **Ga naar Payment Links**
   - Klik op "Payment Links" in het menu
   - Zoek je Payment Link: `G9QCA98NPsAFM65BU8fsQ`

3. **Bewerk de Payment Link**
   - Klik op de Payment Link om deze te bewerken
   - Scroll naar "Redirect URL" of "After payment"

4. **Stel de Redirect URL in:**
   
   **Voor localhost (testing):**
   ```
   http://localhost:3000/#/dashboard
   ```
   
   **Voor productie (Vercel):**
   ```
   https://jouw-vercel-url.vercel.app/#/dashboard
   ```
   *(Vervang `jouw-vercel-url` met je echte Vercel URL)*
   
   **BELANGRIJK:** De redirect URL moet naar het dashboard gaan (`/#/dashboard`). Het dashboard detecteert automatisch wanneer je terugkomt na betaling en upgrade je account naar Pro.

5. **Stel de Webhook URL in (optioneel maar aanbevolen):**
   
   **Voor localhost (testing):**
   ```
   http://localhost:3001/api/mollie-webhook
   ```
   
   **Voor productie:**
   ```
   https://jouw-backend-url.vercel.app/api/mollie-webhook
   ```
   *(Dit zorgt ervoor dat betalingen automatisch worden verwerkt, zelfs als de gebruiker niet wordt doorgestuurd)*

6. **Sla de wijzigingen op**

### Wat gebeurt er na betaling?

1. Gebruiker klikt op "Upgrade naar Pro" op de Upgrade pagina
2. App slaat betalingsinfo op in sessionStorage (user ID, email, timestamp, source)
3. Gebruiker wordt doorgestuurd naar Mollie Payment Link
4. Gebruiker betaalt via Mollie
5. Mollie redirect naar: `http://localhost:3000/#/dashboard` (of je Vercel URL)
6. Het dashboard detecteert automatisch dat er een recente betaling is geweest (binnen 30 minuten) en:
   - Controleert of de gebruiker nog niet Pro is
   - Logt de betaling in de `mollie_payments` tabel in Supabase
   - Upgrade het account automatisch naar Pro in Supabase
   - Toont een mooie success melding met alle Pro voordelen
   - Verwijdert de betalingsinfo uit sessionStorage
7. De gebruiker ziet direct de success melding op het dashboard en heeft nu Pro toegang

### Troubleshooting

**Probleem: Gebruiker wordt niet doorgestuurd na betaling**
- ✅ Check of de Redirect URL correct is ingesteld in Mollie Dashboard
- ✅ Check of de URL exact overeenkomt (inclusief `/#/checkout-success`)
- ✅ Test met localhost eerst voordat je naar productie gaat

**Probleem: Account wordt niet geupgrade**
- ✅ Check of de gebruiker ingelogd is wanneer ze terugkomen
- ✅ Check de browser console voor errors
- ✅ Check of de `mollie_payments` tabel bestaat in Supabase

**Probleem: Betaling wordt niet gelogd in database**
- ✅ Check of de `mollie_payments` tabel bestaat (run `MOLLIE_SUPABASE_TABLES.sql`)
- ✅ Check of RLS policies correct zijn ingesteld
- ✅ Check de browser console voor database errors

### Handmatige Upgrade (als automatische redirect niet werkt)

Als de automatische redirect niet werkt, kan de gebruiker handmatig upgraden:

1. Log in op de app
2. Ga naar de Upgrade pagina
3. Klik opnieuw op "Upgrade naar Pro"
4. De app detecteert dat er al betaald is en upgrade automatisch

*(Dit werkt alleen als de betaling is gelogd in de database)*

