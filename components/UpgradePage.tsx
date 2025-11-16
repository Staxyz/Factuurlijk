import React, { useState } from 'react';
import type { View, UserProfile } from '../types';
import type { Session } from '@supabase/supabase-js';
import { initiateCheckout } from '../services/stripeService';

interface UpgradePageProps {
    setCurrentView: (view: View) => void;
    session: Session | null;
    userProfile: UserProfile;
    onUpgrade: () => void;
}

const CheckIcon: React.FC = () => (
    <svg className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
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
            const priceId = import.meta.env.VITE_STRIPE_PRICE_ID_ONETIME || 'price_1SU4uUCncGp3YgdwFxFeRvKo';
            
            console.log('✅ Price ID:', priceId);

            if (!priceId) {
                throw new Error('Stripe configuration missing');
            }

            const successUrl = `${window.location.origin}/#/checkout-success?session_id={CHECKOUT_SESSION_ID}`;
            const cancelUrl = `${window.location.origin}/#/upgrade`;

            console.log('✅ Calling initiateCheckout...');
            await initiateCheckout(priceId, userEmail, successUrl, cancelUrl, session?.user?.id || userProfile.id);
            console.log('✅ initiateCheckout completed - should be redirecting');
            
        } catch (err) {
            console.error('❌ Checkout failed:', err);
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
                    <div className={`bg-gradient-to-br from-teal-50 to-white p-7 rounded-lg shadow-md relative text-left flex flex-col ${isPro ? 'border-2 border-teal-500' : 'border-2 border-teal-400'}`}>
                        {isPro && <span className="absolute top-4 right-4 bg-teal-500 text-white text-xs font-bold uppercase px-3 py-1 rounded-full">Huidig Plan</span>}
                        
                        <h2 className="text-xl font-bold text-teal-600 mb-2">Pro</h2>

                        <div className="text-center my-4 bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-3xl font-bold text-teal-600">
                                €39,50
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 font-medium">eenmalig</p>
                        </div>

                        <ul className="space-y-3 text-zinc-700 my-6 flex-grow text-sm">
                            <li className="flex items-center"><CheckIcon /> <strong>Onbeperkt facturen & klanten</strong></li>
                            <li className="flex items-center"><CheckIcon /> Toegang tot alle templates & personalisatie</li>
                            <li className="flex items-center"><CheckIcon /> Uitgebreide rapportages en inzichten</li>
                            <li className="flex items-center"><CheckIcon /> Offertes maken en omzetten naar facturen</li>
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
                                    className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition-colors w-full shadow-sm disabled:bg-teal-400 disabled:cursor-not-allowed"
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