import React, { useMemo, useEffect, useState } from 'react';
import type { Invoice, View } from '../types';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';

interface DashboardProps {
  invoices: Invoice[];
  setCurrentView: (view: View) => void;
  onViewInvoice: (invoiceId: string) => void;
  session: Session | null;
  isFreePlanLimitReached: boolean;
  onRefresh?: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getStatusChip = (status: 'betaald' | 'open' | 'verlopen') => {
    switch (status) {
        case 'betaald':
            return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-green-800 bg-green-100 rounded-full">Betaald</span>;
        case 'open':
            return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Open</span>;
        case 'verlopen':
            return <span className="inline-flex items-center px-2.5 py-0.5 text-xs font-medium text-red-800 bg-red-100 rounded-full">Verlopen</span>;
    }
};


export const Dashboard: React.FC<DashboardProps> = ({ invoices, setCurrentView, onViewInvoice, session, isFreePlanLimitReached, onRefresh }) => {
  const userName = session?.user?.user_metadata?.full_name?.split(' ')[0] || session?.user?.email;
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [hasCheckedPayment, setHasCheckedPayment] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  // Fetch current plan on mount and when session changes
  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!session?.user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();
        
        if (!error && profile) {
          setCurrentPlan(profile.plan || 'free');
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      }
    };

