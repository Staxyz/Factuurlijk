import React, { useState } from 'react';
import type { View, UserProfile } from '../types';
import type { Session } from '@supabase/supabase-js';

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
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const userName = session?.user?.user_metadata?.full_name || userProfile.name;
    const userEmail = session?.user?.email || userProfile.email;
    const isPro = userProfile.plan === 'pro';

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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Free Plan */}
                    <div className={`bg-white p-8 rounded-lg shadow-md relative text-left flex flex-col ${!isPro ? 'border-2 border-teal-500' : 'border border-stone-200'}`}>
                        {!isPro && <span className="absolute top-4 right-4 bg-teal-100 text-teal-700 text-xs font-bold uppercase px-3 py-1 rounded-full">Huidig Plan</span>}
                        <h2 className="text-2xl font-bold text-zinc-800">Free</h2>
                        <p className="text-4xl font-bold my-4 text-zinc-800">€0 <span className="text-base font-normal text-zinc-500">/ maand</span></p>
                        <ul className="space-y-3 text-zinc-700 mb-8 flex-grow">
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
                    <div className={`bg-white p-8 rounded-lg shadow-md relative text-left flex flex-col ${isPro ? 'border-2 border-teal-500' : 'border border-stone-200'}`}>
                        {isPro && <span className="absolute top-4 right-4 bg-teal-100 text-teal-700 text-xs font-bold uppercase px-3 py-1 rounded-full">Huidig Plan</span>}
                        <h2 className="text-2xl font-bold text-teal-600">Pro</h2>
                        
                        <div className="flex justify-center my-4">
                            <div className="p-1 bg-stone-200 rounded-full flex items-center space-x-1">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 text-sm font-bold rounded-full transition-colors duration-300 ${billingCycle === 'monthly' ? 'bg-white text-teal-600 shadow' : 'text-zinc-600'}`}
                                >
                                    Maandelijks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-6 py-2 text-sm font-bold rounded-full transition-colors duration-300 ${billingCycle === 'yearly' ? 'bg-white text-teal-600 shadow' : 'text-zinc-600'}`}
                                >
                                    Jaarlijks
                                </button>
                            </div>
                        </div>

                        <div className="text-center">
                            <p className="text-4xl font-bold text-zinc-800">
                                {billingCycle === 'monthly' ? '€12,95' : '€10,79'}
                                <span className="text-base font-normal text-zinc-500"> / maand</span>
                            </p>
                            {billingCycle === 'yearly' && (
                                <p className="text-sm text-zinc-500 mt-1">
                                    €129,50 per jaar gefactureerd (bespaar 2 maanden)
                                </p>
                            )}
                        </div>

                        <ul className="space-y-3 text-zinc-700 my-8 flex-grow">
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
                             <button 
                                onClick={onUpgrade}
                                className="bg-teal-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-teal-700 transition-colors w-full shadow-sm"
                            >
                                Upgrade naar Pro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};