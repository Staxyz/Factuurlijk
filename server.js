import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createMollieClient } from '@mollie/api-client';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const app = express();

// Validate that Mollie API Key is loaded
const mollieApiKey =
  process.env.MOLLIE_API_KEY ||
  process.env.VITE_MOLLIE_API_KEY ||
  process.env.MOLLIE_TEST_API_KEY;

if (!mollieApiKey) {
  console.error('❌ MOLLIE_API_KEY (or VITE_MOLLIE_API_KEY) is not set in environment variables!');
  console.error('   Voeg MOLLIE_API_KEY toe aan .env.local (krijg hem in het Mollie dashboard).');
  process.exit(1);
}

const mollieClient = createMollieClient({ apiKey: mollieApiKey });
console.log('✅ Mollie client initialized with provided API key');

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
const vercelUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3005',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.VITE_FRONTEND_URL,
  process.env.VITE_VERCEL_URL,
  vercelUrl,
  'https://factuurlijk.vercel.app'
].filter(Boolean);

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());

const syncPaymentToSupabase = async (payment) => {
  console.log('🔍 syncPaymentToSupabase called with:', {
    hasSupabaseAdmin: !!supabaseAdmin,
    hasServiceKey: !!supabaseServiceKey,
    paymentId: payment?.id,
    paymentStatus: payment?.status
  });

  if (!supabaseAdmin || !supabaseServiceKey) {
    const errorMsg = 'SUPABASE_SERVICE_ROLE_KEY not set in .env.local';
    console.error('❌ ' + errorMsg);
    console.error('   Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to .env.local');
    console.error('   Get it from: Supabase Dashboard > Settings > API > service_role key');
    return { supabaseUserId: null, error: errorMsg };
  }

  try {
    console.log('🔄 Syncing Mollie payment to Supabase...', {
      paymentId: payment.id,
      paymentStatus: payment.status,
      metadata: payment.metadata
    });

    const rawMetadata = payment.metadata;
    let metadata = {};
    if (typeof rawMetadata === 'string') {
      try {
        metadata = JSON.parse(rawMetadata);
      } catch (parseError) {
        console.warn('⚠️ Unable to parse metadata string, storing raw value');
        metadata = { raw: rawMetadata };
      }
    } else if (rawMetadata && typeof rawMetadata === 'object') {
      metadata = rawMetadata;
    }
    const supabaseUserIdFromMetadata =
      metadata.supabase_user_id ||
      metadata.supabaseUserId ||
      null;
    const customerEmail =
      metadata.customer_email ||
      metadata.email ||
      metadata.user_email ||
      null;

    console.log('📋 Payment details:', {
      supabaseUserIdFromMetadata,
      customerEmail,
      amount: payment.amount
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

    // Update profile to Pro only for successful payments
    if (targetUserId && payment.status === 'paid') {
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
    } else if (!targetUserId) {
      console.warn('⚠️ No matching Supabase profile found for payment', payment.id);
      console.warn('   Metadata:', JSON.stringify(payment.metadata, null, 2));
      console.warn('   Customer email:', customerEmail);
      console.warn('   Possible reasons:');
      console.warn('   1. supabase_user_id niet meegestuurd in metadata');
      console.warn('   2. Email mismatch tussen Mollie en Supabase');
      console.warn('   3. User profile bestaat nog niet in Supabase');
    } else {
      console.log('ℹ️ Payment not marked as paid yet, skipping profile upgrade for now.');
    }

    // Log payment event
    console.log('📝 Logging payment event to mollie_payments...');
    const eventData = {
      payment_id: payment.id,
      payment_status: payment.status,
      amount_value: payment.amount?.value || null,
      amount_currency: payment.amount?.currency || null,
      description: payment.description || null,
      customer_email: customerEmail,
      supabase_user_id: targetUserId,
      metadata: metadata,
      method: payment.method || null,
      paid_at: payment.paidAt || null,
      created_at: new Date().toISOString()
    };
    console.log('   Event data:', JSON.stringify(eventData, null, 2));
    
    const { error: logError, data: logData } = await supabaseAdmin
      .from('mollie_payments')
      .insert(eventData)
      .select();

    if (logError) {
      console.error('❌ Unable to log Mollie payment event:', logError);
      console.error('   Error code:', logError.code);
      console.error('   Error message:', logError.message);
      console.error('   Error details:', JSON.stringify(logError, null, 2));
      console.error('   This might be due to:');
      console.error('   1. mollie_payments table not existing');
      console.error('   2. RLS policies blocking the insert');
      console.error('   3. Column type mismatch');
    } else if (logData && logData.length > 0) {
      console.log('✅ Payment event logged successfully!');
      console.log('   Logged event:', JSON.stringify(logData[0], null, 2));
    }

    return { supabaseUserId: targetUserId, customerEmail };
  } catch (error) {
    console.error('❌ Failed to sync payment to Supabase:', error);
    console.error('   Full error:', JSON.stringify(error, null, 2));
    return { supabaseUserId: null, error };
  }
};

/**
 * Create Mollie Payment
 * POST /api/create-payment
 */
app.post('/api/create-payment', async (req, res) => {
  try {
    const {
      amount,
      description,
      userEmail,
      successUrl,
      webhookUrl,
      supabaseUserId,
      metadata
    } = req.body;

    console.log('📝 Creating Mollie payment:', { amount, userEmail, description });

    if (!amount?.value || !amount?.currency || !description || !successUrl || !userEmail) {
      console.error('❌ Missing required fields for Mollie payment:', {
        hasAmountValue: !!amount?.value,
        hasAmountCurrency: !!amount?.currency,
        hasDescription: !!description,
        hasSuccessUrl: !!successUrl,
        hasEmail: !!userEmail
      });
      return res.status(400).json({
        error: 'Fields amount.value, amount.currency, description, successUrl en userEmail zijn verplicht.'
      });
    }

    const normalizeAmountValue = (value) => {
      if (typeof value === 'number') return value.toFixed(2);
      const parsed = Number(value);
      if (!Number.isFinite(parsed)) {
        throw new Error('Amount value must be a valid number');
      }
      return parsed.toFixed(2);
    };

    const normalizedAmount = {
      value: normalizeAmountValue(amount.value),
      currency: amount.currency
    };

    // Mollie uses the default profile automatically if profileId is omitted
    const paymentPayload = {
      amount: normalizedAmount,
      description,
      redirectUrl: successUrl,
      metadata: {
        ...(metadata || {}),
        supabase_user_id: supabaseUserId || null,
        customer_email: userEmail
      }
    };

    // Only add webhookUrl if it's a valid HTTPS URL (not for localhost testing)
    const webhookUrlEnv = process.env.MOLLIE_WEBHOOK_URL || process.env.VITE_MOLLIE_WEBHOOK_URL;
    if (webhookUrlEnv && webhookUrlEnv.startsWith('https://')) {
      paymentPayload.webhookUrl = webhookUrlEnv;
      console.log('📡 Webhook URL configured:', webhookUrlEnv);
    } else {
      console.log('ℹ️  Webhook URL skipped (localhost/testing mode)');
    }

    console.log('🔄 Calling Mollie API to create payment...');
    console.log('📦 Payment payload:', JSON.stringify(paymentPayload, null, 2));
    
    try {
      const payment = await mollieClient.payments.create(paymentPayload);

      const checkoutUrl = payment?._links?.checkout?.href;
      if (!checkoutUrl) {
        throw new Error('Mollie returned no checkout URL for this payment');
      }

      console.log('✅ Mollie payment created:', payment.id);
      res.json({
        paymentId: payment.id,
        checkoutUrl,
        status: payment.status
      });
    } catch (mollieError) {
      console.error('❌ Mollie API Error Details:');
      console.error('   Status:', mollieError?.status);
      console.error('   Title:', mollieError?.title);
      console.error('   Detail:', mollieError?.detail);
      console.error('   Field:', mollieError?.field);
      console.error('   Full error:', JSON.stringify(mollieError, null, 2));
      
      const errorMessage = mollieError?.detail || mollieError?.title || mollieError?.message || 'Unknown Mollie error';
      throw new Error(`Mollie API Error: ${errorMessage}`);
    }
  } catch (error) {
    console.error('❌ Error creating Mollie payment:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
});

/**
 * Mollie Webhook Handler
 * POST /api/mollie-webhook
 * 
 * This endpoint is called by Mollie when a payment status changes.
 * Mollie will send payment status updates here.
 */
app.post('/api/mollie-webhook', async (req, res) => {
  try {
    console.log('📡 Mollie webhook received:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    // Mollie can send webhook in different formats
    // Format 1: { id: "tr_xxxxx" }
    // Format 2: Direct payment object
    let paymentId = req.body?.id || req.body?.paymentId;
    
    // If no id in body, check if body itself is the payment ID string
    if (!paymentId && typeof req.body === 'string') {
      paymentId = req.body;
    }
    
    // If still no paymentId, check query params (some webhook formats use this)
    if (!paymentId && req.query?.id) {
      paymentId = req.query.id;
    }
    
    console.log('🔍 Extracted payment ID:', paymentId);
    
    if (!paymentId) {
      console.error('❌ No payment ID found in webhook');
      console.error('   Body:', JSON.stringify(req.body, null, 2));
      // Still return 200 to prevent Mollie from retrying
      return res.status(200).json({ received: true, error: 'No payment ID provided' });
    }
    
    // Fetch payment from Mollie to get latest status
    console.log('🔄 Fetching payment from Mollie API...');
    const payment = await mollieClient.payments.get(paymentId);
    
    console.log('📊 Payment retrieved from Mollie:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      metadata: payment.metadata
    });
    
    // Process payment based on status
    if (payment.status === 'paid') {
      console.log('✅ Payment is paid, syncing to Supabase...');
      const syncResult = await syncPaymentToSupabase(payment);
      
      if (syncResult.supabaseUserId) {
        console.log('✅ Payment synced successfully! User upgraded:', syncResult.supabaseUserId);
      } else {
        console.warn('⚠️ Payment synced but no user ID found:', syncResult.error);
      }
    } else {
      console.log(`ℹ️  Payment status is "${payment.status}", not processing (only "paid" status is processed)`);
    }
    
    // Always return 200 to Mollie (they will retry if we return error)
    res.status(200).json({ 
      received: true, 
      paymentId: payment.id,
      status: payment.status,
      processed: payment.status === 'paid'
    });
  } catch (error) {
    console.error('❌ Error processing Mollie webhook:', error);
    console.error('   Error details:', {
      message: error.message,
      stack: error.stack,
      body: req.body
    });
    // Still return 200 to prevent Mollie from retrying excessively
    res.status(200).json({ 
      received: true, 
      error: 'Webhook processed but error occurred',
      errorMessage: error.message 
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
 * Verify Mollie Payment Status
 * POST /api/verify-payment
 * 
 * This endpoint verifies that a Mollie payment was completed successfully.
 * IMPORTANT: Only upgrade users to Pro if this returns status 'complete'
 */
app.post('/api/verify-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;

    console.log('🔍 Verifying Mollie payment:', paymentId);

    if (!paymentId) {
      console.error('❌ Missing paymentId');
      return res.status(400).json({
        error: 'Missing required field: paymentId',
        status: 'invalid'
      });
    }

    console.log('🔄 Fetching payment from Mollie...');
    const payment = await mollieClient.payments.get(paymentId);

    console.log('📊 Payment retrieved:', {
      id: payment.id,
      status: payment.status,
      method: payment.method,
      amount: payment.amount
    });

    const isPaid = payment.status === 'paid';
    const isProcessing = ['authorized', 'pending', 'open'].includes(payment.status || '');

    if (!isPaid && !isProcessing) {
      console.error('❌ Payment not successful. Status:', payment.status);
      return res.json({
        status: 'failed',
        payment_status: payment.status,
        message: 'Payment was not completed successfully'
      });
    }

    console.log('✅ Payment verified successfully! Status:', payment.status);

    const syncResult = await syncPaymentToSupabase(payment);

    res.json({
      status: isPaid ? 'complete' : 'processing',
      payment_status: payment.status,
      amount: payment.amount,
      payment_id: payment.id,
      customer_email: syncResult.customerEmail,
      supabase_user_id: syncResult.supabaseUserId || null,
      isPaid,
      synced: !!syncResult.supabaseUserId && isPaid,
      message: isPaid
        ? (syncResult.supabaseUserId
          ? 'Payment completed and profile updated'
          : 'Payment completed. No matching profile found to upgrade.')
        : 'Payment processing, please retry shortly.'
    });
  } catch (error) {
    console.error('❌ Error verifying Mollie payment:', error);
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
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'paymentId is required' });
    }

    const payment = await mollieClient.payments.get(paymentId);

    if (payment.status !== 'paid') {
      return res.status(400).json({
        error: `Payment not completed (status: ${payment.status})`,
        payment_status: payment.status
      });
    }

    const syncResult = await syncPaymentToSupabase(payment);

    res.json({
      synced: !!syncResult.supabaseUserId,
      supabase_user_id: syncResult.supabaseUserId,
      payment_id: payment.id,
      payment_status: payment.status,
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

    // Test 2: Check if mollie_payments table exists
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('mollie_payments')
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
        mollie_payments: {
          accessible: !paymentsError,
          error: paymentsError?.message,
          count: payments?.length || 0,
          sample: payments?.slice(0, 2)
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
  console.log(`✅ Mollie API server running on http://localhost:${PORT}`);
});

