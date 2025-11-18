import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import type { Invoice, UserProfile, View } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceListProps {
  invoices: Invoice[];
  userProfile: UserProfile;
  onView: (invoiceId: string) => void;
  onEdit: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
  onBulkDelete: (invoiceIds: string[]) => void;
  onBulkMarkAsPaid: (invoiceIds: string[]) => void;
  onAddNew: () => void;
  isFreePlanLimitReached: boolean;
  setCurrentView: (view: View) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nl-NL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const getStatusChip = (status: 'betaald' | 'open' | 'verlopen') => {
    switch (status) {
        case 'betaald':
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">Betaald</span>;
        case 'open':
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">Open</span>;
        case 'verlopen':
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">Verlopen</span>;
    }
};

type StatusFilter = 'all' | 'betaald' | 'open' | 'verlopen';
const statusFilters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: 'Alles' },
    { id: 'open', label: 'Open' },
    { id: 'betaald', label: 'Betaald' },
    { id: 'verlopen', label: 'Verlopen' },
];

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices, userProfile, onView, onEdit, onDelete, onMarkAsPaid, onBulkDelete, onBulkMarkAsPaid, onAddNew, isFreePlanLimitReached, setCurrentView }) => {
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<string | null>(null);
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  
  // Bulk action states
  const [isGeneratingBulkPdf, setIsGeneratingBulkPdf] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  const handleDownloadPdf = async (invoice: Invoice) => {
    setIsGeneratingPdf(invoice.id);
  
    const invoiceElement = document.createElement('div');
    invoiceElement.style.position = 'absolute';
    invoiceElement.style.left = '-9999px';
    invoiceElement.style.width = '210mm';
    invoiceElement.style.height = '297mm';
    invoiceElement.style.backgroundColor = 'white';
    document.body.appendChild(invoiceElement);
  
    const root = ReactDOM.createRoot(invoiceElement);
    root.render(
      <React.StrictMode>
        <InvoicePreview
          invoice={invoice}
          userProfile={userProfile}
          templateStyle={userProfile.template_style}
          templateCustomizations={userProfile.template_customizations}
          isPdfMode={true}
          previewSize="large"
        />
      </React.StrictMode>
    );
  
    // Wait for React to render
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Wait for all images in the invoice element to fully load
    const images = invoiceElement.querySelectorAll('img');
    if (images.length > 0) {
        console.log(`Waiting for ${images.length} image(s) to load...`);
        
        await Promise.all(
            Array.from(images).map((img: HTMLImageElement, index) => {
                return new Promise<void>((resolve) => {
                    const imgSrc = img.src.substring(0, 50);
                    console.log(`Image ${index + 1}: src=${imgSrc}..., complete=${img.complete}, naturalWidth=${img.naturalWidth}, naturalHeight=${img.naturalHeight}`);
                    
                    // Check if image is already loaded and has content
                    if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                        console.log(`Image ${index + 1} already loaded`);
                        resolve();
                        return;
                    }
                    
                    // Wait for image to load
                    const onLoad = () => {
                        img.removeEventListener('load', onLoad);
                        img.removeEventListener('error', onError);
                        // Double check that image has content
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            console.log(`Image ${index + 1} loaded successfully: ${img.naturalWidth}x${img.naturalHeight}`);
                            resolve();
                        } else {
                            console.warn(`Image ${index + 1} loaded but has no dimensions`);
                            // If no content, wait a bit more and resolve anyway
                            setTimeout(resolve, 500);
                        }
                    };
                    
                    const onError = (e: Event) => {
                        img.removeEventListener('load', onLoad);
                        img.removeEventListener('error', onError);
                        console.error(`Image ${index + 1} failed to load:`, e);
                        resolve(); // Continue even if image fails to load
                    };
                    
                    img.addEventListener('load', onLoad);
                    img.addEventListener('error', onError);
                    
                    // If image src is set but not complete, trigger load by setting src again
                    if (img.src && !img.complete) {
                        const currentSrc = img.src;
                        img.src = '';
                        img.src = currentSrc;
                    }
                    
                    // Max wait time of 10 seconds per image
                    setTimeout(() => {
                        img.removeEventListener('load', onLoad);
                        img.removeEventListener('error', onError);
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            console.log(`Image ${index + 1} loaded after timeout`);
                        } else {
                            console.warn(`Image ${index + 1} timeout - continuing anyway`);
                        }
                        resolve();
                    }, 10000);
                });
            })
        );
        
        // Additional wait to ensure everything is rendered
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Convert ALL images to base64 (both blob URLs and public URLs)
        console.log('Converting images to base64...');
        for (const img of Array.from(images) as HTMLImageElement[]) {
            if (img.src && img.naturalWidth > 0 && img.naturalHeight > 0) {
                try {
                    // Create a canvas to convert any image source to base64
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        
                        // Draw the image to canvas
                        ctx.drawImage(img, 0, 0);
                        
                        // Convert to base64
                        const base64 = canvas.toDataURL('image/png');
                        console.log(`Converted image to base64: ${base64.substring(0, 50)}...`);
                        
                        // Update the image src to base64
                        img.src = base64;
                        
                        // Wait a bit for the image to update
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }
                } catch (e) {
                    console.error('Could not convert image to base64:', e, img.src);
                }
            } else {
                console.warn('Skipping image conversion - no dimensions:', img.src);
            }
        }
        
        // Final wait after conversion
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('All images processed, generating PDF...');
    }
  
    try {
        const canvas = await html2canvas(invoiceElement, {
            scale: 4,
            useCORS: true,
            allowTaint: false, // Changed to false for better image rendering
            logging: false,
            imageTimeout: 20000,
            removeContainer: false,
            backgroundColor: '#ffffff',
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4',
        });
    
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Factuur-${invoice.invoice_number}.pdf`);
    } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Er is een fout opgetreden bij het genereren van de PDF.");
    } finally {
        root.unmount();
        document.body.removeChild(invoiceElement);
        setIsGeneratingPdf(null);
    }
  };

  const openDeleteModal = (invoiceId: string) => {
    setInvoiceToDelete(invoiceId);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setInvoiceToDelete(null);
    setShowDeleteModal(false);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      onDelete(invoiceToDelete);
    }
    closeDeleteModal();
  };
  
  const calculateTotal = (invoice: Invoice) => {
    const subtotal = invoice.lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    return subtotal * (1 + invoice.btw_percentage / 100);
  };

  const filteredAndSortedInvoices = useMemo(() => {
    let filteredInvoices = invoices.filter(invoice => {
        // Search filter
        const customerName = invoice.customer.name.toLowerCase();
        const invoiceNumber = invoice.invoice_number.toLowerCase();
        const query = searchQuery.toLowerCase();
        const matchesSearch = customerName.includes(query) || invoiceNumber.includes(query);

        // Status filter
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    let sortableInvoices = [...filteredInvoices];
    if (sortConfig !== null) {
      sortableInvoices.sort((a, b) => {
        const getSortableValue = (invoice: Invoice, key: string): string | number => {
          switch (key) {
            case 'customerName': return invoice.customer.name;
            case 'total': return calculateTotal(invoice);
            case 'invoice_date': return new Date(invoice.invoice_date).getTime();
            case 'invoice_number': return invoice.invoice_number;
            default: return '';
          }
        };

        const aValue = getSortableValue(a, sortConfig.key);
        const bValue = getSortableValue(b, sortConfig.key);

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.localeCompare(bValue, 'nl-NL', { numeric: true });
          return sortConfig.direction === 'ascending' ? comparison : -comparison;
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableInvoices;
  }, [invoices, sortConfig, searchQuery, statusFilter]);

  useEffect(() => {
    if (headerCheckboxRef.current) {
        const numSelected = selectedInvoices.length;
        const numInvoices = filteredAndSortedInvoices.length;
        headerCheckboxRef.current.checked = numSelected === numInvoices && numInvoices > 0;
        headerCheckboxRef.current.indeterminate = numSelected > 0 && numSelected < numInvoices;
    }
  }, [selectedInvoices, filteredAndSortedInvoices]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
        setSelectedInvoices(filteredAndSortedInvoices.map(inv => inv.id));
    } else {
        setSelectedInvoices([]);
    }
  };

  const handleSelectOne = (invoiceId: string) => {
    setSelectedInvoices(prevSelected => {
        if (prevSelected.includes(invoiceId)) {
            return prevSelected.filter(id => id !== invoiceId);
        } else {
            return [...prevSelected, invoiceId];
        }
    });
  };

  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) return null;
    return <span className="ml-1">{sortConfig.direction === 'ascending' ? '▲' : '▼'}</span>;
  };
  
  // Bulk action handlers
  const handleBulkMarkPaid = () => {
    onBulkMarkAsPaid(selectedInvoices);
    setSelectedInvoices([]);
  };

  const handleBulkDownload = async () => {
    const invoicesToDownload = invoices.filter(inv => selectedInvoices.includes(inv.id));
    if (invoicesToDownload.length === 0) return;

    setIsGeneratingBulkPdf(true);
    for (const invoice of invoicesToDownload) {
      await handleDownloadPdf(invoice);
      await new Promise(resolve => setTimeout(resolve, 200)); // Small delay for browser
    }
    setIsGeneratingBulkPdf(false);
    setSelectedInvoices([]);
  };

  const openBulkDeleteModal = () => setShowBulkDeleteModal(true);
  const closeBulkDeleteModal = () => setShowBulkDeleteModal(false);
  const confirmBulkDelete = () => {
    onBulkDelete(selectedInvoices);
    setSelectedInvoices([]);
    closeBulkDeleteModal();
  };

  const handleNewInvoiceClick = () => {
    if (isFreePlanLimitReached) {
        alert('Je hebt je limiet van 3 facturen bereikt. Upgrade naar Pro om onbeperkt facturen te maken.');
        setCurrentView('upgrade');
    } else {
        onAddNew();
    }
  };


  return (
    <>
      <div className="bg-stone-50 p-4 sm:p-6 lg:p-8 rounded-lg border border-stone-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <h1 className="text-2xl font-bold text-zinc-800">Facturen</h1>
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
                <div className="w-full sm:w-64">
                    <label htmlFor="search-invoices" className="sr-only">Zoek facturen</label>
                    <input
                      id="search-invoices"
                      type="text"
                      placeholder="Zoek op nr. of klant..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="block w-full rounded-md border-stone-300 bg-white px-3 py-2 text-base placeholder:text-zinc-400 shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                </div>
                <button onClick={handleNewInvoiceClick} className="flex-shrink-0 flex items-center justify-center bg-teal-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-700 transition-colors shadow-sm w-full sm:w-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2 -ml-1"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    Nieuwe factuur
                </button>
            </div>
        </div>
        
        {/* Advanced Filters */}
        <div className="mb-6">
          <div className="border-b border-stone-200">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {statusFilters.map((tab) => (
                      <button
                          key={tab.id}
                          onClick={() => setStatusFilter(tab.id)}
                          className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-base transition-colors ${
                              statusFilter === tab.id
                                  ? 'border-teal-500 text-teal-600'
                                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:border-stone-300'
                          }`}
                          aria-current={statusFilter === tab.id ? 'page' : undefined}
                      >
                          {tab.label}
                      </button>
                  ))}
              </nav>
          </div>
        </div>

        {/* Bulk Action Bar */}
        {selectedInvoices.length > 0 && (
            <div className="bg-sky-100 border-l-4 border-sky-500 rounded-r-lg p-3 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between shadow-sm">
                <p className="text-base font-medium text-sky-800 mb-2 sm:mb-0">
                    {selectedInvoices.length} factu{selectedInvoices.length === 1 ? 'uur' : 'uren'} geselecteerd
                </p>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                    <button
                        onClick={handleBulkMarkPaid}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                        Markeer als Betaald
                    </button>
                    <button
                        onClick={handleBulkDownload}
                        disabled={isGeneratingBulkPdf}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-wait"
                    >
                        {isGeneratingBulkPdf ? 'Bezig...' : 'Download PDFs'}
                    </button>
                    <button
                        onClick={openBulkDeleteModal}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                        Verwijder
                    </button>
                    <button
                        onClick={() => setSelectedInvoices([])}
                        className="px-3 py-1.5 text-sm font-medium rounded-md bg-white border border-stone-300 text-zinc-700 hover:bg-stone-100 transition-colors"
                    >
                        Deselecteer
                    </button>
                </div>
            </div>
        )}

        <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px] md:min-w-full">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-100">
                  <th className="p-3">
                    <input
                      type="checkbox"
                      ref={headerCheckboxRef}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                      style={{ colorScheme: 'light' }}
                    />
                  </th>
                  <th className="p-3 text-base font-semibold text-zinc-600 cursor-pointer" onClick={() => requestSort('invoice_number')}>
                    <div className="flex items-center">Nummer{getSortIndicator('invoice_number')}</div>
                  </th>
                  <th className="p-3 text-base font-semibold text-zinc-600 cursor-pointer" onClick={() => requestSort('customerName')}>
                    <div className="flex items-center">Klant{getSortIndicator('customerName')}</div>
                  </th>
                  <th className="p-3 text-base font-semibold text-zinc-600 cursor-pointer hidden md:table-cell" onClick={() => requestSort('invoice_date')}>
                    <div className="flex items-center">Datum{getSortIndicator('invoice_date')}</div>
                  </th>
                  <th className="p-3 text-base font-semibold text-zinc-600 text-right cursor-pointer" onClick={() => requestSort('total')}>
                    <div className="flex items-center justify-end">Totaal{getSortIndicator('total')}</div>
                  </th>
                  <th className="p-3 text-base font-semibold text-zinc-600 text-center">Status</th>
                  <th className="p-3 text-base font-semibold text-zinc-600 text-right">Acties</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedInvoices.length > 0 && filteredAndSortedInvoices.map(invoice => (
                  <tr key={invoice.id} className={`border-b border-stone-100 hover:bg-stone-100 cursor-pointer ${selectedInvoices.includes(invoice.id) ? 'bg-blue-50 hover:bg-blue-100' : ''}`} onClick={() => onView(invoice.id)}>
                    <td className="p-3" onClick={e => e.stopPropagation()}>
                        <input
                            type="checkbox"
                            checked={selectedInvoices.includes(invoice.id)}
                            onChange={() => handleSelectOne(invoice.id)}
                            className="h-4 w-4 rounded border-gray-300 bg-white text-blue-600 focus:ring-blue-500"
                            style={{ colorScheme: 'light' }}
                        />
                    </td>
                    <td className="p-3 text-base font-medium text-zinc-800">{invoice.invoice_number}</td>
                    <td className="p-3 text-base text-zinc-600 truncate max-w-xs">{invoice.customer.name}</td>
                    <td className="p-3 text-base text-zinc-600 hidden md:table-cell">{formatDate(invoice.invoice_date)}</td>
                    <td className="p-3 text-base font-medium text-zinc-800 text-right">{formatCurrency(calculateTotal(invoice))}</td>
                    <td className="p-3 text-base text-center">{getStatusChip(invoice.status)}</td>
                    <td className="p-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
                      <button 
                          onClick={() => handleDownloadPdf(invoice)} 
                          disabled={!!isGeneratingPdf}
                          className="text-sm font-medium text-blue-600 hover:text-blue-800 mr-4 disabled:text-zinc-400 disabled:cursor-wait"
                          title="Download PDF"
                      >
                          {isGeneratingPdf === invoice.id ? 'Bezig...' : 'Download PDF'}
                      </button>
                      {(invoice.status === 'open' || invoice.status === 'verlopen') && (
                          <button onClick={() => onMarkAsPaid(invoice.id)} className="text-sm font-medium text-green-600 hover:text-green-800 mr-4">Markeer als Betaald</button>
                      )}
                      <button onClick={() => onEdit(invoice.id)} className="text-sm font-medium text-teal-600 hover:text-teal-800 mr-4">Bewerken</button>
                      <button onClick={() => openDeleteModal(invoice.id)} className="text-sm font-medium text-red-600 hover:text-red-800">Verwijderen</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAndSortedInvoices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-zinc-500">Geen facturen gevonden die aan je filters voldoen.</p>
              </div>
            )}
        </div>
      </div>
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="delete-modal-title">
          <div className="bg-stone-50 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-bold text-zinc-900" id="delete-modal-title">
                        Factuur Verwijderen
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-zinc-600">
                            Weet je zeker dat je deze factuur wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button onClick={confirmDelete} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                Verwijderen
              </button>
              <button onClick={closeDeleteModal} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-stone-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-zinc-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:w-auto sm:text-sm">
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
       {showBulkDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-labelledby="bulk-delete-modal-title">
          <div className="bg-stone-50 rounded-lg shadow-xl p-6 w-full max-w-md m-4">
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-bold text-zinc-900" id="bulk-delete-modal-title">
                        Facturen Verwijderen
                    </h3>
                    <div className="mt-2">
                        <p className="text-sm text-zinc-600">
                            Weet je zeker dat je de geselecteerde {selectedInvoices.length} facturen wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
                        </p>
                    </div>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
              <button onClick={confirmBulkDelete} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                Verwijderen
              </button>
              <button onClick={closeBulkDeleteModal} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-stone-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-zinc-700 hover:bg-stone-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 sm:mt-0 sm:w-auto sm:text-sm">
                Annuleren
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};