# Email Confirmation Setup

## Confirmation URL

De confirmation URL die je moet instellen in Supabase is:

**Voor development:**
```
http://localhost:3000/auth/confirm
```

**Voor productie (live app):**
```
https://factuurlijk-dht5.vercel.app/auth/confirm
```

## Supabase Configuratie

### Stap 1: Email Redirect URL Instellen

1. Ga naar Supabase Dashboard > **Authentication** > **URL Configuration**
2. Scroll naar **Redirect URLs**
3. Voeg toe:
   - `http://localhost:3000/auth/confirm` (voor development)
   - `https://jouw-domein.com/auth/confirm` (voor productie)

### Stap 2: Email Templates (Optioneel)

Je kunt de email template aanpassen in:
- Supabase Dashboard > **Authentication** > **Email Templates** > **Confirm signup**

De confirmation link in de email zal automatisch naar `/auth/confirm` redirecten.

## Hoe het werkt

1. Gebruiker maakt account aan
2. Supabase stuurt confirmation email met link
3. Gebruiker klikt op link in email
4. Link leidt naar `http://localhost:3000/auth/confirm?token=...&type=signup`
5. App verwerkt de confirmation token
6. Gebruiker wordt automatisch doorgestuurd naar login scherm
7. Gebruiker kan nu inloggen

## Testen

1. Maak een nieuw account aan (met email verificatie AAN)
2. Check je email inbox
3. Klik op de confirmation link
4. Je zou automatisch naar het login scherm moeten worden doorgestuurd
5. Log in met je nieuwe account

## Troubleshooting

### Confirmation link werkt niet
- Check of de redirect URL correct is ingesteld in Supabase
- Check of email verificatie AAN staat
- Check browser console voor errors

### Gebruiker komt niet op login scherm
- Check of de `/auth/confirm` route correct wordt afgehandeld
- Check browser console voor errors
- Check of de session correct wordt ingesteld na confirmation

