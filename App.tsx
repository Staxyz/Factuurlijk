import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from './supabaseClient';
import type { Session, User } from '@supabase/supabase-js';
import type { Invoice, UserProfile, View, Customer } from './types';
import { mockUserProfile } from './constants';

import { Sidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { CompanyProfile } from './components/CompanyProfile';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { Templates } from './components/Templates';
import { SettingsPage } from './components/SettingsPage';
import { InvoicePreviewSidebar } from './components/InvoiceDetail';
import { UpgradePage } from './components/UpgradePage';
import { CustomerList } from './components/CustomerList';
import { CustomerForm } from './components/CustomerForm';
import { HelpPage } from './components/HelpPage';
import { PrivacyPolicyPage } from './components/PrivacyPolicyPage';
import { TermsAndConditionsPage } from './components/TermsAndConditionsPage';
import { ContactPage } from './components/ContactPage';
import { ResetPasswordPage } from './components/ResetPasswordPage';
import { CheckoutSuccessPage } from './components/CheckoutSuccessPage';

// Secure error message extractor - prevents leaking sensitive information
const getErrorMessage = (error: unknown, defaultMessage = 'Er is een onbekende fout opgetreden.'): string => {
    // In production, never expose detailed error information
    // Check if we're in production mode
    const isProduction = (import.meta as any).env?.MODE === 'production' || (import.meta as any).env?.PROD === true;
    if (isProduction) {
        return defaultMessage;
    }
    
    // In development, show more details for debugging
    if (error instanceof Error) {
        const message = error.message;
        
        // Don't expose API keys, tokens, or internal paths
        if (
            message.includes('API_KEY') ||
            message.includes('SECRET') ||
            message.includes('TOKEN') ||
            message.includes('PASSWORD') ||
            message.includes('supabase') ||
            message.includes('localhost')
        ) {
            return defaultMessage;
        }
        
        return message;
    }
    
    if (typeof error === 'object' && error !== null) {
        if ('message' in error && typeof (error as any).message === 'string') {
            const msg = (error as any).message;
            // Check for sensitive information
            if (msg.includes('API_KEY') || msg.includes('SECRET') || msg.includes('TOKEN')) {
                return defaultMessage;
            }
            return msg;
        }
        if ('details' in error && typeof (error as any).details === 'string') {
            return (error as any).details;
        }
    }
    
    if (typeof error === 'string' && error.length > 0) {
        return error;
    }
    
    return defaultMessage;
};


const App: React.FC = () => {
  // Determine initial view from hash
  const getInitialView = (): View => {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('checkout-success')) return 'checkout-success';
    if (hash.includes('upgrade')) return 'upgrade';
    return 'dashboard';
  };

  // Authentication state
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false); // Track if we're waiting for OAuth callback

  // App view state - Initialize from hash!
  const [view, setView] = useState<View>(getInitialView());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const isSavingRef = useRef(false); // Ref for synchronous check to prevent race conditions

  // --- Function to create a new user profile ---
  const createUserProfile = useCallback(async (user: User): Promise<UserProfile | null> => {
    try {
      const userMetadata = user.user_metadata || {};
      const fullName = userMetadata.full_name || user.email?.split('@')[0] || 'Nieuwe Gebruiker';
      
      const newProfile: Omit<UserProfile, 'id' | 'updated_at'> = {
        name: fullName,
        email: user.email || '',
        address: '',
        kvk_number: null,
        btw_number: null,
        iban: null,
        logo_url: null,
        template_style: 'corporate',
        template_customizations: null,
        plan: 'free',
        invoice_footer_text: null,
        phone_number: null,
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          ...newProfile,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        // If profile already exists, that's okay - just fetch it
        if (error.code === '23505') { // Unique violation
          console.log('Profile already exists, fetching...');
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          return existingProfile;
        }
        throw error;
      }

      console.log('New user profile created:', data);
      return data;
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Fout bij het aanmaken van profiel.');
      console.error('Error creating user profile:', message, error);
      return null;
    }
  }, []);

  // --- NEW: Centralized Data Fetching Function ---
  const fetchData = useCallback(async (user: User) => {
    setLoading(true);
    try {
      const invoicesPromise = supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('invoice_date', { ascending: false });

      const customersPromise = supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

      // --- Profile Fetching Logic with Retries ---
      // The database trigger should create the profile automatically, so we just wait and retry
      let profileData: UserProfile | null = null;
      let lastProfileError: any = null;
      const maxRetries = 6; // Increased retries to wait for database trigger
      let delay = 500; // Start with shorter delay

      for (let i = 0; i < maxRetries; i++) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .limit(1);
        
        if (error) {
          lastProfileError = error;
          console.error(`Error fetching profile (attempt ${i + 1}):`, error);
          // Don't break on error, keep retrying
          if (i < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 1.5;
            continue;
          }
          break;
        }

        if (data && data.length > 0) {
          profileData = data[0];
          lastProfileError = null;
          console.log('Profile found:', profileData);
          break;
        }
        
        // Profile not found yet - wait for database trigger to create it
        if (i < maxRetries - 1) {
          console.log(`Profile not found for user ${user.id}, waiting for database trigger... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5; // Exponential backoff
        }
      }
      
      // If profile still doesn't exist after retries, try to create it manually (fallback)
      if (!profileData) {
        console.warn('Profile not created by database trigger, attempting manual creation as fallback...');
        const fallbackProfile = await createUserProfile(user);
        if (fallbackProfile) {
          profileData = fallbackProfile;
          console.log('Profile created manually as fallback');
        } else {
          console.error("User profile could not be fetched or created. Using fallback data.");
          if (lastProfileError) {
            console.error('Last profile error:', lastProfileError);
          }
          // Use fallback profile data
          profileData = { ...mockUserProfile, id: user.id, email: user.email || '' };
        }
      }
      
      setUserProfile(profileData);
      
      // --- Handle other data ---
      const [invoicesResult, customersResult] = await Promise.all([invoicesPromise, customersPromise]);

      if (invoicesResult.error) throw invoicesResult.error;
      setInvoices(invoicesResult.data || []);

      if (customersResult.error) throw customersResult.error;
      setCustomers(customersResult.data || []);

    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Fout bij het laden van uw gegevens.');
      console.error('Error handling user data:', message, error);
      alert(`Er is een fout opgetreden bij het laden van uw gegevens: ${message}`);
      // Reset to a clean state on error
      setUserProfile(mockUserProfile);
      setInvoices([]);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [createUserProfile]);

  // Handle hash-based routing - Check for these special routes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      
      // Extract the route (everything after # until ? or end)
      const routePart = hash.split('?')[0].toLowerCase();
      
      if (routePart === '#/checkout-success' || routePart === '#checkout-success') {
        setView('checkout-success');
        return;
      }
      if (routePart === '#/upgrade' || routePart === '#upgrade') {
        setView('upgrade');
        return;
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Handle OAuth callback and email confirmation from hash fragments or query parameters
  useEffect(() => {
    // Check if we're returning from an OAuth redirect or email confirmation
    // Supabase can use either hash fragments (#) or query parameters (?)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const queryParams = new URLSearchParams(window.location.search);
    
    const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
    const error = hashParams.get('error') || queryParams.get('error');
    const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
    const type = hashParams.get('type') || queryParams.get('type'); // 'signup' for email confirmation

    console.log('=== OAuth Callback Detection ===');
    console.log('Hash params:', Object.fromEntries(hashParams));
    console.log('Query params:', Object.fromEntries(queryParams));
    console.log('Access token present:', !!accessToken);
    console.log('Error:', error);
    console.log('Type:', type);
    console.log('================================');

    // Handle email confirmation
    if (type === 'signup' || window.location.pathname === '/auth/confirm') {
      if (error) {
        console.error('Email confirmation error:', error, errorDescription);
        alert(`Email verificatie fout: ${errorDescription || error}`);
        // Redirect to login page
        setView('landing');
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }

      if (accessToken) {
        console.log('Email confirmation detected, verifying...');
        // The session will be set automatically by Supabase
        // Wait a moment for the session to be set, then redirect to login
        setTimeout(() => {
          console.log('Email confirmed successfully, redirecting to login...');
          setView('landing');
          window.history.replaceState({}, document.title, '/');
          alert('Je email is bevestigd! Je kunt nu inloggen.');
        }, 1000);
        return;
      }
    }

    // Handle password reset
    if (type === 'recovery' || window.location.pathname === '/auth/reset-password') {
      if (error) {
        console.error('Password reset error:', error, errorDescription);
        alert(`Wachtwoord reset fout: ${errorDescription || error}`);
        setView('landing');
        window.history.replaceState({}, document.title, '/');
        return;
      }

      if (accessToken) {
        console.log('Password reset link detected, user can now reset password');
        // The session will be set automatically by Supabase
        // Show password reset form
        setView('reset-password');
        window.history.replaceState({}, document.title, '/auth/reset-password');
        return;
      }
    }

    // Handle OAuth callback (Google login/signup)
    if (error && !type) {
      console.error('OAuth error:', error, errorDescription);
      alert(`OAuth fout: ${errorDescription || error}`);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      setView('landing');
      return;
    }

    if (accessToken && !type) {
      console.log('✅ OAuth callback detected (Google Auth)');
      console.log('Waiting for Supabase to process session...');
      
      // Set flag to indicate we're waiting for OAuth session
      setWaitingForOAuth(true);
      
      // Don't clean up URL yet - let Supabase process it first
      // Wait for the session to be set by Supabase
      const checkSession = async () => {
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts for slower connections
        while (attempts < maxAttempts) {
          const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Error getting session:', sessionError);
          }
          
          if (currentSession) {
            console.log('✅ OAuth session confirmed! User:', currentSession.user.email);
            // Clean up URL now that session is confirmed
            window.history.replaceState({}, document.title, window.location.pathname);
            setWaitingForOAuth(false);
            setView('dashboard');
            return;
          }
          
          attempts++;
          if (attempts % 5 === 0) {
            console.log(`Waiting for session... (attempt ${attempts}/${maxAttempts})`);
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        // If session not found after retries, try to get it one more time
        console.warn('Session not found after retries, checking one more time...');
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        if (finalSession) {
          console.log('✅ Session found on final check!');
          window.history.replaceState({}, document.title, window.location.pathname);
          setWaitingForOAuth(false);
          setView('dashboard');
        } else {
          console.error('❌ Session not found after all retries');
          // Clean up URL anyway
          window.history.replaceState({}, document.title, window.location.pathname);
          setWaitingForOAuth(false);
          // The onAuthStateChange listener will handle navigation
        }
      };
      
      checkSession();
    }
  }, []);

  // Supabase session management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        // Do not set loading false here, wait for data fetch
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth state changed:', event, session?.user?.email);
      setSession(session);
      
      if (session) {
        // Clear OAuth wait flag when session is confirmed
        setWaitingForOAuth(false);
        
        // User is logged in - navigate to dashboard and fetch their data
        console.log('✅ User signed in, navigating to dashboard...');
        setView('dashboard');
        
        // Clean up any OAuth callback URLs from the address bar
        if (window.location.hash.includes('access_token') || window.location.search.includes('access_token')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        // fetchData will be called by the useEffect below
      } else {
        // User logged out
        console.log('👋 User signed out');
        setWaitingForOAuth(false);
        setView('landing');
        // Clear user-specific data on logout
        setInvoices([]);
        setCustomers([]);
        setUserProfile(mockUserProfile);
        setInvoiceToEdit(null);
        setSelectedInvoice(null);
        setCustomerToEdit(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all user data when session is available
  useEffect(() => {
    if (session?.user) {
        fetchData(session.user);
    } else {
        setLoading(false);
    }
  }, [session, fetchData]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        const message = getErrorMessage(error, 'Fout bij het uitloggen.');
        alert(`Er is een fout opgetreden bij het uitloggen: ${message}`);
    }
    // The onAuthStateChange listener handles state/view changes.
  };
  
  const handleSetCurrentView = (targetView: View) => {
    if (targetView === 'new-invoice') setInvoiceToEdit(null);
    if (targetView === 'new-customer') setCustomerToEdit(null);
    setView(targetView);
    setIsSidebarOpen(false); // Close sidebar on navigation
  }

  const handleViewInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) setSelectedInvoice(invoice);
  };

  const handleEditInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        setInvoiceToEdit(invoice);
        setView('edit-invoice');
    }
  };
  
  const handleSaveInvoice = async (invoice: Invoice) => {
    if (!session?.user) return alert('U moet ingelogd zijn om op te slaan.');
    if (isSavingRef.current) return;

    // --- Price validation ---
    const calculateTotal = (invoiceToCalc: Invoice): number => {
      const subtotal = invoiceToCalc.lines.reduce((acc, line) => {
          return acc + ((line.quantity || 0) * (line.unit_price || 0) * (1 - ((line.discount_percentage || 0) / 100)));
      }, 0);
      const btwAmount = subtotal * ((invoiceToCalc.btw_percentage || 0) / 100);
      return subtotal + btwAmount;
    };
    
    const MAX_INVOICE_TOTAL = 999_999_999; // Maximaal 9 cijfers
    const totalAmount = calculateTotal(invoice);
    const formatCurrency = (amount: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);

    if (totalAmount > MAX_INVOICE_TOTAL) {
        alert(`Fout bij opslaan: Het totaalbedrag (${formatCurrency(totalAmount)}) mag niet hoger zijn dan ${formatCurrency(MAX_INVOICE_TOTAL)}.`);
        return; // Stop execution
    }
    // --- End of validation ---

    isSavingRef.current = true;
    setIsSavingInvoice(true);

    try {
        const isUpdate = invoices.some(inv => inv.id === invoice.id);
        
        // The check for the free plan limit now relies on the userProfile state,
        // which is fetched after every save. This is reliable.
        if (!isUpdate && userProfile.plan === 'free' && (userProfile.invoice_creation_count ?? 0) >= 3) {
            alert('Je hebt je limiet van 3 facturen bereikt. Upgrade naar Pro om onbeperkt facturen te maken.');
            setView('upgrade');
            return;
        }
        
        const { error: upsertError } = await supabase.from('invoices').upsert({ ...invoice, user_id: session.user.id });
        if (upsertError) throw upsertError;

        // The increment is now handled by a database trigger.
        // No RPC call is needed from the client anymore. This is the correct state.
        
        setView('invoices');
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij opslaan factuur: ${getErrorMessage(error)}`);
    } finally {
        isSavingRef.current = false;
        setIsSavingInvoice(false);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').delete().eq('id', invoiceId);
        if (error) throw error;
        setSelectedInvoice(null);
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij verwijderen factuur: ${getErrorMessage(error)}`);
    }
  };

  const handleBulkDelete = async (invoiceIds: string[]) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').delete().in('id', invoiceIds);
        if (error) throw error;
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij verwijderen facturen: ${getErrorMessage(error)}`);
    }
  };

  const handleMarkAsPaid = async (invoiceId: string) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').update({ status: 'betaald' as const }).eq('id', invoiceId);
        if (error) throw error;
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij bijwerken status: ${getErrorMessage(error)}`);
    }
  };
  
  const handleBulkMarkAsPaid = async (invoiceIds: string[]) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').update({ status: 'betaald' as const }).in('id', invoiceIds);
        if (error) throw error;
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij bijwerken statussen: ${getErrorMessage(error)}`);
    }
  };

  const handleEditCustomer = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
        setCustomerToEdit(customer);
        setView('edit-customer');
    }
  };

  const handleSaveCustomer = async (customerData: Omit<Customer, 'id' | 'user_id' | 'created_at'>) => {
    if (!session?.user) return alert('U moet ingelogd zijn om op te slaan.');
    try {
        const customerToSave = { ...customerData, id: customerToEdit?.id, user_id: session.user.id };
        const { error } = await supabase.from('customers').upsert(customerToSave);
        if (error) throw error;
        setView('customers');
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij opslaan klant: ${getErrorMessage(error)}`);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('customers').delete().eq('id', customerId);
        if (error) throw error;
        await fetchData(session.user);
    } catch (error: unknown) {
        alert(`Fout bij verwijderen klant: ${getErrorMessage(error)}`);
    }
  };

  const handleUpgradeToPro = async () => {
    if (!session?.user) return alert('U moet ingelogd zijn om te upgraden.');
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'pro' as const, updated_at: new Date().toISOString() })
        .eq('id', session.user.id);

      if (error) throw error;
      
      await fetchData(session.user);
      setView('dashboard');
      alert('Upgrade succesvol! U heeft nu toegang tot alle Pro-functies.');

    } catch (error: unknown) {
      alert(`Fout bij het upgraden van uw plan: ${getErrorMessage(error)}`);
    }
  };


  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-full w-full">
          <p className="text-zinc-500">Gegevens laden...</p>
        </div>
      );
    }
    
    const contentWrapper = (children: React.ReactNode) => <div className="p-4 sm:p-6 md:p-8 pb-20 sm:pb-8">{children}</div>;
    const isFreePlanLimitReached = (userProfile.plan === 'free' && (userProfile.invoice_creation_count ?? 0) >= 3);
    
    switch (view) {
      case 'dashboard':
        return contentWrapper(<Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={handleViewInvoice} session={session} isFreePlanLimitReached={isFreePlanLimitReached} />);
      case 'invoices':
        return contentWrapper(<InvoiceList 
                    invoices={invoices} 
                    userProfile={userProfile} 
                    onView={handleViewInvoice} 
                    onEdit={handleEditInvoice} 
                    onDelete={handleDeleteInvoice} 
                    onMarkAsPaid={handleMarkAsPaid} 
                    onBulkDelete={handleBulkDelete}
                    onBulkMarkAsPaid={handleBulkMarkAsPaid}
                    onAddNew={() => handleSetCurrentView('new-invoice')}
                    isFreePlanLimitReached={isFreePlanLimitReached}
                    setCurrentView={handleSetCurrentView}
                />);
      case 'new-invoice':
      case 'edit-invoice':
        return <InvoiceForm 
            initialInvoice={invoiceToEdit} 
            onSave={handleSaveInvoice} 
            onCancel={() => setView('invoices')}
            userProfile={userProfile}
            customers={customers}
            invoices={invoices}
            isSaving={isSavingInvoice}
        />;
      case 'customers':
        return contentWrapper(<CustomerList
            customers={customers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onAddNew={() => handleSetCurrentView('new-customer')}
        />);
      case 'new-customer':
      case 'edit-customer':
        return contentWrapper(<CustomerForm
            initialCustomer={customerToEdit}
            onSave={handleSaveCustomer}
            onCancel={() => setView('customers')}
        />);
      case 'company-profile':
        return (
          <div className="h-full w-full flex items-center justify-center p-4">
             <CompanyProfile userProfile={userProfile} setUserProfile={setUserProfile} session={session} />
          </div>
        );
      case 'settings':
        return contentWrapper(<SettingsPage userProfile={userProfile} session={session} setCurrentView={handleSetCurrentView} />);
      case 'templates':
        return <Templates userProfile={userProfile} setUserProfile={setUserProfile} session={session} />;
      case 'upgrade':
        return contentWrapper(<UpgradePage setCurrentView={handleSetCurrentView} session={session} userProfile={userProfile} onUpgrade={handleUpgradeToPro} />);
      case 'help':
        return <HelpPage />;
      case 'checkout-success':
        return <CheckoutSuccessPage setCurrentView={handleSetCurrentView} />;
      default:
        return contentWrapper(<Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={handleViewInvoice} session={session} isFreePlanLimitReached={isFreePlanLimitReached} />);
    }
  };

  // Show fullscreen checkout-success page without sidebar
  if (view === 'checkout-success') {
    return <CheckoutSuccessPage setCurrentView={handleSetCurrentView} />;
  }

  if (!session) {
    // If we're waiting for OAuth callback, show loading instead of redirecting to landing
    if (waitingForOAuth) {
      return (
        <div className="flex items-center justify-center h-screen w-full">
          <div className="text-center">
            <p className="text-zinc-500 mb-2">Inloggen met Google...</p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mx-auto"></div>
          </div>
        </div>
      );
    }
    
    if (view === 'login' || view === 'signup') {
        return <AuthPage view={view} onSwitchView={setView} onBackToHome={() => setView('landing')} />
    }
    if (view === 'reset-password') {
        return <ResetPasswordPage onBackToLogin={() => setView('login')} />
    }
    
    const handleNavigateToLanding = (sectionId?: string) => {
        setView('landing');
        if (sectionId) {
            setTimeout(() => {
                const targetElement = document.getElementById(sectionId);
                if (targetElement) {
                    const headerOffset = 120;
                    const elementPosition = targetElement.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                }
            }, 100);
        }
    };
    
    if (view === 'privacy-policy') {
      return <PrivacyPolicyPage onNavigateToLanding={handleNavigateToLanding} />;
    }
    if (view === 'terms-and-conditions') {
        return <TermsAndConditionsPage onNavigateToLanding={handleNavigateToLanding} />;
    }
    if (view === 'contact') {
        return <ContactPage onNavigateToLanding={handleNavigateToLanding} />;
    }
    return <LandingPage onNavigate={setView} />;
  }

  const isNonScrollingView = view === 'new-invoice' || view === 'edit-invoice' || view === 'templates' || view === 'help';

  return (
    <div className="relative md:flex h-screen bg-gradient-to-br from-white to-slate-100 font-sans">
      {isSidebarOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30" 
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        ></div>
      )}

      <Sidebar 
        currentView={view} 
        setCurrentView={handleSetCurrentView} 
        onLogout={handleLogout} 
        session={session}
        userProfile={userProfile}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <div className="flex-1 flex flex-col w-full min-w-0">
          <MobileHeader onMenuClick={() => setIsSidebarOpen(true)} />
          <main
            className={`flex-1 ${
              isNonScrollingView
                ? 'overflow-y-hidden'
                : 'overflow-y-auto'
            }`}
          >
            {renderContent()}
          </main>
      </div>
      {selectedInvoice && (
        <InvoicePreviewSidebar
            invoice={selectedInvoice}
            userProfile={userProfile}
            onClose={() => setSelectedInvoice(null)}
            onEdit={handleEditInvoice}
            onDelete={handleDeleteInvoice}
            onMarkAsPaid={handleMarkAsPaid}
        />
      )}
    </div>
  );
};

export default App;
