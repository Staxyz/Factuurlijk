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
  customer_type?: 'bedrijf' | 'persoon';
  kvk_number?: string;
  btw_number?: string;
  phone_number?: string;
  address_line_2?: string;
  postal_code?: string;
  country?: string;
  preferred_language?: string;
}

// Represents a single line item on an invoice
export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  // FIX: Add optional discount_percentage to align with its usage in InvoicePreview.tsx.
  discount_percentage?: number;
  discount_type?: 'percentage' | 'euros';
  discount_amount?: number; // For euros discount
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
    kvk_number?: string;
    btw_number?: string;
  };
  status: 'betaald' | 'open' | 'verlopen';
  lines: InvoiceLine[];
  btw_percentage: number;
  created_at?: string;
  is_recurring?: boolean;
  recurring_template_id?: string;
  recurring_interval?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_start_date?: string;
  recurring_end_date?: string | null; // null = voor altijd
}

// Represents a recurring invoice template
export interface RecurringInvoiceTemplate {
  id: string;
  user_id: string;
  name: string;
  customer: {
    name: string;
    address: string;
    city: string;
    email: string;
    kvk_number?: string;
    btw_number?: string;
  };
  lines: InvoiceLine[];
  btw_percentage: number;
  recurring_interval: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  recurring_start_date: string;
  recurring_end_date: string | null;
  created_at: string;
  updated_at: string;
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
  onboarding_completed?: boolean | null;
  onboarding_profile_completed?: boolean | null;
  onboarding_template_completed?: boolean | null;
  onboarding_invoice_completed?: boolean | null;
}
