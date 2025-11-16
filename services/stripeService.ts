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
  cancelUrl: string,
  supabaseUserId?: string | null
): Promise<{ sessionId: string; url: string }> {
  try {
    console.log('🔄 Creating checkout session...', { priceId, userEmail });
    
    console.log('📍 Backend URL: http://localhost:3001/api/create-checkout-session');
    
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
        cancelUrl,
        supabaseUserId
      }),
    });

    console.log('📦 Response status:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend API error - Raw response:', errorText);
      let errorData = {};
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        console.error('Could not parse error response as JSON');
      }
      throw new Error(errorData.error || errorText || 'Failed to create checkout session');
    }

    const data = await response.json();
    console.log('✅ Checkout session created:', data.sessionId);
    if (!data.url) {
      throw new Error('Stripe did not return a checkout URL');
    }
    return { sessionId: data.sessionId, url: data.url };
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    console.error('   Full error object:', error);
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
  cancelUrl: string,
  supabaseUserId?: string | null
): Promise<void> {
  try {
    console.log('🚀 Initiating checkout...');
    console.log('  priceId:', priceId);
    console.log('  userEmail:', userEmail);
    
    const { sessionId, url } = await createCheckoutSession(priceId, userEmail, successUrl, cancelUrl, supabaseUserId);
    
    if (!url) {
      throw new Error('No checkout URL returned from backend');
    }
    
    console.log('✅ Got session:', sessionId);
    console.log('✅ Redirecting to:', url);
    
    window.location.href = url;
  } catch (error) {
    console.error('❌ Checkout failed:', error);
    throw error;
  }
}

