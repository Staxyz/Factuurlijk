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
import { OnboardingTour } from './components/OnboardingTour';

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
  // Authentication state
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [waitingForOAuth, setWaitingForOAuth] = useState(false); // Track if we're waiting for OAuth callback

  // App view state
  const [view, setView] = useState<View>('dashboard'); // Will be overwritten by auth check
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCheckoutRoute, setIsCheckoutRoute] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('checkout-success');
  });
  const isCheckoutRouteRef = useRef(isCheckoutRoute);
  const userNavigatedRef = useRef(false); // Track if user manually navigated
  useEffect(() => {
    isCheckoutRouteRef.current = isCheckoutRoute;
  }, [isCheckoutRoute]);

  // Prevent hash routing from interfering with normal navigation
  // Removed this useEffect as it was causing issues - hash cleanup is now handled in handleSetCurrentView
  
  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);
  const isSavingRef = useRef(false); // Ref for synchronous check to prevent race conditions
  const hasCompletedInitialFetch = useRef(false);

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
  const fetchData = useCallback(async (user: User, options?: { forceLoader?: boolean }) => {
    const shouldShowLoader = options?.forceLoader || !hasCompletedInitialFetch.current;
    if (shouldShowLoader) {
      setLoading(true);
    }
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
      
      // Check and update expired invoices
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
      
      const invoices = invoicesResult.data || [];
      const expiredInvoiceIds: string[] = [];
      
      // Find invoices that should be marked as expired
      for (const invoice of invoices) {
        if (invoice.status === 'open' && invoice.due_date) {
          const dueDate = new Date(invoice.due_date);
          dueDate.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
          
          // If due date is in the past, mark as expired
          if (dueDate < today) {
            expiredInvoiceIds.push(invoice.id);
          }
        }
      }
      
      // Update expired invoices in database
      if (expiredInvoiceIds.length > 0) {
        console.log(`Updating ${expiredInvoiceIds.length} invoice(s) to expired status`);
        const { error: updateError } = await supabase
          .from('invoices')
          .update({ status: 'verlopen' as const })
          .in('id', expiredInvoiceIds);
        
        if (updateError) {
          console.error('Error updating expired invoices:', updateError);
          // Don't throw - continue with loading invoices even if update fails
        } else {
          // Update local invoice data to reflect the status change
          invoices.forEach(invoice => {
            if (expiredInvoiceIds.includes(invoice.id)) {
              invoice.status = 'verlopen';
            }
          });
        }
      }
      
      setInvoices(invoices);

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
      if (shouldShowLoader) {
        setLoading(false);
      }
      hasCompletedInitialFetch.current = true;
    }
  }, [createUserProfile]);

  // Central function to check and upgrade users returning from checkout
  const checkAndUpgradeFromCheckout = useCallback(async (user: any) => {
    try {
      console.log('🔍 Checking for checkout return and upgrade...');
      
      // Check if there's a recent payment (within last 30 minutes)
      const paymentTimestamp = sessionStorage.getItem('factuurlijk:paymentTimestamp');
      const paymentSource = sessionStorage.getItem('factuurlijk:paymentSource');
      const storedUserId = sessionStorage.getItem('factuurlijk:paymentUserId');
      const storedUserEmail = sessionStorage.getItem('factuurlijk:paymentUserEmail');
      
      if (!paymentTimestamp || !paymentSource) {
        console.log('   No payment info in sessionStorage');
        return; // No payment info, nothing to do
      }
      
      const timeSincePayment = Date.now() - parseInt(paymentTimestamp);
      const isRecent = timeSincePayment < 30 * 60 * 1000; // 30 minutes
      
      console.log('   Payment timestamp:', new Date(parseInt(paymentTimestamp)).toISOString());
      console.log('   Time since payment:', Math.round(timeSincePayment / 1000 / 60), 'minutes');
      console.log('   Is recent:', isRecent);
      
      if (!isRecent) {
        console.log('   Payment too old, cleaning up');
        // Payment too old, clean up
        sessionStorage.removeItem('factuurlijk:paymentSource');
        sessionStorage.removeItem('factuurlijk:paymentUserId');
        sessionStorage.removeItem('factuurlijk:paymentUserEmail');
        sessionStorage.removeItem('factuurlijk:paymentTimestamp');
        return;
      }
      
      // Check if user ID matches (or no stored user ID, meaning it's for current user)
      if (storedUserId && storedUserId !== user.id) {
        console.log('   Payment was for different user, skipping');
        return; // Payment was for different user
      }
      
      // Check current plan
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Error fetching profile for upgrade check:', profileError);
        return;
      }
      
      // If already Pro, clean up and return
      if (profile?.plan === 'pro') {
        console.log('✅ User already Pro, cleaning up payment info');
        sessionStorage.removeItem('factuurlijk:paymentSource');
        sessionStorage.removeItem('factuurlijk:paymentUserId');
        sessionStorage.removeItem('factuurlijk:paymentUserEmail');
        sessionStorage.removeItem('factuurlijk:paymentTimestamp');
        return;
      }
      
      // User is not Pro yet, upgrade them
      console.log('✅ Recent payment detected, upgrading user to Pro...');
      console.log('   Payment source:', paymentSource);
      console.log('   User email:', storedUserEmail || user.email);
      
      // Log payment to mollie_payments table
      try {
        const paymentLogResult = await supabase.from('mollie_payments').insert({
          payment_id: `payment_link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_status: 'paid',
          amount_value: 39.50,
          amount_currency: 'EUR',
          description: 'Factuurlijk Pro upgrade via Payment Link',
          customer_email: storedUserEmail || user.email,
          supabase_user_id: user.id,
          metadata: {
            source: paymentSource,
            payment_method: 'payment_link',
            auto_upgraded_on_checkout_return: true,
            upgraded_at: new Date().toISOString()
          },
          paid_at: new Date().toISOString()
        });
        
        if (paymentLogResult.error) {
          console.warn('⚠️ Error logging payment to mollie_payments:', paymentLogResult.error);
        } else {
          console.log('✅ Payment logged to mollie_payments table');
        }
      } catch (logErr) {
        console.warn('⚠️ Error logging payment:', logErr);
        // Don't throw, continue with upgrade
      }
      
      // Upgrade user to Pro
      console.log('💾 Upgrading profile to Pro...');
      const { error: updateError, data: updateData } = await supabase
        .from('profiles')
        .update({ 
          plan: 'pro', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id)
        .select();
      
      if (updateError) {
        console.error('❌ Error upgrading profile:', updateError);
        return;
      }
      
      if (updateData && updateData.length > 0) {
        console.log('✅ User upgraded to Pro successfully!', updateData);
        
        // Clean up sessionStorage
        sessionStorage.removeItem('factuurlijk:paymentSource');
        sessionStorage.removeItem('factuurlijk:paymentUserId');
        sessionStorage.removeItem('factuurlijk:paymentUserEmail');
        sessionStorage.removeItem('factuurlijk:paymentTimestamp');
        
        // Refresh user data
        await fetchData(user);
      } else {
        console.warn('⚠️ Update returned no data');
      }
    } catch (error) {
      console.error('❌ Error in checkAndUpgradeFromCheckout:', error);
    }
  }, [fetchData]);

  // Basic hash-based routing for checkout success (and other hash routes)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHashRoute = () => {
      const hash = window.location.hash || '';
      const normalized = hash.toLowerCase();
      const isCheckoutHash = normalized.includes('checkout-success');
      const isDashboardHash = normalized.includes('dashboard') || normalized === '#/' || normalized === '';
      setIsCheckoutRoute(isCheckoutHash);

      // Check for checkout return and upgrade if user is logged in
      if ((isCheckoutHash || isDashboardHash) && session?.user) {
        console.log('🔍 Checkout return detected, checking for upgrade...');
        checkAndUpgradeFromCheckout(session.user);
      }

      // Only override view if there's a relevant hash in the URL
      // Don't interfere with normal navigation
      if (isCheckoutHash) {
        console.log('🔗 Hash route detected: checkout-success', hash);
        setView('checkout-success');
        return;
      }

      if (normalized.includes('upgrade') && normalized.includes('#/')) {
        console.log('🔗 Hash route detected: upgrade');
        setView('upgrade');
        return;
      }
      
      // If hash is empty or doesn't match known routes, don't change view
      // This allows normal navigation to work
    };

    // Only run on mount if there's a relevant hash
    const hash = window.location.hash || '';
    if (hash.includes('checkout-success') || (hash.includes('upgrade') && hash.includes('#/'))) {
      handleHashRoute();
    }
    
    window.addEventListener('hashchange', handleHashRoute);
    return () => window.removeEventListener('hashchange', handleHashRoute);
  }, [session, checkAndUpgradeFromCheckout]);

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

    // Handle OAuth callback
    if (error && !type) {
      console.error('OAuth error:', error, errorDescription);
      alert(`OAuth fout: ${errorDescription || error}`);
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }

    if (accessToken && !type) {
      console.log('✅ OAuth callback detected, session will be set by Supabase');
      // Set flag to indicate we're waiting for OAuth session
      setWaitingForOAuth(true);
      setView('dashboard');
      
      // Clean up the URL hash/query AFTER setting the view
      // This ensures the view is set before the URL is cleaned
      const cleanUrl = () => {
        const cleanPath = window.location.pathname || '/';
        window.history.replaceState({}, document.title, cleanPath);
        console.log('🧹 URL cleaned, path:', cleanPath);
      };
      
      // Wait for the session to be set by Supabase
      // The onAuthStateChange listener will clear the flag when session is ready
      const checkSession = async () => {
        let attempts = 0;
        const maxAttempts = 20; // Increased attempts for slower connections
        while (attempts < maxAttempts) {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            console.log('✅ OAuth session confirmed, user:', currentSession.user?.email);
            setWaitingForOAuth(false);
            setView('dashboard');
            cleanUrl();
            return;
          }
          attempts++;
          await new Promise(resolve => setTimeout(resolve, 300));
        }
        // If session not found after retries, clear the flag anyway
        // The onAuthStateChange listener will handle it
        console.log('⚠️ OAuth session not found after retries, clearing wait flag');
        setWaitingForOAuth(false);
        cleanUrl();
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
      console.log('🔄 Auth state changed:', event, session?.user?.email, 'Current view:', view, 'User navigated:', userNavigatedRef.current);
      setSession(session);

      if (session) {
        setWaitingForOAuth(false);

        if (isCheckoutRouteRef.current) {
          console.log('⏸ Checkout success route active - skipping automatic dashboard redirect');
        } else {
          // Only redirect to dashboard on actual sign in, and ONLY if user hasn't manually navigated
          // This prevents overriding user navigation to other pages
          if (event === 'SIGNED_IN' && !userNavigatedRef.current) {
            console.log('✅ User signed in, redirecting to dashboard (current view:', view, ')');
            setView('dashboard');
            if (window.location.hash.includes('access_token') || window.location.search.includes('access_token')) {
              window.history.replaceState({}, document.title, window.location.pathname || '/');
              console.log('🧹 Cleaned OAuth params from URL');
            }
          } else {
            console.log('🟡 Auth event', event, '- NOT changing view, keeping:', view, '(user navigated:', userNavigatedRef.current, ')');
          }
          // Don't change view on TOKEN_REFRESHED or other events - let user stay on current page
        }
      } else {
        setWaitingForOAuth(false);
        userNavigatedRef.current = false; // Reset on logout

        if (isCheckoutRouteRef.current) {
          console.log('⚠️ Checkout success route active without session - keeping current view');
        } else if (event === 'SIGNED_OUT') {
          // Only redirect to landing on explicit sign out
          console.log('🔴 User signed out, redirecting to landing');
          setView('landing');
        }

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
        // Check for checkout return and upgrade if needed
        checkAndUpgradeFromCheckout(session.user);
    } else {
        setLoading(false);
    }
  }, [session, fetchData, checkAndUpgradeFromCheckout]);

  // Clean up old sessionStorage if user is already Pro (upgrades are handled by webhook only)
  useEffect(() => {
    if (!session?.user) return;

    const checkPlan = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('plan')
        .eq('id', session.user.id)
        .single();
      
      if (profile?.plan === 'pro') {
        // Already Pro, clean up old sessionStorage
        sessionStorage.removeItem('factuurlijk:paymentSource');
        sessionStorage.removeItem('factuurlijk:paymentUserId');
        sessionStorage.removeItem('factuurlijk:paymentUserEmail');
        sessionStorage.removeItem('factuurlijk:paymentTimestamp');
      }
    };

    const timer = setTimeout(() => {
      checkPlan();
    }, 1000);

    return () => clearTimeout(timer);
  }, [session]);


  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
        const message = getErrorMessage(error, 'Fout bij het uitloggen.');
        alert(`Er is een fout opgetreden bij het uitloggen: ${message}`);
    }
    // The onAuthStateChange listener handles state/view changes.
  };
  
  const handleSetCurrentView = (targetView: View) => {
    console.log('🔵 handleSetCurrentView called with:', targetView);
    userNavigatedRef.current = true; // Mark that user manually navigated
    if (targetView === 'new-invoice') setInvoiceToEdit(null);
    if (targetView === 'new-customer') setCustomerToEdit(null);
    // Clear any hash that might interfere BEFORE setting the view
    if (window.location.hash && !window.location.hash.includes('checkout-success') && !window.location.hash.includes('upgrade')) {
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
    }
    console.log('🔵 Setting view to:', targetView);
    setView(targetView);
    setIsSidebarOpen(false); // Close sidebar on navigation
  };

  const clearCheckoutRoute = () => {
    if (typeof window !== 'undefined' && window.location.hash.includes('checkout-success')) {
      const cleanPath = window.location.pathname + window.location.search;
      window.history.replaceState({}, document.title, cleanPath || '/');
      console.log('🧹 Cleared checkout-success hash from URL');
    }
    setIsCheckoutRoute(false);
  };

  const handleCheckoutNavigation = (targetView: View) => {
    if (targetView !== 'checkout-success') {
      clearCheckoutRoute();
    }
    handleSetCurrentView(targetView);
  };

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
        
        // Check if invoice should be marked as expired
        if (invoice.status === 'open' && invoice.due_date) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const dueDate = new Date(invoice.due_date);
          dueDate.setHours(0, 0, 0, 0);
          
          // If due date is in the past, automatically set status to expired
          if (dueDate < today) {
            invoice.status = 'verlopen';
          }
        }
        
        // The check for the free plan limit now relies on the userProfile state,
        // which is fetched after every save. This is reliable.
        if (!isUpdate && userProfile.plan === 'free' && (userProfile.invoice_creation_count ?? 0) >= 3) {
            alert('Je hebt je limiet van 3 facturen bereikt. Upgrade naar Pro om onbeperkt facturen te maken.');
            setView('upgrade');
            return;
        }
        
        // Remove recurring fields if they don't exist in the database schema
        const { is_recurring, recurring_template_id, recurring_interval, recurring_start_date, recurring_end_date, ...invoiceData } = invoice;
        const invoiceToSave = { ...invoiceData, user_id: session.user.id };
        
        const { error: upsertError } = await supabase.from('invoices').upsert(invoiceToSave);
        if (upsertError) throw upsertError;

        // The increment is now handled by a database trigger.
        // No RPC call is needed from the client anymore. This is the correct state.
        
        // Mark invoice onboarding as completed when a new invoice is created
        if (!isUpdate && session?.user) {
          try {
            await supabase
              .from('profiles')
              .update({
                onboarding_invoice_completed: true,
                updated_at: new Date().toISOString()
              })
              .eq('id', session.user.id);
          } catch (error) {
            console.error('Error updating invoice onboarding status:', error);
          }
        }
        
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

  const handleMarkAsOpen = async (invoiceId: string) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').update({ status: 'open' as const }).eq('id', invoiceId);
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

  const handleBulkMarkAsOpen = async (invoiceIds: string[]) => {
    if (!session?.user) return;
    try {
        const { error } = await supabase.from('invoices').update({ status: 'open' as const }).in('id', invoiceIds);
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
    
    const contentWrapper = (children: React.ReactNode) => <div className="p-4 sm:p-6 md:p-8">{children}</div>;
    const isFreePlanLimitReached = (userProfile.plan === 'free' && (userProfile.invoice_creation_count ?? 0) >= 3);
    
    switch (view) {
      case 'dashboard':
        return contentWrapper(<Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={handleViewInvoice} session={session} isFreePlanLimitReached={isFreePlanLimitReached} onRefresh={() => session?.user && fetchData(session.user)} />);
      case 'invoices':
        return contentWrapper(<InvoiceList 
                    invoices={invoices} 
                    userProfile={userProfile} 
                    onView={handleViewInvoice} 
                    onEdit={handleEditInvoice} 
                    onDelete={handleDeleteInvoice} 
                    onMarkAsPaid={handleMarkAsPaid}
                    onMarkAsOpen={handleMarkAsOpen}
                    onBulkDelete={handleBulkDelete}
                    onBulkMarkAsPaid={handleBulkMarkAsPaid}
                    onBulkMarkAsOpen={handleBulkMarkAsOpen}
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
        return (
          <div className="h-full w-full overflow-hidden">
            <Templates userProfile={userProfile} setUserProfile={setUserProfile} session={session} />
          </div>
        );
      case 'upgrade':
        return contentWrapper(<UpgradePage setCurrentView={handleSetCurrentView} session={session} userProfile={userProfile} onUpgrade={handleUpgradeToPro} />);
      case 'help':
        return <HelpPage />;
      case 'checkout-success':
        return (
          <CheckoutSuccessPage
            setCurrentView={handleCheckoutNavigation}
            onUpgradeSuccess={async () => {
              if (session?.user) {
                await fetchData(session.user);
              }
            }}
          />
        );
      default:
        return contentWrapper(<Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={handleViewInvoice} session={session} isFreePlanLimitReached={isFreePlanLimitReached} onRefresh={() => session?.user && fetchData(session.user)} />);
    }
  };

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
    
    if (view === 'checkout-success') {
      return <CheckoutSuccessPage setCurrentView={handleCheckoutNavigation} />;
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
                : 'overflow-y-scroll scrollbar-hide'
            }`}
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
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
            onMarkAsOpen={handleMarkAsOpen}
        />
      )}
      {session && (
        <OnboardingTour
          userProfile={userProfile}
          session={session}
          invoicesCount={invoices.length}
          onComplete={async () => {
            // Refresh user profile when onboarding is completed
            if (session?.user) {
              await fetchData(session.user);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
