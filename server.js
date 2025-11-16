import express from 'express';
import cors from 'cors';
import Stripe from 'stripe';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

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

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pprqqanddnixolmbwile.supabase.co';
const supabaseServiceKeySource = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? 'SUPABASE_SERVICE_ROLE_KEY'
  : (process.env.VITE_SUPABASE_SERVICE_ROLE_KEY ? 'VITE_SUPABASE_SERVICE_ROLE_KEY' : null);
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_SERVICE_ROLE_KEY) is missing in environment variables!');
  console.error('   Server will continue but cannot update Supabase automatically.');
  console.error('   Add SUPABASE_SERVICE_ROLE_KEY to .env.local (or rename your Vite key to include this).');
}

if (!supabaseUrl) {
  console.error('❌ SUPABASE_URL is missing!');
  process.exit(1);
}

let supabaseAdmin = null;
if (supabaseServiceKey) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  console.log(`✅ Supabase admin client initialized (source: ${supabaseServiceKeySource})`);
} else {
  console.warn('⚠️ Supabase admin client NOT initialized - no service role key');
}

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3005', 'http://localhost:5173', process.env.VITE_VERCEL_URL || ''],
  credentials: true
}));
app.use(express.json());

const syncPaymentToSupabase = async (session) => {
  console.log('🔍 syncPaymentToSupabase called with:', {
    hasSupabaseAdmin: !!supabaseAdmin,
    hasServiceKey: !!supabaseServiceKey,
    sessionId: session?.id,
    paymentStatus: session?.payment_status
  });

  if (!supabaseAdmin || !supabaseServiceKey) {
    const errorMsg = 'SUPABASE_SERVICE_ROLE_KEY not set in .env.local';
    console.error('❌ ' + errorMsg);
    console.error('   Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to .env.local');
    console.error('   Get it from: Supabase Dashboard > Settings > API > service_role key');
    return { supabaseUserId: null, error: errorMsg };
  }

  try {
    console.log('🔄 Syncing payment to Supabase...', {
      sessionId: session.id,
      paymentStatus: session.payment_status,
      metadata: session.metadata
    });

    const supabaseUserIdFromMetadata = session.metadata?.supabase_user_id || null;
    const customerEmail = session.customer_details?.email || session.customer_email || null;
    const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

    console.log('📋 Payment details:', {
      supabaseUserIdFromMetadata,
      customerEmail,
      paymentIntentId
    });

    let targetUserId = supabaseUserIdFromMetadata;

    // Try to find user by email if no user_id in metadata
    if (!targetUserId && customerEmail) {
      console.log('🔍 Looking up user by email:', customerEmail);
      const { data: profileMatch, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', customerEmail)
        .maybeSingle();

      if (profileError) {
        console.error('❌ Error looking up profile:', profileError);
      } else if (profileMatch?.id) {
        targetUserId = profileMatch.id;
        console.log('✅ Found user by email:', targetUserId);
      } else {
        console.warn('⚠️ No profile found for email:', customerEmail);
      }
    }

    // Update profile to Pro
    if (targetUserId) {
      console.log('💾 Updating profile to Pro for user:', targetUserId);
      console.log('   Using Supabase URL:', supabaseUrl);
      
      const { error: updateError, data: updateData } = await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: 'pro', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', targetUserId)
        .select();

      if (updateError) {
        console.error('❌ Unable to update profile plan:', updateError);
        console.error('   Error code:', updateError.code);
        console.error('   Error message:', updateError.message);
        console.error('   Error details:', JSON.stringify(updateError, null, 2));
        console.error('   This might be due to:');
        console.error('   1. RLS policies blocking the update');
        console.error('   2. The profiles table not existing');
        console.error('   3. The user ID not matching');
      } else {
        if (updateData && updateData.length > 0) {
          console.log('✅ Profile updated to Pro successfully!');
          console.log('   Updated profile:', JSON.stringify(updateData[0], null, 2));
        } else {
          console.warn('⚠️ Update returned no data - profile might not exist or ID mismatch');
        }
      }
    } else {
      console.warn('⚠️ No matching Supabase profile found for payment session', session.id);
      console.warn('   Metadata:', JSON.stringify(session.metadata, null, 2));
      console.warn('   Customer email:', customerEmail);
      console.warn('   Possible reasons:');
      console.warn('   1. supabase_user_id not in session metadata');
      console.warn('   2. Email mismatch between Stripe and Supabase');
      console.warn('   3. User profile not created in Supabase');
    }

    // Log payment event
    console.log('📝 Logging payment event to stripe_payment_events...');
    const eventData = {
      session_id: session.id,
      payment_intent: paymentIntentId,
      payment_status: session.payment_status,
      amount_total: session.amount_total,
      currency: session.currency,
      customer_email: customerEmail,
      supabase_user_id: targetUserId,
      metadata: session.metadata || {}
    };
    console.log('   Event data:', JSON.stringify(eventData, null, 2));
    
    const { error: logError, data: logData } = await supabaseAdmin
      .from('stripe_payment_events')
      .insert(eventData)
      .select();

    if (logError) {
      console.error('❌ Unable to log stripe payment event:', logError);
      console.error('   Error code:', logError.code);
      console.error('   Error message:', logError.message);
      console.error('   Error details:', JSON.stringify(logError, null, 2));
      console.error('   This might be due to:');
      console.error('   1. stripe_payment_events table not existing');
      console.error('   2. RLS policies blocking the insert');
      console.error('   3. Column type mismatch');
    } else {
      if (logData && logData.length > 0) {
        console.log('✅ Payment event logged successfully!');
        console.log('   Logged event:', JSON.stringify(logData[0], null, 2));
      } else {
        console.warn('⚠️ Insert returned no data');
      }
    }

    // Upsert customer
    if (session.customer && customerEmail) {
      console.log('👤 Upserting stripe customer...');
      const customerUpsertData = {
        stripe_customer_id: session.customer,
        supabase_user_id: targetUserId,
        email: customerEmail,
        last_payment_intent: paymentIntentId,
        updated_at: new Date().toISOString()
      };
      console.log('   Customer data:', JSON.stringify(customerUpsertData, null, 2));
      
      const { error: customerError, data: customerData } = await supabaseAdmin
        .from('stripe_customers')
        .upsert(customerUpsertData, { onConflict: 'stripe_customer_id' })
        .select();

      if (customerError) {
        console.error('❌ Unable to upsert stripe customer:', customerError);
        console.error('   Error code:', customerError.code);
        console.error('   Error message:', customerError.message);
        console.error('   Error details:', JSON.stringify(customerError, null, 2));
        console.error('   This might be due to:');
        console.error('   1. stripe_customers table not existing');
        console.error('   2. RLS policies blocking the upsert');
      } else {
        if (customerData && customerData.length > 0) {
          console.log('✅ Stripe customer synced successfully!');
          console.log('   Customer data:', JSON.stringify(customerData[0], null, 2));
        } else {
          console.warn('⚠️ Upsert returned no data');
        }
      }
    } else {
      console.log('⚠️ Skipping customer upsert - no customer ID or email');
      console.log('   session.customer:', session.customer);
      console.log('   customerEmail:', customerEmail);
    }

    return { supabaseUserId: targetUserId, customerEmail };
  } catch (error) {
    console.error('❌ Failed to sync payment to Supabase:', error);
    console.error('   Full error:', JSON.stringify(error, null, 2));
    return { supabaseUserId: null, error };
  }
};

/**
 * Create Stripe Checkout Session
 * POST /api/create-checkout-session
 */
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, userEmail, successUrl, cancelUrl, supabaseUserId } = req.body;

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
      mode: 'payment',
      success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'), // Stripe will replace this
      cancel_url: cancelUrl,
      metadata: {
        supabase_user_id: supabaseUserId || '',
        product_id: priceId
      }
    });

    console.log('✅ Checkout session created:', session.id);
    console.log('📋 Success URL will be:', session.success_url);
    res.json({ sessionId: session.id, url: session.url });
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

    const syncResult = await syncPaymentToSupabase(session);

    res.json({
      status: 'complete',
      payment_status: session.payment_status,
      customer_email: session.customer_email,
      supabase_user_id: syncResult.supabaseUserId || session.metadata?.supabase_user_id || null,
      subscription: session.subscription,
      isPaid: isPaid,
      synced: !!syncResult.supabaseUserId,
      message: syncResult.supabaseUserId ? 'Payment completed and profile updated' : 'Payment completed. No matching profile found to upgrade.'
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
 * Manual fallback to sync a paid session to Supabase
 */
app.post('/api/sync-plan', async (req, res) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        error: `Payment not completed (status: ${session.payment_status})`,
        payment_status: session.payment_status
      });
    }

    const syncResult = await syncPaymentToSupabase(session);

    res.json({
      synced: !!syncResult.supabaseUserId,
      supabase_user_id: syncResult.supabaseUserId,
      session_id: session.id,
      payment_status: session.payment_status,
      message: syncResult.supabaseUserId
        ? 'Account bijgewerkt naar Pro.'
        : 'Betaling gelogd, maar geen profiel gevonden om te upgraden.'
    });
  } catch (error) {
    console.error('❌ Error in /api/sync-plan:', error);
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
  res.json({ 
    status: 'ok',
    supabaseConfigured: !!supabaseAdmin,
    supabaseUrl: supabaseUrl,
    hasServiceKey: !!supabaseServiceKey
  });
});

