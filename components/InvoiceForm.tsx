import React, { useState, useEffect } from 'react';
import type { Invoice, InvoiceLine, UserProfile, Customer } from '../types';
import { InvoicePreview } from './InvoicePreview';

// A simple UUID generator to avoid external dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Calculates the next invoice number based on the existing invoices.
 * It finds the highest number from the invoice list and increments it,
 * preserving any prefix and zero-padding.
 * @param invoices - Array of existing invoices.
 * @returns The suggested next invoice number as a string.
 */
const getNextInvoiceNumber = (invoices: Invoice[]): string => {
  if (!invoices || invoices.length === 0) {
    return `${new Date().getFullYear()}-001`;
  }

  let maxNum = 0;
  let templatePrefix = '';
  let templatePadding = 1;

  invoices.forEach(({ invoice_number }) => {
    if (!invoice_number) return;
    // Match any numbers in the string, and take the last one
    const numericParts = invoice_number.match(/\d+/g);
    if (!numericParts) return;

    const lastNumStr = numericParts[numericParts.length - 1];
    const num = parseInt(lastNumStr, 10);
    
    // Find the invoice with the highest trailing number
    if (num > maxNum) {
      maxNum = num;
      const lastNumIndex = invoice_number.lastIndexOf(lastNumStr);
      templatePrefix = invoice_number.substring(0, lastNumIndex);
      templatePadding = lastNumStr.length;
    }
  });

  // If no invoice numbers with numeric parts were found at all
  if (maxNum === 0) {
    return `${new Date().getFullYear()}-001`;
  }

  const nextNum = maxNum + 1;
  
  return `${templatePrefix}${String(nextNum).padStart(templatePadding, '0')}`;
};


interface InvoiceFormProps {
  initialInvoice: Invoice | null;
  userProfile: UserProfile;
  customers: Customer[];
  invoices: Invoice[];
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
  isSaving: boolean;
}

const newInvoiceTemplate = (invoices: Invoice[]): Omit<Invoice, 'id'> => ({
  invoice_number: getNextInvoiceNumber(invoices),
  invoice_date: new Date().toISOString().split('T')[0],
  due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customer: { name: '', address: '', city: '', email: '' },
  status: 'open',
  lines: [{ id: uuidv4(), description: '', quantity: 1, unit_price: 0 }],
  btw_percentage: 21,
});

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
};

const getCurrencyFontSizeClass = (amount: number): string => {
    const formattedAmount = formatCurrency(amount);
    const length = formattedAmount.length;

    if (length > 22) return 'text-[0.6em]'; 
    if (length > 18) return 'text-[0.7em]';
    if (length > 14) return 'text-[0.8em]';
    if (length > 11) return 'text-[0.9em]';
    return 'text-[1em]'; 
};


