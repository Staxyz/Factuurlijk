import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

interface ResetPasswordPageProps {
  onBackToLogin: () => void;
}

const ArrowLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onBackToLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!password || !confirmPassword) {
      setError('Vul beide velden in.');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error('Password update error:', error);
        setError(error.message || 'Er is een fout opgetreden bij het resetten van je wachtwoord.');
      } else {
        setSuccess(true);
        // Automatically redirect to login after 2 seconds
        setTimeout(() => {
          onBackToLogin();
        }, 2000);
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={onBackToLogin} className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors group">
            <ArrowLeft />
            Terug naar inloggen
        </button>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
          Nieuw wachtwoord instellen
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Kies een nieuw wachtwoord voor je account
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {success ? (
            <div className="space-y-4">
              <div className="rounded-md bg-green-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-green-800">
                      Wachtwoord succesvol gewijzigd!
                    </h3>
                    <div className="mt-2 text-sm text-green-700">
                      <p>Je wordt nu doorgestuurd naar het inlogscherm...</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleResetPassword}>
              {error && <p className="text-center text-sm text-red-600">{error}</p>}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                  Nieuw wachtwoord
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={inputStyle}
                    disabled={loading}
                    placeholder="Minimaal 6 tekens"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirm-password" className="block text-sm font-medium text-zinc-700">
                  Bevestig wachtwoord
                </label>
                <div className="mt-1">
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputStyle}
                    disabled={loading}
                    placeholder="Herhaal je wachtwoord"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                >
                  {loading ? 'Bezig...' : 'Wachtwoord wijzigen'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};




