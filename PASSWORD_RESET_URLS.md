# Password Reset URLs

## Redirect URLs voor Wachtwoord Reset

De confirmation URL die je moet instellen in Supabase voor wachtwoord reset is:

**Voor development:**
```
http://localhost:3000/auth/reset-password
```

**Voor productie (live app):**
```
https://factuurlijk-dht5.vercel.app/auth/reset-password
```

## Supabase Configuratie

### Stap 1: Redirect URL Instellen

1. Ga naar Supabase Dashboard > **Authentication** > **URL Configuration**
2. Scroll naar **Redirect URLs**
3. Voeg toe:
   - `http://localhost:3000/auth/reset-password` (voor development)
   - `https://factuurlijk-dht5.vercel.app/auth/reset-password` (voor productie)

### Stap 2: Email Template (Optioneel)

Je kunt de password reset email template aanpassen in:
- Supabase Dashboard > **Authentication** > **Email Templates** > **Reset Password**

## Hoe het werkt

1. Gebruiker klikt op "Wachtwoord vergeten?" in login scherm
2. Gebruiker vult email in
3. Supabase stuurt password reset email met link
4. Gebruiker klikt op link in email
5. Link leidt naar `http://localhost:3000/auth/reset-password?token=...&type=recovery`
6. App verwerkt de reset token
7. Gebruiker kan nieuw wachtwoord instellen
8. Na succesvolle reset wordt gebruiker doorgestuurd naar login scherm

## Testen

1. Ga naar login scherm
2. Klik op "Wachtwoord vergeten?"
3. Vul je email in
4. Check je email inbox
5. Klik op de reset link
6. Stel een nieuw wachtwoord in
7. Log in met je nieuwe wachtwoord

## Belangrijk

- De code gebruikt automatisch `window.location.origin`, dus:
  - Op localhost → `http://localhost:3000/auth/reset-password`
  - Op Vercel → `https://factuurlijk-dht5.vercel.app/auth/reset-password`
- Zorg dat de redirect URL exact overeenkomt in Supabase (inclusief `https://`)
- Geen trailing slashes (behalve na `/auth/reset-password`)




