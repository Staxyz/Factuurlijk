# Logo Debug Guide

## Probleem
Logo wordt niet weergegeven in bedrijfsprofiel en/of op facturen.

## Debug Stappen

### Stap 1: Open Browser Console
Druk op F12 en ga naar de Console tab.

### Stap 2: Check Storage Bucket
1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Storage**
4. Check of bucket `profile-logos` bestaat
5. Als niet: maak deze aan (zie STORAGE_BUCKET_SETUP.md)

### Stap 3: Check Bucket Permissions
1. Open bucket `profile-logos`
2. Ga naar **Settings**
3. Check of **Public bucket** AAN staat
4. Ga naar **Policies**
5. Check of er minimaal 2 policies zijn:
   - SELECT policy (voor public access)
   - INSERT policy (voor authenticated users)

### Stap 4: Upload Test
1. Ga naar Bedrijfsprofiel
2. Upload een logo
3. Check console logs:
   - Zie je "Uploading logo to path: ..."?
   - Zie je "Logo uploaded successfully: ..."?
   - Zie je "Loading image from storage: ..."?
   - Zie je "Image loaded successfully..."?

### Stap 5: Check Errors
Als je errors ziet in de console:

**Error: "Bucket not found"**
- Bucket bestaat niet
- Oplossing: Maak bucket aan (zie STORAGE_BUCKET_SETUP.md)

**Error: "new row violates row-level security"**
- Permissions zijn niet goed
- Oplossing: Check policies (zie STORAGE_BUCKET_SETUP.md)

**Error: "Error downloading image"**
- Download methode werkt niet
- Wordt automatisch gevolgd door public URL methode
- Als beide falen: check bucket permissions

**Error: "Both download and public URL failed"**
- Bucket is niet public OF path is verkeerd
- Oplossing: 
  1. Maak bucket public
  2. Check of `logo_url` in database correct is

### Stap 6: Check Database
1. Ga naar Supabase Dashboard > **Table Editor** > **profiles**
2. Zoek je profiel (filter op je email)
3. Check kolom `logo_url`
4. Moet format zijn: `{user_id}/{timestamp}.{ext}`
5. Bijvoorbeeld: `abc123-def456/1234567890.png`

### Stap 7: Manual Test
Test public URL handmatig:
1. Check `logo_url` in database (bijv: `abc123/1234567890.png`)
2. Maak URL: `https://pprqqanddnixolmbwile.supabase.co/storage/v1/object/public/profile-logos/abc123/1234567890.png`
3. Plak URL in browser
4. Als image laadt: bucket is correct geconfigureerd
5. Als 404: path is verkeerd
6. Als andere error: bucket permissions zijn verkeerd

## Oplossingen

### Oplossing 1: Bucket bestaat niet
Zie `STORAGE_BUCKET_SETUP.md`

### Oplossing 2: Bucket is niet public
1. Supabase Dashboard > Storage > profile-logos
2. Settings
3. Zet "Public bucket" AAN
4. Save

### Oplossing 3: Policies ontbreken
Zie `STORAGE_BUCKET_SETUP.md` voor complete policy setup

### Oplossing 4: Logo_url is leeg of verkeerd
1. Upload logo opnieuw
2. Check console voor errors
3. Check database of `logo_url` is bijgewerkt

## Als niets werkt

1. Delete bucket `profile-logos`
2. Maak bucket opnieuw aan (zie STORAGE_BUCKET_SETUP.md)
3. Upload logo opnieuw
4. Check console logs stap voor stap

