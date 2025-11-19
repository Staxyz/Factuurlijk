import React from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, View } from '../types';

interface SettingsPageProps {
  userProfile: UserProfile;
  session: Session | null;
  setCurrentView: (view: View) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ userProfile, session, setCurrentView }) => {
  const inputStyle = "block w-full rounded-md border-stone-300 bg-stone-100 px-3 py-2 text-base text-zinc-500 cursor-not-allowed shadow-sm";
  const buttonStyle = "rounded-md px-4 py-2 text-base font-medium shadow-sm transition-colors";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900">Instellingen</h1>
        <p className="text-zinc-600 mt-1">Beheer hier je accountgegevens.</p>
      </div>

      {/* Account Information */}
      <div className="bg-stone-50 p-6 sm:p-8 rounded-lg border border-stone-200">
        <h2 className="text-xl font-bold mb-6">Accountinformatie</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-base font-medium text-zinc-700">Volledige naam</label>
            <input type="text" id="name" name="name" value={userProfile.name} disabled className={inputStyle} />
            <p className="mt-1 text-sm text-zinc-500">Om je naam te wijzigen, pas je dit aan in je <button onClick={() => setCurrentView('company-profile')} className="text-teal-600 hover:underline font-medium">bedrijfsprofiel</button>.</p>
          </div>
          <div>
            <label htmlFor="email" className="block text-base font-medium text-zinc-700">E-mailadres</label>
            <input type="email" id="email" name="email" value={session?.user?.email || ''} disabled className={inputStyle} />
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-stone-50 p-6 sm:p-8 rounded-lg border border-stone-200">
        <h2 className="text-xl font-bold mb-2">Wachtwoord wijzigen</h2>
        <p className="text-zinc-600 mb-6">Voor de veiligheid van je account raden we aan om regelmatig je wachtwoord te wijzigen.</p>
        <button 
          className={`${buttonStyle} bg-white text-zinc-700 border border-stone-300 hover:bg-stone-100`}
          onClick={() => alert('Functionaliteit nog niet geïmplementeerd.')}
        >
          Wachtwoord wijzigen
        </button>
      </div>
      
      {/* Delete Account */}
      <div className="bg-white p-6 sm:p-8 rounded-lg border border-red-200">
        <h2 className="text-xl font-bold text-red-800 mb-2">Account verwijderen</h2>
        <p className="text-zinc-600 mb-6">
          Let op: het verwijderen van je account is een permanente actie. Al je facturen en klantgegevens worden definitief verwijderd. Deze actie kan niet ongedaan worden gemaakt.
        </p>
        <button 
          className={`${buttonStyle} bg-red-600 text-white hover:bg-red-700 border border-transparent`}
          onClick={() => alert('Functionaliteit nog niet geïmplementeerd.')}
        >
          Mijn account permanent verwijderen
        </button>
      </div>
    </div>
  );
};