import { buildApiUrl } from '../apiConfig';

export interface CreateMolliePaymentOptions {
  amountValue: string | number;
  currency?: string;
  description: string;
  userEmail: string;
  successUrl: string;
  webhookUrl?: string;
  supabaseUserId?: string | null;
  metadata?: Record<string, unknown>;
}

interface CreateMolliePaymentResponse {
  paymentId: string;
  checkoutUrl: string;
  status: string;
}

const PAYMENT_STORAGE_KEY = 'factuurlijk:lastPaymentId';

export async function createMolliePayment(options: CreateMolliePaymentOptions): Promise<CreateMolliePaymentResponse> {
  const {
    amountValue,
    currency = 'EUR',
    description,
    userEmail,
    successUrl,
    webhookUrl,
    supabaseUserId,
    metadata
  } = options;

  try {
    console.log('🔄 Creating Mollie payment...', { amountValue, currency, description });

    const endpoint = buildApiUrl('/api/create-payment');
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: { value: amountValue, currency },
        description,
        userEmail,
        successUrl,
        webhookUrl,
        supabaseUserId,
        metadata
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: { error?: string } = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (parseError) {
        console.error('Could not parse Mollie API error response as JSON');
      }
      throw new Error(errorData.error || errorText || 'Failed to create Mollie payment');
    }

    const data = await response.json();
    console.log('✅ Mollie payment created:', data.paymentId);

    if (!data.checkoutUrl) {
      throw new Error('Mollie returned no checkout URL');
    }

    return {
      paymentId: data.paymentId,
      checkoutUrl: data.checkoutUrl,
      status: data.status
    };
  } catch (error) {
    console.error('❌ Error creating Mollie payment:', error);
    throw error;
  }
}

export async function initiateCheckout(options: CreateMolliePaymentOptions): Promise<void> {
  try {
    const { paymentId, checkoutUrl } = await createMolliePayment(options);

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(PAYMENT_STORAGE_KEY, paymentId);
    }

    console.log('✅ Redirecting to Mollie checkout:', checkoutUrl);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('❌ Checkout failed:', error);
    throw error;
  }
}

export function getStoredPaymentId(): string | null {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(PAYMENT_STORAGE_KEY);
}

export function clearStoredPaymentId(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(PAYMENT_STORAGE_KEY);
}
