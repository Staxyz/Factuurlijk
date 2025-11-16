import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { supabase } from '../supabaseClient';

interface CheckoutSuccessPageProps {
  setCurrentView: (view: View) => void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ setCurrentView }) => {
  console.log('📄 CheckoutSuccessPage component mounted!');
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processCheckout = async () => {
      try {
        console.log('🔍 Starting checkout processing...');
        
        // Extract session ID from URL
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        
        if (!sessionId) {
          console.error('❌ No session ID found in URL');
          throw new Error('Session ID niet gevonden. Kan betaling niet verifiëren.');
        }

        console.log('📝 Session ID extracted:', sessionId);

        // STEP 1: Verify payment with backend
        console.log('🔄 Verifying payment with Stripe...');
        const verifyResponse = await fetch('http://localhost:3001/api/verify-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sessionId })
        });

        if (!verifyResponse.ok) {
          const errorData = await verifyResponse.json();
          console.error('❌ Verification failed:', errorData);
          throw new Error(`Betaling kon niet worden geverifieerd: ${errorData.message || 'Onbekende fout'}`);
        }

        const verificationResult = await verifyResponse.json();
        console.log('📊 Verification result:', verificationResult);

        // Check if payment status is complete
        if (verificationResult.status !== 'complete') {
          console.error('❌ Payment not completed. Status:', verificationResult.status);
          throw new Error(`Betaling niet voltooid. Status: ${verificationResult.payment_status}`);
        }

        console.log('✅ Payment verified successfully!');

        // STEP 2: Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ No user found');
          throw new Error('Gebruiker niet geverifieerd');
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
        setIsProcessing(false);

        // Start countdown for redirect
        let remainingTime = 3;
        const redirectTimer = setInterval(() => {
          remainingTime -= 1;
          setCountdown(remainingTime);
          
          if (remainingTime <= 0) {
            clearInterval(redirectTimer);
            console.log('🚀 Redirecting to dashboard...');
            setCurrentView('dashboard');
          }
        }, 1000);

        return () => clearInterval(redirectTimer);
      } catch (err) {
        console.error('❌ Checkout processing error:', err);
        setError(err instanceof Error ? err.message : 'Fout bij het verwerken van de betaling');
        setIsProcessing(false);
      }
    };

    processCheckout();
  }, [setCurrentView]);

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-white to-slate-100">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">⚠️ Fout!</h1>
          <p className="text-red-600 mb-6">{error}</p>
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
        <p className="text-zinc-500 text-sm mt-2">Je account wordt geupgrade naar Pro</p>
        <p className="text-teal-600 text-sm mt-4 font-medium">Even geduld...</p>
      </div>
    </div>
  );
};

