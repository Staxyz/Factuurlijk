# Supabase Redirect URLs Configuratie

## Redirect URLs die je moet toevoegen in Supabase

Ga naar: **Supabase Dashboard** > **Authentication** > **URL Configuration** > **Redirect URLs**

### Voeg deze URLs toe:

1. **Development (localhost):**
   ```
   http://localhost:3000/auth/confirm
   ```

2. **Productie (live app):**
   ```
   https://factuurlijk-dht5.vercel.app/auth/confirm
   ```

3. **OAuth Redirect (voor Google login):**
   ```
   https://factuurlijk-dht5.vercel.app
   ```

4. **Site URL (hoofd URL):**
   ```
   https://factuurlijk-dht5.vercel.app
   ```

## Stappen om in te stellen:

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **URL Configuration**
4. Scroll naar **Redirect URLs**
5. Klik op **Add URL** en voeg alle bovenstaande URLs toe
6. Klik op **Save**

## Belangrijk:

- Zorg dat alle URLs exact overeenkomen (inclusief `http://` vs `https://`)
- Geen trailing slashes (behalve na `/auth/confirm`)
- Voor development: gebruik `http://localhost:3000`
- Voor productie: gebruik `https://factuurlijk-dht5.vercel.app`

## Testen:

1. **Development:**
   - Maak account aan op `http://localhost:3000`
   - Check email voor confirmation link
   - Link zou moeten werken en naar login scherm leiden

2. **Productie:**
   - Maak account aan op `https://factuurlijk-dht5.vercel.app`
   - Check email voor confirmation link
   - Link zou moeten werken en naar login scherm leiden




