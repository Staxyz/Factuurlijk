# Supabase Email Setup - Wachtwoord Vergeten Email

## Probleem
De "Wachtwoord vergeten?" functionaliteit werkt, maar je ontvangt geen email in je inbox.

## Oplossing: Configureer Email in Supabase

Supabase heeft twee opties voor emails:
1. **Supabase SMTP (gratis, maar beperkt)** - Standaard ingeschakeld
2. **Custom SMTP (aanbevolen voor productie)** - Gebruik je eigen email provider

## Stap 1: Check Email Instellingen in Supabase

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Authentication** > **Settings**
4. Scroll naar **SMTP Settings**

## Stap 2: Optie A - Gebruik Supabase SMTP (Gratis, voor Development)

Supabase heeft standaard een gratis SMTP service, maar deze heeft beperkingen:

### Instellingen:
1. Ga naar **Authentication** > **Settings** > **SMTP Settings**
2. Zorg dat **Enable Custom SMTP** UIT staat (gebruik Supabase SMTP)
3. Check of **Enable email confirmations** AAN staat (als je email verificatie wilt)
4. Check of **Enable password resets** AAN staat (dit moet AAN staan!)

### Beperkingen van Supabase SMTP:
- Maximaal 3 emails per uur per gebruiker
- Emails kunnen in spam folder terechtkomen
- Alleen voor development/testing
- Niet geschikt voor productie

### Testen:
1. Probeer "Wachtwoord vergeten?" functionaliteit
2. Check je inbox (en spam folder!)
3. Als je geen email ontvangt, check de Supabase logs

## Stap 3: Optie B - Gebruik Custom SMTP (Aanbevolen voor Productie)

Voor betrouwbare emails in productie, gebruik je eigen SMTP provider:

### Populaire SMTP Providers:
- **SendGrid** (gratis tier: 100 emails/dag)
- **Mailgun** (gratis tier: 5,000 emails/maand)
- **AWS SES** (zeer goedkoop)
- **Gmail SMTP** (gratis, maar beperkt)
- **Resend** (moderne, developer-vriendelijke optie)

### Configuratie met Custom SMTP:

1. Ga naar **Authentication** > **Settings** > **SMTP Settings**
2. Zet **Enable Custom SMTP** AAN
3. Vul in:
   - **Sender email**: Je email adres (bijv. `noreply@jouwdomein.com`)
   - **Sender name**: Naam die in email verschijnt (bijv. "Factuurlijk")
   - **Host**: SMTP server (bijv. `smtp.sendgrid.net`)
   - **Port**: Meestal `587` (TLS) of `465` (SSL)
   - **Username**: Je SMTP username
   - **Password**: Je SMTP password

### Voorbeeld: SendGrid Setup

1. Maak account op [SendGrid](https://sendgrid.com)
2. Ga naar **Settings** > **API Keys** > **Create API Key**
3. Maak een API key met "Mail Send" permissions
4. In Supabase:
   - **Host**: `smtp.sendgrid.net`
   - **Port**: `587`
   - **Username**: `apikey`
   - **Password**: Je SendGrid API key
   - **Sender email**: Je verified sender email in SendGrid

### Voorbeeld: Gmail SMTP Setup

1. Ga naar je Google Account > **Security** > **2-Step Verification** (moet aan staan)
2. Maak een **App Password** aan
3. In Supabase:
   - **Host**: `smtp.gmail.com`
   - **Port**: `587`
   - **Username**: Je Gmail adres
   - **Password**: Je App Password (niet je normale wachtwoord!)
   - **Sender email**: Je Gmail adres

## Stap 4: Check Email Templates

1. Ga naar **Authentication** > **Email Templates**
2. Check de **Reset Password** template
3. Zorg dat de template correct is ingesteld
4. De template gebruikt variabelen zoals:
   - `{{ .ConfirmationURL }}` - De reset link
   - `{{ .Email }}` - Het email adres van de gebruiker

## Stap 5: Check Redirect URLs

Zorg dat de redirect URL correct is ingesteld:

1. Ga naar **Authentication** > **URL Configuration**
2. Check **Redirect URLs**:
   - `http://localhost:3000/auth/reset-password` (development)
   - `https://factuurlijk-dht5.vercel.app/auth/reset-password` (productie)

## Stap 6: Testen

### Test Stappen:
1. Ga naar login scherm
2. Klik op "Wachtwoord vergeten?"
3. Vul je email in
4. Klik op "Verstuur link"
5. Check je inbox (en spam folder!)
6. Check Supabase logs voor errors

### Check Supabase Logs:
1. Ga naar **Logs** > **Postgres Logs** of **API Logs**
2. Zoek naar errors rond de tijd dat je de reset aanvroeg
3. Kijk naar email-related errors

## Troubleshooting

### Geen email ontvangen?

1. **Check spam folder** - Supabase emails kunnen als spam worden gemarkeerd
2. **Check Supabase logs** - Kijk voor email errors
3. **Check SMTP settings** - Zijn ze correct ingevuld?
4. **Test met een ander email adres** - Misschien is je email provider geblokkeerd
5. **Check rate limits** - Supabase SMTP heeft limieten (3 emails/uur per gebruiker)

### Email komt in spam?

1. **Gebruik Custom SMTP** met een verified domain
2. **Configureer SPF/DKIM records** voor je domain
3. **Gebruik een professionele email service** (SendGrid, Mailgun, etc.)

### "Email rate limit exceeded"?

- Supabase SMTP heeft een limiet van 3 emails per uur per gebruiker
- Wacht een uur of gebruik Custom SMTP

## Snelle Fix voor Development

Als je snel wilt testen zonder SMTP setup:

1. Gebruik Supabase SMTP (standaard)
2. Check je spam folder
3. Test met een Gmail adres (werkt meestal beter)
4. Wacht even (emails kunnen 1-2 minuten duren)

## Aanbeveling

Voor productie: Gebruik **Resend** of **SendGrid** met Custom SMTP. Dit geeft:
- Betrouwbare email delivery
- Geen spam issues
- Betere analytics
- Professionele uitstraling




