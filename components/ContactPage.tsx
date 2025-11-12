import React, { useState, useEffect } from 'react';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
            <path d="M14 2V8H20" fill="#0d9488"/>
            <path d="M16 13H8V11H16V13Z" fill="white"/>
            <path d="M16 17H8V15H16V17Z" fill="white"/>
        </svg>
        <span className="text-3xl font-bold text-zinc-800">Factuurlijk</span>
    </div>
);

const FooterLogo = () => (
    <div className="flex items-center space-x-2">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
            <path d="M14 2V8H20" fill="#0d9488"/>
            <path d="M16 13H8V11H16V13Z" fill="white"/>
            <path d="M16 17H8V15H16V17Z" fill="white"/>
        </svg>
        <span className="text-3xl font-bold text-white">Factuurlijk</span>
    </div>
);

interface ContactPageProps {
  onNavigateToLanding: (sectionId?: string) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigateToLanding }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const handleBackToLanding = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.hash.substring(1);
    onNavigateToLanding(targetId);
    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on page load
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  return (
    <div className="bg-white font-sans">
      <header className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-stone-200/80">
          <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-8">
            <a href="#" aria-label="Home" onClick={(e) => { e.preventDefault(); onNavigateToLanding(); }}><Logo /></a>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#hoe-het-werkt" onClick={handleBackToLanding} className="text-base font-medium text-zinc-600 hover:text-zinc-900">Hoe werkt het?</a>
              <a href="#tarieven" onClick={handleBackToLanding} className="text-base font-medium text-zinc-600 hover:text-zinc-900">Prijzen</a>
              <a href="#faq" onClick={handleBackToLanding} className="text-base font-medium text-zinc-600 hover:text-zinc-900">FAQ</a>
            </nav>
            <div className="hidden md:flex items-center">
               <button onClick={() => onNavigateToLanding()} className="text-base font-medium text-teal-600 hover:text-teal-800">Terug naar home</button>
            </div>
             <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="p-2 -mr-2 text-zinc-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm md:hidden" role="dialog" aria-modal="true">
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <a href="#" aria-label="Home" onClick={(e) => { e.preventDefault(); onNavigateToLanding(); setIsMenuOpen(false); }}><Logo /></a>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-zinc-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <nav className="mt-12 flex flex-col items-center space-y-8 text-center">
              <a href="#hoe-het-werkt" onClick={handleBackToLanding} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">Hoe werkt het?</a>
              <a href="#tarieven" onClick={handleBackToLanding} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">Prijzen</a>
              <a href="#faq" onClick={handleBackToLanding} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">FAQ</a>
            </nav>
          </div>
        </div>
      )}

      <main className="pt-32 pb-24 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 bg-white p-8 sm:p-12 rounded-lg shadow-md border border-stone-200">
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 text-center">Neem Contact Op</h1>
            <p className="text-lg text-zinc-600 text-center max-w-2xl mx-auto mb-10">
                We horen graag van je! Of je nu een vraag hebt over onze functies, een suggestie wilt doen, of hulp nodig hebt, ons team staat voor je klaar.
            </p>
            <div className="max-w-none text-zinc-700 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                        <h2 className="text-2xl font-bold text-zinc-800">Stuur ons een e-mail</h2>
                        <p className="mt-2">Voor algemene vragen, ondersteuning of feedback.</p>
                        <a href="mailto:support@factuurlijk.nl" className="mt-4 inline-block font-semibold text-teal-600 hover:text-teal-800">
                            support@factuurlijk.nl
                        </a>
                    </div>
                    <div className="bg-stone-50 p-6 rounded-lg border border-stone-200">
                        <h2 className="text-2xl font-bold text-zinc-800">Bel ons</h2>
                        <p className="mt-2">Voor dringende zaken zijn we telefonisch bereikbaar.</p>
                        <a href="tel:+31612345678" className="mt-4 inline-block font-semibold text-teal-600 hover:text-teal-800">
                            +31 6 123 456 78
                        </a>
                    </div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-zinc-800 text-center mt-8">Bedrijfsgegevens</h2>
                  <ul className="list-none p-0 text-center mt-4 space-y-1">
                      <li>Factuurlijk B.V.</li>
                      <li>Voorbeeldstraat 123</li>
                      <li>1011 AB Amsterdam</li>
                      <li>KvK: 12345678</li>
                  </ul>
                </div>
            </div>
        </div>
      </main>

      <footer className="bg-zinc-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
                <FooterLogo />
                <p className="mt-4 text-base text-zinc-400">Maak je complexe financiën eenvoudiger.</p>
            </div>
          </div>
          <div className="mt-12 border-t border-zinc-800 pt-8">
            <p className="text-base text-zinc-500 text-center">&copy; {new Date().getFullYear()} Factuurlijk. Alle rechten voorbehouden.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};