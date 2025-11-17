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
   http://localhost:3000/#/checkout-success
   ```
   
   **Voor productie (Vercel):**
   ```
   https://jouw-vercel-url.vercel.app/#/checkout-success
   ```
   *(Vervang `jouw-vercel-url` met je echte Vercel URL)*

5. **Sla de wijzigingen op**

### Wat gebeurt er na betaling?

1. Gebruiker betaalt via de Mollie Payment Link
2. Mollie redirect naar: `http://localhost:3000/#/checkout-success`
3. De app detecteert de return en:
   - Logt de betaling in de `mollie_payments` tabel
   - Upgrade het account naar Pro
   - Redirect automatisch naar dashboard na 5 seconden

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

