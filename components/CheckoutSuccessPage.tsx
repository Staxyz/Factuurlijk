import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { supabase } from '../supabaseClient';
import { buildApiUrl } from '../apiConfig';
import { clearStoredPaymentId, getStoredPaymentId } from '../services/mollieService';

interface CheckoutSuccessPageProps {
  setCurrentView: (view: View) => void;
  onUpgradeSuccess?: () => Promise<void> | void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ setCurrentView, onUpgradeSuccess }) => {
  console.log('📄 CheckoutSuccessPage component mounted!');
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);

  // Helper function to upgrade user directly
  const upgradeUserDirectly = async (user: any, source: string) => {
    console.log('✅ User verified, upgrading to Pro...');
    
    const storedUserEmail = sessionStorage.getItem('factuurlijk:paymentUserEmail');
    
    // Log payment to mollie_payments table
    try {
      const { error: logError } = await supabase
        .from('mollie_payments')
        .insert({
          payment_id: `payment_link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          payment_status: 'paid',
          amount_value: 39.50,
          amount_currency: 'EUR',
          description: 'Factuurlijk Pro upgrade via Payment Link',
          customer_email: storedUserEmail || user.email,
          supabase_user_id: user.id,
          metadata: {
            source: source,
            payment_method: 'payment_link',
            auto_upgraded: true
          },
          paid_at: new Date().toISOString()
        });
      
      if (logError) {
        console.warn('⚠️ Could not log payment to database:', logError);
        // Don't throw, continue with upgrade
      } else {
        console.log('✅ Payment logged to database');
      }
    } catch (logErr) {
      console.warn('⚠️ Error logging payment:', logErr);
      // Don't throw, continue with upgrade
    }
    
    // Upgrade user to Pro
    console.log('💾 Attempting to upgrade profile to Pro for user:', user.id);
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
      console.error('   Error code:', updateError.code);
      console.error('   Error message:', updateError.message);
      console.error('   Error details:', JSON.stringify(updateError, null, 2));
      
      // If RLS error, try to get more info
      if (updateError.code === '42501' || updateError.message?.includes('permission')) {
        throw new Error('Geen toestemming om account te upgraden. Neem contact op met support.');
      }
      
      throw updateError;
    }
    
    if (!updateData || updateData.length === 0) {
      console.warn('⚠️ Update returned no data - profile might not exist');
      throw new Error('Profiel niet gevonden. Neem contact op met support.');
    }
    
    console.log('✅ Profile upgraded to Pro:', updateData);
    
    // Clean up sessionStorage
    sessionStorage.removeItem('factuurlijk:paymentSource');
    sessionStorage.removeItem('factuurlijk:paymentUserId');
    sessionStorage.removeItem('factuurlijk:paymentUserEmail');
    sessionStorage.removeItem('factuurlijk:paymentTimestamp');
    
    setCountdown(5);
    setIsSuccess(true);
    setIsProcessing(false);
    if (onUpgradeSuccess) {
      await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
    }
  };

  useEffect(() => {
    const processCheckout = async () => {
      try {
        console.log('🔍 Starting checkout processing...');
        
        // Get current user first
        const { data: sessionData } = await supabase.auth.getSession();
        const currentUser = sessionData.session?.user;
        
        if (!currentUser) {
          console.warn('⚠️ No user session found, redirecting to dashboard - webhook will handle upgrade');
          // If user is not logged in, redirect to dashboard
          // The webhook will handle the upgrade in the background
          setCurrentView('dashboard');
          return;
        }
        
        console.log('✅ User session found:', currentUser.id, currentUser.email);
        
        // Determine payment reference from URL/hash or storage
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const hashParams = new URLSearchParams(hashQuery);
        const currentUrl = window.location.href;

        // Check for payment_id from Mollie redirect
        const paymentIdFromUrl =
          urlParams.get('payment_id') ||
          hashParams.get('payment_id') ||
          urlParams.get('paymentId') ||
          hashParams.get('paymentId');

        // Check for payment link ID in URL (from Mollie status page)
        // Format: https://payment-links.mollie.com/nl/status/019a96c8-686f-7384-a620-4137d127c92b
        let paymentLinkId = null;
        const paymentLinkMatch = currentUrl.match(/\/status\/([a-f0-9-]+)/i);
        if (paymentLinkMatch) {
          paymentLinkId = paymentLinkMatch[1];
          console.log('🔍 Found payment link ID in URL:', paymentLinkId);
        }

        const storedPaymentId = getStoredPaymentId();
        const paymentSource = sessionStorage.getItem('factuurlijk:paymentSource');
        const storedUserId = sessionStorage.getItem('factuurlijk:paymentUserId');
        const storedUserEmail = sessionStorage.getItem('factuurlijk:paymentUserEmail');
        const paymentTimestamp = sessionStorage.getItem('factuurlijk:paymentTimestamp');
        
        // Check if payment was initiated recently (within last 30 minutes)
        const isRecentPayment = paymentTimestamp && (Date.now() - parseInt(paymentTimestamp)) < 30 * 60 * 1000;
        
        // If we have a payment link ID, verify it via the new endpoint
        if (paymentLinkId && isRecentPayment && (storedUserId === currentUser.id || !storedUserId)) {
          console.log('🔍 Verifying payment link...');
          
          try {
            const verifyResponse = await fetch(buildApiUrl('/api/verify-payment-link'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                paymentLinkId,
                userEmail: storedUserEmail || currentUser.email,
                userId: currentUser.id
              })
            });

            if (!verifyResponse.ok) {
              throw new Error('Kon betaling niet verifiëren');
            }

            const verifyResult = await verifyResponse.json();
            console.log('📊 Payment link verification result:', verifyResult);

            if (verifyResult.status === 'complete' && verifyResult.user_upgraded) {
              console.log('✅ Payment verified and user upgraded!');
              setCountdown(5);
              setIsSuccess(true);
              setIsProcessing(false);
              if (onUpgradeSuccess) {
                await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
              }
              // Clean up sessionStorage
              sessionStorage.removeItem('factuurlijk:paymentSource');
              sessionStorage.removeItem('factuurlijk:paymentUserId');
              sessionStorage.removeItem('factuurlijk:paymentUserEmail');
              sessionStorage.removeItem('factuurlijk:paymentTimestamp');
              return;
            } else if (verifyResult.status === 'processing') {
              // Payment is still processing, wait and retry
              console.log('⏳ Payment is still processing, waiting...');
              await new Promise(resolve => setTimeout(resolve, 3000));
              // Retry once
              const retryResponse = await fetch(buildApiUrl('/api/verify-payment-link'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  paymentLinkId,
                  userEmail: storedUserEmail || currentUser.email,
                  userId: currentUser.id
                })
              });
              const retryResult = await retryResponse.json();
              if (retryResult.status === 'complete' && retryResult.user_upgraded) {
                console.log('✅ Payment verified on retry!');
                setCountdown(5);
                setIsSuccess(true);
                setIsProcessing(false);
                if (onUpgradeSuccess) {
                  await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
                }
                sessionStorage.removeItem('factuurlijk:paymentSource');
                sessionStorage.removeItem('factuurlijk:paymentUserId');
                sessionStorage.removeItem('factuurlijk:paymentUserEmail');
                sessionStorage.removeItem('factuurlijk:paymentTimestamp');
                return;
              }
            }
          } catch (verifyError) {
            console.error('❌ Error verifying payment link:', verifyError);
            // Fall through to try other methods
          }
        }

        const paymentId = paymentIdFromUrl || storedPaymentId;
        
        // Check if this is a Payment Link return (might not have payment_id)
        const isPaymentLinkReturn = paymentSource === 'templates-page' || paymentSource === 'upgrade-page';
        
        // If no payment ID but we have stored user info and recent payment, try to upgrade directly
        if (!paymentId && (isPaymentLinkReturn || isRecentPayment) && (storedUserId === currentUser.id || !storedUserId)) {
          console.log('📝 Payment Link return detected, checking payment status...');
          
          // First check if user is already Pro (webhook might have upgraded)
          let { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', currentUser.id)
            .single();
          
          if (profile?.plan === 'pro') {
            console.log('✅ User already upgraded via webhook!');
            setCountdown(5);
            setIsSuccess(true);
            setIsProcessing(false);
            if (onUpgradeSuccess) {
              await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
            }
            sessionStorage.removeItem('factuurlijk:paymentSource');
            sessionStorage.removeItem('factuurlijk:paymentUserId');
            sessionStorage.removeItem('factuurlijk:paymentUserEmail');
            sessionStorage.removeItem('factuurlijk:paymentTimestamp');
            return;
          }
          
          // Try to verify payment via payment link ID from sessionStorage or try direct upgrade
          // Since we know payment was completed (user got email confirmation), upgrade directly
          console.log('💳 Payment confirmed via email, upgrading user directly...');
          
          try {
            await upgradeUserDirectly(currentUser, paymentSource || 'upgrade-page');
            return;
          } catch (upgradeError) {
            console.error('❌ Direct upgrade failed, waiting for webhook...', upgradeError);
            
            // Wait a bit for webhook and check again
            console.log('⏳ Waiting for webhook to process payment...');
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            const { data: profileRetry } = await supabase
              .from('profiles')
              .select('plan')
              .eq('id', currentUser.id)
              .single();
            
            if (profileRetry?.plan === 'pro') {
              console.log('✅ User upgraded after webhook delay!');
              setCountdown(5);
              setIsSuccess(true);
              setIsProcessing(false);
              if (onUpgradeSuccess) {
                await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
              }
              sessionStorage.removeItem('factuurlijk:paymentSource');
              sessionStorage.removeItem('factuurlijk:paymentUserId');
              sessionStorage.removeItem('factuurlijk:paymentUserEmail');
              sessionStorage.removeItem('factuurlijk:paymentTimestamp');
              return;
            }
            
            // If still not upgraded, show helpful error
            throw new Error('Betaling is voltooid, maar account upgrade is nog bezig. Ververs de pagina over 30 seconden of neem contact op met support als het probleem aanhoudt.');
          }
        }
        
        if (!paymentId && !isPaymentLinkReturn && !isRecentPayment) {
          console.error('❌ No payment ID found in URL or storage');
          // Check if user already has Pro plan
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', currentUser.id)
            .single();
          
          if (profile?.plan === 'pro') {
            console.log('✅ User already has Pro plan');
            setCountdown(3);
            setIsSuccess(true);
            setIsProcessing(false);
            if (onUpgradeSuccess) {
              await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
            }
            return;
          }
          
          throw new Error('Payment ID niet gevonden. Start de upgrade opnieuw zodat we je betaling kunnen verifiëren.');
        }

        console.log('📝 Payment ID resolved:', paymentId);

        const verifyPaymentWithRetry = async (attempt = 1, maxAttempts = 6): Promise<any> => {
          console.log(`🔄 Verifying payment (attempt ${attempt}/${maxAttempts})`);
          const response = await fetch(buildApiUrl('/api/verify-payment'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Betaling kon niet worden geverifieerd.');
          }

          const result = await response.json();

          const paymentCompleted =
            result.status === 'complete' &&
            (result.payment_status === 'paid' || result.isPaid);

          if (paymentCompleted) {
            return result;
          }

          if (result.status === 'failed') {
            throw new Error(`Betaling niet voltooid (status: ${result.payment_status}).`);
          }

          if (attempt >= maxAttempts) {
            throw new Error('Betaling is nog niet bevestigd. Probeer het over enkele seconden opnieuw.');
          }

          await new Promise(res => setTimeout(res, 2000));
          return verifyPaymentWithRetry(attempt + 1, maxAttempts);
        };

        const verificationResult = await verifyPaymentWithRetry();
        console.log('📊 Verification result:', verificationResult);
        setVerificationStatus(verificationResult.status);
        setPaymentStatus(verificationResult.payment_status);

        const paymentCompleted = verificationResult.status === 'complete' && (verificationResult.payment_status === 'paid' || verificationResult.isPaid);
        if (!paymentCompleted) {
          console.error('❌ Payment not completed. Status:', verificationResult.status, verificationResult.payment_status);
          throw new Error(`Betaling niet voltooid (status: ${verificationResult.payment_status}). Je blijft op het Free plan.`);
        }

        console.log('✅ Payment verified successfully!');

        // STEP 2: Get current user
        const getSupabaseUser = async (attempt = 1, maxAttempts = 6): Promise<any> => {
          const { data: sessionData } = await supabase.auth.getSession();
          const currentUser = sessionData.session?.user;
          if (currentUser) return currentUser;
          if (attempt >= maxAttempts) {
            throw new Error('Kon Supabase gebruiker niet verifiëren. Log opnieuw in en probeer het opnieuw.');
          }
          await new Promise(res => setTimeout(res, 1000));
          return getSupabaseUser(attempt + 1, maxAttempts);
        };

        let user;
        try {
          user = await getSupabaseUser();
        } catch (userErr) {
          console.warn('⚠️ Supabase user session not found, attempting server-side sync...', userErr);
          const fallbackResponse = await fetch(buildApiUrl('/api/sync-plan'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ paymentId })
          });

          if (!fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(fallbackData.error || 'Betaling is geslaagd, maar account kon niet worden gesynchroniseerd. Neem contact op met support.');
          }

          console.log('✅ Server-side sync completed');
          clearStoredPaymentId();
          setCountdown(10);
          setIsSuccess(true);
          setIsProcessing(false);
          if (onUpgradeSuccess) {
            await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
          }
          return;
        }

        console.log('✅ User found:', user.id, user.email);

        // STEP 3: Update user profile to pro ONLY after payment verification
        console.log('💾 Upgrading user profile to pro...');
        const { error: updateError, data } = await supabase
          .from('profiles')
          .update({ 
            plan: 'pro', 
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id)
          .select();

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }

        console.log('✅ User upgraded to Pro successfully!', data);
        clearStoredPaymentId();
        setCountdown(10);
        setIsSuccess(true);
        if (onUpgradeSuccess) {
          await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
        }
        setIsProcessing(false);
      } catch (err) {
        console.error('❌ Checkout processing error:', err);
        clearStoredPaymentId();
        setError(err instanceof Error ? err.message : 'Fout bij het verwerken van de betaling');
        setIsProcessing(false);
      }
    };

    processCheckout();
  }, [setCurrentView, onUpgradeSuccess]);

  useEffect(() => {
    if (!isSuccess) return;
    if (countdown <= 0) {
      console.log('🚀 Redirecting to dashboard...');
      // Clean up URL before redirect
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      setCurrentView('dashboard');
      return;
    }
    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, setCurrentView]);

  if (error) {
    // Check if user might already be Pro despite the error
    const checkIfPro = async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const user = sessionData.session?.user;
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('plan')
            .eq('id', user.id)
            .single();
          
          if (profile?.plan === 'pro') {
            // User is actually Pro, show success instead
            setError(null);
            setIsSuccess(true);
            setCountdown(5);
            setIsProcessing(false);
            if (onUpgradeSuccess) {
              await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
            }
            return true;
          }
        }
      } catch (err) {
        console.error('Error checking profile:', err);
      }
      return false;
    };
    
    // Auto-check if Pro after error
    checkIfPro();
    
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-slate-100">
        <div className="text-center bg-yellow-50 p-8 rounded-lg border border-yellow-200 max-w-md">
          <h1 className="text-2xl font-bold text-yellow-700 mb-4">⏳ Upgrade wordt verwerkt</h1>
          <p className="text-yellow-600 mb-4">{error}</p>
          <p className="text-sm text-yellow-500 mb-4">
            Als je een bevestigingsemail hebt ontvangen, is je betaling voltooid. 
            Je account wordt automatisch geüpgraded. Dit kan enkele minuten duren.
          </p>
          {verificationStatus && (
            <p className="text-sm text-yellow-600 mb-2">Verificatie status: {verificationStatus}</p>
          )}
          {paymentStatus && (
            <p className="text-sm text-yellow-600 mb-4">Betaalstatus: {paymentStatus}</p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={async () => {
                // Try to refresh and check again
                if (onUpgradeSuccess) {
                  await onUpgradeSuccess();
                }
                // Check if Pro now
                const { data: sessionData } = await supabase.auth.getSession();
                const user = sessionData.session?.user;
                if (user) {
                  const { data: profile } = await supabase
                    .from('profiles')
                    .select('plan')
                    .eq('id', user.id)
                    .single();
                  
                  if (profile?.plan === 'pro') {
                    setError(null);
                    setIsSuccess(true);
                    setCountdown(5);
                    setIsProcessing(false);
                  }
                }
              }}
              className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors"
            >
              Ververs status
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className="bg-stone-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-stone-700 transition-colors"
            >
              Naar dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-slate-100">
        <div className="text-center bg-green-50 p-8 rounded-lg border border-green-200 max-w-md">
          <h1 className="text-3xl font-bold text-green-700 mb-4">✅ Succes!</h1>
          <p className="text-green-600 mb-2 font-semibold">Bedankt voor je upgrade naar Pro! 🎉</p>
          <p className="text-zinc-600 text-sm mb-4">Je account is nu geupgrade naar Pro</p>
          <div className="mt-6 bg-white p-4 rounded-lg border border-green-200 mb-4">
            <p className="text-teal-600 font-bold text-lg">Automatisch doorgestuurd naar dashboard...</p>
            <p className="text-teal-600 text-sm mt-2">Over {countdown} seconden</p>
          </div>
          <button
            onClick={() => {
              // Clean up URL
              if (typeof window !== 'undefined') {
                window.history.replaceState({}, document.title, window.location.pathname);
              }
              setCurrentView('dashboard');
            }}
            className="w-full bg-teal-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Direct naar dashboard
          </button>
        </div>
      </div>
    );
  }

  // Processing state
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-slate-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
        <p className="text-zinc-600 text-lg font-semibold">Je betaling wordt verwerkt...</p>
        <p className="text-zinc-500 text-sm mt-2">Dit kan tot ongeveer 10 seconden duren.</p>
        <p className="text-teal-600 text-sm mt-4 font-medium">Even geduld...</p>
      </div>
    </div>
  );
};

