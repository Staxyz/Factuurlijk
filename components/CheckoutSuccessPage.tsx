import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { supabase } from '../supabaseClient';

interface CheckoutSuccessPageProps {
  setCurrentView: (view: View) => void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ setCurrentView }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const processCheckout = async () => {
      try {
        // Get the session_id from URL query parameters (works with hash-based routing)
        const urlParams = new URLSearchParams(window.location.search);
        let sessionId = urlParams.get('session_id');
        
        // If not found in search, check hash
        if (!sessionId && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(window.location.hash.indexOf('?')));
          sessionId = hashParams.get('session_id');
        }
        
        if (!sessionId) {
          throw new Error('No session ID found');
        }

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not authenticated');
        }

        // Call Supabase function to verify payment and upgrade user
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        if (!response.ok) {
          throw new Error('Failed to verify payment');
        }

        // Update user profile to pro
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ plan: 'pro', updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (updateError) {
          throw updateError;
        }

        // Redirect to dashboard immediately after successful upgrade
        setCurrentView('dashboard');
      } catch (err) {
        console.error('Checkout processing error:', err);
        setError(err instanceof Error ? err.message : 'Failed to process payment');
        setIsProcessing(false);
      }
    };

    processCheckout();
  }, [setCurrentView]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 text-lg">Je betaling wordt verwerkt...</p>
          <p className="text-zinc-500 text-sm mt-2">Je wordt zo doorgestuurd naar je dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center bg-red-50 p-8 rounded-lg border border-red-200 max-w-md">
          <h1 className="text-2xl font-bold text-red-700 mb-4">Oeps!</h1>
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

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center bg-green-50 p-8 rounded-lg border border-green-200 max-w-md">
        <h1 className="text-2xl font-bold text-green-700 mb-4">✓ Betaling geslaagd!</h1>
        <p className="text-green-600 mb-4">Dank je wel voor je upgrade naar Pro!</p>
        <p className="text-zinc-600">Je wordt zo doorgestuurd naar je dashboard...</p>
      </div>
    </div>
  );
};

