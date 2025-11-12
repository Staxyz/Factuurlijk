import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { UserProfile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { StorageImage } from './StorageImage';

interface CompanyProfileProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  session: Session | null;
}

export const CompanyProfile: React.FC<CompanyProfileProps> = ({ userProfile, setUserProfile, session }) => {
  const [profile, setProfile] = useState<UserProfile>(userProfile);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProfile(userProfile);
  }, [userProfile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = async (file: File | null) => {
    if (!file || !session?.user) return;
    if (!file.type.startsWith('image/')) {
        alert('Selecteer a.u.b. een afbeeldingsbestand.');
        return;
    }

    setIsUploadingLogo(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;
        
        // Remove old logo from storage if it exists to prevent orphaned files
        if (profile.logo_url) {
            const { error: removeError } = await supabase.storage
                .from('profile-logos')
                .remove([profile.logo_url]);
            if (removeError) {
                console.error("Could not remove old logo:", removeError.message);
            }
        }

        const { error: uploadError } = await supabase.storage
            .from('profile-logos')
            .upload(filePath, file, { upsert: false });

        if (uploadError) throw uploadError;

        // Update local state with the new file path. This will be saved on submit.
        setProfile(prev => ({ ...prev, logo_url: filePath }));

    } catch (error: any) {
        console.error('Error uploading logo:', error);
        alert(`Er is een fout opgetreden bij het uploaden van het logo: ${error.message}`);
    } finally {
        setIsUploadingLogo(false);
    }
  };

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileChange(file);
  }, []);
  
  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFileChange(file || null);
  };
  
  const removeLogo = async () => {
    if (!session?.user || !profile.logo_url) return;

    try {
        const { error } = await supabase.storage
            .from('profile-logos')
            .remove([profile.logo_url]);
        if (error) throw error;
        
        setProfile(prev => ({...prev, logo_url: ''}));
    } catch (error: any) {
        console.error('Error removing logo from storage:', error);
        alert(`Fout bij verwijderen logo: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) {
      alert("U moet ingelogd zijn om uw profiel op te slaan.");
      return;
    }

    setIsSaving(true);
    setShowSuccess(false);

    try {
      // Create a clean payload for the update operation.
      // We exclude fields that should not be changed, like 'id' and 'email'.
      const { id, email, updated_at, ...updatePayload } = profile;

      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatePayload,
          updated_at: new Date().toISOString(), // Always set a fresh timestamp
        })
        .eq('id', session.user.id) // Ensure we only update the logged-in user's profile
        .select()
        .single();

      if (error) {
        throw error;
      }

      setUserProfile(data); // Update global state with data from DB
      setProfile(data); // Sync local form state to prevent false "hasChanges"
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (error: any) {
      console.error("Error updating profile:", error);
      alert(`Er is een fout opgetreden bij het opslaan van het profiel: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };
  
  const hasChanges = JSON.stringify(userProfile) !== JSON.stringify(profile);
  const inputStyle = "block w-full rounded-md border-stone-300 bg-white px-3 py-1.5 text-sm placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600";
  
  return (
    <div className="bg-stone-50 p-6 rounded-lg border border-stone-200 max-w-3xl w-full">
      <h1 className="text-2xl font-bold mb-1">Bedrijfsprofiel</h1>
      <p className="text-zinc-600 mb-6">Deze informatie verschijnt op je facturen.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Bedrijfslogo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div className="sm:col-span-1">
                    <div className="h-20 w-full flex items-center justify-start">
                        {profile.logo_url ? (
                            <div className="relative group">
                                <StorageImage 
                                    bucket="profile-logos" 
                                    path={profile.logo_url} 
                                    alt="Logo preview" 
                                    className="h-16 w-auto object-contain rounded-md bg-white p-2 border border-stone-200" 
                                />
                                <button 
                                    type="button" 
                                    onClick={removeLogo} 
                                    className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                    aria-label="Verwijder logo"
                                >
                                    &#x2715;
                                </button>
                            </div>
                        ) : (
                           <div className="h-16 w-full flex items-center justify-center text-xs text-zinc-500 bg-stone-100 rounded-md border border-dashed">Geen logo</div>
                        )}
                    </div>
                </div>
                <div 
                    className={`${profile.logo_url ? 'sm:col-span-2' : 'sm:col-span-3'} flex justify-center items-center p-4 border-2 border-stone-300 border-dashed rounded-md transition-colors ${isUploadingLogo ? 'cursor-wait bg-stone-100' : 'cursor-pointer hover:border-teal-500'} ${isDragging ? 'border-teal-500 bg-teal-50' : ''}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                >
                    <input ref={fileInputRef} id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/*" onChange={onFileSelect} disabled={isUploadingLogo} />
                    {isUploadingLogo ? (
                         <div className="space-y-1 text-center">
                            <p className="text-sm text-zinc-600">Logo uploaden...</p>
                         </div>
                    ) : (
                        <div className="space-y-1 text-center">
                            <svg className="mx-auto h-10 w-10 text-zinc-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                            <div className="flex text-sm text-zinc-600">
                                <p className="pl-1">Sleep een bestand hierheen of <span className="font-semibold text-teal-600">klik om te selecteren</span></p>
                            </div>
                            <p className="text-xs text-zinc-500">PNG, JPG, tot 5MB</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">Bedrijfsnaam</label>
            <input type="text" id="name" name="name" value={profile.name} onChange={handleChange} className={inputStyle} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">E-mailadres</label>
            <input type="email" id="email" name="email" value={profile.email} disabled className={`${inputStyle} bg-stone-100 cursor-not-allowed`} />
            <p className="mt-1 text-xs text-zinc-500">Het e-mailadres is gekoppeld aan je account en kan hier niet gewijzigd worden.</p>
          </div>
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1">Adres</label>
          <input type="text" id="address" name="address" value={profile.address} onChange={handleChange} placeholder="Voorbeeldstraat 1, 1234 AB Amsterdam" className={inputStyle} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="kvk_number" className="block text-sm font-medium text-zinc-700 mb-1">KvK-nummer</label>
            <input type="text" id="kvk_number" name="kvk_number" value={profile.kvk_number} onChange={handleChange} className={inputStyle} />
          </div>
          <div>
            <label htmlFor="btw_number" className="block text-sm font-medium text-zinc-700 mb-1">BTW-nummer</label>
            <input type="text" id="btw_number" name="btw_number" value={profile.btw_number} onChange={handleChange} className={inputStyle} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="iban" className="block text-sm font-medium text-zinc-700 mb-1">IBAN</label>
              <input type="text" id="iban" name="iban" value={profile.iban} onChange={handleChange} className={inputStyle} />
            </div>
            <div>
              <label htmlFor="phone_number" className="block text-sm font-medium text-zinc-700 mb-1">Telefoonnummer</label>
              <input type="tel" id="phone_number" name="phone_number" value={profile.phone_number || ''} onChange={handleChange} className={inputStyle} />
            </div>
        </div>
        
        <div className="flex justify-end items-center pt-4 border-t border-stone-200">
           {showSuccess && (
              <div className="flex items-center text-sm font-medium text-green-600 mr-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Profiel opgeslagen!
              </div>
          )}
          <button 
            type="submit" 
            disabled={!hasChanges || isSaving || isUploadingLogo}
            className="rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
          </button>
        </div>
      </form>
    </div>
  );
};