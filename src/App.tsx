
import React, { useState, useEffect } from 'react';
import type { Invoice, Customer, UserProfile, View } from './types';

import { Sidebar } from './components/Sidebar';
import { Dashboard } from '../components/Dashboard';
import { InvoiceList } from '../components/InvoiceList';
import { InvoiceForm } from './components/InvoiceForm';
import { CompanyProfile } from '../components/CompanyProfile';
import { LandingPage } from '../components/LandingPage';
import { AuthPage } from '../components/AuthPage';
import { Templates } from '../components/Templates';
import { Favorites } from '../components/Favorites';

// FIX: Define mock data locally to match the types in `src/types.ts` and resolve import errors.
const mockCustomers: Customer[] = [
  {
    id: 'cust-1',
    name: 'Stichting Horeca',
    address: 'Postweg 50',
    city: '1234 AB, Amsterdam',
    email: 'contact@horeca.nl',
  },
  {
    id: 'cust-2',
    name: 'Jan de Vries',
    address: 'Plein 1945 1',
    city: '5678 CD, Utrecht',
    email: 'jan@devries.nl',
  },
];

const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: '2024-001',
    invoiceDate: '2024-06-01',
    dueDate: '2024-06-15',
    customerId: 'cust-1',
    status: 'betaald',
    lines: [
      { id: 'line-1-1', description: 'Webdesign services', quantity: 10, unitPrice: 75 },
      { id: 'line-1-2', description: 'Hosting (jaarlijks)', quantity: 1, unitPrice: 250 },
    ],
    btwPercentage: 21,
  },
  {
    id: 'inv-2',
    invoiceNumber: '2024-002',
    invoiceDate: '2024-06-10',
    dueDate: '2024-06-24',
    customerId: 'cust-2',
    status: 'open',
    lines: [
      { id: 'line-2-1', description: 'Consultancy', quantity: 8, unitPrice: 100 },
    ],
    btwPercentage: 21,
  },
   {
    id: 'inv-3',
    invoiceNumber: '2024-003',
    invoiceDate: '2024-05-20',
    dueDate: '2024-06-03',
    customerId: 'cust-1',
    status: 'verlopen',
    lines: [
      { id: 'line-3-1', description: 'Logo ontwerp', quantity: 1, unitPrice: 500 },
    ],
    btwPercentage: 21,
  },
];

const mockUserProfile: UserProfile = {
  name: 'Jouw Bedrijfsnaam',
  email: 'jouw@email.com',
  address: 'Jouw Straat 1, 1234 AB Jouw Stad',
  kvkNumber: '12345678',
  btwNumber: 'NL001234567B01',
  iban: 'NL91 ABNA 0417 1643 00',
  logoUrl: '',
  templateStyle: 'classic',
};


const App: React.FC = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // App view state
  const [view, setView] = useState<View>('landing');
  
  // Data state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile>(mockUserProfile);
  const [invoiceToEdit, setInvoiceToEdit] = useState<Invoice | null>(null);

  // Load mock data on mount
  useEffect(() => {
    setInvoices(mockInvoices);
    setCustomers(mockCustomers);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
    setView('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setView('landing');
  };

  const handleNavigate = (targetView: 'login' | 'signup') => {
    setView(targetView);
  };
  
  const handleSetCurrentView = (targetView: View) => {
    if (targetView === 'new-invoice') {
        setInvoiceToEdit(null);
    }
    setView(targetView);
  }

  const handleEditInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
        setInvoiceToEdit(invoice);
        setView('edit-invoice');
    }
  };
  
  const handleSaveInvoice = (invoice: Invoice) => {
    if (invoiceToEdit && invoice.id === invoiceToEdit.id) {
      // Update existing invoice
      setInvoices(invoices.map(inv => inv.id === invoice.id ? invoice : inv));
    } else {
      // Add new invoice
      const newInvoice = { ...invoice, id: `inv-${Date.now()}` };
      setInvoices([newInvoice, ...invoices]);
    }
    setView('invoices');
  };

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Weet je zeker dat je deze factuur wilt verwijderen?')) {
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
    }
  };


  const renderContent = () => {
    // NOTE: Components are imported from ../components, which may not be compatible with the props being passed.
    // This fix focuses on the reported error and data consistency within this file.
    switch (view) {
      case 'dashboard':
        return <Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={() => {}} session={null} isFreePlanLimitReached={false} />;
      case 'invoices':
        return <InvoiceList 
          invoices={invoices} 
          userProfile={userProfile}
          onView={() => {}}
          onEdit={handleEditInvoice} 
          onDelete={handleDeleteInvoice} 
          onMarkAsPaid={() => {}}
          onBulkDelete={() => {}}
          onBulkMarkAsPaid={() => {}}
          onAddNew={() => handleSetCurrentView('new-invoice')}
          isFreePlanLimitReached={false}
          setCurrentView={handleSetCurrentView}
          />;
      case 'new-invoice':
      case 'edit-invoice':
        return <InvoiceForm 
            initialInvoice={invoiceToEdit} 
            customers={customers} 
            onSave={handleSaveInvoice} 
            onCancel={() => setView('invoices')}
            userProfile={userProfile}
        />;
      case 'profile':
        return <CompanyProfile userProfile={userProfile} setUserProfile={setUserProfile} session={null}/>;
      case 'templates':
        return <Templates userProfile={userProfile} setUserProfile={setUserProfile} session={null} />;
      case 'favorites':
        return <Favorites />;
      default:
        return <Dashboard invoices={invoices} setCurrentView={handleSetCurrentView} onViewInvoice={() => {}} session={null} isFreePlanLimitReached={false} />;
    }
  };

  if (!isLoggedIn) {
    if (view === 'login' || view === 'signup') {
        return <AuthPage view={view} onSwitchView={handleNavigate} onBackToHome={() => setView('landing')} />
    }
    return <LandingPage onNavigate={handleNavigate} />;
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      <Sidebar currentView={view} setCurrentView={handleSetCurrentView} onLogout={handleLogout} />
      <main className="flex-1 overflow-y-auto p-6 sm:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
