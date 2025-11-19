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

interface TermsAndConditionsPageProps {
  onNavigateToLanding: (sectionId?: string) => void;
}

export const TermsAndConditionsPage: React.FC<TermsAndConditionsPageProps> = ({ onNavigateToLanding }) => {
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
            <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-6">Algemene Voorwaarden</h1>
            <div className="prose prose-lg max-w-none text-zinc-700 space-y-4">
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">1. Definities</h2>
                <div className="space-y-2">
                    <p><strong>Factuurlijk:</strong> [Jouw bedrijfsnaam/naam], gevestigd te [Adres], ingeschreven bij de KvK onder nummer [KvK-nummer], de leverancier van de Dienst.</p>
                    <p><strong>Dienst:</strong> De via de webapplicatie (app.factuurlijk.nl) aangeboden dienst om facturen te creëren, te verzenden en de betaalstatus te beheren.</p>
                    <p><strong>Gebruiker:</strong> De natuurlijke of rechtspersoon die een overeenkomst aangaat met Factuurlijk voor het gebruik van de Dienst.</p>
                    <p><strong>Overeenkomst:</strong> De overeenkomst tussen Factuurlijk en Gebruiker voor het gebruik van de Dienst, waarop deze Algemene Voorwaarden van toepassing zijn.</p>
                    <p><strong>Partijen:</strong> Factuurlijk en de Gebruiker gezamenlijk.</p>
                </div>

                <h2 className="text-2xl font-bold text-zinc-800 pt-4">2. Toepasselijkheid</h2>
                <p>2.1. Deze Algemene Voorwaarden zijn van toepassing op alle aanbiedingen, offertes en Overeenkomsten met Factuurlijk betreffende het gebruik van de Dienst.</p>
                <p>2.2. De Gebruiker aanvaardt deze Algemene Voorwaarden bij het aanmaken van een account en het afsluiten van de Overeenkomst.</p>
                <p>2.3. Factuurlijk behoudt zich het recht voor deze voorwaarden te wijzigen. Wijzigingen treden in werking [X aantal dagen] na schriftelijke kennisgeving (meestal per e-mail). Indien de Gebruiker een wijziging niet wenst te accepteren, dient deze de Overeenkomst schriftelijk op te zeggen vóór de ingangsdatum van de wijziging.</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">3. De Dienst en Gebruik</h2>
                <p>3.1. Omvang van de Dienst: De Dienst stelt de Gebruiker in staat om facturen op te stellen, te beheren en de betalingsstatus van deze facturen bij te houden.</p>
                <p>3.2. Licentie: Factuurlijk verleent de Gebruiker een niet-exclusief, niet-overdraagbaar recht om de Dienst te gebruiken gedurende de looptijd van de Overeenkomst.</p>
                <p>3.3. Verantwoordelijkheid Gebruiker: De Gebruiker is verantwoordelijk voor de juistheid en volledigheid van de door hem/haar ingevoerde gegevens (zoals factuurgegevens en klantgegevens). Factuurlijk is niet aansprakelijk voor fouten in de facturen die door de Gebruiker zijn aangemaakt.</p>
                <p>3.4. Ongeoorloofd Gebruik: Het is de Gebruiker niet toegestaan de Dienst te gebruiken voor illegale, onethische of ongewenste doeleinden.</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">4. Prijzen en Betaling</h2>
                <p>4.1. Tarieven: De tarieven voor de Dienst staan vermeld op de website van Factuurlijk ([Link naar prijspagina]).</p>
                <p>4.2. Betaaltermijn: Betalingen dienen [vooraf/achteraf] te geschieden via de door Factuurlijk aangeboden betaalmethoden, binnen [X aantal dagen] na factuurdatum.</p>
                <p>4.3. Prijsaanpassing: Factuurlijk is gerechtigd de geldende prijzen en tarieven aan te passen. Factuurlijk zal de Gebruiker hierover [X aantal dagen] van tevoren informeren.</p>
                <p>4.4. Niet-tijdige Betaling: Indien de Gebruiker niet tijdig betaalt, is Factuurlijk gerechtigd de toegang tot de Dienst op te schorten totdat volledige betaling is ontvangen. De wettelijke rente en incassokosten kunnen in rekening worden gebracht.</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">5. Duur en Beëindiging van de Overeenkomst</h2>
                <p>5.1. Duur: De Overeenkomst wordt aangegaan voor een initiële periode van [bijv. één maand of één jaar] en wordt stilzwijgend verlengd voor dezelfde periode, tenzij tijdig opgezegd.</p>
                <p>5.2. Opzegging door Gebruiker: De Gebruiker kan de Overeenkomst opzeggen met inachtneming van een opzegtermijn van [bijv. één maand] vóór het einde van de lopende abonnementsperiode. Opzegging dient schriftelijk te geschieden via [bijv. het dashboard in de app of e-mail].</p>
                <p>5.3. Beëindiging door Factuurlijk: Factuurlijk kan de Overeenkomst met onmiddellijke ingang beëindigen of de toegang tot de Dienst opschorten indien de Gebruiker de Algemene Voorwaarden schendt of niet tijdig betaalt.</p>
                <p>5.4. Gevolgen van Beëindiging: Bij beëindiging heeft de Gebruiker gedurende een periode van [bijv. 30 dagen] de mogelijkheid de opgeslagen gegevens te exporteren. Daarna worden de gegevens verwijderd, met uitzondering van gegevens die Factuurlijk wettelijk verplicht is te bewaren (zie Privacybeleid).</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">6. Aansprakelijkheid en Vrijwaring</h2>
                <p>6.1. Beperking Aansprakelijkheid Factuurlijk: Factuurlijk is niet aansprakelijk voor schade als gevolg van storingen, onderhoud of onbeschikbaarheid van de Dienst.</p>
                <p>6.2. De totale aansprakelijkheid van Factuurlijk wegens toerekenbare tekortkoming in de nakoming van de Overeenkomst is beperkt tot vergoeding van directe schade tot maximaal een bedrag gelijk aan de vergoedingen die de Gebruiker in de [laatste 3 maanden / laatste 12 maanden] vóór de schadeveroorzakende gebeurtenis aan Factuurlijk heeft betaald.</p>
                <p>6.3. Factuurlijk is nooit aansprakelijk voor indirecte schade, daaronder begrepen maar niet beperkt tot gevolgschade, gemiste winst, gemiste besparingen, of schade door bedrijfsstagnatie.</p>
                <p>6.4. Vrijwaring: De Gebruiker vrijwaart Factuurlijk voor alle aanspraken van derden (inclusief klanten van de Gebruiker) die voortvloeien uit het gebruik van de Dienst door de Gebruiker.</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">7. Overmacht</h2>
                <p>7.1. Factuurlijk is niet gehouden tot het nakomen van enige verplichting jegens de Gebruiker indien zij daartoe gehinderd wordt als gevolg van een omstandigheid die niet is te wijten aan haar schuld, noch krachtens wet, rechtshandeling of in het verkeer geldende opvattingen voor haar rekening komt (overmacht).</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">8. Intellectuele Eigendomsrechten</h2>
                <p>8.1. Alle rechten van intellectuele eigendom met betrekking tot de Dienst, waaronder de software, het ontwerp, en de bijbehorende documentatie, berusten uitsluitend bij Factuurlijk.</p>
                <p>8.2. De Gebruiker verkrijgt uitsluitend de gebruiksrechten die in deze Voorwaarden en de Overeenkomst uitdrukkelijk zijn toegekend.</p>
                
                <h2 className="text-2xl font-bold text-zinc-800 pt-4">9. Overige Bepalingen</h2>
                <p>9.1. Toepasselijk Recht: Op de Overeenkomst is uitsluitend het Nederlands recht van toepassing.</p>
                <p>9.2. Geschillen: Alle geschillen die voortvloeien uit de Overeenkomst zullen in eerste instantie worden voorgelegd aan de bevoegde rechter in [Rechtbank/Arrondissement Factuurlijk is gevestigd].</p>

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