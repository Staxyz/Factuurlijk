import type { Invoice, UserProfile } from './types';

export const mockInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoice_number: '2024-001',
    invoice_date: '2024-06-01',
    due_date: '2024-06-15',
    customer: { name: 'Stichting Horeca', address: 'Postweg 50', city: '1234 AB, Amsterdam', email: 'contact@horeca.nl' },
    status: 'betaald',
    lines: [
      { id: 'line-1-1', description: 'Webdesign services', quantity: 10, unit_price: 75 },
      { id: 'line-1-2', description: 'Hosting (jaarlijks)', quantity: 1, unit_price: 250 },
    ],
    btw_percentage: 21,
  },
  {
    id: 'inv-2',
    invoice_number: '2024-002',
    invoice_date: '2024-06-10',
    due_date: '2024-06-24',
    customer: { name: 'Jan de Vries', address: 'Plein 1945 1', city: '5678 CD, Utrecht', email: 'jan@devries.nl' },
    status: 'open',
    lines: [
      { id: 'line-2-1', description: 'Consultancy', quantity: 8, unit_price: 100 },
    ],
    btw_percentage: 21,
  },
   {
    id: 'inv-3',
    invoice_number: '2024-003',
    invoice_date: '2024-05-20',
    due_date: '2024-06-03',
    customer: { name: 'Stichting Horeca', address: 'Postweg 50', city: '1234 AB, Amsterdam', email: 'contact@horeca.nl' },
    status: 'verlopen',
    lines: [
      { id: 'line-3-1', description: 'Logo ontwerp', quantity: 1, unit_price: 500 },
    ],
    btw_percentage: 21,
  },
];

export const mockUserProfile: Omit<UserProfile, 'id' | 'updated_at'> = {
  name: 'Jouw Bedrijfsnaam',
  email: 'jouw@email.com',
  address: 'Jouw Straat 1, 1234 AB Jouw Stad',
  kvk_number: '12345678',
  btw_number: 'NL001234567B01',
  iban: 'NL91 ABNA 0417 1643 00',
  logo_url: '',
  template_style: 'corporate',
  template_customizations: null,
  plan: 'free',
  invoice_footer_text: null,
};
