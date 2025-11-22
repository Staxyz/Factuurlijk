import React, { useState, useEffect } from 'react';
import { View } from '../types';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg width="32" height="32" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="landingLogoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
            </defs>
            <path d="M16 3H7C5.89543 3 5 3.89543 5 5V23C5 24.1046 5.89543 25 7 25H21C22.1046 25 23 24.1046 23 23V10L16 3Z" fill="url(#landingLogoGradient)"/>
            <path d="M16 3V10H23" fill="#0d9488" opacity="0.7"/>
            <rect x="9" y="13" width="10" height="1.5" rx="0.75" fill="white"/>
            <rect x="9" y="17" width="10" height="1.5" rx="0.75" fill="white"/>
        </svg>
        <span className="text-3xl font-bold text-zinc-800">Factuurlijk</span>
    </div>
);

const FooterLogo = () => (
    <div className="flex items-center space-x-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
            <path d="M14 2V8H20" fill="#0d9488"/>
            <path d="M16 13H8V11H16V13Z" fill="white"/>
            <path d="M16 17H8V15H16V17Z" fill="white"/>
        </svg>
        <span className="text-3xl font-bold text-white">Factuurlijk</span>
    </div>
);

const ArrowRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-2">
        <line x1="5" y1="12" x2="19" y2="12"></line>
        <polyline points="12 5 19 12 12 19"></polyline>
    </svg>
);

const CheckCircleIcon = ({ className = '' }) => (
    <div className={`flex-shrink-0 ${className}`}>
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm4.3,7.61-4.57,6a1,1,0,0,1-.79.39h0a1,1,0,0,1-.79-.38l-2.44-3.21a1,1,0,0,1,1.58-1.2l1.65,2.15,3.78-5a1,1,0,1,1,1.57,1.2Z" />
        </svg>
    </div>
);

const StarIcon = ({ className = 'w-5 h-5 text-yellow-400' } : { className?: string }) => (
    <svg className={className} fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
);


interface LandingPageProps {
  onNavigate: (view: View) => void;
}

const faqs = [
    {
        question: "Is Factuurlijk echt gratis?",
        answer: "Ja, het basispakket is volledig gratis. Hiermee kun je tot 3 facturen per maand sturen. Ideaal voor startende ondernemers die de kosten laag willen houden."
    },
    {
        question: "Voor wie is Factuurlijk bedoeld?",
        answer: "Factuurlijk is ontworpen voor ZZP'ers, freelancers en kleine MKB-bedrijven in Nederland die een eenvoudige, snelle en professionele manier zoeken om facturen te maken en te beheren."
    },
    {
        question: "Zijn mijn gegevens veilig?",
        answer: "Absoluut. We gebruiken de nieuwste beveiligingstechnologieën en slaan je data veilig op in de cloud. Jouw privacy en de veiligheid van je bedrijfsgegevens zijn onze hoogste prioriteit."
    },
    {
        question: "Kan ik mijn abonnement op elk moment opzeggen?",
        answer: "Jazeker. Je zit nergens aan vast. Je kunt je Pro-abonnement op elk gewenst moment opzeggen of downgraden naar het gratis pakket, zonder gedoe."
    }
];

const FaqItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void; }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-stone-200">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center py-5 text-left"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-medium text-zinc-800">{question}</span>
                <span className="ml-6 flex-shrink-0">
                    {isOpen ? (
                        <svg className="h-6 w-6 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 12H6" /></svg>
                    ) : (
                        <svg className="h-6 w-6 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    )}
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-screen pb-5' : 'max-h-0'}`}>
                <p className="text-zinc-600 pr-12">{answer}</p>
            </div>
        </div>
    );
};

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isMenuOpen]);

  const handleFaqToggle = (index: number) => {
    setOpenFaqIndex(prevIndex => (prevIndex === index ? null : index));
  };

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetId = e.currentTarget.hash.substring(1);
    const targetElement = document.getElementById(targetId);
    
    if (targetElement) {
        const headerOffset = 120; // Estimated header height + extra space
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
        });
    }

    if (isMenuOpen) {
      setIsMenuOpen(false);
    }
  };
    
  return (
    <div className="bg-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto bg-white/70 backdrop-blur-lg rounded-2xl shadow-lg border border-stone-200/80">
          <div className="flex items-center justify-between h-16 sm:h-20 px-4 sm:px-8">
            <a href="#" aria-label="Home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Logo /></a>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#hoe-het-werkt" onClick={handleScrollTo} className="text-base font-medium text-zinc-600 hover:text-zinc-900">Hoe werkt het?</a>
              <a href="#tarieven" onClick={handleScrollTo} className="text-base font-medium text-zinc-600 hover:text-zinc-900">Prijzen</a>
              <a href="#faq" onClick={handleScrollTo} className="text-base font-medium text-zinc-600 hover:text-zinc-900">FAQ</a>
            </nav>
            <div className="hidden md:flex items-center space-x-4">
               <button onClick={() => onNavigate('login')} className="text-base font-medium text-zinc-600 hover:text-zinc-900">Inloggen</button>
              <button onClick={() => onNavigate('signup')} className="flex items-center bg-zinc-900 text-white px-6 py-3 rounded-full text-base font-medium hover:bg-zinc-700 transition-colors">
                Registreren
              </button>
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(true)} aria-label="Open menu" className="p-2 -mr-2 text-zinc-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm md:hidden" role="dialog" aria-modal="true">
          <div className="px-4 pt-4">
            <div className="flex items-center justify-between">
              <a href="#" aria-label="Home" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); setIsMenuOpen(false); }}><Logo /></a>
              <button onClick={() => setIsMenuOpen(false)} aria-label="Close menu" className="p-2 -mr-2 text-zinc-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <nav className="mt-12 flex flex-col items-center space-y-8 text-center">
              <a href="#hoe-het-werkt" onClick={handleScrollTo} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">Hoe werkt het?</a>
              <a href="#tarieven" onClick={handleScrollTo} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">Prijzen</a>
              <a href="#faq" onClick={handleScrollTo} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">FAQ</a>
              <hr className="w-24 border-stone-200" />
              <button onClick={() => { setIsMenuOpen(false); onNavigate('login'); }} className="text-xl font-medium text-zinc-600 hover:text-zinc-900">Inloggen</button>
              <button onClick={() => { setIsMenuOpen(false); onNavigate('signup'); }} className="flex items-center bg-zinc-900 text-white px-8 py-3 rounded-full text-lg font-medium hover:bg-zinc-700 transition-colors w-full justify-center">
                Registreren
              </button>
            </nav>
          </div>
        </div>
      )}

      <main>
        {/* Hero Section */}
        <section className="relative min-h-screen flex items-center bg-gradient-to-b from-slate-50 to-white pt-48 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full" aria-hidden="true">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-teal-100 rounded-full filter blur-3xl opacity-40 animate-blob"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-cyan-100 rounded-full filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>
                </div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10 pb-20 md:pb-40">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    {/* Left: Text Content */}
                    <div className="text-center md:text-left">
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-semibold bg-teal-100 text-teal-800">
                          Voor ZZP'ers & MKB
                        </span>
                        <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tighter text-zinc-900">
                          Professionele Facturen, <span className="block text-teal-600">Simpel & Snel.</span>
                        </h1>
                        <p className="mt-6 max-w-lg mx-auto md:mx-0 text-lg sm:text-xl text-zinc-600">
                          Factuurlijk is dé tool voor ondernemers in Nederland. Maak, beheer en verstuur facturen die voldoen aan alle eisen, zonder het gedoe.
                        </p>
                        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                          <button onClick={() => onNavigate('signup')} className="flex items-center justify-center bg-teal-600 text-white px-8 py-3 rounded-full font-bold text-base hover:bg-teal-700 transition-transform hover:scale-105 w-full sm:w-auto">
                            Start gratis
                            <ArrowRight />
                          </button>
                        </div>
                    </div>
                    
                    {/* Right: Visual Element */}
                    <div className="hidden md:flex justify-center">
                        <div className="bg-white/50 backdrop-blur-lg p-6 rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full transform transition-transform hover:scale-105 duration-500">
                            {/* START of new detailed invoice */}
                            <div className="flex justify-between items-start pb-4 border-b border-stone-200">
                                <div>
                                    <h3 className="font-bold text-zinc-800">Jouw Bedrijfsnaam</h3>
                                    <p className="text-xs text-zinc-500">Voorbeeldstraat 1<br/>1234 AB Amsterdam</p>
                                </div>
                                <h2 className="text-xl font-bold text-teal-600">FACTUUR</h2>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4 text-xs">
                                <div>
                                    <p className="font-semibold text-zinc-600">AAN</p>
                                    <p className="text-zinc-800 font-medium">Stichting Horeca</p>
                                    <p className="text-zinc-500">Postweg 50<br/>1234 AB, Amsterdam</p>
                                </div>
                                <div className="text-right">
                                    <p><span className="font-semibold text-zinc-600">Factuurnr:</span> 2025-001</p>
                                    <p><span className="font-semibold text-zinc-600">Datum:</span> 01-06-2025</p>
                                    <p><span className="font-semibold text-zinc-600">Vervaldatum:</span> 15-06-2025</p>
                                </div>
                            </div>

                            <div className="mt-6">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="bg-slate-50 rounded-t-lg">
                                            <th className="p-2 font-semibold text-zinc-600 rounded-tl-lg">Omschrijving</th>
                                            <th className="p-2 text-right font-semibold text-zinc-600">Aantal</th>
                                            <th className="p-2 text-right font-semibold text-zinc-600 rounded-tr-lg">Totaal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-2">Webdesign services</td>
                                            <td className="p-2 text-right">1</td>
                                            <td className="p-2 text-right">€ 750,00</td>
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-2">Hosting (jaarlijks)</td>
                                            <td className="p-2 text-right">1</td>
                                            <td className="p-2 text-right">€ 250,00</td>
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-2">Logo ontwerp</td>
                                            <td className="p-2 text-right">1</td>
                                            <td className="p-2 text-right">€ 500,00</td>
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-2">Consultancy (4 uur)</td>
                                            <td className="p-2 text-right">4</td>
                                            <td className="p-2 text-right">€ 300,00</td>
                                        </tr>
                                        <tr className="border-b border-stone-100">
                                            <td className="p-2">Onderhoudscontract (Q3)</td>
                                            <td className="p-2 text-right">1</td>
                                            <td className="p-2 text-right">€ 450,00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end mt-4">
                                <div className="w-full sm:w-1/2 text-xs">
                                    <div className="flex justify-between py-1">
                                        <span className="text-zinc-600">Subtotaal</span>
                                        <span className="font-medium text-zinc-800">€ 2.250,00</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-zinc-600">BTW (21%)</span>
                                        <span className="font-medium text-zinc-800">€ 472,50</span>
                                    </div>
                                    <div className="flex justify-between mt-2 pt-2 border-t border-zinc-300">
                                        <span className="font-bold text-base text-zinc-800">Totaal</span>
                                        <span className="font-bold text-base text-zinc-800">€ 2.722,50</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-6 flex justify-center">
                                <span className="inline-flex items-center px-4 py-1.5 text-sm font-bold text-green-800 bg-green-100 rounded-full ring-4 ring-green-50">
                                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                                    BETAALD
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Wave Divider */}
            <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-[0]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none" className="relative block w-full h-[150px] sm:h-[200px] lg:h-[250px]">
                    <path fill="#ffffff" fillOpacity="1" d="M0,224L120,213.3C240,203,480,181,720,186.7C960,192,1200,224,1320,240L1440,256L1440,320L1320,320C1200,320,960,320,720,320C480,320,240,320,120,320L0,320Z"></path>
                </svg>
            </div>
        </section>
        
        {/* How it works */}
        <section id="hoe-het-werkt" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center">
                    <h2 className="text-base font-semibold text-teal-600 uppercase tracking-wide">Hoe het werkt</h2>
                    <p className="mt-2 text-3xl font-extrabold text-zinc-900 tracking-tight sm:text-4xl">Factureren in 3 simpele stappen</p>
                </div>
                <div className="mt-20 grid md:grid-cols-3 gap-x-8 gap-y-16 text-center">
                    <div className="relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl font-bold text-teal-500">1</span>
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-800 pt-16">Kies je template</h3>
                        <p className="mt-2 text-zinc-600">Start met een professioneel ontworpen template. Voeg je logo toe en pas de kleuren aan.</p>
                    </div>
                    <div className="relative">
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl font-bold text-teal-500">2</span>
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-800 pt-16">Voeg je gegevens toe</h3>
                        <p className="mt-2 text-zinc-600">Vul de klantgegevens en factuurregels in. Alle bedragen worden automatisch berekend.</p>
                    </div>
                    <div className="relative">
                         <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center">
                            <span className="text-4xl font-bold text-teal-500">3</span>
                        </div>
                        <h3 className="text-xl font-semibold text-zinc-800 pt-16">Download de PDF</h3>
                        <p className="mt-2 text-zinc-600">Genereer met één klik een PDF, klaar om te versturen naar je klant. Geen gedoe met Word of Excel.</p>
                    </div>
                </div>
            </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 bg-stone-50 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-full" aria-hidden="true">
                <div className="absolute -bottom-60 -right-60 w-96 h-96 bg-teal-100 rounded-full filter blur-3xl opacity-30"></div>
                <div className="absolute -top-60 -left-60 w-96 h-96 bg-cyan-100 rounded-full filter blur-3xl opacity-30"></div>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    <div className="text-center lg:text-left">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">Alles wat je nodig hebt, en niets meer</h2>
                        <p className="mt-4 max-w-2xl mx-auto lg:mx-0 text-lg text-zinc-600">
                            Focus op je werk, wij regelen de administratie. Onze tool is ontworpen om intuïtief en krachtig te zijn.
                        </p>
                        <dl className="mt-12 space-y-10">
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-teal-500 text-white">
                                       <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path></svg>
                                    </div>
                                    <p className="ml-16 text-xl font-semibold leading-8 text-gray-900">Persoonlijke Huisstijl</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base leading-7 text-gray-600">Pas templates aan met je eigen logo en kleuren voor een factuur die perfect bij jouw merk past.</dd>
                            </div>
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-teal-500 text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
                                    </div>
                                    <p className="ml-16 text-xl font-semibold leading-8 text-gray-900">Overzichtelijk Dashboard</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base leading-7 text-gray-600">Houd grip op je financiën met een duidelijk overzicht van openstaande, betaalde en verlopen facturen.</dd>
                            </div>
                            <div className="relative">
                                <dt>
                                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-teal-500 text-white">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
                                    </div>
                                    <p className="ml-16 text-xl font-semibold leading-8 text-gray-900">Voldoet aan Eisen</p>
                                </dt>
                                <dd className="mt-2 ml-16 text-base leading-7 text-gray-600">Onze facturen bevatten alle verplichte onderdelen volgens de Nederlandse Belastingdienst.</dd>
                            </div>
                        </dl>
                    </div>
                    <div className="hidden lg:flex items-center justify-center">
                        <div className="bg-white p-6 rounded-2xl shadow-2xl border border-stone-200 transform rotate-3 transition-transform hover:rotate-0 hover:scale-105 duration-500">
                             <div className="bg-slate-100 p-6 rounded-lg">
                                 <div className="flex justify-between items-center mb-6">
                                     <h3 className="text-xl font-bold">Dashboard</h3>
                                     <span className="text-base font-medium text-zinc-500">Deze maand</span>
                                 </div>
                                 <div className="grid grid-cols-2 gap-5">
                                     <div className="bg-white p-5 rounded-lg">
                                         <p className="text-base text-zinc-500">Omzet</p>
                                         <p className="text-3xl font-bold text-green-600">€2.722</p>
                                     </div>
                                     <div className="bg-white p-5 rounded-lg">
                                         <p className="text-base text-zinc-500">Openstaand</p>
                                         <p className="text-3xl font-bold text-yellow-600">€850</p>
                                     </div>
                                 </div>
                                 <div className="mt-5 bg-white p-5 rounded-lg">
                                     <p className="font-bold mb-3 text-lg">Recente activiteit</p>
                                     <div className="text-base space-y-3">
                                         <p><span className="font-medium text-teal-600">Factuur 2025-001</span> is betaald.</p>
                                         <p>Nieuwe factuur voor <span className="font-medium">Jan de Vries</span>.</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Pricing Section */}
        <section id="tarieven" className="py-24 bg-white">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">Eerlijke prijzen</h2>
                <p className="mt-4 text-lg text-zinc-600 max-w-2xl mx-auto">Kies het abonnement dat bij jou past. Begin gratis, upgrade wanneer jij er klaar voor bent.</p>
                <div className="mt-12 grid md:grid-cols-2 gap-8 text-left items-start">
                    {/* Gratis Card */}
                    <div className="p-8 bg-slate-50 rounded-2xl border border-stone-200 flex flex-col h-full">
                        <h3 className="text-3xl font-bold">Gratis</h3>
                        <p className="text-zinc-600 mt-1">Voor wie net begint</p>

                        <div className="flex items-baseline mt-6">
                            <span className="text-5xl font-extrabold">€0</span>
                            <span className="ml-2 px-2 py-0.5 bg-slate-200 text-zinc-600 rounded-md text-sm font-semibold">/maand</span>
                        </div>
                        
                        <p className="mt-6 text-zinc-700 font-semibold">Alles om goed van start te gaan</p>
                        
                        <button onClick={() => onNavigate('signup')} className="w-full text-center bg-slate-200 text-zinc-800 px-6 py-3 rounded-lg font-bold hover:bg-slate-300 transition-colors mt-6">
                            Probeer Factuurlijk vandaag
                        </button>
                        
                        <div className="mt-8 pt-8 border-t border-stone-200 flex-grow">
                            <h4 className="font-semibold text-zinc-800">Inclusief:</h4>
                            <ul className="space-y-4 text-zinc-600 mt-4">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span>Tot 3 facturen per maand</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span>Klantbeheer (max. 5 klanten)</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span>Professionele templates</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                     
                    {/* Pro Card */}
                    <div className="p-8 bg-teal-800 text-white rounded-2xl relative flex flex-col h-full">
                        <div className="absolute top-4 right-4 inline-flex items-center px-3 py-1 bg-teal-600 text-white text-sm font-semibold rounded-full">
                            <StarIcon className="w-4 h-4 mr-1.5" /> Meest gekozen
                        </div>
                        
                        <h3 className="text-3xl font-bold">Pro</h3>
                        <p className="text-teal-200 mt-1">Voor de groeiende ondernemer</p>

                        <div className="flex justify-center my-6">
                            <div className="p-1 bg-teal-700 rounded-full flex items-center space-x-1">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-6 py-2 text-sm font-bold rounded-full transition-colors duration-300 ${billingCycle === 'monthly' ? 'bg-white text-teal-800 shadow' : 'text-teal-200'}`}
                                >
                                    Maandelijks
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-6 py-2 text-sm font-bold rounded-full transition-colors duration-300 ${billingCycle === 'yearly' ? 'bg-white text-teal-800 shadow' : 'text-teal-200'}`}
                                >
                                    Jaarlijks
                                </button>
                            </div>
                        </div>

                        <div className="mt-2 text-center">
                            <div className="flex items-baseline justify-center">
                                <span className="text-5xl font-extrabold">
                                    {billingCycle === 'monthly' ? '€12,95' : '€10,79'}
                                </span>
                                <span className="ml-2 text-teal-200">/maand excl. btw</span>
                            </div>
                            {billingCycle === 'yearly' && (
                                <p className="text-sm text-teal-200 mt-1">
                                    €129,50 per jaar gefactureerd (bespaar 2 maanden)
                                </p>
                            )}
                        </div>

                        <p className="mt-6 text-teal-100 font-semibold text-center">Alle Pro-functies om je bedrijf te laten groeien</p>

                        <button onClick={() => onNavigate('signup')} className="w-full text-center bg-white text-teal-800 px-6 py-3 rounded-lg font-bold hover:bg-slate-100 transition-colors mt-6">
                            Start je Pro-abonnement
                        </button>
                        
                        <div className="mt-8 pt-8 border-t border-teal-700 flex-grow">
                            <h4 className="font-semibold text-white">Alles van Gratis +</h4>
                            <ul className="space-y-4 text-teal-100 mt-4">
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span className="text-white">Onbeperkt facturen & klanten</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span className="text-white">Toegang tot alle templates & personalisatie</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span className="text-white">Uitgebreide rapportages en inzichten</span>
                                </li>
                                <li className="flex items-start">
                                    <CheckCircleIcon className="text-teal-500 mr-3 mt-0.5" />
                                    <span className="text-white">Offertes maken en omzetten naar facturen</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        
        {/* Testimonials */}
        <section className="py-24 bg-stone-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                 <div className="text-center">
                    <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight sm:text-4xl">Gebruikt door ZZP'ers zoals jij</h2>
                    <p className="mt-4 max-w-2xl mx-auto text-lg text-zinc-600">
                        Wij zijn er trots op dat we ondernemers helpen groeien.
                    </p>
                 </div>
                 <div className="mt-16 grid md:grid-cols-2 gap-8">
                    <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 transform transition-transform hover:-translate-y-2">
                        <svg className="w-10 h-10 text-teal-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M10.25 4.155a3.023 3.023 0 00-3.023 3.023v.23c0 2.045 1.659 3.704 3.704 3.704h1.077c-.378 2.502-2.07 3.356-3.923 3.356-.554 0-1.107.088-1.66.262a.498.498 0 00-.339.47v1.178c0 .35.33.626.678.554 2.8-.58 4.67-2.19 5.31-5.18.238-1.09.357-2.27.357-3.54V7.178a3.023 3.023 0 00-3.023-3.023zm8.161 0a3.023 3.023 0 00-3.023 3.023v.23c0 2.045 1.659 3.704 3.704 3.704h1.077c-.378 2.502-2.07 3.356-3.923 3.356-.554 0-1.107.088-1.66.262a.498.498 0 00-.339.47v1.178c0 .35.33.626.678.554 2.8-.58 4.67-2.19 5.31-5.18.238-1.09.357-2.27.357-3.54V7.178a3.023 3.023 0 00-3.023-3.023z" />
                        </svg>
                        <p className="text-zinc-700 text-lg mt-6">"Eindelijk een factuurtool die doet wat het moet doen, zonder onnodige toeters en bellen. Ik bespaar hierdoor wekelijks zeker een uur."</p>
                        <div className="mt-6 pt-6 border-t border-stone-200">
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-zinc-600">SDW</div>
                                <div className="ml-4">
                                    <div className="font-bold text-zinc-900">Sanne de Wit</div>
                                    <div className="text-zinc-500">Grafisch Ontwerper</div>
                                </div>
                                <div className="ml-auto flex items-center">
                                    <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                                </div>
                            </div>
                        </div>
                    </div>
                     <div className="bg-white rounded-2xl shadow-lg border border-stone-200 p-8 transform transition-transform hover:-translate-y-2">
                         <svg className="w-10 h-10 text-teal-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M10.25 4.155a3.023 3.023 0 00-3.023 3.023v.23c0 2.045 1.659 3.704 3.704 3.704h1.077c-.378 2.502-2.07 3.356-3.923 3.356-.554 0-1.107.088-1.66.262a.498.498 0 00-.339.47v1.178c0 .35.33.626.678.554 2.8-.58 4.67-2.19 5.31-5.18.238-1.09.357-2.27.357-3.54V7.178a3.023 3.023 0 00-3.023-3.023zm8.161 0a3.023 3.023 0 00-3.023 3.023v.23c0 2.045 1.659 3.704 3.704 3.704h1.077c-.378 2.502-2.07 3.356-3.923 3.356-.554 0-1.107.088-1.66.262a.498.498 0 00-.339.47v1.178c0 .35.33.626.678.554 2.8-.58 4.67-2.19 5.31-5.18.238-1.09.357-2.27.357-3.54V7.178a3.023 3.023 0 00-3.023-3.023z" />
                        </svg>
                        <p className="text-zinc-700 text-lg mt-6">"Sinds ik Factuurlijk gebruik zien mijn facturen er veel professioneler uit. Het is super gebruiksvriendelijk en de prijs is onverslaanbaar."</p>
                        <div className="mt-6 pt-6 border-t border-stone-200">
                            <div className="flex items-center">
                                <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center font-bold text-zinc-600">MJ</div>
                                <div className="ml-4">
                                    <div className="font-bold text-zinc-900">Mark Jansen</div>
                                    <div className="text-zinc-500">Webdeveloper</div>
                                </div>
                                <div className="ml-auto flex items-center">
                                    <StarIcon /><StarIcon /><StarIcon /><StarIcon /><StarIcon />
                                </div>
                            </div>
                        </div>
                    </div>
                 </div>
            </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-center text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900">Veelgestelde Vragen</h2>
                <p className="mt-4 text-center text-lg text-zinc-600">Vind hier antwoorden op de meest voorkomende vragen.</p>
                <div className="mt-12">
                    {faqs.map((faq, index) => (
                        <FaqItem
                            key={index}
                            question={faq.question}
                            answer={faq.answer}
                            isOpen={openFaqIndex === index}
                            onClick={() => handleFaqToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </section>
        
        {/* Call to Action Section */}
        <section className="bg-stone-50 py-20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-teal-900 rounded-3xl p-8 sm:p-12 text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Klaar om je facturatie te vereenvoudigen?</h2>
                    <p className="mt-4 text-teal-100 max-w-2xl mx-auto">Meld je vandaag nog gratis aan en ontdek hoe eenvoudig professioneel factureren kan zijn. Geen creditcard nodig.</p>
                    <div className="mt-8">
                        <button 
                            onClick={() => onNavigate('signup')}
                            className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-bold rounded-full shadow-sm text-teal-900 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-teal-900 focus:ring-white transition-transform hover:scale-105"
                        >
                            Start gratis
                            <ArrowRight />
                        </button>
                    </div>
                </div>
            </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-900">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-4">
                <FooterLogo />
                <p className="mt-4 text-base text-zinc-400">Maak je complexe financiën eenvoudiger.</p>
            </div>
            <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Features</h3>
                <ul className="mt-4 space-y-4">
                    <li><a href="#features" onClick={handleScrollTo} className="text-base text-zinc-400 hover:text-white">Features</a></li>
                    <li><a href="#tarieven" onClick={handleScrollTo} className="text-base text-zinc-400 hover:text-white">Prijzen</a></li>
                </ul>
            </div>
             <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Support</h3>
                <ul className="mt-4 space-y-4">
                    <li><a href="#faq" onClick={handleScrollTo} className="text-base text-zinc-400 hover:text-white">FAQ</a></li>
                    <li><button onClick={() => onNavigate('contact')} className="text-base text-zinc-400 hover:text-white text-left">Contact</button></li>
                </ul>
            </div>
             <div className="md:col-span-2">
                <h3 className="text-sm font-semibold text-white tracking-wider uppercase">Legal</h3>
                <ul className="mt-4 space-y-4">
                    <li><button onClick={() => onNavigate('privacy-policy')} className="text-base text-zinc-400 hover:text-white text-left">Privacybeleid</button></li>
                    <li><button onClick={() => onNavigate('terms-and-conditions')} className="text-base text-zinc-400 hover:text-white text-left">Algemene Voorwaarden</button></li>
                </ul>
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