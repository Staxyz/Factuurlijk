import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();

// Validate that Stripe Secret Key is loaded
const stripeSecretKey = process.env.VITE_STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('❌ VITE_STRIPE_SECRET_KEY is not set in environment variables!');
  process.exit(1);
}

const stripe = new Stripe(stripeSecretKey);
console.log('✅ Stripe initialized with secret key');

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://localhost:5173', process.env.VITE_VERCEL_URL || ''],
  credentials: true
}));
app.use(express.json());

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userEmail, successUrl, cancelUrl } = req.body;

    console.log('📝 Creating checkout session:', { priceId, userEmail });

    // Validate inputs
    if (!priceId || !userEmail || !successUrl || !cancelUrl) {
      console.error('❌ Missing required fields:', { priceId, userEmail, successUrl, cancelUrl });
      return res.status(400).json({
        error: 'Missing required fields: priceId, userEmail, successUrl, cancelUrl'
      });
    }

    // Create checkout session
    console.log('🔄 Calling Stripe API to create session...');
    const session = await stripe.checkout.sessions.create({
      customer_email: userEmail,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'), // Stripe will replace this
      cancel_url: cancelUrl,
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('📋 Success URL will be:', session.success_url);
    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('❌ Error creating checkout session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Create Stripe Payment Link
 * POST /api/create-payment-link
 */
app.post('/api/create-payment-link', async (req, res) => {
  try {
    const { priceId } = req.body;

    console.log('📝 Creating payment link for price:', priceId);

    // Validate input
    if (!priceId) {
      console.error('❌ Missing required field: priceId');
      return res.status(400).json({
        error: 'Missing required field: priceId'
      });
    }

    // Create payment link
    console.log('🔄 Calling Stripe API to create payment link...');
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
    });

    console.log('✅ Payment link created:', paymentLink.url);
    res.json({ paymentLinkUrl: paymentLink.url });
  } catch (error) {
    console.error('❌ Error creating payment link:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * ADMIN: Reset user plan to Free (for testing only)
 * POST /api/admin/reset-plan
 */
app.post('/api/admin/reset-plan', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required'
      });
    }

    console.log('🔧 Admin: Resetting plan for:', email);

    // This is a test endpoint - in production, should require authentication
    // For now, we'll just log it and warn
    console.warn('⚠️  ADMIN ENDPOINT: Resetting plan for user:', email);

    res.json({
      message: 'Admin endpoint received',
      email: email,
      note: 'Note: You need to update Supabase directly. Go to your Supabase dashboard and update the profiles table.'
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Verify Checkout Session Status
 * POST /api/verify-session
 * 
 * This endpoint verifies that a Stripe checkout session was completed successfully.
 * IMPORTANT: Only upgrade users to Pro if this returns status 'complete'
 */
app.post('/api/verify-session', async (req, res) => {
  try {
    const { sessionId } = req.body;

    console.log('🔍 Verifying checkout session:', sessionId);

    // Validate input
    if (!sessionId) {
      console.error('❌ Missing sessionId');
      return res.status(400).json({
        error: 'Missing required field: sessionId',
        status: 'invalid'
      });
    }

    // Retrieve session from Stripe
    console.log('🔄 Fetching session from Stripe...');
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    console.log('📊 Session retrieved:', {
      id: session.id,
      status: session.payment_status,
      customer_email: session.customer_email,
      subscription: session.subscription
    });

    // Check if payment is paid (not just initiated)
    const isPaid = session.payment_status === 'paid';
    const isProcessing = session.payment_status === 'unpaid'; // Payment initiated but not confirmed yet

    if (!isPaid && !isProcessing) {
      console.error('❌ Payment not successful. Status:', session.payment_status);
      return res.json({
        status: 'failed',
        payment_status: session.payment_status,
        message: 'Payment was not completed successfully'
      });
    }

    console.log('✅ Session verified successfully! Payment status:', session.payment_status);
    res.json({
      status: 'complete',
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      subscription: session.subscription,
      isPaid: isPaid,
      message: 'Payment completed successfully'
    });
  } catch (error) {
    console.error('❌ Error verifying session:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 'error'
    });
  }
});

/**
 * Health check
 * GET /api/health
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Stripe API server running on http://localhost:${PORT}`);
});

