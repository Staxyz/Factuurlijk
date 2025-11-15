import React, { useState, useEffect } from 'react';
import type { UserProfile, TemplateStyle, TemplateCustomizations, TemplateFont, Invoice } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { mockInvoices } from '../constants';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';


interface TemplatesProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  session: Session | null;
}

const templates: { id: TemplateStyle; name: string; description: string; }[] = [
  { id: 'corporate', name: 'Zakelijk', description: 'Een strakke, professionele look voor zakelijke klanten.' },
  { id: 'creative', name: 'Creatief', description: 'Een opvallend en modern ontwerp met een vleugje kleur.' },
  { id: 'wave', name: 'Modern', description: 'Een stijlvol template met een unieke golf-header.' },
  { id: 'sidebar', name: 'Structuur', description: 'Een gestructureerde layout met contactinfo in een zijbalk.' },
  { id: 'elegant', name: 'Elegant', description: 'Een klassiek en verfijnd ontwerp met schreefletters.' },
  { id: 'minimalist', name: 'Minimalistisch', description: 'Een simpel, tekstgericht ontwerp voor maximale duidelijkheid.' },
];

const defaultCustomizations: Record<TemplateStyle, TemplateCustomizations> = {
  minimalist: { primary_color: '#1f2937', font: 'mono' },
  corporate: { primary_color: '#4b5563', font: 'sans' },
  creative: { primary_color: '#2d3748', font: 'sans' },
  sidebar: { primary_color: '#374151', font: 'sans' },
  elegant: { primary_color: '#333333', font: 'serif' },
  wave: { primary_color: '#2563eb', font: 'sans' },
};


const previewInvoice = { ...mockInvoices[0], lines: mockInvoices[0].lines.slice(0, 2) };
const colorPalette = ['#1f2937', '#475569', '#b91c1c', '#1d4ed8', '#7c3aed', '#0f766e', '#ea580c'];

const footerSuggestions = [
  {
    name: 'Standaard',
    text: `Gelieve het totaalbedrag over te maken voor de vervaldatum op rekeningnummer {iban} t.n.v. {name}, onder vermelding van het factuurnummer.\nHartelijk dank voor uw vertrouwen!`,
  },
  {
    name: 'Kort & Vriendelijk',
    text: `Bedankt voor de fijne samenwerking! Graag de betaling voldoen binnen de termijn op IBAN {iban} o.v.v. het factuurnummer.`,
  },
  {
    name: 'Formeel',
    text: `Wij verzoeken u vriendelijk het verschuldigde bedrag te voldoen vóór de vervaldatum. Betalingen kunnen worden verricht op bankrekening {iban} ten name van {name}, onder vermelding van het factuurnummer.\nMet vriendelijke groet,`,
  },
];

// Dummy profile for the template selection buttons
const dummyProfileForPreviewButtons: UserProfile = {
  id: 'dummy-user',
  updated_at: null,
  name: 'Jouw Bedrijfsnaam',
  email: 'jouw@email.com',
  address: 'Voorbeeldstraat 1, 1234 AB Voorbeeldstad',
  kvk_number: '12345678',
  btw_number: 'NL001234567B01',
  iban: 'NL91 ABNA 0417 1643 00',
  phone_number: '06-12345678',
  logo_url: null,
  template_style: 'corporate',
  template_customizations: null,
  plan: 'pro',
  invoice_creation_count: 0,
  invoice_footer_text: 'Bedankt voor uw bestelling!',
};

