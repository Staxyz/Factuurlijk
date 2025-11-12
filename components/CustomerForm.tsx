import React, { useState, useEffect } from 'react';
import type { Customer } from '../types';

type CustomerFormData = Omit<Customer, 'id' | 'user_id' | 'created_at'>;

interface CustomerFormProps {
    initialCustomer: Customer | null;
    onSave: (customer: CustomerFormData) => void;
    onCancel: () => void;
}

const emptyCustomer: CustomerFormData = {
    name: '',
    email: '',
    address: '',
    city: ''
};

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialCustomer, onSave, onCancel }) => {
    const [customer, setCustomer] = useState<CustomerFormData>(emptyCustomer);
    
    useEffect(() => {
        if (initialCustomer) {
            setCustomer({
                name: initialCustomer.name,
                email: initialCustomer.email,
                address: initialCustomer.address,
                city: initialCustomer.city
            });
        } else {
            setCustomer(emptyCustomer);
        }
    }, [initialCustomer]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCustomer(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(customer);
    };

    const inputStyle = "mt-1 block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-base placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors hover:border-stone-400";

    return (
        <div className="bg-stone-50 p-6 sm:p-8 rounded-lg border border-stone-200 max-w-2xl mx-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">{initialCustomer ? 'Klant Bewerken' : 'Nieuwe Klant'}</h1>
                    <div className="flex items-center space-x-4">
                        <button type="button" onClick={onCancel} className="text-base font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Annuleren</button>
                        <button type="submit" className="rounded-md bg-teal-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-teal-700 transition-all duration-200 hover:shadow-md hover:-translate-y-px">Klant Opslaan</button>
                    </div>
                </div>

                <div className="pt-4 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="name" className="block text-base font-medium text-zinc-700">Naam</label>
                            <input type="text" id="name" name="name" value={customer.name} onChange={handleChange} className={inputStyle} required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-base font-medium text-zinc-700">E-mail</label>
                            <input type="email" id="email" name="email" value={customer.email} onChange={handleChange} className={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="address" className="block text-base font-medium text-zinc-700">Adres</label>
                        <input type="text" id="address" name="address" value={customer.address} onChange={handleChange} className={inputStyle} />
                    </div>
                    <div>
                        <label htmlFor="city" className="block text-base font-medium text-zinc-700">Postcode & Plaats</label>
                        <input type="text" id="city" name="city" value={customer.city} onChange={handleChange} className={inputStyle} />
                    </div>
                </div>
            </form>
        </div>
    );
};