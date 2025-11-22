import { createMollieClient } from '@mollie/api-client';
import { createClient } from '@supabase/supabase-js';

// Initialize Mollie client
const mollieApiKey = process.env.MOLLIE_API_KEY || process.env.VITE_MOLLIE_API_KEY;
if (!mollieApiKey) {
  console.error('❌ MOLLIE_API_KEY is not set!');
}
const mollieClient = createMollieClient({ apiKey: mollieApiKey });

// Initialize Supabase admin client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (supabaseServiceKey && supabaseUrl) {
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
} else {
  console.warn('⚠️ Supabase admin client NOT initialized - missing keys');
}

// Sync payment to Supabase
const syncPaymentToSupabase = async (payment) => {
  if (!supabaseAdmin || !supabaseServiceKey) {
    const errorMsg = 'SUPABASE_SERVICE_ROLE_KEY not set';
    console.error('❌ ' + errorMsg);
    return { supabaseUserId: null, error: errorMsg };
  }

  try {
    const rawMetadata = payment.metadata;
    let metadata = {};
    if (typeof rawMetadata === 'string') {
      try {
        metadata = JSON.parse(rawMetadata);
      } catch (parseError) {
        metadata = { raw: rawMetadata };
      }
    } else if (rawMetadata && typeof rawMetadata === 'object') {
      metadata = rawMetadata;
    }

    const supabaseUserIdFromMetadata = metadata.supabase_user_id || metadata.supabaseUserId || null;
    const customerEmail = metadata.customer_email || metadata.email || metadata.user_email || null;

    let targetUserId = supabaseUserIdFromMetadata;

    // Try to find user by email if no user_id in metadata
    if (!targetUserId && customerEmail) {
      const { data: profileMatch } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', customerEmail.toLowerCase().trim())
        .maybeSingle();

      if (profileMatch?.id) {
        targetUserId = profileMatch.id;
      }
    }

    // Update profile to Pro only for successful payments
    if (targetUserId && payment.status === 'paid') {
      await supabaseAdmin
        .from('profiles')
        .update({ 
          plan: 'pro', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', targetUserId);
    }

    // Log payment event
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
    
    const { error: logError } = await supabaseAdmin
      .from('mollie_payments')
      .insert(eventData);

    if (logError) {
      console.error('❌ Unable to log Mollie payment event:', logError);
    } else {
      console.log('✅ Payment event logged successfully!');
    }

    return {
      supabaseUserId: targetUserId,
      customerEmail: customerEmail,
      error: targetUserId ? null : (customerEmail ? 'No user found for email: ' + customerEmail : 'No customer email provided'),
      upgradeSuccess: targetUserId && payment.status === 'paid'
    };
  } catch (error) {
    console.error('❌ Failed to sync payment to Supabase:', error);
    return { 
      supabaseUserId: null, 
      customerEmail: null,
      error: error.message || 'Unknown error',
      upgradeSuccess: false
    };
  }
};

// Vercel serverless function handler
export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📡 Mollie webhook received:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString()
    });
    
    // Extract payment ID from various formats
    let paymentId = req.body?.id || req.body?.paymentId;
    
    if (!paymentId && typeof req.body === 'string') {
      paymentId = req.body;
    }
    
    if (!paymentId && req.query?.id) {
      paymentId = req.query.id;
    }
    
    console.log('🔍 Extracted payment ID:', paymentId);
    
    if (!paymentId) {
      console.error('❌ No payment ID found in webhook');
      return res.status(200).json({ received: true, error: 'No payment ID provided' });
    }
    
    // Fetch payment from Mollie
    console.log('🔄 Fetching payment from Mollie API...');
    const payment = await mollieClient.payments.get(paymentId);
    
    console.log('📊 Payment retrieved from Mollie:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      method: payment.method,
      metadata: payment.metadata
    });
    
    // Get customer email
    let customerEmail = null;
    if (payment.metadata?.customer_email) {
      customerEmail = payment.metadata.customer_email;
    } else if (payment.customerId) {
      try {
        const customer = await mollieClient.customers.get(payment.customerId);
        customerEmail = customer.email;
      } catch (customerError) {
        console.warn('⚠️ Could not fetch customer from Mollie:', customerError);
      }
    }
    
    // Process payment
    if (payment.status === 'paid') {
      console.log('✅ Payment is paid, syncing to Supabase...');
      const syncResult = await syncPaymentToSupabase(payment);
      
      if (syncResult.supabaseUserId) {
        console.log('✅ Payment synced successfully! User upgraded to Pro:', syncResult.supabaseUserId);
      } else {
        console.warn('⚠️ Payment synced but no user ID found:', syncResult.error);
      }
    } else {
      console.log(`ℹ️  Payment status is "${payment.status}", not processing`);
    }
    
    // Always return 200 to Mollie
    return res.status(200).json({ 
      received: true, 
      paymentId: payment.id,
      status: payment.status,
      processed: payment.status === 'paid'
    });
  } catch (error) {
    console.error('❌ Error processing Mollie webhook:', error);
    // Still return 200 to prevent Mollie from retrying excessively
    return res.status(200).json({ 
      received: true, 
      error: 'Webhook processed but error occurred',
      errorMessage: error.message 
    });
  }
}

