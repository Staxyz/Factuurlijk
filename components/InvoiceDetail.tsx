import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import type { Invoice, UserProfile } from '../types';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { InvoicePreview } from './InvoicePreview';

interface InvoicePreviewSidebarProps {
  invoice: Invoice;
  userProfile: UserProfile;
  onClose: () => void;
  onEdit: (invoiceId: string) => void;
  onDelete: (invoiceId: string) => void;
  onMarkAsPaid: (invoiceId: string) => void;
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

export const InvoicePreviewSidebar: React.FC<InvoicePreviewSidebarProps> = ({
  invoice,
  userProfile,
  onClose,
  onEdit,
  onDelete,
  onMarkAsPaid,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const calculateTotal = (invoice: Invoice) => {
    const subtotal = invoice.lines.reduce((acc, line) => acc + (line.quantity * line.unit_price), 0);
    return subtotal * (1 + invoice.btw_percentage / 100);
  };
  const totalAmount = calculateTotal(invoice);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
  
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
        setIsGeneratingPdf(false);
    }
  };

  const handleEdit = () => {
    onEdit(invoice.id);
    onClose();
  };

  const handleDelete = () => {
    onDelete(invoice.id);
  };
  
  const handleMarkAsPaid = () => {
    onMarkAsPaid(invoice.id);
  };

  return (
    <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <div className="fixed top-0 right-0 bottom-0 flex">
        <div className="w-screen max-w-full sm:max-w-2xl bg-stone-50 flex flex-col shadow-xl">
          {/* Header */}
          <header className="flex-shrink-0 flex items-start justify-between p-4 sm:p-6 border-b border-stone-200">
            <div>
              <h2 className="text-xl font-bold text-zinc-800">Factuur {invoice.invoice_number}</h2>
              <p className="text-sm text-zinc-500">{invoice.customer.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 text-zinc-500 hover:text-zinc-800 hover:bg-stone-200 rounded-full transition-colors"
              aria-label="Close panel"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>
          
          {/* Action bar */}
          <div className="flex-shrink-0 p-4 sm:p-6 border-b border-stone-200 bg-white">
            <div className="flex items-center justify-center gap-2 sm:gap-6">
              <button
                onClick={handleEdit}
                className="flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-stone-100 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"></path></svg>
                 Bewerken
              </button>
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium text-zinc-700 hover:bg-stone-100 transition-colors disabled:opacity-50"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                {isGeneratingPdf ? 'Bezig...' : 'Download'}
              </button>
              {(invoice.status === 'open' || invoice.status === 'verlopen') && (
                <button
                    onClick={handleMarkAsPaid}
                    className="flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium text-green-700 hover:bg-green-50 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M20 6 9 17l-5-5"></path></svg>
                    Betaald
                </button>
              )}
               <button
                onClick={handleDelete}
                className="flex flex-col items-center justify-center p-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
              >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mb-1"><path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                 Verwijder
              </button>
            </div>
          </div>
          
          {/* Details */}
          <div className="flex-shrink-0 p-4 sm:p-6 space-y-4">
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Status</span>
                  {getStatusChip(invoice.status)}
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Totaalbedrag</span>
                  <span className="text-lg font-bold text-zinc-800">{formatCurrency(totalAmount)}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Factuurdatum</span>
                  <span className="text-sm text-zinc-600">{formatDate(invoice.invoice_date)}</span>
              </div>
              <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-zinc-500">Vervaldatum</span>
                  <span className="text-sm text-zinc-600">{formatDate(invoice.due_date)}</span>
              </div>
          </div>

          {/* Preview */}
          <div className="flex-1 p-4 sm:p-6 bg-stone-200 overflow-y-auto">
            <div className="bg-white shadow-lg rounded-md overflow-hidden max-w-full mx-auto aspect-[210/297]">
              <InvoicePreview
                invoice={invoice}
                userProfile={userProfile}
                templateStyle={userProfile.template_style}
                templateCustomizations={userProfile.template_customizations}
                previewSize="medium"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
