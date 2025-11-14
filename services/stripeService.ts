/**
 * Create a payment link via local backend API
 * @param priceId - Stripe Price ID (monthly or yearly)
 */
export async function createPaymentLink(priceId: string): Promise<string> {
  try {
    // Call local backend API to create a payment link
    const response = await fetch('http://localhost:3001/api/create-payment-link', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', errorData);
      throw new Error(errorData.error || 'Failed to create payment link');
    }

    const data = await response.json();
    return data.paymentLinkUrl;
  } catch (error) {
    console.error('Error creating payment link:', error);
    throw error;
  }
}

/**
 * Initiate checkout by redirecting to payment link
 */
export async function initiateCheckout(
  priceId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<void> {
  try {
    const paymentLinkUrl = await createPaymentLink(priceId);
    window.location.href = paymentLinkUrl;
  } catch (error) {
    console.error('Error initiating checkout:', error);
    throw error;
  }
}

