import React, { useState, useEffect } from 'react';
import type { Customer } from '../types';

type CustomerType = 'bedrijf' | 'persoon';

type CustomerFormData = Omit<Customer, 'id' | 'user_id' | 'created_at'> & {
    customer_type?: CustomerType;
    kvk_number?: string;
    btw_number?: string;
    phone_number?: string;
    address_line_2?: string;
    postal_code?: string;
    country?: string;
    preferred_language?: string;
};

interface CustomerFormProps {
    initialCustomer: Customer | null;
    onSave: (customer: CustomerFormData) => void;
    onCancel: () => void;
}

const emptyCustomer: CustomerFormData = {
    name: '',
    email: '',
    address: '',
    city: '',
    customer_type: 'bedrijf',
    kvk_number: '',
    btw_number: '',
    phone_number: '',
    address_line_2: '',
    postal_code: '',
    country: '',
    preferred_language: 'Nederlands'
};

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialCustomer, onSave, onCancel }) => {
    const [customer, setCustomer] = useState<CustomerFormData>(emptyCustomer);
    const [customerType, setCustomerType] = useState<CustomerType>('bedrijf');
    
    useEffect(() => {
        if (initialCustomer) {
            setCustomer({
                name: initialCustomer.name || '',
                email: initialCustomer.email || '',
                address: initialCustomer.address || '',
                city: initialCustomer.city || '',
                customer_type: (initialCustomer as any).customer_type || 'bedrijf',
                kvk_number: (initialCustomer as any).kvk_number || '',
                btw_number: (initialCustomer as any).btw_number || '',
                phone_number: (initialCustomer as any).phone_number || '',
                address_line_2: (initialCustomer as any).address_line_2 || '',
                postal_code: (initialCustomer as any).postal_code || '',
                country: (initialCustomer as any).country || '',
                preferred_language: (initialCustomer as any).preferred_language || 'Nederlands'
            });
            setCustomerType((initialCustomer as any).customer_type || 'bedrijf');
        } else {
            setCustomer(emptyCustomer);
            setCustomerType('bedrijf');
        }
    }, [initialCustomer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleTypeChange = (type: CustomerType) => {
        setCustomerType(type);
        setCustomer(prev => ({ ...prev, customer_type: type }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ ...customer, customer_type: customerType });
    };

    const inputStyle = "mt-1 block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors hover:border-stone-400";

    return (
        <div className="h-full flex flex-col items-center p-4 sm:p-6 md:p-8">
            <div className="w-full max-w-2xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900">Klant toevoegen</h1>
                    <button 
                        type="button" 
                        onClick={onCancel}
                        className="text-zinc-600 hover:text-zinc-900 transition-colors p-2"
                        aria-label="Sluiten"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
                    {/* Customer Type Selection */}
                    <div className="mb-6">
                        <div className="inline-flex rounded-lg border border-stone-300 bg-white p-1 shadow-sm">
                            <button
                                type="button"
                                onClick={() => handleTypeChange('bedrijf')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    customerType === 'bedrijf'
                                        ? 'bg-stone-800 text-white'
                                        : 'bg-white text-zinc-700 hover:text-zinc-900'
                                }`}
                            >
                                <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                                    customerType === 'bedrijf'
                                        ? 'border-white'
                                        : 'border-stone-300'
                                }`}>
                                    {customerType === 'bedrijf' && (
                                        <span className="w-2 h-2 rounded-full bg-white"></span>
                                    )}
                                </span>
                                Bedrijf
                            </button>
                            <button
                                type="button"
                                onClick={() => handleTypeChange('persoon')}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center ${
                                    customerType === 'persoon'
                                        ? 'bg-stone-800 text-white'
                                        : 'bg-white text-zinc-700 hover:text-zinc-900'
                                }`}
                            >
                                <span className={`inline-block w-4 h-4 rounded-full border-2 mr-2 flex items-center justify-center ${
                                    customerType === 'persoon'
                                        ? 'border-white'
                                        : 'border-stone-300'
                                }`}>
                                    {customerType === 'persoon' && (
                                        <span className="w-2 h-2 rounded-full bg-white"></span>
                                    )}
                                </span>
                                Persoon
                            </button>
                        </div>
                    </div>

                {/* Form Fields */}
                <div className="flex-1 space-y-6 overflow-y-auto">
                    {/* Bedrijfsnaam / Naam */}
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-zinc-700 mb-1">
                            {customerType === 'bedrijf' ? 'Bedrijfsnaam' : 'Naam'}
                        </label>
                        <input 
                            type="text" 
                            id="name" 
                            name="name" 
                            value={customer.name} 
                            onChange={handleChange} 
                            className={inputStyle} 
                            required 
                        />
                    </div>

                    {/* KvK-nummer and Btw-nummer */}
                    {customerType === 'bedrijf' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="kvk_number" className="block text-sm font-medium text-zinc-700 mb-1">
                                    KvK-nummer <span className="text-zinc-500 font-normal">(optioneel)</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="kvk_number" 
                                    name="kvk_number" 
                                    value={customer.kvk_number || ''} 
                                    onChange={handleChange} 
                                    className={inputStyle} 
                                />
                            </div>
                            <div>
                                <label htmlFor="btw_number" className="block text-sm font-medium text-zinc-700 mb-1">
                                    Btw-nummer <span className="text-zinc-500 font-normal">(optioneel)</span>
                                </label>
                                <input 
                                    type="text" 
                                    id="btw_number" 
                                    name="btw_number" 
                                    value={customer.btw_number || ''} 
                                    onChange={handleChange} 
                                    className={inputStyle} 
                                />
                            </div>
                        </div>
                    )}

                    {/* E-mail and Telefoonnummer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
                                E-mail
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline-block ml-1 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </label>
                            <input 
                                type="email" 
                                id="email" 
                                name="email" 
                                value={customer.email} 
                                onChange={handleChange} 
                                className={`${inputStyle} bg-stone-50`}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone_number" className="block text-sm font-medium text-zinc-700 mb-1">
                                Telefoonnummer <span className="text-zinc-500 font-normal">(optioneel)</span>
                            </label>
                            <input 
                                type="tel" 
                                id="phone_number" 
                                name="phone_number" 
                                value={customer.phone_number || ''} 
                                onChange={handleChange} 
                                className={inputStyle} 
                            />
                        </div>
                    </div>

                    {/* Straatnaam en huisnummer and Adresregel 2 */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium text-zinc-700 mb-1">
                                Straatnaam en huisnummer
                            </label>
                            <input 
                                type="text" 
                                id="address" 
                                name="address" 
                                value={customer.address} 
                                onChange={handleChange} 
                                className={inputStyle} 
                            />
                        </div>
                        <div>
                            <label htmlFor="address_line_2" className="block text-sm font-medium text-zinc-700 mb-1">
                                Adresregel 2 <span className="text-zinc-500 font-normal">(optioneel)</span>
                            </label>
                            <input 
                                type="text" 
                                id="address_line_2" 
                                name="address_line_2" 
                                value={customer.address_line_2 || ''} 
                                onChange={handleChange} 
                                className={inputStyle} 
                            />
                        </div>
                    </div>

                    {/* Postcode and Stad */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="postal_code" className="block text-sm font-medium text-zinc-700 mb-1">
                                Postcode
                            </label>
                            <input 
                                type="text" 
                                id="postal_code" 
                                name="postal_code" 
                                value={customer.postal_code || ''} 
                                onChange={handleChange} 
                                className={inputStyle} 
                            />
                        </div>
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium text-zinc-700 mb-1">
                                Stad
                            </label>
                            <input 
                                type="text" 
                                id="city" 
                                name="city" 
                                value={customer.city} 
                                onChange={handleChange} 
                                className={inputStyle} 
                            />
                        </div>
                    </div>

                    {/* Land and Voorkeurstaal */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="country" className="block text-sm font-medium text-zinc-700 mb-1">
                                Land
                            </label>
                            <select 
                                id="country" 
                                name="country" 
                                value={customer.country || ''} 
                                onChange={handleChange} 
                                className={inputStyle}
                            >
                                <option value="">Selecteer land</option>
                                <option value="Nederland">Nederland</option>
                                <option value="België">België</option>
                                <option value="Duitsland">Duitsland</option>
                                <option value="Frankrijk">Frankrijk</option>
                                <option value="Verenigd Koninkrijk">Verenigd Koninkrijk</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="preferred_language" className="block text-sm font-medium text-zinc-700 mb-1">
                                Voorkeurstaal
                            </label>
                            <select 
                                id="preferred_language" 
                                name="preferred_language" 
                                value={customer.preferred_language || 'Nederlands'} 
                                onChange={handleChange} 
                                className={inputStyle}
                            >
                                <option value="Nederlands">Nederlands</option>
                                <option value="Engels">Engels</option>
                                <option value="Duits">Duits</option>
                                <option value="Frans">Frans</option>
                            </select>
                        </div>
                    </div>
                </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-4 pt-6 border-t border-stone-200 mt-6">
                        <button 
                            type="button" 
                            onClick={onCancel}
                            className="px-5 py-2.5 rounded-lg bg-white border border-stone-300 text-zinc-700 font-medium hover:bg-stone-50 transition-colors"
                        >
                            Annuleren
                        </button>
                    <button 
                        type="submit"
                        className="px-5 py-2.5 rounded-lg bg-teal-600 text-white font-medium hover:bg-teal-700 transition-colors"
                    >
                        Opslaan
                    </button>
                    </div>
                </form>
            </div>
        </div>
    );
};