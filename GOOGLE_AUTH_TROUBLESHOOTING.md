# Google Auth Troubleshooting Checklist

Als Google Auth niet werkt, controleer deze punten in volgorde:

## 1. Supabase Dashboard Configuratie

### ✅ Google Provider Ingeschakeld
- Ga naar **Authentication** > **Providers** > **Google**
- Zorg dat **Enable Google provider** is ingeschakeld
- Controleer dat **Client ID** en **Client Secret** zijn ingevuld (geen spaties!)

### ✅ Redirect URLs Geconfigureerd
- Ga naar **Authentication** > **URL Configuration**
- **Site URL** moet zijn: `http://localhost:3000` (voor development)
- **Redirect URLs** moet bevatten:
  - `http://localhost:3000`
  - `http://localhost:3000/**` (wildcard voor alle sub-paden)

### ✅ Google Cloud Console Configuratie
- Ga naar [Google Cloud Console](https://console.cloud.google.com/)
- **APIs & Services** > **Credentials** > Je OAuth Client ID
- **Authorized redirect URIs** moet bevatten:
  - `https://pprqqanddnixolmbwile.supabase.co/auth/v1/callback` (VERPLICHT!)
  - Optioneel: `http://localhost:3000` (voor directe redirects)

## 2. Browser Console Checken

Open de browser console (F12) en kijk naar:

1. **Bij het klikken op "Inloggen met Google":**
   - Zie je: `=== Google OAuth Debug Info ===`
   - Controleer de `Redirect URL` - moet exact `http://localhost:3000` zijn
   - Zie je: `Google OAuth initiated successfully`?

2. **Na redirect van Google:**
   - Zie je: `OAuth callback detected`?
   - Zie je: `Auth state changed: SIGNED_IN`?
   - Zijn er rode errors?

## 3. Veelvoorkomende Fouten

### "redirect_uri_mismatch"
**Oorzaak:** De redirect URL in Google Cloud Console komt niet overeen.

**Oplossing:**
1. Controleer in browser console wat de exacte redirect URL is
2. Voeg deze URL toe aan Google Cloud Console > Authorized redirect URIs
3. Zorg dat `https://pprqqanddnixolmbwile.supabase.co/auth/v1/callback` er ook in staat

### "Invalid client"
**Oorzaak:** Client ID of Secret is incorrect in Supabase.

**Oplossing:**
1. Kopieer opnieuw de Client ID en Secret uit Google Cloud Console
2. Plak ze opnieuw in Supabase (zonder spaties!)
3. Klik op Save

### "Provider is not enabled"
**Oorzaak:** Google provider is niet ingeschakeld in Supabase.

**Oplossing:**
1. Ga naar Supabase Dashboard > Authentication > Providers > Google
2. Schakel "Enable Google provider" in
3. Sla op

### Gebruiker wordt niet ingelogd na Google Auth
**Oorzaak:** Redirect URL komt niet overeen of Site URL is verkeerd.

**Oplossing:**
1. Controleer Supabase > Authentication > URL Configuration
2. Site URL moet exact `http://localhost:3000` zijn (geen trailing slash!)
3. Redirect URLs moet `http://localhost:3000` bevatten

## 4. Test Stappen

1. **Open browser console** (F12)
2. **Klik op "Inloggen met Google"**
3. **Check console output:**
   - Moet zien: `Starting Google OAuth with redirect URL: http://localhost:3000`
   - Moet zien: `Google OAuth initiated successfully`
4. **Na redirect van Google:**
   - Moet zien: `OAuth callback detected`
   - Moet zien: `Auth state changed: SIGNED_IN`
5. **Check of je bent ingelogd:**
   - Moet automatisch naar dashboard navigeren

## 5. Als Niets Werkt

1. **Clear browser cache en cookies**
2. **Test in incognito/private window**
3. **Check Supabase logs:**
   - Ga naar Supabase Dashboard > Logs > Auth Logs
   - Kijk naar errors bij de OAuth poging
4. **Test met een andere browser**
5. **Check of er ad blockers actief zijn** (kunnen OAuth blokkeren)

## 6. Debug Mode

De applicatie heeft nu uitgebreide console logging. Open de browser console en:
- Kijk naar alle `console.log` en `console.error` berichten
- Deel deze met de ontwikkelaar als je hulp nodig hebt

## Belangrijkste Checklist

- [ ] Google provider ingeschakeld in Supabase
- [ ] Client ID en Secret correct ingevuld in Supabase
- [ ] Site URL = `http://localhost:3000` in Supabase
- [ ] Redirect URLs bevat `http://localhost:3000` in Supabase
- [ ] `https://pprqqanddnixolmbwile.supabase.co/auth/v1/callback` staat in Google Cloud Console
- [ ] Geen ad blockers actief
- [ ] Browser console toont geen errors




