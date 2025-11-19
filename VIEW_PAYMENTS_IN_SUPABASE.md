# Betalingen Bekijken in Supabase Database

## Stap 1: Ga naar Supabase Dashboard
1. Ga naar https://app.supabase.com
2. Log in met je account
3. Selecteer je project

## Stap 2: Open de Database Editor
1. Klik op **"Table Editor"** in het linker menu
2. Of ga naar **"SQL Editor"** om queries uit te voeren

## Stap 3: Bekijk de `mollie_payments` tabel
1. In de Table Editor, zoek naar de tabel **`mollie_payments`**
2. Klik erop om alle betalingen te zien

## Stap 4: Bekijk Betalingen via SQL Query
Als je specifieke betalingen wilt zoeken, gebruik deze SQL query in de SQL Editor:

```sql
-- Alle betalingen bekijken
SELECT 
  id,
  payment_id,
  payment_status,
  amount_value,
  amount_currency,
  customer_email,
  supabase_user_id,
  metadata,
  paid_at,
  created_at
FROM mollie_payments
ORDER BY created_at DESC
LIMIT 50;
```

## Stap 5: Zoek Betalingen voor een Specifieke Gebruiker
```sql
-- Vervang 'USER_EMAIL_HIER' met het email adres van de gebruiker
SELECT 
  id,
  payment_id,
  payment_status,
  amount_value,
  amount_currency,
  customer_email,
  supabase_user_id,
  metadata,
  paid_at,
  created_at
FROM mollie_payments
WHERE customer_email = 'USER_EMAIL_HIER'
ORDER BY created_at DESC;
```

## Stap 6: Check of een Gebruiker Pro is
```sql
-- Vervang 'USER_ID_HIER' met de Supabase user ID
SELECT 
  id,
  email,
  plan,
  updated_at
FROM profiles
WHERE id = 'USER_ID_HIER';
```

## Stap 7: Handmatig een Betaling Toevoegen (voor testing)
Als je een betaling handmatig wilt toevoegen voor testing:

```sql
-- Vervang de waarden met echte data
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
  'USER_ID_HIER',
  '{"source": "manual_test", "payment_method": "payment_link"}'::jsonb,
  now()
);
```

## Stap 8: Handmatig een Gebruiker Upgraden naar Pro
Als je een gebruiker handmatig wilt upgraden:

```sql
-- Vervang 'USER_ID_HIER' met de Supabase user ID
UPDATE profiles
SET 
  plan = 'pro',
  updated_at = now()
WHERE id = 'USER_ID_HIER';
```

## Belangrijke Kolommen in `mollie_payments`:
- **payment_id**: De Mollie payment ID
- **payment_status**: Status van de betaling (paid, pending, failed, etc.)
- **amount_value**: Het betaalde bedrag
- **customer_email**: Email van de klant
- **supabase_user_id**: De Supabase user ID
- **metadata**: Extra informatie over de betaling (JSON)
- **paid_at**: Wanneer de betaling is voltooid
- **created_at**: Wanneer de record is aangemaakt

## Troubleshooting
Als je geen betalingen ziet:
1. Check of de `mollie_payments` tabel bestaat
2. Check of de webhook correct werkt
3. Check of de betaling daadwerkelijk is voltooid in Mollie
4. Check de server logs voor errors