const TemplateSelectionButton: React.FC<{
  template: { id: TemplateStyle; name: string; description: string };
  isSelected: boolean;
  onClick: () => void;
  previewInvoice: Invoice;
}> = ({ template, isSelected, onClick, previewInvoice }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group rounded-xl overflow-hidden text-left transition-all duration-200 relative border-2 flex flex-col h-full ${
                isSelected
                    ? 'bg-teal-50/50 border-teal-500 shadow-lg'
                    : 'bg-white border-stone-200 hover:border-stone-400 hover:shadow-md'
            }`}
            aria-pressed={isSelected}
        >
            {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 bg-zinc-800 text-white rounded-full flex items-center justify-center ring-4 ring-white z-10">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                </div>
            )}

            {/* Preview Container */}
            <div className="h-40 bg-white shadow-inner rounded-md overflow-hidden border border-stone-200 relative m-4 flex-shrink-0">
                <div
                    className="absolute top-0 left-0 w-full"
                    style={{
                        pointerEvents: 'none',
                    }}
                >
                    <div className="w-full aspect-[210/297] bg-white">
                        <InvoicePreview
                            invoice={previewInvoice}
                            userProfile={dummyProfileForPreviewButtons}
                            templateStyle={template.id}
                            templateCustomizations={{
                                ...defaultCustomizations[template.id],
                                font: 'sans',
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Text Content with Better Spacing */}
            <div className="flex-1 flex flex-col px-4 pb-4">
                <h4 className="text-base font-bold text-zinc-800 leading-snug">{template.name}</h4>
                <p className="mt-2 text-sm text-zinc-600 leading-relaxed line-clamp-2">{template.description}</p>
            </div>
        </button>
    );
};

export const Templates: React.FC<TemplatesProps> = ({ userProfile, setUserProfile, session }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateStyle>(userProfile.template_style);
  const [customizations, setCustomizations] = useState<TemplateCustomizations>(
    userProfile.template_customizations || defaultCustomizations[userProfile.template_style]
  );
  const [footerText, setFooterText] = useState(userProfile.invoice_footer_text || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setSelectedTemplate(userProfile.template_style);
    setCustomizations(userProfile.template_customizations || defaultCustomizations[userProfile.template_style]);
    setFooterText(userProfile.invoice_footer_text || '');
  }, [userProfile]);

  const handleCustomizationChange = (field: keyof TemplateCustomizations, value: string) => {
    setCustomizations(prev => ({ ...prev, [field]: value as TemplateFont | string }));
  };

  const handleSave = async () => {
    if (!session?.user) {
        alert("U moet ingelogd zijn om op te slaan.");
        return;
    }
    setIsSaving(true);
    setShowSuccess(false);

    try {
        const updatePayload = {
            template_style: selectedTemplate,
            template_customizations: customizations,
            invoice_footer_text: footerText,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('profiles')
            .update(updatePayload)
            .eq('id', session.user.id)
            .select()
            .single();
        
        if (error) throw error;

        setUserProfile(data);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    } catch (error: unknown) {
        // A more robust error message extractor
        const getErrorMessage = (err: unknown, defaultMessage = 'Er is een onbekende fout opgetreden.'): string => {
            if (err instanceof Error) return err.message;
            if (typeof err === 'object' && err !== null) {
                if ('message' in err && typeof (err as any).message === 'string') return (err as any).message;
                if ('details' in err && typeof (err as any).details === 'string') return (err as any).details;
            }
            return defaultMessage;
        };
        const message = getErrorMessage(error, 'Kon de instellingen niet opslaan.');
        console.error("Error saving template settings:", message, error); // Log both message and full object
        alert(`Fout bij opslaan template: ${message}`);
    } finally {
        setIsSaving(false);
    }
  };
  
  const hasChanges = userProfile.template_style !== selectedTemplate || 
    JSON.stringify(userProfile.template_customizations || defaultCustomizations[userProfile.template_style]) !== JSON.stringify(customizations) ||
    (userProfile.invoice_footer_text || '') !== footerText;

  const processedFooterSuggestions = footerSuggestions.map(suggestion => ({
    ...suggestion,
    text: suggestion.text
        .replace('{iban}', userProfile.iban || '[IBAN]')
        .replace('{name}', userProfile.name || '[Bedrijfsnaam]'),
  }));

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 md:p-8">
        {/* Toast Notification */}
        <div
            className={`fixed top-6 right-6 z-50 bg-white border border-green-200 shadow-lg rounded-lg p-4 flex items-start transition-all duration-300 ease-in-out ${
                showSuccess ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'
            }`}
        >
            <div className="flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
            </div>
            <div className="ml-3">
                <p className="text-sm font-bold text-zinc-800">Template opgeslagen!</p>
                <p className="mt-1 text-sm text-zinc-600">Alle nieuwe facturen die je aanmaakt, zullen nu deze layout gebruiken.</p>
            </div>
        </div>

        {/* Header */}
        <header className="flex-shrink-0 pb-4 mb-4 border-b border-stone-200">
            <h1 className="text-2xl font-bold text-zinc-900">Pas je factuurtemplate aan</h1>
            <p className="text-zinc-600 mt-1">Kies een basisstijl en pas de details aan. Deze stijl wordt gebruikt voor alle nieuwe facturen.</p>
        </header>

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-hidden">
             {/* Left Column: Live Preview (fixed) */}
            <div className="flex lg:col-span-1 bg-stone-100 p-2 sm:p-4 rounded-lg flex-col overflow-hidden h-[60vh] lg:h-full">
                <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex-shrink-0">Live Voorbeeld</h3>
                <div className="flex-1 w-full h-full flex items-center justify-center min-h-0">
                    <div className="bg-white shadow-lg rounded-md overflow-hidden max-w-full max-h-full aspect-[210/297] transform scale-95">
                       <div className="w-full h-full overflow-hidden">
                            <InvoicePreview 
                                invoice={previewInvoice}
                                userProfile={{...userProfile, invoice_footer_text: footerText}}
                                templateStyle={selectedTemplate}
                                templateCustomizations={customizations}
                                previewSize="large"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column: Selection & Customization (with sticky footer) */}
            <div className="lg:col-span-1 flex flex-col overflow-hidden">
                <div className="flex-grow overflow-y-auto p-1 sm:p-2 md:p-4">
                    <div className="space-y-12">
                         <div className="px-4 sm:px-0">
                            <h3 className="text-lg font-semibold text-zinc-800 mb-6">1. Kies een basisstijl</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 auto-rows-max">
                                {templates.map(template => (
                                     <TemplateSelectionButton
                                        key={template.id}
                                        template={template}
                                        isSelected={selectedTemplate === template.id}
                                        onClick={() => setSelectedTemplate(template.id)}
                                        previewInvoice={previewInvoice}
                                    />
                                ))}
                            </div>
                         </div>

                         <div className="w-full max-w-md mx-auto">
                            <h3 className="text-lg font-semibold text-zinc-800 mb-6">2. Pas de details aan</h3>
                            <div className="bg-white p-6 rounded-lg border border-stone-200 space-y-6">
                                <div>
                                    <label htmlFor="primary_color" className="block text-base font-medium text-zinc-700">Accentkleur</label>
                                    <div className="flex flex-wrap gap-3 mt-3">
                                        {colorPalette.map(color => (
                                            <button
                                                key={color}
                                                type="button"
                                                aria-label={`Kies kleur ${color}`}
                                                className={`w-9 h-9 rounded-full border-2 transition-all ${customizations.primary_color.toLowerCase() === color.toLowerCase() ? 'border-teal-500 ring-2 ring-teal-200' : 'border-white hover:border-stone-300'}`}
                                                style={{ backgroundColor: color }}
                                                onClick={() => handleCustomizationChange('primary_color', color)}
                                            />
                                        ))}
                                        {/* Custom Color Picker */}
                                        <div className="relative w-9 h-9" title="Kies een eigen kleur">
                                            <input
                                                type="color"
                                                id="custom_color_picker"
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                value={customizations.primary_color}
                                                onChange={(e) => handleCustomizationChange('primary_color', e.target.value)}
                                            />
                                            <label
                                                htmlFor="custom_color_picker"
                                                className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer ${
                                                    !colorPalette.includes(customizations.primary_color)
                                                        ? 'border-teal-500 ring-2 ring-teal-200'
                                                        : 'border-white hover:border-stone-300'
                                                }`}
                                                style={{ backgroundColor: customizations.primary_color }}
                                            >
                                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white mix-blend-difference"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path></svg>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="font" className="block text-base font-medium text-zinc-700">Lettertype</label>
                                    <select 
                                        id="font"
                                        value={customizations.font}
                                        onChange={(e) => handleCustomizationChange('font', e.target.value)}
                                        className="mt-2 block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                    >
                                        <option value="sans">Standaard (Sans-serif)</option>
                                        <option value="serif">Klassiek (Serif)</option>
                                        <option value="mono">Minimalistisch (Monospace)</option>
                                    </select>
                                </div>
                                 <div>
                                    <label htmlFor="footer_text" className="block text-base font-medium text-zinc-700">Factuurvoettekst</label>
                                    <textarea
                                        id="footer_text"
                                        rows={4}
                                        value={footerText}
                                        onChange={(e) => setFooterText(e.target.value)}
                                        className="mt-2 block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-base focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                                        placeholder="Laat leeg voor de standaardtekst."
                                    ></textarea>
                                    <p className="mt-2 text-sm text-zinc-500">Deze tekst verschijnt onderaan je factuur.</p>
                                    <div className="mt-4 pt-4 border-t border-stone-200">
                                        <p className="text-base font-medium text-zinc-600">Suggesties:</p>
                                        <div className="flex flex-wrap gap-2 mt-3">
                                            {processedFooterSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.name}
                                                    type="button"
                                                    onClick={() => setFooterText(suggestion.text)}
                                                    className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-stone-300 text-zinc-700 hover:bg-stone-100 hover:border-stone-400 transition-all shadow-sm"
                                                >
                                                    {suggestion.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>

                 <div className="flex-shrink-0 flex items-center space-x-6 bg-slate-100/80 backdrop-blur-sm border-t border-stone-200 p-6">
                    <button 
                        onClick={handleSave}
                        disabled={!hasChanges || isSaving}
                        className="rounded-md bg-teal-600 px-5 py-2.5 text-base font-medium text-white shadow-sm hover:bg-teal-700 disabled:bg-teal-400 disabled:cursor-not-allowed"
                    >
                        {isSaving ? 'Opslaan...' : 'Wijzigingen Opslaan'}
                    </button>
                </div>
            </div>
        </div>
    </div>
  );
};
