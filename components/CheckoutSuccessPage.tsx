import React, { useEffect, useState } from 'react';
import type { View } from '../types';
import { supabase } from '../supabaseClient';

interface CheckoutSuccessPageProps {
  setCurrentView: (view: View) => void;
}

export const CheckoutSuccessPage: React.FC<CheckoutSuccessPageProps> = ({ setCurrentView }) => {
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const processCheckout = async () => {
      try {
        console.log('🔍 Starting checkout processing...');
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('❌ No user found');
          throw new Error('Not authenticated');
        }

        console.log('✅ User found:', user.id, user.email);

        // Update user profile to pro directly
        console.log('💾 Updating user profile to pro...');
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
        setError(err instanceof Error ? err.message : 'Failed to process payment');
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

