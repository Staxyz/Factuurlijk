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
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't submit login form if forgot password is showing
    if (isLogin && showForgotPassword) {
      return;
    }
    
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
        // Determine the correct redirect URL based on environment
        const redirectUrl = `${window.location.origin}/auth/confirm`;
        
        const { data, error } = await supabase.auth.signUp({ 
        email, 
        password, 
          options: { 
            data: { full_name: name },
            emailRedirectTo: redirectUrl
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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError('Vul je e-mailadres in.');
      setLoading(false);
      return;
    }

    try {
      const redirectUrl = `${window.location.origin}/auth/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        console.error('Password reset error:', error);
        setError(error.message || 'Er is een fout opgetreden. Probeer het opnieuw.');
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      console.error('Unexpected error during password reset:', err);
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
    setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Force production URL if we're on Vercel, otherwise use current origin
      // This ensures OAuth always redirects to the correct production URL
      const isProduction = window.location.hostname.includes('vercel.app') || 
                          window.location.hostname.includes('factuurlijk') ||
                          (window.location.protocol === 'https:' && !window.location.hostname.includes('localhost'));
      
      const redirectUrl = isProduction 
        ? 'https://factuurlijk.vercel.app'
        : window.location.origin;
      
      console.log('=== Google OAuth Debug Info ===');
      console.log('Current origin:', window.location.origin);
      console.log('Current hostname:', window.location.hostname);
      console.log('Is production:', isProduction);
      console.log('Redirect URL:', redirectUrl);
      console.log('NOTE: After OAuth, will redirect to dashboard');
      console.log('===============================');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: false,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
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
        // Don't set loading to false here - the redirect will happen
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

            {!showForgotPassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-700">
                Wachtwoord
              </label>
              <div className="mt-1 relative">
                <input 
                  id="password" 
                  name="password" 
                  type={showPassword ? "text" : "password"} 
                  autoComplete="current-password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`${inputStyle} pr-10`} 
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center w-10 text-zinc-500 hover:text-teal-600 focus:outline-none transition-colors duration-200 rounded-r-md hover:bg-teal-50"
                  tabIndex={-1}
                  aria-label={showPassword ? "Wachtwoord verbergen" : "Wachtwoord tonen"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>
            )}
            
            {isLogin && !showForgotPassword && (
                <div className="flex items-center justify-between">
                    <div className="text-sm">
                        <button
                            type="button"
                            onClick={() => {
                              setShowForgotPassword(true);
                              setPassword(''); // Clear password when switching to forgot password
                            }}
                            className="font-medium text-teal-600 hover:text-teal-500"
                        >
                            Wachtwoord vergeten?
                        </button>
                    </div>
                </div>
            )}

            {isLogin && showForgotPassword && !resetEmailSent && (
                <div className="space-y-4">
                    <div className="text-sm text-zinc-600">
                        <p>Vul je e-mailadres in en we sturen je een link om je wachtwoord te resetten.</p>
                    </div>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                        <div>
                            <label htmlFor="reset-email" className="block text-sm font-medium text-zinc-700">
                                E-mailadres
                            </label>
                            <div className="mt-1">
                                <input
                                    id="reset-email"
                                    name="reset-email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputStyle}
                                    disabled={loading}
                                />
                            </div>
                        </div>
                        <div className="flex space-x-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    setEmail('');
                                    setError(null);
                                }}
                                disabled={loading}
                                className="flex-1 py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                Annuleren
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
                            >
                                {loading ? 'Bezig...' : 'Verstuur link'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {isLogin && showForgotPassword && resetEmailSent && (
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
                                    Email verzonden!
                                </h3>
                                <div className="mt-2 text-sm text-green-700">
                                    <p>We hebben een wachtwoord reset link gestuurd naar <strong>{email}</strong>. Check je inbox en klik op de link om je wachtwoord te resetten.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setShowForgotPassword(false);
                            setResetEmailSent(false);
                            setEmail('');
                            setError(null);
                        }}
                        className="w-full py-2 px-4 border border-stone-300 rounded-md shadow-sm text-sm font-medium text-zinc-700 bg-white hover:bg-stone-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                        Terug naar inloggen
                    </button>
                </div>
            )}

            {!showForgotPassword && (
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? 'Bezig...' : (isLogin ? 'Inloggen' : 'Registreren')}
              </button>
            </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};