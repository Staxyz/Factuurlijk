import React, { useState } from 'react';
import type { View, UserProfile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface UpgradePageProps {
    setCurrentView: (view: View) => void;
    session: Session | null;
    userProfile: UserProfile;
    onUpgrade: () => void;
}

const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-teal-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
);


export const UpgradePage: React.FC<UpgradePageProps> = ({ setCurrentView, session, userProfile, onUpgrade }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const userName = session?.user?.user_metadata?.full_name || userProfile.name;
    const userEmail = session?.user?.email || userProfile.email;
    const isPro = userProfile.plan === 'pro';

    const handleCheckout = async () => {
        console.log('=== CHECKOUT STARTED ===');
        
        if (!userEmail) {
            console.error('❌ No email found');
            setError('Email address not found');
            return;
        }

        console.log('✅ Email:', userEmail);
        setIsLoading(true);
        setError(null);

        try {
            // Use Mollie Payment Link directly (no API call needed)
            // NEW PAYMENT LINK: erYCHDF3fXvq4zBJPVpTW
            const paymentLink = 'https://payment-links.mollie.com/payment/erYCHDF3fXvq4zBJPVpTW';
            
            // Verify the link is correct
            if (!paymentLink.includes('erYCHDF3fXvq4zBJPVpTW')) {
                console.error('❌ WRONG PAYMENT LINK DETECTED!', paymentLink);
                throw new Error('Incorrect payment link configuration');
            }
            
            console.log('✅ CORRECT PAYMENT LINK:', paymentLink);
            console.log('🔄 Redirecting to Mollie Payment Link:', paymentLink);
            
            // Store user info in sessionStorage for after payment return
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('factuurlijk:paymentSource', 'upgrade-page');
                sessionStorage.setItem('factuurlijk:paymentUserId', session?.user?.id || userProfile.id);
                sessionStorage.setItem('factuurlijk:paymentUserEmail', userEmail);
                sessionStorage.setItem('factuurlijk:paymentTimestamp', Date.now().toString());
            }
            
            // Redirect to Mollie Payment Link
            console.log('🚀 EXECUTING REDIRECT TO:', paymentLink);
            window.location.href = paymentLink;
            
        } catch (err) {
            console.error('❌ Mollie payment link redirect failed:', err);
            const errorMsg = err instanceof Error ? err.message : String(err);
            setError(errorMsg);
            setIsLoading(false);
        }
    };

    return (
        <div>
             <button onClick={() => setCurrentView('dashboard')} className="flex items-center text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors group mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1">
                    <line x1="19" y1="12" x2="5" y2="12"></line>
                    <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Terug naar dashboard
            </button>
            <div className="bg-stone-50 p-6 sm:p-8 rounded-lg border border-stone-200 max-w-5xl mx-auto text-center">
                <h1 className="text-3xl font-bold mb-4 text-zinc-900">Kies je abonnement</h1>
                <p className="text-zinc-600 mb-10 max-w-2xl mx-auto">
                    Upgrade naar Pro voor krachtige functies of blijf bij ons gratis abonnement.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Free Plan */}
                    <div className={`bg-white p-7 rounded-lg shadow-md relative text-left flex flex-col ${!isPro ? 'border-2 border-teal-500' : 'border border-stone-200'}`}>
                        {!isPro && <span className="absolute top-4 right-4 bg-teal-100 text-teal-700 text-xs font-bold uppercase px-3 py-1 rounded-full">Huidig Plan</span>}
                        <h2 className="text-xl font-bold text-zinc-800 mb-2">Free</h2>
                        <p className="text-3xl font-bold my-4 text-zinc-800">€0 <span className="text-sm font-normal text-zinc-500">/ maand</span></p>
                        <ul className="space-y-4 text-zinc-700 mb-10 flex-grow">
                            <li className="flex items-center"><CheckIcon /> 3 facturen in totaal</li>
                            <li className="flex items-center"><CheckIcon /> 5 klanten</li>
                            <li className="flex items-center"><CheckIcon /> Standaard templates</li>
                        </ul>
                        {!isPro && (
                            <div className="bg-stone-100 text-zinc-800 py-3 px-4 rounded-lg w-full text-center">
                                <p className="font-semibold text-zinc-800 truncate">{userName}</p>
                                <p className="text-sm text-zinc-600 truncate">{userEmail}</p>
                            </div>
                        )}
                    </div>

                    {/* Pro Plan */}
                    <div className={`bg-gradient-to-br from-teal-50 via-teal-50/50 to-white p-8 rounded-xl shadow-lg relative text-left flex flex-col transform transition-all hover:shadow-xl ${isPro ? 'border-2 border-teal-500 ring-2 ring-teal-200' : 'border-2 border-teal-400 ring-2 ring-teal-100'}`}>
                        {isPro ? (
                            <span className="absolute top-4 right-4 bg-teal-600 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-md">Huidig Plan</span>
                        ) : (
                            <span className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-bold uppercase px-3 py-1.5 rounded-full shadow-md animate-pulse">Meest gekozen</span>
                        )}
                        
                        <div className="mb-4">
                            <h2 className="text-2xl font-bold text-teal-700 mb-1">Pro</h2>
                            <p className="text-sm text-zinc-600">Voor de groeiende ondernemer</p>
                        </div>

                        <div className="text-center my-6 bg-white p-5 rounded-xl shadow-md border border-teal-100">
                            <p className="text-4xl font-bold text-teal-600 mb-1">
                                €39,50
                            </p>
                            <p className="text-sm text-teal-600 font-semibold">eenmalig</p>
                        </div>

                        <ul className="space-y-3.5 text-zinc-700 mb-8 flex-grow">
                            <li className="flex items-start">
                                <CheckIcon /> 
                                <span><strong className="text-zinc-900">Onbeperkt facturen & klanten</strong></span>
                            </li>
                            <li className="flex items-start">
                                <CheckIcon /> 
                                <span>Toegang tot alle templates & personalisatie</span>
                            </li>
                            <li className="flex items-start">
                                <CheckIcon /> 
                                <span>Uitgebreide rapportages en inzichten</span>
                            </li>
                            <li className="flex items-start">
                                <CheckIcon /> 
                                <span>Offertes maken en omzetten naar facturen</span>
                            </li>
                        </ul>
                        {isPro ? (
                            <div className="bg-stone-100 text-zinc-800 py-3 px-4 rounded-lg w-full text-center">
                                <p className="font-semibold text-zinc-800 truncate">{userName}</p>
                                <p className="text-sm text-zinc-600 truncate">{userEmail}</p>
                            </div>
                        ) : (
                            <>
                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                                        {error}
                                    </div>
                                )}
                                
                                <button 
                                    onClick={handleCheckout}
                                    disabled={isLoading}
                                    className="bg-gradient-to-r from-teal-600 to-teal-700 text-white font-bold py-3.5 px-8 rounded-lg hover:from-teal-700 hover:to-teal-800 transition-all w-full shadow-md hover:shadow-lg disabled:from-teal-400 disabled:to-teal-400 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    {isLoading ? 'Aan het laden...' : 'Upgrade naar Pro'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};