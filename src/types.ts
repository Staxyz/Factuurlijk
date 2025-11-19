export type TemplateStyle = 'modern' | 'classic' | 'minimalist';

export type View = 'landing' | 'login' | 'signup' | 'dashboard' | 'invoices' | 'new-invoice' | 'edit-invoice' | 'profile' | 'templates' | 'favorites' | 'checkout-success' | 'upgrade';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  customerId: string;
  status: 'betaald' | 'open' | 'verlopen';
  lines: InvoiceLine[];
  btwPercentage: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  city: string;
  email: string;
}

export interface UserProfile {
  name: string;
  email: string;
  address: string;
  kvkNumber: string;
  btwNumber: string;
  iban: string;
  logoUrl?: string;
  templateStyle: TemplateStyle;
}
