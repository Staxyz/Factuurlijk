/**
 * Create a checkout session via local backend API
 * @param priceId - Stripe Price ID (monthly or yearly)
 * @param userEmail - Customer email
 * @param successUrl - URL to redirect to on successful payment
 * @param cancelUrl - URL to redirect to if payment is cancelled
 */
export async function createCheckoutSession(
  priceId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  try {
    console.log('🔄 Creating checkout session...', { priceId, userEmail });
    
    // Call local backend API to create a checkout session
    const response = await fetch('http://localhost:3001/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        priceId, 
        userEmail, 
        successUrl, 
        cancelUrl 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Backend API error:', errorData);
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    console.log('✅ Checkout session created:', data.sessionId);
    return data.sessionId;
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Initiate checkout by creating a session and redirecting to Stripe hosted checkout
 */
export async function initiateCheckout(
  priceId: string,
  userEmail: string,
  successUrl: string,
  cancelUrl: string
): Promise<void> {
  try {
    console.log('🚀 Initiating checkout...');
    const sessionId = await createCheckoutSession(priceId, userEmail, successUrl, cancelUrl);
    
    // Redirect to Stripe hosted checkout
    const checkoutUrl = `https://checkout.stripe.com/pay/${sessionId}`;
    console.log('🔗 Redirecting to:', checkoutUrl);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('❌ Error initiating checkout:', error);
    throw error;
  }
}

