import { supabase } from '../supabaseClient';

/**
 * Create a Stripe checkout session
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
    // Call Supabase Edge Function to create Stripe checkout session
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          userEmail,
          successUrl,
          cancelUrl,
        }),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
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
    const { loadStripe } = await import('@stripe/stripe-js');
    const stripe = await loadStripe(
      import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
    );

    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });

    if (error) {
      throw new Error(error.message);
    }
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