    fetchCurrentPlan();
  }, [session]);

  // Check if user is already Pro (but don't auto-upgrade - that's handled by webhook)
  useEffect(() => {
    if (!session?.user || hasCheckedPayment) return;

    const checkPlan = async () => {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', session.user.id)
          .single();
        
        if (profileError) {
          console.error('❌ Error fetching profile:', profileError);
          return;
        }
        
        if (profile?.plan === 'pro') {
          setCurrentPlan('pro');
          // Clean up old sessionStorage if user is already Pro
          sessionStorage.removeItem('factuurlijk:paymentSource');
          sessionStorage.removeItem('factuurlijk:paymentUserId');
          sessionStorage.removeItem('factuurlijk:paymentUserEmail');
          sessionStorage.removeItem('factuurlijk:paymentTimestamp');
        }
      } catch (error) {
        console.error('❌ Error checking plan:', error);
      } finally {
        setHasCheckedPayment(true);
      }
    };

    checkPlan();
  }, [session, hasCheckedPayment]);

  const calculateTotal = (invoice: Invoice) => {
    const subtotal = invoice.lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    return subtotal * (1 + invoice.btw_percentage / 100);
  };

  const openInvoices = invoices.filter(inv => inv.status === 'open' || inv.status === 'verlopen');
  const totalOpenAmount = openInvoices.reduce((acc, inv) => acc + calculateTotal(inv), 0);

  const revenueThisMonth = invoices
    .filter(inv => {
        const invoiceDate = new Date(inv.invoice_date);
        const today = new Date();
        return inv.status === 'betaald' &&
               invoiceDate.getMonth() === today.getMonth() &&
               invoiceDate.getFullYear() === today.getFullYear();
    })
    .reduce((acc, inv) => acc + calculateTotal(inv), 0);

  const recentInvoices = invoices.slice(0, 5);

  const handleNewInvoiceClick = () => {
    if (isFreePlanLimitReached) {
        alert('Je hebt je limiet van 3 facturen bereikt. Upgrade naar Pro om onbeperkt facturen te maken.');
        setCurrentView('upgrade');
    } else {
        setCurrentView('new-invoice');
    }
  };


  return (
    <div>
      {/* Payment Success Notification */}
      {showPaymentSuccess && (
        <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 sm:p-6 shadow-lg animate-in fade-in slide-in-from-top-2">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-500">
                <svg className="h-6 w-6 sm:h-8 sm:w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-xl sm:text-2xl font-bold text-green-800 mb-2">
                🎉 Betaling voltooid!
              </h3>
              <p className="text-base sm:text-lg text-green-700 mb-3 font-semibold">
                Je account is succesvol geupgrade naar <strong className="text-green-900">Pro</strong>!
              </p>
              <div className="bg-white/60 rounded-lg p-3 mb-3">
                <p className="text-sm sm:text-base text-green-800 font-medium mb-2">Je hebt nu toegang tot:</p>
                <ul className="list-disc list-inside text-sm sm:text-base text-green-700 space-y-1">
                  <li>Onbeperkt facturen maken</li>
                  <li>Onbeperkt klanten toevoegen</li>
                  <li>Alle templates & personalisatie opties</li>
                  <li>Uitgebreide rapportages en inzichten</li>
                </ul>
              </div>
              <p className="text-xs sm:text-sm text-green-600 italic">
                Deze melding verdwijnt automatisch over 15 seconden.
              </p>
            </div>
            <button
              onClick={() => setShowPaymentSuccess(false)}
              className="flex-shrink-0 ml-4 text-green-600 hover:text-green-800 transition-colors"
              aria-label="Sluit melding"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Dashboard</h1>
            {userName && <p className="text-lg sm:text-xl text-zinc-600 mt-1 sm:mt-2">Welkom, {userName}</p>}
        </div>
        <button onClick={handleNewInvoiceClick} className="flex items-center justify-center bg-teal-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm w-full sm:w-auto">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Nieuwe Factuur
        </button>
      </div>
      
      {/* Statistics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Card 1: Omzet deze maand */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-green-100 text-green-600 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                  </div>
                  <div className="text-right">
                      <h2 className="text-sm sm:text-base font-medium text-zinc-500">Omzet deze maand</h2>
                      <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(revenueThisMonth)}</p>
                  </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-3 sm:mt-4">&nbsp;</p>
          </div>

          {/* Card 2: Openstaand Bedrag */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
            <div className="flex-grow">
               <div className="flex items-start justify-between">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-yellow-100 text-yellow-600 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  </div>
                  <div className="text-right">
                      <h2 className="text-sm sm:text-base font-medium text-zinc-500">Openstaand Bedrag</h2>
                      <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{formatCurrency(totalOpenAmount)}</p>
                  </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-3 sm:mt-4">{openInvoices.length > 0 ? `in ${openInvoices.length} ${openInvoices.length === 1 ? 'factuur' : 'facturen'}` : '\u00A0'}</p>
          </div>

          {/* Card 3: Aantal Openstaand */}
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1 sm:col-span-2 md:col-span-1">
            <div className="flex-grow">
              <div className="flex items-start justify-between">
                  <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                  </div>
                  <div className="text-right">
                      <h2 className="text-sm sm:text-base font-medium text-zinc-500">Aantal Openstaand</h2>
                      <p className="text-xl sm:text-2xl font-bold text-zinc-900 mt-1">{openInvoices.length}</p>
                  </div>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-3 sm:mt-4">{openInvoices.length > 0 ? `${openInvoices.length === 1 ? '1 factuur staat open' : `${openInvoices.length} facturen staan open`}` : '\u00A0'}</p>
          </div>
        </div>
      
       {/* Recent Invoices - Mobile Card View / Desktop Table View */}
       <div className="bg-white p-4 sm:p-6 rounded-lg border border-stone-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-zinc-800">Recente Facturen</h2>
            <button onClick={() => setCurrentView('invoices')} className="text-sm font-medium text-teal-600 hover:text-teal-800">
                Bekijk alles
            </button>
        </div>
        
        {/* Mobile Card View */}
        <div className="block sm:hidden space-y-3">
            {recentInvoices.length > 0 ? recentInvoices.map(invoice => (
                <div 
                    key={invoice.id} 
                    className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 cursor-pointer transition-colors"
                    onClick={() => onViewInvoice(invoice.id)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="font-semibold text-zinc-800">{invoice.invoice_number}</p>
                            <p className="text-sm text-zinc-600 mt-1">{invoice.customer.name}</p>
                        </div>
                        {getStatusChip(invoice.status)}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-stone-100">
                        <p className="text-xs text-zinc-500">{formatDate(invoice.invoice_date)}</p>
                        <p className="font-semibold text-zinc-800">{formatCurrency(calculateTotal(invoice))}</p>
                    </div>
                </div>
            )) : (
                <div className="text-center py-10 text-zinc-500">
                    Nog geen facturen gemaakt.
                </div>
            )}
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left">
                <thead>
                    <tr className="border-b border-stone-200">
                        <th className="p-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider">Factuur ID</th>
                        <th className="p-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider">Klant</th>
                        <th className="p-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider">Datum</th>
                        <th className="p-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider text-right">Totaal</th>
                        <th className="p-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider text-center">Status</th>
                    </tr>
                </thead>
                <tbody>
                    {recentInvoices.length > 0 ? recentInvoices.map(invoice => (
                        <tr key={invoice.id} className="border-b border-stone-100 hover:bg-stone-100 cursor-pointer" onClick={() => onViewInvoice(invoice.id)}>
                            <td className="p-3 text-base font-medium text-zinc-800">{invoice.invoice_number}</td>
                            <td className="p-3 text-base text-zinc-600 truncate max-w-xs">{invoice.customer.name}</td>
                            <td className="p-3 text-base text-zinc-600">{formatDate(invoice.invoice_date)}</td>
                            <td className="p-3 text-base font-medium text-zinc-800 text-right">{formatCurrency(calculateTotal(invoice))}</td>
                            <td className="p-3 text-center">{getStatusChip(invoice.status)}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan={5} className="text-center py-10 text-zinc-500">
                                Nog geen facturen gemaakt.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};
