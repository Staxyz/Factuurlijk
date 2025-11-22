import React, { useState, useEffect } from 'react';

const Logo = () => (
    <div className="flex items-center space-x-2">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
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
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" fill="#14b8a6"/>
            <path d="M14 2V8H20" fill="#0d9488"/>
            <path d="M16 13H8V11H16V13Z" fill="white"/>
            <path d="M16 17H8V15H16V17Z" fill="white"/>
        </svg>
        <span className="text-3xl font-bold text-white">Factuurlijk</span>
    </div>
);

interface PrivacyPolicyPageProps {
  onNavigateToLanding: (sectionId?: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigateToLanding }) => {
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

      {/* Mobile Menu */}
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
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6">Privacybeleid</h1>
            <div className="prose prose-lg max-w-none text-zinc-700 space-y-4">
                <p>Via de webapplicatie Factuurlijk ([Jouw domeinnaam]) worden privacygevoelige gegevens, oftewel persoonsgegevens, verwerkt. Factuurlijk is eigendom van [Bedrijfsnaam of Naam Eigenaar, KvK-nummer]. Wij hechten veel waarde aan een zorgvuldige omgang met persoonsgegevens en respecteren de privacy van onze gebruikers. Persoonlijke gegevens worden door ons dan ook zorgvuldig verwerkt en beveiligd.</p>
                <p>In deze Privacyverklaring leggen wij uit welke persoonsgegevens wij verzamelen, met welk doel en op welke juridische grondslag wij deze verwerken, en hoe wij deze beveiligen.</p>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">1. Contactgegevens</h2>
                <ul className="list-disc pl-5">
                    <li><strong>Rol:</strong> Verwerkingsverantwoordelijke</li>
                    <li><strong>Gegevens:</strong> [Je bedrijfsnaam/naam]</li>
                    <li><strong>Adres:</strong> [Adres en Postcode]</li>
                    <li><strong>E-mailadres:</strong> [E-mailadres voor privacyvragen]</li>
                    <li><strong>KvK-nummer:</strong> [Je KvK-nummer]</li>
                </ul>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">2. Welke Persoonsgegevens Verwerken Wij?</h2>
                <p>Factuurlijk verwerkt persoonsgegevens van haar gebruikers (jij als ondernemer) en van de klanten van haar gebruikers (de ontvangers van de facturen).</p>
                <h3 className="text-xl font-semibold text-zinc-800">A. Gegevens van Gebruikers (Verwerkingsverantwoordelijke)</h3>
                <p>Dit zijn de gegevens die we van jou als Factuurlijk-klant verzamelen bij registratie en gebruik:</p>
                <ul className="list-disc pl-5">
                    <li><strong>Identificatie- en contactgegevens:</strong> Naam, e-mailadres, adres, telefoonnummer.</li>
                    <li><strong>Bedrijfsgegevens:</strong> Bedrijfsnaam, KvK-nummer, BTW-nummer.</li>
                    <li><strong>Financiële gegevens:</strong> Bankrekeningnummer (IBAN) voor facturatie en, indien van toepassing, abonnementsbetalingen.</li>
                    <li><strong>Gebruiksgegevens:</strong> IP-adres, login-momenten en instellingen (ten behoeve van beveiliging en service).</li>
                </ul>
                <h3 className="text-xl font-semibold text-zinc-800">B. Gegevens van Klanten van Gebruikers (Verwerker)</h3>
                <p>Dit zijn de gegevens die jij in Factuurlijk invoert over jouw klanten:</p>
                <ul className="list-disc pl-5">
                    <li><strong>Contact- en bedrijfsgegevens van debiteuren:</strong> Naam, bedrijfsnaam, adres, e-mailadres, telefoonnummer.</li>
                    <li><strong>Factuurgegevens:</strong> Factuurregels, bedragen, betaalstatus, factuurnummers.</li>
                </ul>
                <p><strong>Let op:</strong> Factuurlijk treedt in dit geval op als <strong>Verwerker</strong> en jij als Gebruiker bent de <strong>Verwerkingsverantwoordelijke</strong> voor de gegevens van jouw klanten.</p>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">3. Doeleinden en Grondslagen van Verwerking</h2>
                <p>Wij verwerken jouw persoonsgegevens uitsluitend voor de volgende doeleinden en op basis van de volgende wettelijke grondslagen:</p>
                <ul className="list-disc pl-5">
                    <li><strong>Dienstverlening:</strong> Alle onder 2A en 2B genoemde gegevens. Juridische Grondslag: Uitvoering van de Overeenkomst.</li>
                    <li><strong>Communicatie:</strong> Naam, e-mailadres. Juridische Grondslag: Gerechtvaardigd Belang.</li>
                    <li><strong>Wettelijke Verplichting:</strong> Facturatiegegevens, financiële gegevens. Juridische Grondslag: Wettelijke Verplichting.</li>
                    <li><strong>Beveiliging:</strong> IP-adres, login-momenten. Juridische Grondslag: Gerechtvaardigd Belang.</li>
                </ul>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">4. Beveiliging en Opslag (Supabase)</h2>
                <p>Factuurlijk neemt de bescherming van jouw gegevens serieus en treft passende technische en organisatorische maatregelen om misbruik, verlies, onbevoegde toegang en andere ongewenste handelingen tegen te gaan.</p>
                <ul className="list-disc pl-5">
                    <li><strong>Opslaglocatie:</strong> Alle persoonsgegevens worden veilig opgeslagen in een Supabase database.</li>
                    <li><strong>Beveiliging:</strong> De database is op een technisch hoog niveau beveiligd met toegangscontroles, encryptie en periodieke updates.</li>
                    <li><strong>Geheimhouding:</strong> Factuurlijk en haar eventuele medewerkers zijn gehouden aan geheimhouding van alle gegevens.</li>
                </ul>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">5. Delen van Persoonsgegevens met Derden</h2>
                <p>Factuurlijk verkoopt jouw gegevens niet aan derden. Wij maken gebruik van de volgende categorieën van dienstverleners ('Verwerkers'):</p>
                <ul className="list-disc pl-5">
                    <li><strong>Hosting en Database:</strong> Supabase (voor de veilige opslag van alle factuur- en gebruikersgegevens).</li>
                    <li><strong>Betalingsverwerker:</strong> [Naam Payment Provider, indien van toepassing].</li>
                </ul>
                <p>Met partijen die in onze opdracht jouw gegevens verwerken, sluiten wij een Verwerkersovereenkomst.</p>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">6. Bewaartermijn</h2>
                <p>Factuurlijk bewaart jouw persoonsgegevens niet langer dan strikt noodzakelijk.</p>
                <ul className="list-disc pl-5">
                    <li><strong>Facturatie- en Bedrijfsgegevens:</strong> Bewaard zolang je een actief account hebt en daarna gedurende de wettelijke fiscale bewaartermijn van 7 jaar.</li>
                    <li><strong>Accountgegevens:</strong> Worden bewaard zolang je Factuurlijk gebruikt. Bij opzegging worden deze gegevens binnen [X aantal dagen/maanden] verwijderd.</li>
                </ul>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">7. Jouw Rechten (Rechten van Betrokkenen)</h2>
                <p>Als gebruiker heb je op basis van de AVG de volgende rechten:</p>
                <ul className="list-disc pl-5">
                    <li>Recht op Inzage, Rectificatie, Verwijdering, Bezwaar en Beperking.</li>
                    <li>Recht op Dataportabiliteit.</li>
                </ul>
                <p>Je kunt een verzoek indienen via [E-mailadres voor privacyvragen]. Wij reageren hierop binnen één maand.</p>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">8. Klachten</h2>
                <p>Mocht je klachten hebben, neem dan contact met ons op via [E-mailadres voor privacyvragen]. Je hebt ook altijd het recht een klacht in te dienen bij de Autoriteit Persoonsgegevens (AP).</p>

                <div className="pt-4 border-t border-stone-200">
                    <p className="text-sm italic text-zinc-500"><strong>Disclaimer:</strong> Vul de placeholders (tussen [ ]) in en laat dit concept altijd controleren door een juridisch expert (bijvoorbeeld een AVG-specialist of jurist) om zeker te zijn dat het volledig aan alle wettelijke eisen voldoet.</p>
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