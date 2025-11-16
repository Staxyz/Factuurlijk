import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { supabase } from '../supabaseClient';

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
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  const startRedirectCountdown = () => {
    let remainingTime = 10;
    setCountdown(remainingTime);

    const timer = setInterval(() => {
      remainingTime -= 1;
      setCountdown(remainingTime);

      if (remainingTime <= 0) {
        clearInterval(timer);
        console.log('🚀 Redirecting to dashboard...');
        setCurrentView('dashboard');
      }
    }, 1000);

    return () => clearInterval(timer);
  };

  useEffect(() => {
    let stopCountdown: (() => void) | undefined;

    const processCheckout = async () => {
      try {
        console.log('🔍 Starting checkout processing...');
        
        // Extract session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const hash = window.location.hash || '';
        const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
        const hashParams = new URLSearchParams(hashQuery);

        const sessionId =
          urlParams.get('session_id') ||
          hashParams.get('session_id');
        
        if (!sessionId) {
          console.error('❌ No session ID found in URL');
          throw new Error('Session ID niet gevonden. Kan betaling niet verifiëren.');
        }

        console.log('📝 Session ID extracted:', sessionId);

        const verifyPaymentWithRetry = async (attempt = 1, maxAttempts = 6): Promise<any> => {
          console.log(`🔄 Verifying payment (attempt ${attempt}/${maxAttempts})`);
          const response = await fetch('http://localhost:3001/api/verify-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
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
        setSessionStatus(verificationResult.status);
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
          const fallbackResponse = await fetch('http://localhost:3001/api/sync-plan', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
          });

          if (!fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(fallbackData.error || 'Betaling is geslaagd, maar account kon niet worden gesynchroniseerd. Neem contact op met support.');
          }

          console.log('✅ Server-side sync completed');
          setIsSuccess(true);
          setIsProcessing(false);
          if (onUpgradeSuccess) {
            await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
          }
          stopCountdown = startRedirectCountdown();
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
        setIsSuccess(true);
        if (onUpgradeSuccess) {
          await onUpgradeSuccess().catch(err => console.error('Error refreshing profile:', err));
        }
        setIsProcessing(false);

        stopCountdown = startRedirectCountdown();
      } catch (err) {
        console.error('❌ Checkout processing error:', err);
        setError(err instanceof Error ? err.message : 'Fout bij het verwerken van de betaling');
        setIsProcessing(false);
      }
    };

    processCheckout();
    return () => {
      if (stopCountdown) stopCountdown();
    };
  }, [setCurrentView, onUpgradeSuccess]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-slate-100">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Fout!</h1>
          <p className="text-red-600 mb-4">{error}</p>
          {sessionStatus && (
            <p className="text-sm text-red-500 mb-2">Session status: {sessionStatus}</p>
          )}
          {paymentStatus && (
            <p className="text-sm text-red-500 mb-4">Betaalstatus: {paymentStatus}</p>
          )}
          <button
            onClick={() => setCurrentView('upgrade')}
            className="bg-teal-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-teal-700 transition-colors"
          >
            Terug naar upgrade
          </button>
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
          <p className="text-zinc-600 text-sm">Je account is nu geupgrade naar Pro</p>
          <div className="mt-6 bg-white p-4 rounded-lg border border-green-200">
            <p className="text-teal-600 font-bold text-lg">Automatisch doorgestuurd naar dashboard...</p>
            <p className="text-teal-600 text-sm mt-2">Over {countdown} seconden</p>
          </div>
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

