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
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    console.log('✅ Checkout session created:', session.id);
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

