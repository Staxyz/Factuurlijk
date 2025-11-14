// Defines the current view/page of the application
export type View =
  | 'landing'
  | 'login'
  | 'signup'
  | 'reset-password'
  | 'dashboard'
  | 'invoices'
  | 'new-invoice'
  | 'edit-invoice'
  | 'invoice-detail'
  | 'customers'
  | 'new-customer'
  | 'edit-customer'
  | 'company-profile'
  | 'templates'
  | 'settings'
  | 'upgrade'
  | 'help'
  | 'privacy-policy'
  | 'terms-and-conditions'
  | 'contact'
  | 'checkout-success';

// Represents a customer, typically stored in the 'customers' table
export interface Customer {
  id: string;
  user_id: string;
  created_at: string;
  name: string;
  email: string;
  address: string;
  city: string;
}

// Represents a single line item on an invoice
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  // FIX: Add optional discount_percentage to align with its usage in InvoicePreview.tsx.
  discount_percentage?: number;
}

// Represents an invoice, stored in the 'invoices' table
export interface Invoice {
  id: string;
  user_id?: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer: {
    name: string;
    address: string;
    city: string;
    email: string;
  };
  status: 'betaald' | 'open' | 'verlopen';
  lines: InvoiceLine[];
  btw_percentage: number;
  created_at?: string;
}

// Defines the available fonts for invoice templates
export type TemplateFont = 'sans' | 'serif' | 'mono';

// Defines the available template styles
export type TemplateStyle = 'minimalist' | 'corporate' | 'creative' | 'sidebar' | 'elegant' | 'wave';

// Defines the customization options for a template
export interface TemplateCustomizations {
  primary_color: string;
  font: TemplateFont;
}

// Represents a user's profile, stored in the 'profiles' table
export interface UserProfile {
  id: string;
  updated_at?: string | null;
  name: string;
  email: string;
  address: string;
  kvk_number: string | null;
  btw_number: string | null;
  iban: string | null;
  phone_number?: string | null;
  logo_url: string | null;
  template_style: TemplateStyle;
  template_customizations: TemplateCustomizations | null;
  plan: 'free' | 'pro';
  invoice_creation_count?: number | null;
  invoice_footer_text?: string | null;
}
