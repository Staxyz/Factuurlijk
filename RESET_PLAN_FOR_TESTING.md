# How to Reset Your Plan for Testing

Your account is currently set to "Pro Plan", which means the "Upgrade naar Pro" button is not visible on the upgrade page. To test the new payment verification system, you need to reset your plan back to "Free".

## Option 1: Via Supabase Dashboard (Recommended)

1. Go to your **Supabase Dashboard**: https://app.supabase.com
2. Navigate to your project
3. Go to **SQL Editor**
4. Run this query:

```sql
UPDATE profiles 
SET plan = 'free'
WHERE id = (SELECT id FROM auth.users WHERE email = 'stormburg083@gmail.com')
LIMIT 1;
```

Replace `'stormburg083@gmail.com'` with your actual email address.

5. After running, go back to your app and refresh: `http://localhost:3000`
6. You should now see "Free Plan" in the sidebar
7. Navigate to the Upgrade page and click "Upgrade naar Pro"

## Option 2: Direct Database Manipulation

If you have direct access to your Supabase database:

1. Open your Supabase Dashboard
2. Click on the **profiles** table
3. Find your row (search by email)
4. Edit the `plan` column and change it from `'pro'` to `'free'`
5. Click Save

## What Happens Next

After you reset your plan to Free:

1. The "Upgrade naar Pro" button will appear on the upgrade page
2. Click the button
3. You'll be redirected to Stripe's test checkout page
4. Use Stripe's test card:
   - Card Number: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `567`
   - Any future date

5. Complete the payment
6. You'll be redirected back to `#/checkout-success?session_id=...`
7. The backend will verify the payment with Stripe
8. Your plan will be updated to "Pro" ✓

## Testing the Security

The new system will only upgrade your plan if:
✓ You have a valid session_id in the URL
✓ The session exists in Stripe
✓ The payment_status is 'paid'

You CANNOT get Pro by:
✗ Navigating directly to `#/checkout-success` without a session_id
✗ Using a fake session_id
✗ Using an unpaid session_id

## Troubleshooting

### "I reset my plan but it still shows Pro"
- Refresh the page (Ctrl+Shift+R for hard refresh)
- Check you're modifying the right table/row
- Verify the email address matches

### "The checkout button doesn't work"
- Check the browser console (F12) for errors
- Look for the "🔗 Checkout URLs" log message
- Check that the Price ID is configured in `.env.local`

### "I get 'Something went wrong' on Stripe's page"
- This usually means the session configuration is invalid
- Check the backend logs for error messages
- Verify the success_url and cancel_url are correct

## After Testing

Once you've confirmed the payment flow works:
1. Your plan should automatically be "Pro"
2. You can test it by logging out and back in
3. The sidebar should show "Pro Plan"
4. You'll have access to Pro features