export const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialInvoice, userProfile, customers, invoices, onSave, onCancel, isSaving }) => {
  // Use a state initializer function to create the initial invoice state.
  // This function runs ONLY ONCE when the component mounts.
  // This prevents re-running the logic every time the parent's `invoices` array changes,
  // which was the root cause of the race condition.
  const [invoice, setInvoice] = useState<Invoice>(() => 
    initialInvoice || { ...newInvoiceTemplate(invoices), id: uuidv4() }
  );
  const preventDiscountSignInput = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === '-' || event.key === '+') {
      event.preventDefault();
    }
  };
  
  const [totalAmount, setTotalAmount] = useState(0);
  const [isOverLimit, setIsOverLimit] = useState(false);
  const MAX_INVOICE_TOTAL = 999_999_999; // Maximaal 9 cijfers

  // This useEffect is now ONLY for handling a switch from one invoice to another
  // (e.g., from 'new' to 'edit') while the component is already mounted.
  // It no longer resets the form based on background data changes.
  useEffect(() => {
    if (initialInvoice) {
      setInvoice(initialInvoice);
    }
  }, [initialInvoice]);
  
  useEffect(() => {
    const calculateTotal = (invoiceToCalc: Invoice): number => {
        const subtotal = invoiceToCalc.lines.reduce((acc, line) => {
            return acc + ((line.quantity || 0) * (line.unit_price || 0) * (1 - ((line.discount_percentage || 0) / 100)));
        }, 0);
        const btwAmount = subtotal * ((invoiceToCalc.btw_percentage || 0) / 100);
        return subtotal + btwAmount;
    };
    
    const currentTotal = calculateTotal(invoice);
    setTotalAmount(currentTotal);
    setIsOverLimit(currentTotal > MAX_INVOICE_TOTAL);
  }, [invoice]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: name === 'btw_percentage' ? parseFloat(value) : value }));
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({
        ...prev,
        customer: {
            ...prev.customer,
            [name]: value,
        }
    }));
  };
  
  const handleLineChange = (lineId: string, field: keyof Omit<InvoiceLine, 'id'>, value: string) => {
    setInvoice(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id !== lineId) return line;

        const isNumericField = field === 'quantity' || field === 'unit_price' || field === 'discount_percentage';
        
        if (isNumericField) {
            // Remove any non-numeric characters except decimal point
            const numericValue = value.replace(/[^\d.]/g, '');
            
            // For unit_price, validate maximum 9 digits (excluding decimal point)
            if (field === 'unit_price') {
                // Count digits (excluding decimal point)
                const digitCount = numericValue.replace(/\./g, '').length;
                if (digitCount > 9) {
                    // If more than 9 digits, truncate to 9 digits
                    const parts = numericValue.split('.');
                    const integerPart = parts[0].slice(0, 9);
                    const decimalPart = parts[1] || '';
                    const truncatedValue = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
                    return { ...line, [field]: parseFloat(truncatedValue) || 0 };
                }
            }
            
            return { ...line, [field]: parseFloat(numericValue) || 0 };
        } else { // This block handles 'description'
            return { ...line, [field]: value.slice(0, 30) };
        }
      }),
    }));
  };

  const handleCustomerSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value;
    if (customerId === "") {
        setInvoice(prev => ({
            ...prev,
            customer: { name: '', address: '', city: '', email: '' }
        }));
    } else {
        const selected = customers.find(c => c.id === customerId);
        if (selected) {
            setInvoice(prev => ({
                ...prev,
                customer: {
                    name: selected.name,
                    address: selected.address,
                    city: selected.city,
                    email: selected.email
                }
            }));
        }
    }
  };
  
  const addLine = () => {
    setInvoice(prev => ({
      ...prev,
      lines: [...prev.lines, { id: uuidv4(), description: '', quantity: 1, unit_price: 0, discount_percentage: 0 }],
    }));
  };

  const removeLine = (lineId: string) => {
    setInvoice(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(invoice);
  };
  
  const inputStyle = "block w-full rounded-md border-stone-300 bg-white px-4 py-3 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors hover:border-stone-400";

  return (
    <form onSubmit={handleSubmit} className="h-full flex flex-col p-4 sm:p-6 md:p-8 pb-20 sm:pb-8">
      {/* Header */}
      <header className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 mb-4 gap-4 border-b border-stone-200">
        <div className="flex items-center w-full sm:w-auto">
            <button type="button" onClick={onCancel} className="flex items-center text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors group">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 transition-transform group-hover:-translate-x-1"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                Terug
            </button>
            <span className="ml-4 inline-block px-3 py-1.5 text-sm font-semibold text-zinc-600 bg-stone-200 rounded-md">
                {initialInvoice ? 'Factuur bewerken' : 'Nieuwe factuur'}
            </span>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <button type="button" onClick={onCancel} className="px-5 py-3 text-base font-medium rounded-lg bg-white border border-stone-300 hover:bg-stone-100 text-zinc-700 shadow-sm transition-colors w-1/2 sm:w-auto">
              Annuleren
          </button>
          <button 
            type="submit" 
            disabled={isSaving || isOverLimit}
            className="flex items-center justify-center bg-teal-600 text-white px-5 py-3 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm disabled:bg-teal-400 disabled:cursor-not-allowed w-1/2 sm:w-auto"
            style={{ minWidth: '165px' }}
          >
            {isSaving ? (
                <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Opslaan...
                </>
            ) : (
                <>
                    Factuur opslaan
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-2 -mr-1"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
                </>
            )}
          </button>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 overflow-hidden">
        {/* Left Column: Preview - Hidden on mobile, shown on larger screens */}
        <div className="hidden lg:flex lg:col-span-1 bg-stone-100 p-4 rounded-lg flex-col overflow-hidden">
            <h3 className="text-lg font-semibold text-zinc-800 mb-4 flex-shrink-0">Preview</h3>
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                <div className="bg-white shadow-lg rounded-md overflow-hidden h-full aspect-[210/297]">
                    <InvoicePreview 
                        invoice={invoice}
                        userProfile={userProfile}
                        templateStyle={userProfile.template_style}
                        templateCustomizations={userProfile.template_customizations}
                        previewSize="large"
                    />
                </div>
            </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="lg:col-span-1 overflow-y-auto space-y-4 sm:space-y-6">
            <h2 className="text-xl font-bold text-zinc-800 mb-4">Factuurgegevens</h2>
            <div className="bg-stone-50 p-4 sm:p-5 rounded-lg border border-stone-200 space-y-4">
                <h3 className="font-semibold text-zinc-700 text-lg">Klant</h3>
                 <div>
                    <label htmlFor="customer-select" className="block text-sm font-medium text-zinc-700 mb-2">Selecteer Bestaande Klant</label>
                    <select id="customer-select" onChange={handleCustomerSelect} className={`${inputStyle} mt-0`}>
                        <option value="">-- Nieuwe klant --</option>
                        {customers.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
                 <div>
                    <label htmlFor="customerName" className="block text-sm font-medium text-zinc-700 mb-2">Naam</label>
                    <input type="text" id="customerName" name="name" value={invoice.customer.name} onChange={handleCustomerChange} className={`${inputStyle} mt-0`} required />
                </div>
                <div>
                    <label htmlFor="customerEmail" className="block text-sm font-medium text-zinc-700 mb-2">E-mail</label>
                    <input type="email" id="customerEmail" name="email" value={invoice.customer.email} onChange={handleCustomerChange} className={`${inputStyle} mt-0`} />
                </div>
                <div>
                    <label htmlFor="customerAddress" className="block text-sm font-medium text-zinc-700 mb-2">Adres</label>
                    <input type="text" id="customerAddress" name="address" value={invoice.customer.address} onChange={handleCustomerChange} className={`${inputStyle} mt-0`} />
                </div>
                 <div>
                    <label htmlFor="customerCity" className="block text-sm font-medium text-zinc-700 mb-2">Postcode & Plaats</label>
                    <input type="text" id="customerCity" name="city" value={invoice.customer.city} onChange={handleCustomerChange} className={`${inputStyle} mt-0`} />
                </div>
            </div>

            <div className="bg-stone-50 p-4 sm:p-5 rounded-lg border border-stone-200 space-y-4">
                <h3 className="font-semibold text-zinc-700 text-lg">Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="invoice_number" className="block text-sm font-medium text-zinc-700 mb-2">Factuurnummer</label>
                        <div className="mt-0 flex rounded-md shadow-sm">
                            <input
                                type="text"
                                id="invoice_number"
                                name="invoice_number"
                                value={invoice.invoice_number}
                                onChange={handleChange}
                                className="block w-full rounded-none rounded-l-md border-stone-300 bg-white px-4 py-3 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-colors hover:border-stone-400"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setInvoice(prev => ({...prev, invoice_number: getNextInvoiceNumber(invoices)}))}
                                className="relative -ml-px inline-flex items-center justify-center rounded-r-md border border-stone-300 bg-stone-50 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-stone-100 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
                                title="Genereer volgend nummer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-zinc-700 mb-2">Status</label>
                        <select id="status" name="status" value={invoice.status} onChange={handleChange} className={`${inputStyle} mt-0`}>
                            <option value="open">Open</option>
                            <option value="betaald">Betaald</option>
                            <option value="verlopen">Verlopen</option>
                        </select>
                    </div>
                    <div>
                        <label htmlFor="invoice_date" className="block text-sm font-medium text-zinc-700 mb-2">Factuurdatum</label>
                        <input type="date" id="invoice_date" name="invoice_date" value={invoice.invoice_date} onChange={handleChange} className={`${inputStyle} mt-0`} required />
                    </div>
                    <div>
                        <label htmlFor="due_date" className="block text-sm font-medium text-zinc-700 mb-2">Vervaldatum</label>
                        <input type="date" id="due_date" name="due_date" value={invoice.due_date} onChange={handleChange} className={`${inputStyle} mt-0`} required />
                    </div>
                     <div className="sm:col-span-2">
                        <label htmlFor="btw_percentage" className="block text-sm font-medium text-zinc-700 mb-2">BTW Percentage</label>
                        <input type="number" id="btw_percentage" name="btw_percentage" value={invoice.btw_percentage} onChange={handleChange} className={`${inputStyle} mt-0`} required />
                    </div>
                </div>
            </div>

            <div className="bg-stone-50 p-4 sm:p-5 rounded-lg border border-stone-200">
                <h3 className="font-semibold text-zinc-700 mb-4 text-lg">Factuurregels</h3>
                <div className="space-y-4">
                    {invoice.lines.map((line, index) => {
                       const lineTotal = (line.quantity * line.unit_price) * (1 - ((line.discount_percentage || 0) / 100));
                       return (
                        <div key={line.id} className="bg-white p-4 rounded-lg border border-stone-200 space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="sm:col-span-2">
                                    <label className="block text-xs font-medium text-zinc-700 mb-2">Omschrijving</label>
                                    <input type="text" placeholder="Dienst of product" value={line.description} onChange={(e) => handleLineChange(line.id, 'description', e.target.value)} className={inputStyle} required maxLength={30} />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-2">Aantal</label>
                                    <input type="number" step="any" value={line.quantity} onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-2">Prijs (€)</label>
                                    <input type="number" step="any" value={line.unit_price} onChange={(e) => handleLineChange(line.id, 'unit_price', e.target.value)} className={inputStyle} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-zinc-700 mb-2">Korting (%)</label>
                                    <input
                                        type="number"
                                        step="any"
                                        placeholder="0"
                                        value={line.discount_percentage || ''}
                                        onChange={(e) => handleLineChange(line.id, 'discount_percentage', e.target.value)}
                                        onKeyDown={preventDiscountSignInput}
                                        className={inputStyle}
                                    />
                                </div>
                                <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-stone-200">
                                    <div>
                                        <span className="text-xs font-medium text-zinc-500">Regel totaal:</span>
                                        <p className={`text-lg text-zinc-800 font-semibold ${getCurrencyFontSizeClass(lineTotal)}`}>
                                            {formatCurrency(lineTotal)}
                                        </p>
                                    </div>
                                    {invoice.lines.length > 1 && (
                                        <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700 h-10 w-10 flex items-center justify-center rounded-full hover:bg-red-100 transition-colors text-xl font-bold">
                                            ×
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                       );
                    })}
                </div>
                <button type="button" onClick={addLine} className="mt-4 w-full sm:w-auto px-5 py-3 text-base font-medium text-teal-600 hover:text-teal-800 hover:bg-teal-50 rounded-lg transition-colors border border-teal-200">
                    + Regel toevoegen
                </button>
                 {isOverLimit && (
                    <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-r-md text-sm" role="alert">
                        <p className="font-bold">Limiet overschreden</p>
                        <p>Het totaalbedrag mag niet hoger zijn dan {formatCurrency(MAX_INVOICE_TOTAL)}. Huidig totaal: {formatCurrency(totalAmount)}.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </form>
  );
};
