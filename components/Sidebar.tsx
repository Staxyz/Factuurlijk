import React from 'react';
import type { Session } from '@supabase/supabase-js';
import type { UserProfile, View } from '../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (view: View) => void;
  onLogout: () => void;
  session: Session | null;
  userProfile: UserProfile;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const NavLink: React.FC<{
  label: string;
  view: View;
  currentView: View;
  onClick: (view: View) => void;
  icon: React.ReactElement;
}> = ({ label, view, currentView, onClick, icon }) => {
  const isActive = currentView === view || 
    (view === 'invoices' && (currentView === 'new-invoice' || currentView === 'edit-invoice' || currentView === 'invoice-detail')) ||
    (view === 'customers' && (currentView === 'new-customer' || currentView === 'edit-customer'));
  return (
    <button
      onClick={() => onClick(view)}
      className={`flex items-center w-full py-3 text-base font-medium rounded-md transition-colors px-4 ${
        isActive
          ? 'bg-zinc-700 text-white'
          : 'text-stone-300 hover:bg-zinc-700 hover:text-white'
      }`}
    >
      <span className="mr-3">{icon}</span>
      {label}
    </button>
  );
};

const LogoIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
        <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
        <path d="M14 2V8H20" fill="#0d9488"/>
        <path d="M16 13H8V11H16V13Z" fill="white"/>
        <path d="M16 17H8V15H16V17Z" fill="white"/>
    </svg>
);

const icons = {
  dashboard: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  invoices: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>,
  customers: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>,
  'company-profile': <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>,
  settings: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  templates: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>,
  help: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>,
  logout: <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>,
};


export const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, onLogout, session, userProfile, isOpen, setIsOpen }) => {
  const userName = userProfile.name || session?.user?.user_metadata?.full_name;
  const userEmail = userProfile.email || session?.user?.email;
  const invoiceCreationCount = userProfile.invoice_creation_count ?? 0;

  const handleNavigate = (view: View) => {
    setCurrentView(view);
    setIsOpen(false);
  };

  return (
    <aside className={`flex-shrink-0 bg-gradient-to-b from-zinc-800 to-zinc-900 flex flex-col w-72 transition-transform duration-300 ease-in-out fixed inset-y-0 left-0 z-40 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="h-20 flex items-center justify-between border-b border-zinc-700 overflow-hidden px-4">
        <div className="flex items-center space-x-2">
            <LogoIcon />
            <span className="text-2xl font-bold text-white whitespace-nowrap">Factuurlijk</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="md:hidden p-2 text-stone-300 hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="p-4 space-y-2">
            <NavLink label="Dashboard" view="dashboard" currentView={currentView} onClick={handleNavigate} icon={icons.dashboard} />
            <NavLink label="Facturen" view="invoices" currentView={currentView} onClick={handleNavigate} icon={icons.invoices} />
            <NavLink label="Klanten" view="customers" currentView={currentView} onClick={handleNavigate} icon={icons.customers} />
            <NavLink label="Bedrijfsprofiel" view="company-profile" currentView={currentView} onClick={handleNavigate} icon={icons['company-profile']} />
            <NavLink label="Templates" view="templates" currentView={currentView} onClick={handleNavigate} icon={icons.templates} />
        </nav>
      </div>
      
      <div className="p-4">
        <button 
          onClick={() => handleNavigate('upgrade')}
          title="Account & Plan"
          className="w-full text-left p-3 rounded-lg transition-colors hover:bg-zinc-700 group"
        >
            <div>
              <div className={`text-sm font-bold ${userProfile.plan === 'pro' ? 'text-yellow-400' : 'text-violet-400'}`}>
                  {userProfile.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
              <p className="font-semibold text-base text-stone-100 mt-1 truncate">{userName}</p>
              <p className="text-sm text-stone-400 truncate">{userEmail}</p>
              {userProfile.plan === 'free' && (
                <div className="mt-2">
                    <p className="text-xs text-stone-400">
                        Facturen gemaakt: {invoiceCreationCount} / 3
                    </p>
                    <div className="w-full bg-zinc-600 rounded-full h-1.5 mt-1">
                        <div
                            className="bg-violet-400 h-1.5 rounded-full"
                            style={{ width: `${Math.min((invoiceCreationCount / 3) * 100, 100)}%` }}
                        ></div>
                    </div>
                </div>
              )}
            </div>
        </button>
      </div>

      <div className="p-4 border-t border-zinc-700 space-y-2">
        <NavLink label="Help" view="help" currentView={currentView} onClick={handleNavigate} icon={icons.help} />
        <NavLink label="Instellingen" view="settings" currentView={currentView} onClick={handleNavigate} icon={icons.settings} />
        <button
          onClick={onLogout}
          className="flex items-center w-full py-3 text-base font-medium rounded-md text-stone-300 hover:bg-zinc-700 hover:text-white px-4"
        >
          <span className="mr-3">{icons.logout}</span>
          Uitloggen
        </button>
      </div>
    </aside>
  );
};