/**
 * DEBUG: Test Supabase connection and table access
 * GET /api/debug/supabase
 */
app.get('/api/debug/supabase', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        error: 'Supabase admin client not initialized',
        reason: !supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY missing' : 'Unknown error'
      });
    }

    // Test 1: Check if we can query profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, plan')
      .limit(5);

    // Test 2: Check if stripe_payment_events table exists
    const { data: events, error: eventsError } = await supabaseAdmin
      .from('stripe_payment_events')
      .select('*')
      .limit(5);

    // Test 3: Check if stripe_customers table exists
    const { data: customers, error: customersError } = await supabaseAdmin
      .from('stripe_customers')
      .select('*')
      .limit(5);

    res.json({
      supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      tests: {
        profiles: {
          accessible: !profilesError,
          error: profilesError?.message,
          count: profiles?.length || 0,
          sample: profiles?.slice(0, 2)
        },
        stripe_payment_events: {
          accessible: !eventsError,
          error: eventsError?.message,
          count: events?.length || 0,
          sample: events?.slice(0, 2)
        },
        stripe_customers: {
          accessible: !customersError,
          error: customersError?.message,
          count: customers?.length || 0,
          sample: customers?.slice(0, 2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Stripe API server running on http://localhost:${PORT}`);
});

