# Webhook Automatische Upgrade Gids

## Hoe het werkt

Wanneer een betaling succesvol is via Mollie, gebeurt het volgende automatisch:

1. **Mollie stuurt webhook** naar `/api/mollie-webhook`
2. **Webhook verifieert betaling** via Mollie API
3. **Webhook zoekt gebruiker** via email adres
4. **Webhook upgrade account** naar Pro in Supabase
5. **Webhook logt betaling** in `mollie_payments` tabel

## Belangrijk: Email Matching

De webhook identificeert gebruikers via **email adres**. Zorg dat:

- Het email adres in **Mollie** (bij betaling) overeenkomt met
- Het email adres in **Supabase** (in `profiles` tabel of `auth.users`)

## Webhook Flow

### Stap 1: Webhook ontvangt betaling
```
Mollie → POST /api/mollie-webhook → { payment_id: "tr_xxxxx" }
```

### Stap 2: Webhook haalt betaling op van Mollie
```javascript
payment = await mollieClient.payments.get(paymentId);
// Status: "paid"
// Amount: { value: "39.50", currency: "EUR" }
```

### Stap 3: Webhook zoekt customer email
De webhook probeert email te vinden via:
1. **Payment metadata** (`payment.metadata.customer_email`)
2. **Mollie customer object** (`payment.customerId` → `customer.email`)
3. **Payment details** (`payment.details.consumerEmail`)

### Stap 4: Webhook zoekt gebruiker in Supabase
```javascript
// Zoekt in profiles tabel
profile = await supabaseAdmin
  .from('profiles')
  .select('id, email')
  .eq('email', customerEmail)
  .single();

// Als niet gevonden, zoekt in auth.users
```

### Stap 5: Webhook upgrade account naar Pro
```javascript
if (payment.status === 'paid' && userId) {
  await supabaseAdmin
    .from('profiles')
    .update({ plan: 'pro' })
    .eq('id', userId);
}
```

### Stap 6: Webhook logt betaling
```javascript
await supabaseAdmin
  .from('mollie_payments')
  .insert({
    payment_id: payment.id,
    payment_status: 'paid',
    customer_email: customerEmail,
    supabase_user_id: userId,
    // ...
  });
```

## Verificatie

### Check of webhook werkt:

1. **Ga naar Vercel Dashboard** → **Functions** → **View Logs**
2. **Zoek naar** `/api/mollie-webhook` logs
3. **Je zou moeten zien:**
   ```
   📡 Mollie webhook received
   🔄 Fetching payment from Mollie API...
   ✅ Payment is paid, syncing to Supabase...
   📧 Customer email from payment: user@example.com
   ✅ Found user by email in profiles: user-id-123
   💾 Updating profile to Pro for user: user-id-123
   ✅ Profile updated to Pro successfully!
   ✅ Payment logged to mollie_payments table
   ```

### Check Supabase:

1. **Ga naar Supabase Dashboard** → **Table Editor**
2. **Check `profiles` tabel:**
   - Zoek je gebruiker
   - `plan` moet `'pro'` zijn
3. **Check `mollie_payments` tabel:**
   - Er moet een record zijn met `payment_status = 'paid'`
   - `supabase_user_id` moet je user ID bevatten

## Troubleshooting

### Probleem: Account wordt niet geüpgraded

**Mogelijke oorzaken:**

1. **Email mismatch**
   - Check: Is het email in Mollie hetzelfde als in Supabase?
   - Fix: Zorg dat beide emails exact overeenkomen (case-insensitive)

2. **Webhook wordt niet aangeroepen**
   - Check: Vercel function logs
   - Fix: Verifieer webhook URL in Mollie dashboard

3. **SUPABASE_SERVICE_ROLE_KEY ontbreekt**
   - Check: Vercel environment variables
   - Fix: Voeg `SUPABASE_SERVICE_ROLE_KEY` toe aan Vercel

4. **RLS policies blokkeren update**
   - Check: Supabase RLS policies
   - Fix: Service role key bypassed RLS, maar check of er custom policies zijn

### Probleem: Webhook kan gebruiker niet vinden

**Oplossing:**
- Zorg dat het email adres in Mollie exact overeenkomt met Supabase
- Check of de gebruiker een profiel heeft in `profiles` tabel
- Check webhook logs voor specifieke error messages

## Test de Webhook

1. **Maak een test betaling** via Mollie
2. **Wacht 10-30 seconden** (webhook kan vertraging hebben)
3. **Check Vercel logs** voor webhook activiteit
4. **Check Supabase** - is `plan` = `'pro'`?
5. **Check `mollie_payments`** - is betaling gelogd?

## Belangrijke Notities

- **Webhook werkt automatisch** - geen handmatige actie nodig
- **Upgrade gebeurt direct** na betaling (binnen 10-30 seconden)
- **Email matching is cruciaal** - zorg dat emails overeenkomen
- **Webhook logt altijd** - zelfs als gebruiker niet gevonden wordt
- **Service role key is vereist** - voor Supabase updates

