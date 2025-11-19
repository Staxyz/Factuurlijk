import React from 'react';
import type { Invoice, UserProfile, TemplateStyle, TemplateCustomizations, TemplateFont } from '../types';
import { StorageImage } from './StorageImage';

interface InvoicePreviewProps {
  invoice: Invoice;
  userProfile: UserProfile;
  templateStyle?: TemplateStyle;
  templateCustomizations?: TemplateCustomizations | null;
  isPdfMode?: boolean;
  previewSize?: 'small' | 'medium' | 'large';
  btwIncluded?: boolean; // Whether prices include VAT
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
};

// Calculate BTW and totals based on whether prices include VAT
const calculateBtwAndTotal = (subtotal: number, btwPercentage: number, btwIncluded: boolean = false) => {
  if (btwIncluded) {
    // Prices include VAT: calculate VAT amount and exclusive subtotal
    const btwMultiplier = 1 + (btwPercentage / 100);
    const subtotalExclBtw = subtotal / btwMultiplier;
    const btwAmount = subtotal - subtotalExclBtw;
    const total = subtotal; // Total is the same as subtotal when VAT is included
    return { subtotalExclBtw, btwAmount, total };
  } else {
    // Prices exclude VAT: calculate VAT amount and total
    const btwAmount = subtotal * (btwPercentage / 100);
    const total = subtotal + btwAmount;
    return { subtotalExclBtw: subtotal, btwAmount, total };
  }
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

const getEmailSectionFontSize = (email1: string, email2: string, baseFontSize: string): string => {
    const maxLength = Math.max(email1?.length || 0, email2?.length || 0);
    
    // Extract base size from class like "text-[13px]" or "text-[24px]"
    const baseSizeMatch = baseFontSize.match(/text-\[(\d+(?:\.\d+)?)px\]/);
    if (!baseSizeMatch) return baseFontSize;
    
    const baseSize = parseFloat(baseSizeMatch[1]);
    
    // Scale down based on email length
    if (maxLength > 40) return `text-[${Math.max(baseSize * 0.65, 6)}px]`;
    if (maxLength > 35) return `text-[${Math.max(baseSize * 0.7, 7)}px]`;
    if (maxLength > 30) return `text-[${Math.max(baseSize * 0.75, 8)}px]`;
    if (maxLength > 25) return `text-[${Math.max(baseSize * 0.85, 9)}px]`;
    if (maxLength > 20) return `text-[${Math.max(baseSize * 0.9, 10)}px]`;
    return baseFontSize;
};

const getDateFontSize = (date1: string, date2: string, baseFontSize: string): string => {
    const maxLength = Math.max(date1?.length || 0, date2?.length || 0);
    
    // Extract base size from class like "text-[13px]" or "text-[24px]"
    const baseSizeMatch = baseFontSize.match(/text-\[(\d+(?:\.\d+)?)px\]/);
    if (!baseSizeMatch) return baseFontSize;
    
    const baseSize = parseFloat(baseSizeMatch[1]);
    
    // Scale down more aggressively for dates - make them smaller
    if (maxLength > 25) return `text-[${Math.max(baseSize * 0.6, 7)}px]`;
    if (maxLength > 22) return `text-[${Math.max(baseSize * 0.65, 8)}px]`;
    if (maxLength > 20) return `text-[${Math.max(baseSize * 0.7, 9)}px]`;
    if (maxLength > 18) return `text-[${Math.max(baseSize * 0.75, 10)}px]`;
    // Default: make dates smaller than base font
    return `text-[${Math.max(baseSize * 0.8, 10)}px]`;
};

const formatDate = (dateString: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('nl-NL', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

// Helper function to calculate discount for a line
const calculateLineDiscount = (line: Invoice['lines'][0]): number => {
    const lineSubtotal = (line.quantity || 0) * (line.unit_price || 0);
    
    if (line.discount_type === 'euros' && line.discount_amount) {
        return line.discount_amount;
    } else if (line.discount_type === 'percentage' || !line.discount_type) {
        // Default to percentage for backwards compatibility
        return lineSubtotal * ((line.discount_percentage || 0) / 100);
    }
    
    return 0;
};

// Helper function to format discount display
const formatDiscount = (line: Invoice['lines'][0]): string => {
    if (line.discount_type === 'euros' && line.discount_amount) {
        return formatCurrency(line.discount_amount);
    } else if (line.discount_type === 'percentage' || !line.discount_type) {
        return line.discount_percentage ? `${line.discount_percentage}%` : '-';
    }
    return '-';
};

// Helper function to check if invoice has any discounts
const hasDiscounts = (lines: Invoice['lines']): boolean => {
    return lines.some(line => {
        if (line.discount_type === 'euros' && line.discount_amount && line.discount_amount > 0) {
            return true;
        }
        if ((line.discount_type === 'percentage' || !line.discount_type) && line.discount_percentage && line.discount_percentage > 0) {
            return true;
        }
        return false;
    });
};

// Helper function to calculate subtotal with discounts
const calculateSubtotalWithDiscounts = (lines: Invoice['lines']): number => {
    return lines.reduce((acc, line) => {
        const lineSubtotal = (line.quantity || 0) * (line.unit_price || 0);
        const discount = calculateLineDiscount(line);
        return acc + (lineSubtotal - discount);
    }, 0);
};

const getDynamicStyling = (lineCount: number, templateStyle: TemplateStyle, isPdfMode?: boolean, previewSize?: 'small' | 'medium' | 'large') => {
    // Special handling: When both isPdfMode and previewSize="large" are used,
    // scale up the font sizes to match the visual appearance of the live preview on A4 paper
    if (isPdfMode && previewSize === 'large') {
        // Scale up font sizes for PDF to match live preview visual appearance
        // The live preview uses smaller viewport, so we need larger fonts for A4 PDF
        if (templateStyle === 'sidebar') {
            if (lineCount <= 6) return { fontSizeClass: 'text-[18px]', paddingClass: 'p-3' };
            if (lineCount <= 12) return { fontSizeClass: 'text-[15px]', paddingClass: 'p-2' };
            if (lineCount <= 18) return { fontSizeClass: 'text-[13px]', paddingClass: 'p-2' };
            if (lineCount <= 24) return { fontSizeClass: 'text-[12px]', paddingClass: 'p-1.5' };
            if (lineCount <= 30) return { fontSizeClass: 'text-[11px]', paddingClass: 'p-1.5' };
            return { fontSizeClass: 'text-[10px]', paddingClass: 'p-1' };
        }
        // Default styling for other templates - scaled up for PDF
        if (lineCount <= 6) return { fontSizeClass: 'text-[20px]', paddingClass: 'p-3' };
        if (lineCount <= 12) return { fontSizeClass: 'text-[17px]', paddingClass: 'p-2' };
        if (lineCount <= 18) return { fontSizeClass: 'text-[15px]', paddingClass: 'p-2' };
        if (lineCount <= 24) return { fontSizeClass: 'text-[14px]', paddingClass: 'p-1.5' };
        if (lineCount <= 30) return { fontSizeClass: 'text-[13px]', paddingClass: 'p-1.5' };
        return { fontSizeClass: 'text-[12px]', paddingClass: 'p-1' };
    }
    
    // If previewSize is specified (without isPdfMode), use that for live previews
    if (previewSize) {
        // Live Previews by size
        switch (previewSize) {
        case 'large': // For Form & Template live preview pages.
             // Special, smaller font sizes for the sidebar template due to its narrow content area.
            if (templateStyle === 'sidebar') {
                if (lineCount <= 6) return { fontSizeClass: 'text-[11px]', paddingClass: 'p-1.5' };
                if (lineCount <= 12) return { fontSizeClass: 'text-[9px]', paddingClass: 'p-1' };
                if (lineCount <= 18) return { fontSizeClass: 'text-[8px]', paddingClass: 'p-1' };
                if (lineCount <= 24) return { fontSizeClass: 'text-[7px]', paddingClass: 'p-0.5' };
                if (lineCount <= 30) return { fontSizeClass: 'text-[6.5px]', paddingClass: 'p-0.5' };
                return { fontSizeClass: 'text-[6px]', paddingClass: 'p-0.5' };
            }
            // Default styling for other templates in large preview
            if (lineCount <= 6) return { fontSizeClass: 'text-[13px]', paddingClass: 'p-2' };
            if (lineCount <= 12) return { fontSizeClass: 'text-[11px]', paddingClass: 'p-1' };
            if (lineCount <= 18) return { fontSizeClass: 'text-[10px]', paddingClass: 'p-1' };
            if (lineCount <= 24) return { fontSizeClass: 'text-[9px]', paddingClass: 'p-1' };
            if (lineCount <= 30) return { fontSizeClass: 'text-[8px]', paddingClass: 'p-0.5' };
            return { fontSizeClass: 'text-[7px]', paddingClass: 'p-0.5' };

        case 'medium': // For Sidebar.
            if (lineCount <= 6) return { fontSizeClass: 'text-[16px]', paddingClass: 'p-3' };
            if (lineCount <= 12) return { fontSizeClass: 'text-[14px]', paddingClass: 'p-2' };
            if (lineCount <= 18) return { fontSizeClass: 'text-[13px]', paddingClass: 'p-2' };
            if (lineCount <= 24) return { fontSizeClass: 'text-[12px]', paddingClass: 'p-1' };
            if (lineCount <= 30) return { fontSizeClass: 'text-[11px]', paddingClass: 'p-1' };
            return { fontSizeClass: 'text-[10px]', paddingClass: 'p-1' };

        case 'small': // For template selection buttons.
        default:
            if (templateStyle === 'sidebar') { // Keep special case for sidebar on small views
                if (lineCount <= 4) return { fontSizeClass: 'text-[6px]', paddingClass: 'p-0.5' };
                if (lineCount <= 8) return { fontSizeClass: 'text-[5px]', paddingClass: 'p-0.5' };
                if (lineCount <= 12) return { fontSizeClass: 'text-[4.5px]', paddingClass: 'p-0.5' };
                if (lineCount <= 18) return { fontSizeClass: 'text-[4px]', paddingClass: 'p-0.5' };
                return { fontSizeClass: 'text-[3.5px]', paddingClass: 'p-0.5' };
            }
            // General styling for small preview
            if (lineCount <= 4) return { fontSizeClass: 'text-[7px]', paddingClass: 'p-1' };
            if (lineCount <= 8) return { fontSizeClass: 'text-[6px]', paddingClass: 'p-0.5' };
            if (lineCount <= 12) return { fontSizeClass: 'text-[5px]', paddingClass: 'p-0.5' };
            if (lineCount <= 18) return { fontSizeClass: 'text-[4.5px]', paddingClass: 'p-0.5' };
            return { fontSizeClass: 'text-[4px]', paddingClass: 'p-0.5' };
        }
    }
    
    // PDF Mode - Adjusted for more spacing (only when previewSize is not specified)
    if (isPdfMode) {
        if (lineCount <= 6) return { fontSizeClass: 'text-[24px]', paddingClass: 'p-4' };
        if (lineCount <= 12) return { fontSizeClass: 'text-[20px]', paddingClass: 'p-3' };
        if (lineCount <= 18) return { fontSizeClass: 'text-[18px]', paddingClass: 'p-2' };
        if (lineCount <= 24) return { fontSizeClass: 'text-[16px]', paddingClass: 'p-2' };
        if (lineCount <= 30) return { fontSizeClass: 'text-[14px]', paddingClass: 'p-1.5' };
        return { fontSizeClass: 'text-[12px]', paddingClass: 'p-1' };
    }
    
    // Default fallback (should not normally be reached)
    return { fontSizeClass: 'text-[13px]', paddingClass: 'p-2' };
};


const getProcessedFooterText = (userProfile: UserProfile): string => {
    const defaultFooterText = `Gelieve het totaalbedrag over te maken voor de vervaldatum op rekeningnummer {iban} t.n.v. {name}, onder vermelding van het factuurnummer.\nHartelijk dank voor uw vertrouwen!`;
    const footerText = userProfile.invoice_footer_text || defaultFooterText;

    return footerText
        .replace('{iban}', userProfile.iban || '[IBAN]')
        .replace('{name}', userProfile.name || '[Bedrijfsnaam]');
};

const fontClasses: Record<TemplateFont, string> = {
  sans: 'font-sans',
  serif: 'font-serif',
  mono: 'font-mono',
};

interface BusinessInfoStripProps {
  userProfile: UserProfile;
  className?: string;
  variant?: 'light' | 'dark';
  align?: 'left' | 'center' | 'right';
  primaryColor?: string;
}

const BusinessInfoStrip: React.FC<BusinessInfoStripProps> = ({
  userProfile,
  className = '',
  variant = 'light',
  align = 'left',
  primaryColor,
}) => {
  const info = [
    { label: 'BTW', value: userProfile.btw_number || '—' },
    { label: 'KvK', value: userProfile.kvk_number || '—' },
    { label: 'IBAN', value: userProfile.iban || '—' },
  ];

  const baseText =
    variant === 'dark' ? 'text-white/95' : 'text-gray-800';
  const labelClass =
    variant === 'dark' ? 'text-white font-semibold' : 'text-gray-700 font-semibold';
  const valueClass =
    variant === 'dark' ? 'text-white/90' : 'text-gray-900';

  const alignClass =
    align === 'center'
      ? 'justify-center text-center'
      : align === 'right'
      ? 'justify-end text-right'
      : 'justify-start text-left';

  // Use flex-col for right alignment to match date field spacing
  const layoutClass = align === 'right' 
    ? 'flex flex-col items-end space-y-1' 
    : 'flex flex-wrap gap-x-8 gap-y-2';

  const renderItem = (label: string, value: string) => {
    const content = (
      <>
        <span className={`${labelClass}`}>{label}:</span>
        <span
          className={valueClass}
          style={
            primaryColor && variant === 'light'
              ? { color: primaryColor }
              : undefined
          }
        >
          {value}
        </span>
      </>
    );

    if (align === 'right') {
      return (
        <p key={label} className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
          {content}
        </p>
      );
    }

    return (
      <div key={label} className="flex items-baseline gap-1 whitespace-nowrap min-w-0">
        {content}
      </div>
    );
  };

  return (
    <div
      className={`${layoutClass} text-[0.95em] leading-tight ${baseText} ${alignClass} ${className} min-w-0`}
      style={{ overflow: 'visible' }}
    >
      {info.map(({ label, value }) => renderItem(label, value))}
    </div>
  );
};

const renderers: Record<TemplateStyle, React.FC<InvoicePreviewProps>> = {
  minimalist: MinimalistTemplate,
  corporate: CorporateTemplate,
  creative: CreativeTemplate,
  sidebar: SidebarTemplate,
  elegant: ElegantTemplate,
  wave: WaveTemplate,
};

export const InvoicePreview: React.FC<InvoicePreviewProps> = (props) => {
  const Renderer = renderers[props.templateStyle || 'minimalist'];
  return <Renderer {...props} />;
};


// Template Implementations

function MinimalistTemplate(props: InvoicePreviewProps) {
  const { invoice, userProfile, templateCustomizations, isPdfMode, previewSize, btwIncluded = false } = props;
  const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
  const { subtotalExclBtw, btwAmount, total } = calculateBtwAndTotal(subtotal, invoice.btw_percentage, btwIncluded);
  const { customer } = invoice;
  const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'minimalist', isPdfMode, previewSize);
  const primaryColor = templateCustomizations?.primary_color;
  const footerText = getProcessedFooterText(userProfile);
  const fontClass = fontClasses[templateCustomizations?.font || 'mono'];
  const pagePaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-6' : 'p-4';
  const invoiceHasDiscounts = hasDiscounts(invoice.lines);
  
  // Calculate dynamic font sizes for email and date sections
  const emailSectionFontSize = getEmailSectionFontSize(userProfile.email || '', customer?.email || '', fontSizeClass);
  const invoiceDate = formatDate(invoice.invoice_date);
  const dueDate = formatDate(invoice.due_date);
  const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);
  
  return (
    <div className={`${fontSizeClass} ${fontClass} bg-white h-full`}>
      <div className={`${pagePaddingClass} h-full flex flex-col text-gray-800`}>
        <header className={`flex justify-between items-start pb-4 border-b border-gray-300`}>
          <div className="min-w-0 pr-4">
            {userProfile.logo_url ? <StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="h-16 max-w-[220px] object-contain"/> : <h1 className="text-[1em] font-bold break-words">{userProfile.name}</h1>}
          </div>
          <div className="text-right flex-shrink-0">
            <h2 className={`text-[1em] font-semibold tracking-wider uppercase`} style={primaryColor ? { color: primaryColor } : {}}>Factuur</h2>
          </div>
        </header>

        <section className="grid grid-cols-3 gap-6 md:gap-8 mt-4">
          <div className={`min-w-0 ${emailSectionFontSize}`}>
            <h3 className="font-semibold text-gray-500 uppercase mb-1">Van</h3>
            <p className="font-semibold break-words">{userProfile.name}</p>
            <p className="break-words">{userProfile.address}</p>
            <p className="break-all">{userProfile.email}</p>
            {userProfile.phone_number && <p className="break-words">{userProfile.phone_number}</p>}
          </div>
          <div className={`min-w-0 ${emailSectionFontSize}`}>
            <h3 className="font-semibold text-gray-500 uppercase mb-1">Aan</h3>
            {customer && customer.name ? (
              <>
                <p className="font-semibold break-words">{customer.name}</p>
                <p className="break-words">{customer.address}</p>
                <p className="break-words">{customer.city}</p>
                <p className="break-all">{customer.email}</p>
              </>
            ) : <p className="text-gray-500">Klantgegevens</p>}
          </div>
          <div className={`${dateSectionFontSize}`} style={{ minWidth: 'fit-content' }}>
              <div className="flex flex-col items-end">
                  <p className="whitespace-nowrap"><span className="font-semibold">Nr:</span> {invoice.invoice_number}</p>
                  <p className="whitespace-nowrap"><span className="font-semibold">Datum:</span> {invoiceDate}</p>
                  <p className="whitespace-nowrap"><span className="font-semibold">Vervaldatum:</span> {dueDate}</p>
              </div>
              <BusinessInfoStrip
                userProfile={userProfile}
                className="mt-3"
                align="right"
              />
          </div>
        </section>

        <section className={`mt-6 ${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'}`}>
          <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
            <table className="w-full text-left table-fixed">
              <thead className="sticky top-0 bg-white z-10">
                <tr className={`border-b border-gray-300`}>
                  <th className={`${paddingClass} font-semibold uppercase text-gray-500 text-[0.8em] w-[40%]`}>Omschrijving</th>
                  <th className={`${paddingClass} text-center font-semibold uppercase text-gray-500 text-[0.8em]`}>Aantal</th>
                  <th className={`${paddingClass} text-right font-semibold uppercase text-gray-500 text-[0.8em]`}>Prijs</th>
                  {invoiceHasDiscounts && <th className={`${paddingClass} text-right font-semibold uppercase text-gray-500 text-[0.8em]`}>Korting</th>}
                  <th className={`${paddingClass} text-right font-semibold uppercase text-gray-500 text-[0.8em]`}>Totaal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line) => {
                  const lineSubtotal = (line.quantity || 0) * (line.unit_price || 0);
                  const discount = calculateLineDiscount(line);
                  const discountedTotal = lineSubtotal - discount;
                  return (
                    <tr key={line.id} className="border-b border-gray-200">
                      <td className={`${paddingClass} break-words`}>{line.description || <span className="text-gray-400">...</span>}</td>
                      <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                      <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                      {invoiceHasDiscounts && <td className={`${paddingClass} text-right`}>{formatDiscount(line)}</td>}
                      <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <div className="mt-auto flex-shrink-0">
          <section className="flex justify-end mt-4">
            <div className="w-1/2">
              <div className="flex justify-between">
                <span className="pr-2">Subtotaal</span>
                <span className={`text-right whitespace-nowrap ${getCurrencyFontSizeClass(subtotal)}`}>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="pr-2">BTW ({invoice.btw_percentage}%)</span>
                <span className={`text-right whitespace-nowrap ${getCurrencyFontSizeClass(btwAmount)}`}>{formatCurrency(btwAmount)}</span>
              </div>
              <div className={`flex justify-between mt-2 pt-2 border-t border-gray-400`}>
                <span className="font-semibold pr-2">Totaal</span>
                <span className={`font-semibold text-right whitespace-nowrap ${getCurrencyFontSizeClass(total)}`}>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>

          <footer className="mt-8 pt-4 border-t border-gray-200 text-gray-600">
               <p className="whitespace-pre-line mb-4 break-words">{footerText}</p>
          </footer>
        </div>
      </div>
    </div>
  );
}

function CorporateTemplate(props: InvoicePreviewProps) {
  const { invoice, userProfile, templateCustomizations, isPdfMode, previewSize, btwIncluded = false } = props;
  const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
  const { subtotalExclBtw, btwAmount, total } = calculateBtwAndTotal(subtotal, invoice.btw_percentage, btwIncluded);
  const { customer } = invoice;
  const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'corporate', isPdfMode, previewSize);
  const primaryColor = templateCustomizations?.primary_color || '#4b5563';
  const footerText = getProcessedFooterText(userProfile);
  const fontClass = fontClasses[templateCustomizations?.font || 'sans'];
  const pagePaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-6' : 'p-4';
  const invoiceHasDiscounts = hasDiscounts(invoice.lines);
  
  // Calculate dynamic font sizes for email and date sections
  const emailSectionFontSize = getEmailSectionFontSize('', customer?.email || '', fontSizeClass);
  const invoiceDate = formatDate(invoice.invoice_date);
  const dueDate = formatDate(invoice.due_date);
  const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);
  
  return (
    <div className={`${fontSizeClass} ${fontClass} bg-white h-full`}>
      <div className={`${pagePaddingClass} h-full flex flex-col text-gray-800`}>
        <header>
            <div className="flex justify-between items-center bg-gray-100 p-4">
              <div className="min-w-0 pr-4">
                {userProfile.logo_url ? <StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="h-20 max-w-[250px] object-contain"/> : <h1 className="text-[1.25em] font-bold break-words">{userProfile.name}</h1>}
              </div>
              <div className="text-right flex-shrink-0">
                <h2 className="text-[1.75em] font-bold uppercase tracking-wider" style={{ color: primaryColor }}>Factuur</h2>
              </div>
            </div>
        </header>

        <section className="grid grid-cols-3 gap-6 md:gap-8 mt-4">
          <div className={`min-w-0 ${emailSectionFontSize}`}>
            <h3 className="font-bold text-gray-600 uppercase mb-1">Van</h3>
            <p className="font-semibold break-words">{userProfile.name}</p>
            <p className="break-words">{userProfile.address}</p>
          </div>
          <div className={`min-w-0 ${emailSectionFontSize}`}>
            <h3 className="font-bold text-gray-600 uppercase mb-1">Factuur aan</h3>
            <p className="font-semibold break-words">{customer.name || 'Klantnaam'}</p>
            <p className="break-words">{customer.address || 'Adres'}</p>
            <p className="break-words">{customer.city || 'Stad'}</p>
            <p className="break-all">{customer.email || 'Email'}</p>
          </div>
          <div className={`${dateSectionFontSize}`} style={{ minWidth: 'fit-content' }}>
              <div className="flex flex-col items-end">
                  <p className="whitespace-nowrap"><span className="font-semibold">Factuurnr:</span> {invoice.invoice_number}</p>
                  <p className="whitespace-nowrap"><span className="font-semibold">Datum:</span> {invoiceDate}</p>
                  <p className="whitespace-nowrap"><span className="font-semibold">Vervaldatum:</span> {dueDate}</p>
              </div>
              <BusinessInfoStrip
                userProfile={userProfile}
                className="mt-3"
                align="right"
                primaryColor={primaryColor}
              />
          </div>
        </section>

        <section className={`mt-6 ${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'}`}>
          <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
            <table className="w-full text-left">
              <thead className="sticky top-0 z-10" style={{ backgroundColor: primaryColor }}>
                <tr className="text-white">
                  <th className={`${paddingClass} font-bold uppercase text-[0.8em] w-[8%]`}>#</th>
                  <th className={`${paddingClass} font-bold uppercase text-[0.8em] w-[40%]`}>Omschrijving</th>
                  <th className={`${paddingClass} text-right font-bold uppercase text-[0.8em]`}>Prijs</th>
                  <th className={`${paddingClass} text-center font-bold uppercase text-[0.8em]`}>Aantal</th>
                  {invoiceHasDiscounts && <th className={`${paddingClass} text-center font-bold uppercase text-[0.8em]`}>Korting</th>}
                  <th className={`${paddingClass} text-right font-bold uppercase text-[0.8em]`}>Totaal</th>
                </tr>
              </thead>
              <tbody>
                {invoice.lines.map((line, index) => {
                  const discountedTotal = (line.quantity * line.unit_price) * (1 - ((line.discount_percentage || 0) / 100));
                  return (
                    <tr key={line.id} className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}>
                      <td className={paddingClass}>0{index + 1}</td>
                      <td className={`${paddingClass} break-words`}>{line.description || '...'}</td>
                      <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                      <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                      {invoiceHasDiscounts && <td className={`${paddingClass} text-center`}>{formatDiscount(line)}</td>}
                      <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        
        <div className="mt-auto flex-shrink-0">
           <section className="flex justify-end mt-4">
            <div className="w-1/2">
              <div className="flex justify-between py-1"><span className="pr-2">Subtotaal</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(subtotal)}`}>{formatCurrency(subtotal)}</span></div>
              <div className="flex justify-between py-1"><span className="pr-2">BTW ({invoice.btw_percentage}%)</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(btwAmount)}`}>{formatCurrency(btwAmount)}</span></div>
              <div className="flex justify-between font-bold mt-2 pt-2 border-t-2" style={{borderColor: primaryColor}}>
                  <span className="pr-2" style={{ color: primaryColor }}>Totaal</span>
                  <span className={`whitespace-nowrap ${getCurrencyFontSizeClass(total)}`} style={{ color: primaryColor }}>{formatCurrency(total)}</span>
              </div>
            </div>
          </section>
          
          <div className="mt-8 text-center text-[0.8em] text-gray-600">
            <p className="whitespace-pre-line break-words">{footerText}</p>
          </div>

          <footer className="mt-8 pt-4 border-t text-gray-600 grid grid-cols-3 gap-4">
              <div><p className="font-bold">Telefoon</p><p className="break-words">{userProfile.phone_number || '(niet ingesteld)'}</p></div>
              <div><p className="font-bold">Locatie</p><p className="break-words">{userProfile.address}</p></div>
              <div><p className="font-bold">Email</p><p className="break-all text-[0.9em]">{userProfile.email}</p></div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function CreativeTemplate(props: InvoicePreviewProps) {
    const { invoice, userProfile, templateCustomizations, isPdfMode, previewSize } = props;
    const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
    const btwAmount = subtotal * (invoice.btw_percentage / 100);
    const total = subtotal + btwAmount;
    const { customer } = invoice;
    const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'creative', isPdfMode, previewSize);
    const primaryColor = templateCustomizations?.primary_color || '#2d3748';
    const footerText = getProcessedFooterText(userProfile);
    const fontClass = fontClasses[templateCustomizations?.font || 'sans'];
    const pagePaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-8' : 'p-6';
    const invoiceHasDiscounts = hasDiscounts(invoice.lines);

    // Calculate dynamic font sizes for email and date sections
    const emailSectionFontSize = getEmailSectionFontSize(userProfile.email || '', customer?.email || '', fontSizeClass);
    const invoiceDate = formatDate(invoice.invoice_date);
    const dueDate = formatDate(invoice.due_date);
    const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);

    return (
    <div className={`${fontSizeClass} ${fontClass} bg-gray-50 h-full flex flex-col text-gray-800 shadow-lg rounded-md overflow-hidden`}>
        {/* Header Content */}
        <header className={`text-white ${pagePaddingClass} flex justify-between items-start`} style={{ backgroundColor: primaryColor }}>
            <div className="min-w-0 pr-4">
                {userProfile.logo_url 
                    ? <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center p-1 shadow-sm"><StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="max-h-full max-w-full object-contain"/></div>
                    : <h1 className="text-[1.25em] font-bold truncate">{userProfile.name}</h1>
                }
            </div>
            <div className="text-right flex-shrink-0">
                <h2 className="text-[1.875em] font-bold uppercase tracking-wider pt-2">Factuur</h2>
            </div>
        </header>
        
        <main className={`${pagePaddingClass} flex-grow flex flex-col`}>
            <section className="grid grid-cols-3 gap-6 md:gap-8">
                <div className={`min-w-0 ${emailSectionFontSize}`}>
                  <h3 className="font-bold text-gray-500 uppercase mb-1 text-[0.8em] tracking-wider">Van</h3>
                  <p className="font-semibold break-words">{userProfile.name}</p>
                  <p className="break-words">{userProfile.address}</p>
                  <p className="whitespace-nowrap">{userProfile.email}</p>
                </div>
                <div className={`min-w-0 ${emailSectionFontSize}`}>
                  <h3 className="font-bold text-gray-500 uppercase mb-1 text-[0.8em] tracking-wider">Factuur aan</h3>
                  <p className="font-semibold break-words">{customer.name || 'Klantnaam'}</p>
                  <p className="break-words">{customer.address || 'Adres'}</p>
                  <p className="break-words">{customer.city || 'Stad'}</p>
                  <p className="whitespace-nowrap">{customer.email || 'Email'}</p>
                </div>
                <div className={`text-right min-w-0 ${dateSectionFontSize}`}>
                    <p className="whitespace-nowrap"><span className="font-semibold">Factuurnr:</span> {invoice.invoice_number}</p>
                    <p className="whitespace-nowrap"><span className="font-semibold">Datum:</span> {invoiceDate}</p>
                    <p className="whitespace-nowrap"><span className="font-semibold">Vervaldatum:</span> {dueDate}</p>
                    <BusinessInfoStrip
                      userProfile={userProfile}
                      className="mt-3"
                      align="right"
                    />
                </div>
            </section>

            <section className={`mt-8 ${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'}`}>
              <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
                 <table className="w-full text-left">
                  <thead className="sticky top-0 z-10" style={{ backgroundColor: primaryColor }}>
                    <tr className="text-white">
                      <th className={`${paddingClass} font-bold rounded-tl-lg w-[40%]`}>Omschrijving</th>
                      <th className={`${paddingClass} text-right font-bold`}>Prijs</th>
                      <th className={`${paddingClass} text-center font-bold`}>Aantal</th>
                      {invoiceHasDiscounts && <th className={`${paddingClass} text-center font-bold`}>Korting</th>}
                      <th className={`${paddingClass} text-right font-bold rounded-tr-lg`}>Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line) => {
                      const discountedTotal = (line.quantity * line.unit_price) * (1 - ((line.discount_percentage || 0) / 100));
                      return (
                      <tr key={line.id} className="border-b bg-gray-100">
                        <td className={`${paddingClass} font-semibold break-words`}>{line.description || '...'}</td>
                        <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                        <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                        {invoiceHasDiscounts && <td className={`${paddingClass} text-center`}>{formatDiscount(line)}</td>}
                        <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            
            <div className="mt-auto flex-shrink-0">
                <section className="flex justify-end mt-4">
                    <div className="w-1/2">
                        <div className="flex justify-between py-2"><span className="pr-2">Subtotaal</span><span className={`font-medium whitespace-nowrap ${getCurrencyFontSizeClass(subtotal)}`}>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between py-2"><span className="pr-2">BTW ({invoice.btw_percentage}%)</span><span className={`font-medium whitespace-nowrap ${getCurrencyFontSizeClass(btwAmount)}`}>{formatCurrency(btwAmount)}</span></div>
                        <div className="flex justify-between font-bold mt-2 pt-2 text-[1em] border-t-2 border-gray-400">
                            <span className="pr-2">Totaal</span>
                            <span className={`whitespace-nowrap ${getCurrencyFontSizeClass(total)}`}>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </section>
                <footer className="text-left mt-4">
                    <p className="text-[0.8em] text-gray-600 whitespace-pre-line break-words">{footerText}</p>
                    {userProfile.phone_number && <p className="mt-2"><span className="font-semibold">Tel:</span> {userProfile.phone_number}</p>}
                </footer>
            </div>
        </main>
    </div>
    );
}

function SidebarTemplate(props: InvoicePreviewProps) {
  const { invoice, userProfile, isPdfMode, previewSize, templateCustomizations } = props;
  const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
  const btwAmount = subtotal * (invoice.btw_percentage / 100);
  const total = subtotal + btwAmount;
  const { customer } = invoice;
  const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'sidebar', isPdfMode, previewSize);
  const footerText = getProcessedFooterText(userProfile);
  const pagePaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-6' : 'p-4';
  const invoiceHasDiscounts = hasDiscounts(invoice.lines);
  const fontClass = fontClasses[templateCustomizations?.font || 'sans'];

  // Calculate dynamic font sizes for email and date sections
  const emailSectionFontSize = getEmailSectionFontSize(userProfile.email || '', customer?.email || '', fontSizeClass);
  const invoiceDate = formatDate(invoice.invoice_date);
  const dueDate = formatDate(invoice.due_date);
  const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);

  return (
    <div className={`${fontSizeClass} ${fontClass} bg-white h-full flex shadow-lg`}>
      {/* Sidebar */}
      <aside className={`w-1/3 bg-gray-50 ${pagePaddingClass} flex flex-col justify-between border-r border-gray-200`}>
        <div>
          <div className="mb-6">
            {userProfile.logo_url ? (
                <div className="w-28 h-28 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                    <StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="max-h-full max-w-full object-contain"/>
                </div>
            ) : (
                <h1 className="text-[1em] font-bold break-words">{userProfile.name}</h1>
            )}
          </div>
          <div className={`space-y-6 ${emailSectionFontSize}`}>
             <div>
              <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-1">Van</h3>
              <p className="font-bold break-words">{userProfile.name}</p>
              <p className="break-words">{userProfile.address}</p>
              <p className="break-all">{userProfile.email}</p>
              {userProfile.phone_number && <p className="break-words">{userProfile.phone_number}</p>}
            </div>
            <div>
              <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-1">Aan</h3>
              <p className="font-semibold break-words">{customer.name || 'Klantnaam'}</p>
              <p className="break-words">{customer.address || 'Adres'}</p>
              <p className="break-words">{customer.city || 'Stad'}</p>
              <p className="break-all">{customer.email || 'Email'}</p>
            </div>
          </div>
        </div>
        <div className="text-gray-600">
            <h3 className="font-bold text-gray-500 uppercase tracking-wider mb-1">Betaling</h3>
            <BusinessInfoStrip userProfile={userProfile} className="mb-2" />
            <p className="whitespace-pre-line break-words mt-2">{footerText}</p>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`w-2/3 ${pagePaddingClass} flex flex-col min-w-0`}>
        <header className="flex justify-between items-start mb-4 gap-6">
          <h2 className="text-[1.25em] font-bold text-gray-800 uppercase tracking-wide whitespace-nowrap">
            Factuur
          </h2>
          <div className={`flex-shrink-0 ${dateSectionFontSize}`}>
            <div className="flex flex-col items-end">
              <p className="whitespace-nowrap"><span className="font-semibold">Factuurnr:</span> {invoice.invoice_number}</p>
              <p className="whitespace-nowrap"><span className="font-semibold">Datum:</span> {invoiceDate}</p>
              <p className="whitespace-nowrap"><span className="font-semibold">Vervaldatum:</span> {dueDate}</p>
            </div>
          </div>
        </header>

        <section className={`${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'} mt-2`}>
            <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
            <table className="w-full text-left table-fixed">
                <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-300">
                    <th className={`${paddingClass} font-semibold uppercase text-gray-500 ${invoiceHasDiscounts ? 'w-[40%]' : 'w-[50%]'}`}>Omschrijving</th>
                    <th className={`${paddingClass} text-right font-semibold uppercase text-gray-500 w-[20%]`}>Prijs</th>
                    <th className={`${paddingClass} text-center font-semibold uppercase text-gray-500 w-[10%]`}>Aantal</th>
                    {invoiceHasDiscounts && <th className={`${paddingClass} text-center font-semibold uppercase text-gray-500 w-[10%]`}>Korting</th>}
                    <th className={`${paddingClass} text-right font-semibold uppercase text-gray-500 w-[20%]`}>Totaal</th>
                </tr>
                </thead>
                <tbody>
                {invoice.lines.map((line) => {
                    const lineSubtotal = (line.quantity || 0) * (line.unit_price || 0);
                    const discount = calculateLineDiscount(line);
                    const discountedTotal = lineSubtotal - discount;
                    return (
                        <tr key={line.id} className="border-b border-gray-100">
                            <td className={`${paddingClass} break-words`}>{line.description || '...'}</td>
                            <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                            <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                            {invoiceHasDiscounts && <td className={`${paddingClass} text-center`}>{formatDiscount(line)}</td>}
                            <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
            </div>
        </section>
        <div className="mt-auto flex-shrink-0">
            <div className="flex justify-end">
                <div className="w-full max-w-xs sm:max-w-sm">
                    <table className="w-full table-fixed">
                        <tbody className="border-t-2 border-gray-300">
                            <tr>
                                <td className={`${paddingClass} w-3/5 text-right text-gray-600`}>Subtotaal</td>
                                <td className={`${paddingClass} w-2/5 text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(subtotal)}>{formatCurrency(subtotal)}</span></td>
                            </tr>
                            <tr>
                                <td className={`${paddingClass} w-3/5 text-right text-gray-600`}>BTW ({invoice.btw_percentage}%)</td>
                                <td className={`${paddingClass} w-2/5 text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(btwAmount)}>{formatCurrency(btwAmount)}</span></td>
                            </tr>
                            <tr className="font-bold">
                                <td className={`${paddingClass} w-3/5 text-right pt-2`}>Totaal</td>
                                <td className={`${paddingClass} w-2/5 text-right pt-2 whitespace-nowrap`}><span className={getCurrencyFontSizeClass(total)}>{formatCurrency(total)}</span></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}

function ElegantTemplate(props: InvoicePreviewProps) {
  const { invoice, userProfile, templateCustomizations, isPdfMode, previewSize, btwIncluded = false } = props;
    const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
    const { subtotalExclBtw, btwAmount, total } = calculateBtwAndTotal(subtotal, invoice.btw_percentage, btwIncluded);
    const { customer } = invoice;
    const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'elegant', isPdfMode, previewSize);
    const primaryColor = templateCustomizations?.primary_color || '#333333';
    const footerText = getProcessedFooterText(userProfile);
    const fontClass = fontClasses[templateCustomizations?.font || 'serif'];
    const pagePaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-8' : 'p-6';
    const invoiceHasDiscounts = hasDiscounts(invoice.lines);
  
  // Calculate dynamic font sizes for email and date sections
  const emailSectionFontSize = getEmailSectionFontSize(userProfile.email || '', customer?.email || '', fontSizeClass);
  const invoiceDate = formatDate(invoice.invoice_date);
  const dueDate = formatDate(invoice.due_date);
  const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);

  return (
    <div className={`${fontSizeClass} ${fontClass} bg-white h-full`}>
        <div className={`h-full flex flex-col text-gray-800 ${pagePaddingClass} border-4 border-gray-200`}>
            <header className="pb-4 border-b flex items-start">
                {userProfile.logo_url ? (
                  <StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="h-20 max-w-[250px] object-contain" />
                ) : (
                  <h1 className="text-[1.5em] font-bold tracking-widest break-words">{userProfile.name}</h1>
                )}
            </header>
            
            <section className="grid grid-cols-3 gap-6 md:gap-8 mt-6 pb-4 border-b">
                 <div className={`min-w-0 ${emailSectionFontSize}`}>
                  <h3 className="font-bold text-gray-600 uppercase mb-1">Van</h3>
                  <p className="font-semibold break-words">{userProfile.name}</p>
                  <p className="break-words">{userProfile.address}</p>
                  <p className="break-all">{userProfile.email}</p>
                </div>
                 <div className={`min-w-0 ${emailSectionFontSize}`}>
                  <h3 className="font-bold text-gray-600 uppercase mb-1">Factuur aan</h3>
                  <p className="font-semibold break-words">{customer.name || 'Klantnaam'}</p>
                  <p className="break-words">{customer.address || 'Adres'}</p>
                  <p className="break-words">{customer.city || 'Stad'}</p>
                  <p className="break-all">{customer.email || 'Email'}</p>
                </div>
                <div className={`${dateSectionFontSize}`} style={{ minWidth: 'fit-content' }}>
                    <div className="flex flex-col items-end">
                        <h2 className="text-[1.25em] font-bold">FACTUUR</h2>
                        <p className="whitespace-nowrap">Factuurnummer: {invoice.invoice_number}</p>
                        <p className="whitespace-nowrap">Datum: {invoiceDate}</p>
                        <p className="whitespace-nowrap">Vervaldatum: {dueDate}</p>
                    </div>
                    <BusinessInfoStrip userProfile={userProfile} className="mt-3" align="right" />
                </div>
            </section>

            <section className={`mt-6 ${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'}`}>
              <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
                <table className="w-full text-left">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="border-b-2">
                      <th className={`${paddingClass} font-semibold uppercase text-[0.8em] w-[40%]`}>Item Omschrijving</th>
                      <th className={`${paddingClass} text-center font-semibold uppercase text-[0.8em]`}>Aantal</th>
                      <th className={`${paddingClass} text-right font-semibold uppercase text-[0.8em]`}>Prijs</th>
                      {invoiceHasDiscounts && <th className={`${paddingClass} text-right font-semibold uppercase text-[0.8em]`}>Korting</th>}
                      <th className={`${paddingClass} text-right font-semibold uppercase text-[0.8em]`}>Totaal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.lines.map((line) => {
                      const discountedTotal = (line.quantity * line.unit_price) * (1 - ((line.discount_percentage || 0) / 100));
                      return (
                      <tr key={line.id} className="border-b">
                        <td className={`${paddingClass} font-bold break-words`}>{line.description || '...'}</td>
                        <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                        <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                        {invoiceHasDiscounts && <td className={`${paddingClass} text-right`}>{formatDiscount(line)}</td>}
                        <td className={`${paddingClass} text-right font-bold whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
            
            <div className="mt-auto pt-4">
                <section className="flex justify-end">
                    <div className="w-1/2">
                        <div className="flex justify-between py-1 border-b"><span className="pr-2">Subtotaal</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(subtotal)}`}>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between py-1 border-b"><span className="pr-2">BTW ({invoice.btw_percentage}%)</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(btwAmount)}`}>{formatCurrency(btwAmount)}</span></div>
                        <div className="flex justify-between font-bold text-[1.125em] mt-2 p-2" style={{ backgroundColor: primaryColor, color: 'white' }}>
                            <span className="pr-2">Totaal</span>
                            <span className={`whitespace-nowrap ${getCurrencyFontSizeClass(total)}`}>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </section>
                 <footer className="mt-8 pt-4 border-t text-center text-[0.8em] text-gray-600">
                    <p className="whitespace-pre-line break-words">{footerText}</p>
                    {userProfile.phone_number && <p className="mt-2"><span className="font-semibold">Tel:</span> {userProfile.phone_number}</p>}
                </footer>
            </div>
        </div>
    </div>
  );
}

function WaveTemplate(props: InvoicePreviewProps) {
    const { invoice, userProfile, templateCustomizations, isPdfMode, previewSize } = props;
    const subtotal = calculateSubtotalWithDiscounts(invoice.lines);
    const btwAmount = subtotal * (invoice.btw_percentage / 100);
    const total = subtotal + btwAmount;
    const { customer } = invoice;
    const { fontSizeClass, paddingClass } = getDynamicStyling(invoice.lines.length, props.templateStyle || 'wave', isPdfMode, previewSize);
    const primaryColor = templateCustomizations?.primary_color || '#2563eb';
    const footerText = getProcessedFooterText(userProfile);
    const fontClass = fontClasses[templateCustomizations?.font || 'sans'];
    const pageHeaderMainPaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-8' : 'p-6';
    const footerPaddingClass = (isPdfMode && !previewSize) ? 'p-10' : (isPdfMode && previewSize === 'large') ? 'p-6' : 'p-4';
    const invoiceHasDiscounts = hasDiscounts(invoice.lines);
    
    // Calculate dynamic font sizes for email and date sections
    const emailSectionFontSize = getEmailSectionFontSize('', customer?.email || '', fontSizeClass);
    const invoiceDate = formatDate(invoice.invoice_date);
    const dueDate = formatDate(invoice.due_date);
    const dateSectionFontSize = getDateFontSize(invoiceDate, dueDate, fontSizeClass);
    
    return (
    <div className={`${fontSizeClass} ${fontClass} bg-gray-50 h-full flex flex-col text-gray-800`}>
        <header className={`relative text-white ${pageHeaderMainPaddingClass}`} style={{ backgroundColor: primaryColor }}>
            <div className="relative flex justify-between items-center">
                <div className="min-w-0 pr-4">
                    {userProfile.logo_url ? (
                        <div className="w-24 h-24 bg-white rounded-md flex items-center justify-center p-1 shadow-sm">
                            <StorageImage key={userProfile.logo_url} bucket="profile-logos" path={userProfile.logo_url} alt="Logo" className="max-h-full max-w-full object-contain"/>
                        </div>
                    ) : (
                        <h1 className="text-[1.25em] font-bold break-words">{userProfile.name}</h1>
                    )}
                </div>
                <div className="flex-shrink-0">
                    <h2 className="text-[1.5em] font-bold uppercase">Factuur</h2>
                </div>
            </div>
        </header>

        <main className={`${pageHeaderMainPaddingClass} flex-grow flex flex-col`}>
            <section className="grid grid-cols-3 gap-6 md:gap-8">
                <div className={`min-w-0 ${emailSectionFontSize}`}>
                    <h3 className="font-bold uppercase" style={{ color: primaryColor }}>Van</h3>
                    <p className="font-semibold break-words">{userProfile.name}</p>
                    <p className="break-words">{userProfile.address}</p>
                </div>
                <div className={`min-w-0 ${emailSectionFontSize}`}>
                    <h3 className="font-bold uppercase" style={{ color: primaryColor }}>Factuur aan</h3>
                    <p className="font-semibold break-words">{customer.name || 'Klantnaam'}</p>
                    <p className="break-words">{customer.address || 'Adres'}</p>
                    <p className="break-words">{customer.city || 'Stad'}</p>
                    <p className="break-all">{customer.email || 'email'}</p>
                </div>
                <div className={`${dateSectionFontSize}`} style={{ minWidth: 'fit-content' }}>
                    <div className="flex flex-col items-end">
                        <p className="whitespace-nowrap"><span className="font-semibold">Factuurnr:</span> {invoice.invoice_number}</p>
                        <p className="whitespace-nowrap"><span className="font-semibold">Datum:</span> {invoiceDate}</p>
                        <p className="whitespace-nowrap"><span className="font-semibold">Vervaldatum:</span> {dueDate}</p>
                    </div>
                    <BusinessInfoStrip
                      userProfile={userProfile}
                      className="mt-3"
                      align="right"
                      variant="light"
                      primaryColor={primaryColor}
                    />
                </div>
            </section>
            
            <section className={`mt-6 ${isPdfMode ? 'flex-grow min-h-0' : ''} flex flex-col ${isPdfMode ? 'overflow-hidden' : 'overflow-visible'}`}>
              <div className={`${isPdfMode ? 'flex-1 min-h-0 overflow-y-auto' : 'overflow-visible'}`}>
                 <table className="w-full text-left">
                    <thead className="sticky top-0 bg-white z-10" style={{ color: primaryColor }}>
                        <tr className="border-b-2" style={{ borderColor: primaryColor }}>
                          <th className={`${paddingClass} font-bold w-[8%]`}>Nr.</th>
                          <th className={`${paddingClass} font-bold w-[40%]`}>Omschrijving</th>
                          <th className={`${paddingClass} text-right font-bold`}>Prijs</th>
                          <th className={`${paddingClass} text-center font-bold`}>Aantal</th>
                           {invoiceHasDiscounts && <th className={`${paddingClass} text-center font-bold`}>Korting</th>}
                          <th className={`${paddingClass} text-right font-bold`}>Totaal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {invoice.lines.map((line, index) => {
                          const discountedTotal = (line.quantity * line.unit_price) * (1 - ((line.discount_percentage || 0) / 100));
                          return (
                          <tr key={line.id} className="border-b bg-white">
                            <td className={paddingClass}>0{index+1}</td>
                            <td className={`${paddingClass} break-words`}>{line.description || '...'}</td>
                            <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(line.unit_price)}>{formatCurrency(line.unit_price)}</span></td>
                            <td className={`${paddingClass} text-center`}>{line.quantity}</td>
                            {invoiceHasDiscounts && <td className={`${paddingClass} text-center`}>{formatDiscount(line)}</td>}
                            <td className={`${paddingClass} text-right whitespace-nowrap`}><span className={getCurrencyFontSizeClass(discountedTotal)}>{formatCurrency(discountedTotal)}</span></td>
                          </tr>
                          );
                        })}
                    </tbody>
                </table>
              </div>
            </section>

            <div className="mt-auto flex-shrink-0">
                <section className="grid grid-cols-2 mt-4 gap-4">
                    <div className="text-[0.8em]">
                        
                    </div>
                    <div className="bg-white p-2">
                        <div className="flex justify-between py-1"><span className="pr-2">Subtotaal</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(subtotal)}`}>{formatCurrency(subtotal)}</span></div>
                        <div className="flex justify-between py-1"><span className="pr-2">BTW ({invoice.btw_percentage}%)</span><span className={`whitespace-nowrap ${getCurrencyFontSizeClass(btwAmount)}`}>{formatCurrency(btwAmount)}</span></div>
                        <div className="flex justify-between text-[1.125em] font-bold mt-2 p-2 text-white" style={{ backgroundColor: primaryColor }}>
                            <span className="pr-2">Totaal</span>
                            <span className={`whitespace-nowrap ${getCurrencyFontSizeClass(total)}`}>{formatCurrency(total)}</span>
                        </div>
                    </div>
                </section>
                <div className="pt-6 text-center text-[0.8em] text-gray-600">
                  <p className="whitespace-pre-line break-words">{footerText}</p>
                </div>
            </div>
        </main>
        
        <footer className={`${footerPaddingClass} text-center`} style={{ backgroundColor: primaryColor, color: 'white' }}>
            <p className="text-[0.9em] break-words">Vragen? Contacteer ons op {userProfile.email}{userProfile.phone_number && ` of ${userProfile.phone_number}`}</p>
        </footer>
    </div>
    );
}
