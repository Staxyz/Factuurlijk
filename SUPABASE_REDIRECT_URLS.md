# Supabase Redirect URLs Configuratie

## ⚠️ BELANGRIJK: Site URL Instellen (KRITISCH!)

**Dit is de belangrijkste stap om te voorkomen dat OAuth naar localhost redirect!**

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **URL Configuration**
4. **Site URL** (bovenaan) moet zijn: `https://factuurlijk.vercel.app`
   - **NIET** `http://localhost:3000` (dit zorgt ervoor dat OAuth naar localhost redirect!)
   - Dit is de primaire URL die Supabase gebruikt voor OAuth redirects

## Redirect URLs die je moet toevoegen

Ga naar: **Authentication** > **URL Configuration** > **Redirect URLs**

### Voeg deze URLs toe:

1. **Development (localhost):**
   ```
   http://localhost:3000
   http://localhost:3000/auth/confirm
   ```

2. **Productie (live app) - BELANGRIJK:**
   ```
   https://factuurlijk.vercel.app
   https://factuurlijk.vercel.app/#/dashboard
   https://factuurlijk.vercel.app/auth/confirm
   ```

## Stappen om in te stellen:

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **URL Configuration**
4. **Zet de Site URL op:** `https://factuurlijk.vercel.app` (KRITISCH!)
5. Scroll naar **Redirect URLs**
6. Klik op **Add URL** en voeg alle bovenstaande URLs toe
7. Klik op **Save**

## Belangrijk:

- **Site URL moet ALTIJD op de productie URL staan** (`https://factuurlijk.vercel.app`)
- Zorg dat alle URLs exact overeenkomen (inclusief `http://` vs `https://`)
- Geen trailing slashes (behalve na `/auth/confirm`)
- Voor development: gebruik `http://localhost:3000` alleen in Redirect URLs
- Voor productie: gebruik `https://factuurlijk.vercel.app`

## Testen:

1. **Development:**
   - Maak account aan op `http://localhost:3000`
   - Check email voor confirmation link
   - Link zou moeten werken en naar login scherm leiden

2. **Productie:**
   - Maak account aan op `https://factuurlijk.vercel.app`
   - Check email voor confirmation link
   - Link zou moeten werken en naar login scherm leiden
   - **Google OAuth moet naar** `https://factuurlijk.vercel.app/#/dashboard` redirecten

## Troubleshooting OAuth Redirect naar Localhost

Als OAuth nog steeds naar `http://localhost:3000` redirect:

1. **Controleer Site URL:**
   - Ga naar **Authentication** > **URL Configuration**
   - **Site URL** moet `https://factuurlijk.vercel.app` zijn
   - **NIET** `http://localhost:3000`

2. **Controleer Redirect URLs:**
   - Zorg dat `https://factuurlijk.vercel.app` in de lijst staat
   - Zorg dat `https://factuurlijk.vercel.app/#/dashboard` in de lijst staat

3. **Clear browser cache:**
   - Soms cachet de browser de oude redirect URL
   - Probeer incognito/private mode

4. **De code heeft nu automatische fallback:**
   - Als je toch naar localhost wordt geredirect, zal de app automatisch doorsturen naar productie
   - Check de browser console voor debug informatie




