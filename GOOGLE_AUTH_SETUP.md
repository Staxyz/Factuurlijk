# Google Authentication Setup

Deze applicatie gebruikt Supabase voor Google OAuth authenticatie. Volg deze stappen om Google Auth te configureren:

## Stappen in Supabase Dashboard

### 1. Google OAuth Provider Configureren

1. Ga naar je [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **Providers**
4. Zoek **Google** in de lijst en klik erop
5. Schakel **Enable Google provider** in

### 2. OAuth Consent Screen Configureren (BELANGRIJK!)

**Dit voorkomt de "app niet veilig" waarschuwing:**

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project
3. Ga naar **APIs & Services** > **OAuth consent screen**
4. Kies **External** (tenzij je een Google Workspace account hebt, dan **Internal**)
5. Klik op **Create**
6. Vul de verplichte velden in:
   - **App name**: Factuurlijk (of je eigen naam)
   - **User support email**: Je eigen email
   - **Developer contact information**: Je eigen email
7. Klik op **Save and Continue**
8. Bij **Scopes**: Klik op **Add or Remove Scopes**
   - Selecteer minimaal: `.../auth/userinfo.email` en `.../auth/userinfo.profile`
   - Klik op **Update** en dan **Save and Continue**
9. Bij **Test users** (BELANGRIJK voor development!):
   - Klik op **Add Users**
   - Voeg je eigen Google email adres toe
   - Voeg eventueel andere test gebruikers toe
   - Klik op **Add**
   - Klik op **Save and Continue**
10. Bij **Summary**: Controleer alles en klik op **Back to Dashboard**

**Let op:** Zolang de app in "Testing" status is, kunnen alleen de toegevoegde test users inloggen. Voor productie moet je de app laten verifiëren door Google.

### 3. Google OAuth Credentials Aanmaken

Je hebt een Google OAuth Client ID en Secret nodig:

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project
3. Ga naar **APIs & Services** > **Credentials**
4. Klik op **Create Credentials** > **OAuth client ID**
5. Kies **Web application** als application type
6. Geef een naam op (bijv. "Factuurlijk Web Client")
7. Voeg de volgende **Authorized redirect URIs** toe:
   - **VERPLICHT**: `https://pprqqanddnixolmbwile.supabase.co/auth/v1/callback`
   - Voor development: `http://localhost:3000`
   - Voor production: `https://jouw-domein.com`
8. Klik op **Create**
9. Kopieer de **Client ID** en **Client Secret** (bewaar deze veilig!)

### 4. Credentials Toevoegen in Supabase

1. Terug in Supabase Dashboard, bij de Google provider configuratie:
2. Plak de **Client ID** in het veld "Client ID (for OAuth)"
3. Plak de **Client Secret** in het veld "Client Secret (for OAuth)"
4. Klik op **Save**

### 5. Redirect URLs Configureren

1. Ga naar **Authentication** > **URL Configuration**
2. Voeg de volgende URLs toe aan **Redirect URLs**:
   - `http://localhost:3000` (voor development)
   - `https://jouw-domein.com` (voor production)
3. Zorg dat de **Site URL** is ingesteld op je productie URL of `http://localhost:3000` voor development

## Testen

1. Start de applicatie: `npm run dev`
2. Ga naar de login/registratie pagina
3. Klik op "Inloggen met Google" of "Registreren met Google"
4. Je wordt doorgestuurd naar Google om in te loggen
5. **BELANGRIJK:** Als je de "app niet veilig" waarschuwing ziet:
   - Klik op **Advanced** (Geavanceerd)
   - Klik op **Go to Factuurlijk (unsafe)** of **Ga naar Factuurlijk (onveilig)**
   - Dit is normaal voor apps in "Testing" status
6. Na goedkeuring word je teruggebracht naar de applicatie en automatisch ingelogd

## "App niet veilig" Waarschuwing Oplossen

### Voor Development (Testing Status)
- Dit is **normaal** voor apps die nog niet zijn geverifieerd
- Zorg dat je email is toegevoegd als **Test User** in OAuth Consent Screen
- Gebruikers kunnen klikken op "Advanced" > "Go to [app name] (unsafe)" om door te gaan

### Voor Productie (App Verificatie)
Om de waarschuwing volledig te verwijderen moet je:

1. **App laten verifiëren door Google:**
   - Ga naar OAuth Consent Screen
   - Klik op **Publish App** (of **Submit for Verification**)
   - Vul alle vereiste informatie in
   - Dit proces kan enkele dagen tot weken duren

2. **Privacy Policy en Terms of Service:**
   - Je moet publiek toegankelijke links hebben naar:
     - Privacy Policy
     - Terms of Service
   - Deze moeten op je website staan

3. **App Domein Verificatie:**
   - Google moet je domein verifiëren
   - Dit gebeurt via Google Search Console

**Voor nu (development):** De "unsafe" waarschuwing is acceptabel. Zorg gewoon dat test users zijn toegevoegd.

## Troubleshooting

### "redirect_uri_mismatch" Error
- Controleer of de redirect URL in Google Cloud Console exact overeenkomt met wat je gebruikt
- Zorg dat `https://pprqqanddnixolmbwile.supabase.co/auth/v1/callback` is toegevoegd aan de Authorized redirect URIs

### "Invalid client" Error
- Controleer of de Client ID en Client Secret correct zijn gekopieerd in Supabase
- Zorg dat er geen extra spaties zijn

### Gebruiker wordt niet ingelogd na Google Auth
- Controleer of de Site URL correct is ingesteld in Supabase
- Controleer de browser console voor errors
- Zorg dat de auth state change listener actief is (dit is al geïmplementeerd in App.tsx)

## Productie Deployment

Voor productie:
1. Update de Site URL in Supabase naar je productie domein
2. Voeg je productie URL toe aan de Redirect URLs
3. Update de Authorized redirect URIs in Google Cloud Console met je productie URL
4. Zorg dat je HTTPS gebruikt (vereist voor OAuth)

