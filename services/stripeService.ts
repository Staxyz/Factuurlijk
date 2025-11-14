/**
 * Create a Stripe checkout session via local backend API
 * @param priceId - Stripe Price ID (monthly or yearly)
 * @param userEmail - User email address
 * @param successUrl - URL to redirect after successful payment
 * @param cancelUrl - URL to redirect if user cancels
 */
export async function createCheckoutSession(
  priceId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    // Call local backend API instead of Edge Function
    const response = await fetch('http://localhost:3001/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId,
        userEmail,
        successUrl,
        cancelUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Backend API error:', errorData);
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    return data.sessionId;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Redirect to Stripe checkout
 * @param sessionId - Stripe Session ID from create-checkout-session
 */
export async function redirectToCheckout(sessionId: string): Promise<void> {
  try {
    // Stripe recommends redirecting directly to the Stripe Checkout URL
    // The session ID is used as a query parameter in the checkout URL
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error redirecting to checkout:', error);
    throw error;
  }
}

/**
 * Create and redirect to Stripe checkout in one function
 */
export async function initiateCheckout(
  priceId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<void> {
  const sessionId = await createCheckoutSession(
    priceId,
    userEmail,
    successUrl,
    cancelUrl
  );
  await redirectToCheckout(sessionId);
}

