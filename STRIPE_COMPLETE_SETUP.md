# ✅ Complete Stripe Setup Guide

## 🎯 Wat Je Tot Nu Toe Hebt

1. ✅ Environment variables (.env.local)
2. ✅ Stripe packages (npm install)
3. ✅ Frontend checkout service
4. ✅ SQL database setup
5. ✅ UpgradePage integratie

## 🚀 Wat Nog Nodig Is (7 Stappen)

---

## **STAP 1: SQL Database Uitvoeren**

1. Open Supabase Dashboard → SQL Editor
2. Kopieeer de volledige code van `stripe_database_setup.sql`
3. Plak in SQL Editor en klik **Run**
4. Controleer dat alles succesvol is

---

## **STAP 2: Supabase Redirect URLs Configureren**

1. Ga naar Supabase Dashboard → Authentication → URL Configuration
2. Voeg deze URLs toe:
   ```
   Redirect URLs:
   - http://localhost:3000/checkout-success
   - http://localhost:5173/checkout-success
   - https://yourdomain.com/checkout-success
   ```

---

## **STAP 3: Supabase Edge Function #1 - create-checkout-session**

1. Ga naar **Edge Functions** in Supabase
2. Klik **Create a new function**
3. Noem het: `create-checkout-session`
4. Plak deze code:

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { priceId, userEmail, successUrl, cancelUrl } = await req.json();

    if (!priceId || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing priceId or userEmail' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get or create Stripe customer
    const customerList = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    let customerId: string;

    if (customerList.data.length > 0) {
      customerId = customerList.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: userEmail,
      });
      customerId = customer.id;

      // Save to database
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
      const { error: dbError } = await supabase
        .from('stripe_customers')
        .insert({
          stripe_customer_id: customerId,
          id: req.headers.get('x-user-id'),
        });

      if (dbError) {
        console.error('DB error saving customer:', dbError);
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl + '?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: cancelUrl,
    });

    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

5. Ga naar **Settings** → **Environment Variables**
6. Voeg toe:
   - Key: `STRIPE_SECRET_KEY`
   - Value: `sk_test_xxx` (jouw Stripe Secret Key)
7. Klik **Deploy**

---

## **STAP 4: Supabase Edge Function #2 - verify-checkout**

1. Klik **Create a new function**
2. Noem het: `verify-checkout`
3. Plak deze code:

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Retrieve checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return new Response(
        JSON.stringify({ error: 'Payment not completed', status: session.payment_status }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Payment succeeded - subscription should be created
    // Get subscription ID
    const subscriptions = await stripe.subscriptions.list({
      customer: session.customer as string,
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      // Save subscription to database
      const { error: dbError } = await supabase
        .from('stripe_subscriptions')
        .upsert({
          id: subscription.id,
          stripe_subscription_id: subscription.id,
          stripe_customer_id: subscription.customer as string,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        });

      if (dbError) {
        console.error('DB error saving subscription:', dbError);
        throw dbError;
      }
    }

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('Verification error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
```

4. Deploy (dezelfde environment variable gebruiken)

---

## **STAP 5: Stripe Webhook Configureren**

1. Ga naar https://dashboard.stripe.com/test/webhooks
2. Klik **Add Endpoint**
3. Voer in:
   ```
   Endpoint URL: https://[supabase-project-id].supabase.co/functions/v1/stripe-webhook
   ```
4. Selecteer events:
   - `charge.succeeded`
   - `charge.failed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Klik **Create Endpoint**
6. Klik op het endpoint
7. Kopieer **Signing Secret** (begint met `whsec_`)

---

## **STAP 6: Webhook Edge Function Aanmaken**

1. Maak nieuwe Edge Function: `stripe-webhook`
2. Plak deze code:

```typescript
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { serve } from 'https://deno.land/std@0.170.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || '';

serve(async (req) => {
  if (req.method === 'POST') {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') || '';

    try {
      const event = stripe.webhooks.constructEvent(body, sig, webhookSecret);

      const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
          const subscription = event.data.object;
          await supabase.from('stripe_subscriptions').upsert({
            id: subscription.id,
            stripe_subscription_id: subscription.id,
            stripe_customer_id: subscription.customer,
            stripe_price_id: subscription.items.data[0].price.id,
            status: subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          });
          break;

        case 'customer.subscription.deleted':
          const deletedSub = event.data.object;
          await supabase
            .from('stripe_subscriptions')
            .update({ status: 'canceled', canceled_at: new Date().toISOString() })
            .eq('stripe_subscription_id', deletedSub.id);
          break;
      }

      return new Response(
        JSON.stringify({ received: true }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    } catch (err) {
      console.error('Webhook error:', err);
      return new Response('Webhook error', { status: 400 });
    }
  }

  return new Response('Method not allowed', { status: 405 });
});
```

3. Voeg environment variable toe:
   - Key: `STRIPE_WEBHOOK_SECRET`
   - Value: Je webhook signing secret van Stripe
4. Deploy

---

## **STAP 7: Test de Complete Flow**

1. **Start je webapp**: `npm run dev`
2. **Ga naar de Upgrade pagina**
3. **Klik "Upgrade naar Pro"**
4. **Test payment card**:
   - Number: `4242 4242 4242 4242`
   - Expiry: `12/25`
   - CVC: `123`
5. **Controleer of**:
   - ✅ Checkout page verschijnt
   - ✅ Payment succeeds
   - ✅ Redirects naar dashboard
   - ✅ Plan wordt "Pro"

---

## **✅ Checklist**

- [ ] SQL Database setup uitgevoerd
- [ ] Redirect URLs geconfigureerd
- [ ] Edge Function `create-checkout-session` gedeployed
- [ ] Edge Function `verify-checkout` gedeployed
- [ ] Webhook endpoint aangemaakt in Stripe
- [ ] Edge Function `stripe-webhook` gedeployed
- [ ] Test payment gedaan
- [ ] Plan updated naar "Pro"

---

## **🐛 Troubleshooting**

**Checkout werkt niet?**
- Check `.env.local` - zijn alle keys correct?
- Check Supabase Edge Functions → Logs

**Betaling werkt maar plan update niet?**
- Check `stripe_subscriptions` tabel in Supabase
- Controleer triggers

**Webhook errors?**
- Controleer signing secret
- Check webhook logs in Stripe dashboard

---

Klaar? Vraag me om hulp bij een stap! 🚀

