import React, { useState } from 'react';
import { supabase } from '../supabaseClient'; // Import supabase client

interface AuthPageProps {
  view: 'login' | 'signup';
  onSwitchView: (view: 'login' | 'signup') => void;
  onBackToHome: () => void;
}

// Icons
const ArrowLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262">
        <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.686H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"></path>
        <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"></path>
        <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.615.035C5.45 88.721 0 107.855 0 130.55s5.45 41.828 13.645 59.238l42.636-33.424z"></path>
        <path fill="#EB4335" d="M130.55 50.479c24.514 0 36.836 10.583 45.105 18.271l36.834-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.645 59.238l42.636 33.424c10.445-31.477 39.746-52.183 74.269-52.183z"></path>
    </svg>
);

export const AuthPage: React.FC<AuthPageProps> = ({ view, onSwitchView, onBackToHome }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
        }
        // On success, the onAuthStateChange listener in App.tsx will handle navigation.
      } else {
        // Sign up
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password, 
          options: { 
            data: { full_name: name },
            emailRedirectTo: window.location.origin
          } 
        });
        
        if (error) {
          console.error('=== SIGNUP ERROR DETAILS ===');
          console.error('Message:', error.message);
          console.error('Status:', error.status);
          console.error('Name:', error.name);
          console.error('Full error object:', JSON.stringify(error, null, 2));
          console.error('============================');
          
          // Provide more specific error messages
          if (error.message.includes('User already registered') || error.message.includes('already registered')) {
            setError('Dit e-mailadres is al geregistreerd. Log in met je bestaande account.');
          } else if (error.message.includes('Password') || error.message.includes('password')) {
            setError('Wachtwoord moet minimaal 6 tekens lang zijn.');
          } else if (error.message.includes('Email') || error.message.includes('email')) {
            setError('Ongeldig e-mailadres. Controleer je invoer.');
          } else if (error.message.includes('Database') || error.message.includes('database')) {
            setError('Database fout. Controleer of de database correct is ingesteld. Check de console voor details.');
          } else {
            setError(error.message || 'Er is een fout opgetreden bij het aanmaken van je account. Check de console (F12) voor details.');
          }
        } else if (data.user) {
          // Check if email confirmation is required
          if (data.session) {
            // User is immediately logged in (email confirmation disabled)
            console.log('User signed up and logged in immediately');
            // The onAuthStateChange listener will handle navigation
            // The database trigger should create the profile automatically
          } else {
            // Email confirmation is required
            alert('Registratie succesvol! Controleer je e-mail voor de verificatielink om je account te activeren.');
          }
        } else {
          setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
        }
      }
    } catch (err) {
      console.error('Unexpected error during auth:', err);
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Get the current origin (works for both localhost and production)
      // Make sure this matches exactly with what's configured in Supabase Dashboard > Authentication > URL Configuration
      const redirectUrl = `${window.location.origin}`;
      
      console.log('=== Google OAuth Debug Info ===');
      console.log('Current origin:', window.location.origin);
      console.log('Full URL:', window.location.href);
      console.log('Redirect URL:', redirectUrl);
      console.log('===============================');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
              redirectTo: redirectUrl,
              skipBrowserRedirect: false,
          },
      });
      
      if (error) {
          console.error('Google OAuth error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          setError(error.message || 'Er is een fout opgetreden bij het inloggen met Google. Controleer je Supabase configuratie.');
          setLoading(false);
      } else {
          // If successful, the browser will redirect to Google
          // The redirect will happen automatically, so we don't need to do anything here
          console.log('Google OAuth initiated successfully, redirecting to Google...');
          console.log('OAuth data:', data);
      }
    } catch (err) {
      console.error('Unexpected error during Google OAuth:', err);
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
      setLoading(false);
    }
  };

  const isLogin = view === 'login';
  const inputStyle = "block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-600 focus:border-teal-600";

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={onBackToHome} className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors group">
            <ArrowLeft />
            Terug naar home
        </button>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-zinc-900">
          {isLogin ? 'Inloggen op je account' : 'Maak een account aan'}
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-600">
          Of{' '}
          <button
            onClick={() => onSwitchView(isLogin ? 'signup' : 'login')}
            disabled={loading}
            className="font-medium text-teal-600 hover:text-teal-500 disabled:opacity-50"
          >
            {isLogin ? 'maak een nieuw account aan' : 'log in op je bestaande account'}
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Google Login Button */}
          <div>
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                type="button"
                className="w-full inline-flex justify-center items-center py-2 px-4 border border-stone-300 rounded-md shadow-sm bg-white text-sm font-medium text-zinc-700 hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
            >
                <GoogleIcon />
                <span>{isLogin ? 'Inloggen' : 'Registreren'} met Google</span>
            </button>
          </div>

          <div className="mt-6 relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-stone-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-zinc-500">Of ga verder met e-mail</span>
            </div>
          </div>
          
          {error && <p className="mt-4 text-center text-sm text-red-600">{error}</p>}

          <form className="mt-6 space-y-6" onSubmit={handleAuthAction}>
            {!isLogin && (
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
                  Volledige naam
                </label>
                <div className="mt-1">
                  <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)} className={inputStyle} disabled={loading}/>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
                E-mailadres
              </label>
              <div className="mt-1">
                <input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputStyle} disabled={loading} />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Wachtwoord
              </label>
              <div className="mt-1">
                <input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputStyle} disabled={loading}/>
              </div>
            </div>
            
            {isLogin && (
                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <a href="#" className="font-medium text-teal-600 hover:text-teal-500">
                            Wachtwoord vergeten?
                        </a>
                    </div>
                </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? 'Bezig...' : (isLogin ? 'Inloggen' : 'Registreren')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};