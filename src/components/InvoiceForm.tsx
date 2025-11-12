import React, { useState, useEffect } from 'react';
import type { Invoice, InvoiceLine, Customer, UserProfile } from '../types';
import { InvoicePreview } from './InvoicePreview';

// A simple UUID generator to avoid external dependencies
const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface InvoiceFormProps {
  initialInvoice: Invoice | null;
  customers: Customer[];
  userProfile: UserProfile;
  onSave: (invoice: Invoice) => void;
  onCancel: () => void;
}

const newInvoiceTemplate = (customers: Customer[]): Omit<Invoice, 'id'> => ({
  invoiceNumber: '',
  invoiceDate: new Date().toISOString().split('T')[0],
  dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  customerId: customers.length > 0 ? customers[0].id : '',
  status: 'open',
  lines: [{ id: uuidv4(), description: '', quantity: 1, unitPrice: 0 }],
  btwPercentage: 21,
});


export const InvoiceForm: React.FC<InvoiceFormProps> = ({ initialInvoice, customers, userProfile, onSave, onCancel }) => {
  const [invoice, setInvoice] = useState<Invoice>(
    initialInvoice || { ...newInvoiceTemplate(customers), id: uuidv4() }
  );
  
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (initialInvoice) {
      setInvoice(initialInvoice);
    } else {
      setInvoice({ ...newInvoiceTemplate(customers), id: uuidv4() });
    }
  }, [initialInvoice, customers]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInvoice(prev => ({ ...prev, [name]: name === 'btwPercentage' ? parseFloat(value) : value }));
  };
  
  const handleLineChange = (lineId: string, field: keyof Omit<InvoiceLine, 'id'>, value: string) => {
    setInvoice(prev => ({
      ...prev,
      lines: prev.lines.map(line => {
        if (line.id !== lineId) return line;

        if (field === 'description') {
          return { ...line, [field]: value };
        } else {
          // For quantity or unitPrice, parse the string value into a number.
          return { ...line, [field]: parseFloat(value) || 0 };
        }
      }),
    }));
  };
  
  const addLine = () => {
    setInvoice(prev => ({
      ...prev,
      lines: [...prev.lines, { id: uuidv4(), description: '', quantity: 1, unitPrice: 0 }],
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
  
  const selectedCustomer = customers.find(c => c.id === invoice.customerId);
  const inputStyle = "mt-1 block w-full rounded-md border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500";

  if (showPreview) {
    return (
        <div className="bg-white rounded-lg border border-slate-200">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                <h2 className="text-xl font-bold">Factuur Voorbeeld</h2>
                <button onClick={() => setShowPreview(false)} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                    Terug naar bewerken
                </button>
            </div>
            <InvoicePreview 
                invoice={invoice}
                customer={selectedCustomer}
                userProfile={userProfile}
                templateStyle={userProfile.templateStyle}
            />
        </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{initialInvoice ? 'Factuur Bewerken' : 'Nieuwe Factuur'}</h1>
        <div className="flex items-center space-x-4">
            <button type="button" onClick={() => setShowPreview(true)} className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
                Voorbeeld
            </button>
            <button type="button" onClick={onCancel} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                Annuleren
            </button>
            <button type="submit" className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-700">
                Factuur Opslaan
            </button>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Algemene Informatie</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                  <label htmlFor="customerId" className="block text-sm font-medium text-slate-700">Klant</label>
                  <select id="customerId" name="customerId" value={invoice.customerId} onChange={handleChange} className={inputStyle}>
                      {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
              </div>
              <div>
                  <label htmlFor="invoiceNumber" className="block text-sm font-medium text-slate-700">Factuurnummer</label>
                  <input type="text" id="invoiceNumber" name="invoiceNumber" value={invoice.invoiceNumber} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                  <label htmlFor="status" className="block text-sm font-medium text-slate-700">Status</label>
                  <select id="status" name="status" value={invoice.status} onChange={handleChange} className={inputStyle}>
                      <option value="open">Open</option>
                      <option value="betaald">Betaald</option>
                      <option value="verlopen">Verlopen</option>
                  </select>
              </div>
              <div>
                  <label htmlFor="invoiceDate" className="block text-sm font-medium text-slate-700">Factuurdatum</label>
                  <input type="date" id="invoiceDate" name="invoiceDate" value={invoice.invoiceDate} onChange={handleChange} className={inputStyle} required />
              </div>
              <div>
                  <label htmlFor="dueDate" className="block text-sm font-medium text-slate-700">Vervaldatum</label>
                  <input type="date" id="dueDate" name="dueDate" value={invoice.dueDate} onChange={handleChange} className={inputStyle} required />
              </div>
               <div>
                  <label htmlFor="btwPercentage" className="block text-sm font-medium text-slate-700">BTW Percentage</label>
                  <input type="number" id="btwPercentage" name="btwPercentage" value={invoice.btwPercentage} onChange={handleChange} className={inputStyle} required />
              </div>
          </div>
      </div>

      <div className="bg-white p-6 rounded-lg border border-slate-200">
          <h2 className="text-lg font-semibold mb-4">Factuurregels</h2>
          <div className="space-y-4">
              {invoice.lines.map((line, index) => (
                  <div key={line.id} className="grid grid-cols-12 gap-x-4 items-center">
                      <div className="col-span-6">
                          {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Omschrijving</label>}
                          <input type="text" placeholder="Dienst of product" value={line.description} onChange={(e) => handleLineChange(line.id, 'description', e.target.value)} className={inputStyle.replace('mt-1', '')} required />
                      </div>
                      <div className="col-span-2">
                          {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Aantal</label>}
                          <input type="number" step="any" value={line.quantity} onChange={(e) => handleLineChange(line.id, 'quantity', e.target.value)} className={inputStyle.replace('mt-1', '')} required />
                      </div>
                      <div className="col-span-2">
                          {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Prijs p.s.</label>}
                          <input type="number" step="any" value={line.unitPrice} onChange={(e) => handleLineChange(line.id, 'unitPrice', e.target.value)} className={inputStyle.replace('mt-1', '')} required />
                      </div>
                      <div className="col-span-1 text-right">
                          {index === 0 && <label className="block text-xs font-medium text-slate-500 mb-1">Totaal</label>}
                          <span className="text-sm">€{(line.quantity * line.unitPrice).toFixed(2)}</span>
                      </div>
                      <div className="col-span-1 flex justify-end items-center">
                        {index === 0 && <div className="h-4 mb-1"></div>}
                        {invoice.lines.length > 1 && (
                            <button type="button" onClick={() => removeLine(line.id)} className="text-red-500 hover:text-red-700 h-8 w-8 flex items-center justify-center rounded-full hover:bg-red-50">
                                &#x2715;
                            </button>
                        )}
                      </div>
                  </div>
              ))}
          </div>
          <button type="button" onClick={addLine} className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-800">
              + Regel toevoegen
          </button>
      </div>
    </form>
  );
};
