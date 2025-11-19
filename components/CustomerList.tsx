import React, { useState, useMemo } from 'react';
import type { Customer } from '../types';

interface CustomerListProps {
    customers: Customer[];
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onAddNew: () => void;
}

const Avatar: React.FC<{ name: string }> = ({ name }) => {
    const initials = name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    return (
        <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-teal-100 text-teal-700 font-semibold text-sm">
            {initials || '?'}
        </div>
    );
};

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete, onAddNew }) => {
    const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    const openDeleteModal = (id: string) => setCustomerToDelete(id);
    const closeDeleteModal = () => setCustomerToDelete(null);

    const confirmDelete = () => {
        if (customerToDelete) {
            onDelete(customerToDelete);
        }
        closeDeleteModal();
    };
    
    const filteredCustomers = useMemo(() =>
        customers.filter(customer =>
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()))
        ), [customers, searchQuery]);

    return (
        <>
            <div className="bg-stone-50 p-4 sm:p-6 lg:p-8 rounded-lg border border-stone-200">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <h1 className="text-2xl font-bold">Klanten</h1>
                    <div className="flex flex-col sm:flex-row items-center w-full md:w-auto gap-4">
                        <div className="w-full sm:w-64">
                            <label htmlFor="search-customers" className="sr-only">Zoek klanten</label>
                            <input
                                id="search-customers"
                                type="text"
                                placeholder="Zoek op naam of e-mail..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-base placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                            />
                        </div>
                        <button onClick={onAddNew} className="flex-shrink-0 w-full sm:w-auto flex items-center justify-center bg-teal-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Nieuwe Klant
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[640px] md:min-w-full">
                        <thead>
                            <tr className="border-b border-stone-200 bg-stone-100">
                                <th className="p-3 text-base font-semibold text-zinc-600">Naam</th>
                                <th className="p-3 text-base font-semibold text-zinc-600">Contact</th>
                                <th className="p-3 text-base font-semibold text-zinc-600 hidden sm:table-cell">Adres</th>
                                <th className="p-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCustomers.length > 0 ? filteredCustomers.map(customer => (
                                <tr key={customer.id} className="border-b border-stone-100 hover:bg-stone-100">
                                    <td className="p-3 text-base font-medium text-zinc-800">
                                        <div className="flex items-center gap-3">
                                            <Avatar name={customer.name} />
                                            <span className="truncate max-w-xs">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-3 text-base text-zinc-600 truncate max-w-xs">{customer.email}</td>
                                    <td className="p-3 text-base text-zinc-600 hidden sm:table-cell">{customer.city}</td>
                                    <td className="p-3 text-right whitespace-nowrap">
                                        <button onClick={() => onEdit(customer.id)} className="text-sm font-medium text-teal-600 hover:text-teal-800 mr-4">Bewerken</button>
                                        <button onClick={() => openDeleteModal(customer.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Verwijderen</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={4} className="text-center py-16">
                                        <h3 className="text-base font-semibold text-zinc-800">Geen klanten gevonden</h3>
                                        {searchQuery ? (
                                             <p className="mt-1 text-base text-zinc-500">Je zoekopdracht voor "{searchQuery}" heeft geen resultaten opgeleverd.</p>
                                        ) : (
                                             <p className="mt-1 text-base text-zinc-500">Begin met het toevoegen van je eerste klant.</p>
                                        )}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {customerToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
                    <div className="bg-stone-50 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                        <div className="sm:flex sm:items-start">
                             <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                <h3 className="text-lg leading-6 font-bold text-zinc-900" id="delete-modal-title">Klant Verwijderen</h3>
                                <p className="text-sm text-zinc-600 mt-2">Weet je zeker dat je deze klant wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.</p>
                            </div>
                        </div>
                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                            <button onClick={confirmDelete} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm">Verwijderen</button>
                            <button onClick={closeDeleteModal} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-stone-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-zinc-700 hover:bg-stone-100 sm:mt-0 sm:w-auto sm:text-sm">Annuleren</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
