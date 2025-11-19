import React, { useState } from 'react';

const faqs = [
    {
        question: "Wat is Factuurlijk?",
        answer: "Factuurlijk is een webapp waarmee jij makkelijk professionele facturen maakt. Vul je bedrijfsgegevens in en kies een template."
    },
    {
        question: "Voor wie is Factuurlijk bedoeld?",
        answer: "Factuurlijk is ontworpen voor ZZP'ers, freelancers en kleine MKB-bedrijven in Nederland die een eenvoudige, snelle en professionele manier zoeken om facturen te maken en te beheren."
    },
    {
        question: "Zijn mijn gegevens Veilig?",
        answer: "Absoluut. We gebruiken de nieuwste beveiligingstechnologieën en slaan je data veilig op in de cloud. Jouw privacy en de veiligheid van je bedrijfsgegevens zijn onze hoogste prioriteit."
    },
    {
        question: "Wat kost Factuurlijk?",
        answer: "Factuurlijk kost eenmalig 39,50. Je koopt het één keer en zit dus niet vast aan een abonnement. Handig toch ;)"
    }
];

const FaqItem: React.FC<{ question: string; answer: string; isOpen: boolean; onClick: () => void; }> = ({ question, answer, isOpen, onClick }) => {
    return (
        <div className="border-b border-stone-200">
            <button
                onClick={onClick}
                className="w-full flex justify-between items-center py-5 text-left group"
                aria-expanded={isOpen}
            >
                <span className="text-lg font-medium text-zinc-800 group-hover:text-teal-600 transition-colors">{question}</span>
                <span className={`ml-6 flex-shrink-0 transform transition-transform duration-300 ${isOpen ? 'rotate-45' : ''}`}>
                    <svg className="h-6 w-6 text-zinc-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
                </span>
            </button>
            <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                <div className="overflow-hidden">
                    <p className="text-zinc-600 pr-12 pb-5">{answer}</p>
                </div>
            </div>
        </div>
    );
};

export const HelpPage: React.FC = () => {
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const handleFaqToggle = (index: number) => {
        setOpenFaqIndex(prevIndex => (prevIndex === index ? null : index));
    };
    
    const handleCopyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            alert('E-mailadres gekopieerd naar klembord!');
        }, (err) => {
            console.error('Kon tekst niet kopiëren: ', err);
            alert('Kopiëren mislukt.');
        });
    };

    return (
        <div className="h-full flex flex-col p-6 sm:p-8 bg-gradient-to-br from-white to-slate-50">
            {/* Header */}
            <div className="flex-shrink-0 pb-8 text-center">
                <h1 className="text-4xl font-extrabold text-zinc-900 tracking-tight">Hulp & Support</h1>
                <p className="mt-3 text-lg text-zinc-600 max-w-2xl mx-auto">Vind antwoorden op je vragen of neem contact met ons op.</p>
            </div>

            {/* Main Content */}
            <div className="flex-grow grid grid-cols-1 lg:grid-cols-5 gap-8 min-h-0">
                {/* Left Column: FAQ List */}
                <div className="lg:col-span-3 bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm flex flex-col">
                     <h2 className="text-2xl font-bold text-zinc-900 mb-4 flex-shrink-0">Veelgestelde Vragen</h2>
                     <div className="flex-grow overflow-y-auto -mr-4 pr-4">
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

                {/* Right Column: Contact Options */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Email Card */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                        <div className="flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-teal-100 text-teal-600 rounded-lg">
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold text-zinc-800">Stuur een e-mail</h3>
                                <p className="text-zinc-600 mt-1">We reageren meestal binnen 24 uur.</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-stone-200 flex items-center justify-between bg-stone-50 p-3 rounded-lg">
                            <a href="mailto:info@factuurlijk.nl" className="text-base font-medium text-teal-700 hover:text-teal-800 hover:underline truncate">info@factuurlijk.nl</a>
                            <button onClick={() => handleCopyToClipboard('info@factuurlijk.nl')} className="p-2 rounded-md hover:bg-stone-200 transition-colors flex-shrink-0" title="Kopieer e-mailadres">
                                <svg className="h-5 w-5 text-zinc-500 group-hover:text-zinc-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                            </button>
                        </div>
                    </div>
                    
                    {/* Phone Card */}
                    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-stone-200 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                         <div className="flex items-start">
                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-bold text-zinc-800">Bel Ons</h3>
                                <p className="text-zinc-600 mt-1">Ma-Vr, 9:00 - 17:00.</p>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-stone-200">
                             <a href="tel:+31657806503" className="block w-full text-center bg-stone-50 p-3 rounded-lg text-base font-medium text-blue-700 hover:text-blue-800 hover:bg-stone-100 transition-colors">06 57 80 65 03</a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};