# Storage Bucket Setup voor Logo Upload

## Probleem
Het logo wordt niet weergegeven na upload. Dit kan komen doordat de storage bucket niet bestaat of geen juiste permissions heeft.

## Oplossing: Storage Bucket Aanmaken en Configureren

### Stap 1: Maak de Storage Bucket aan

1. Ga naar [Supabase Dashboard](https://app.supabase.com)
2. Selecteer je project
3. Ga naar **Storage** in het linker menu
4. Klik op **New bucket**
5. Vul in:
   - **Name**: `profile-logos`
   - **Public bucket**: ✅ **AAN** (belangrijk!)
   - **File size limit**: 5 MB (of meer)
   - **Allowed MIME types**: `image/*` (of leeg laten voor alle types)
6. Klik op **Create bucket**

### Stap 2: Configureer Bucket Policies

1. Ga naar **Storage** > **Policies** (of klik op de bucket `profile-logos`)
2. Klik op **New Policy**
3. Selecteer **For full customization** (of gebruik de template)

#### Policy 1: Users can upload their own logos
```sql
CREATE POLICY "Users can upload own logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 2: Users can view all logos (public access)
```sql
CREATE POLICY "Public logo access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profile-logos');
```

#### Policy 3: Users can update their own logos
```sql
CREATE POLICY "Users can update own logos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profile-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

#### Policy 4: Users can delete their own logos
```sql
CREATE POLICY "Users can delete own logos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profile-logos' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Stap 3: Verifieer de Configuratie

1. Upload een logo in de app
2. Open de browser console (F12)
3. Kijk naar de console logs:
   - "Uploading logo to path: ..."
   - "Logo uploaded successfully: ..."
   - "Loading image from storage: ..."
   - "Public URL: ..."
4. Als er errors zijn, deel ze met de ontwikkelaar

### Belangrijk

- De bucket **MOET** public zijn voor de public URL methode
- De bucket naam moet exact `profile-logos` zijn (geen spaties, kleine letters)
- Zorg dat alle policies correct zijn ingesteld

## Troubleshooting

### Logo wordt niet weergegeven
1. Check browser console voor errors
2. Check of de bucket bestaat: Storage > Buckets
3. Check of de bucket public is: Storage > Buckets > profile-logos > Settings
4. Check of de policies correct zijn: Storage > Policies

### Upload error
- Check of de bucket bestaat
- Check of je ingelogd bent
- Check of de file size niet te groot is (max 5MB standaard)

### Image loading error
- Check of de bucket public is
- Check of de public URL policy correct is ingesteld
- Check browser console voor CORS errors

