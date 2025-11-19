# Quick Fix: "App niet veilig" Waarschuwing

## Snelle Oplossing (5 minuten)

### Stap 1: OAuth Consent Screen Configureren

1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project
3. Ga naar **APIs & Services** > **OAuth consent screen**
4. Als je nog geen consent screen hebt:
   - Kies **External**
   - Klik op **Create**
   - Vul in:
     - **App name**: `Factuurlijk`
     - **User support email**: Je eigen email
     - **Developer contact**: Je eigen email
   - Klik op **Save and Continue**
5. Bij **Scopes**:
   - Klik op **Add or Remove Scopes**
   - Selecteer: `.../auth/userinfo.email` en `.../auth/userinfo.profile`
   - Klik op **Update** > **Save and Continue**
6. **BELANGRIJK - Test Users toevoegen:**
   - Klik op **Add Users**
   - Voeg je eigen Google email adres toe
   - Klik op **Add**
   - Klik op **Save and Continue**
7. Klik op **Back to Dashboard**

### Stap 2: Testen

1. Probeer opnieuw in te loggen met Google
2. Je ziet nog steeds de waarschuwing (dit is normaal)
3. Klik op **Advanced** (Geavanceerd)
4. Klik op **Go to Factuurlijk (unsafe)** of **Ga naar Factuurlijk (onveilig)**
5. Je kunt nu inloggen!

## Waarom zie ik deze waarschuwing?

- Google toont deze waarschuwing voor alle apps die nog niet zijn geverifieerd
- Dit is **normaal** voor development/test apps
- Zolang je app in "Testing" status is, zie je deze waarschuwing
- Alleen gebruikers die zijn toegevoegd als "Test User" kunnen inloggen

## Waarschuwing Volledig Verwijderen (Productie)

Dit vereist Google App Verificatie (kan dagen tot weken duren):

1. **OAuth Consent Screen** > **Publish App**
2. Vul alle vereiste informatie in
3. Verstrek Privacy Policy en Terms of Service links
4. Wacht op Google verificatie

**Voor development:** De waarschuwing is acceptabel. Gebruikers kunnen gewoon op "Advanced" klikken.




