# Stripe Setup Guide - Phase 1.3

Complete guide for setting up Stripe integration for subscription management.

## Overview

This guide covers:
1. Creating a Stripe account
2. Setting up products and pricing
3. Configuring webhooks
4. Testing the integration
5. Production deployment

---

## 1. Create Stripe Account

### Steps

1. **Sign Up**:
   - Go to https://stripe.com
   - Click "Start now" or "Sign up"
   - Complete registration with email and password

2. **Activate Account**:
   - Verify email address
   - Complete business information
   - Add banking details (required for production)

3. **Get API Keys**:
   - Navigate to https://dashboard.stripe.com/apikeys
   - Copy **Publishable key** (starts with `pk_test_` for test mode)
   - Click "Reveal test key" for **Secret key** (starts with `sk_test_`)
   - Save to `.env.local`:
     ```bash
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
     STRIPE_SECRET_KEY=sk_test_your_secret_key_here
     ```

---

## 2. Create Products and Pricing

### Product 1: Free Tier

**Purpose**: Track free users in Stripe for analytics

1. Go to https://dashboard.stripe.com/products
2. Click "Add product"
3. Configure:
   ```
   Name: PubWon Free
   Description: Free tier with limited features - 1 repository, 10 pain points/month
   ```
4. Pricing:
   ```
   Pricing model: Standard pricing
   Price: $0.00 USD
   Billing period: monthly
   ```
5. Click "Save product"
6. Copy **Price ID** (starts with `price_`) → `STRIPE_PRICE_ID_FREE`

### Product 2: Pro (Monthly)

1. Click "Add product"
2. Configure:
   ```
   Name: PubWon Pro (Monthly)
   Description: Professional tier - 5 repositories, 100 pain points/month, priority support
   ```
3. Pricing:
   ```
   Pricing model: Standard pricing
   Price: $29.00 USD
   Billing period: monthly
   ```
4. Click "Save product"
5. Copy **Price ID** → `STRIPE_PRICE_ID_PRO_MONTHLY`

### Product 3: Pro (Yearly)

**Note**: Create as a new price for the same product (if you want) or separate product

1. Option A: Add to existing Pro product
   - Click on "PubWon Pro" product
   - Click "Add another price"
   - Configure yearly pricing

2. Option B: Create new product
   - Click "Add product"
   - Configure:
     ```
     Name: PubWon Pro (Yearly)
     Description: Professional tier - Annual billing (save 17%)
     ```
   - Pricing:
     ```
     Pricing model: Standard pricing
     Price: $290.00 USD ($24.17/month, 17% savings)
     Billing period: yearly
     ```
   - Click "Save product"
   - Copy **Price ID** → `STRIPE_PRICE_ID_PRO_YEARLY`

### Product 4: Enterprise

1. Click "Add product"
2. Configure:
   ```
   Name: PubWon Enterprise
   Description: Unlimited everything, dedicated support, custom integrations
   ```
3. Pricing:
   ```
   Pricing model: Standard pricing
   Price: $499.00 USD (starting price, can be customized)
   Billing period: monthly
   ```
4. Click "Save product"
5. Copy **Price ID** → `STRIPE_PRICE_ID_ENTERPRISE`

### Environment Variables Update

Add all price IDs to `.env.local`:

```bash
STRIPE_PRICE_ID_FREE=price_free_id_here
STRIPE_PRICE_ID_PRO_MONTHLY=price_pro_monthly_id_here
STRIPE_PRICE_ID_PRO_YEARLY=price_pro_yearly_id_here
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_id_here
```

---

## 3. Configure Webhooks

### Create Webhook Endpoint

1. Go to https://dashboard.stripe.com/webhooks
2. Click "Add endpoint"
3. Configure:
   ```
   Endpoint URL: https://yourdomain.com/api/webhooks/stripe
   (For local testing: Use ngrok or Stripe CLI)

   Description: PubWon subscription webhooks

   Events to send:
   ✓ customer.created
   ✓ customer.updated
   ✓ customer.deleted
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.paid
   ✓ invoice.payment_failed
   ✓ checkout.session.completed
   ```
4. Click "Add endpoint"
5. Click "Reveal" next to "Signing secret"
6. Copy webhook secret (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### Local Testing with Stripe CLI

**Install Stripe CLI**:

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Linux
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.tar.gz
tar -xvf stripe_linux_amd64.tar.gz
sudo mv stripe /usr/local/bin

# Windows
scoop install stripe
```

**Test Webhooks Locally**:

```bash
# Login to Stripe CLI
stripe login

# Forward webhooks to local endpoint
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger test events
stripe trigger customer.subscription.created
stripe trigger invoice.paid
stripe trigger customer.subscription.updated
```

---

## 4. Test the Integration

### Test Checkout Flow

1. **Start Development Server**:
   ```bash
   npm run dev
   ```

2. **Create Test Customer**:
   - Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date (e.g., 12/34)
   - Any 3-digit CVC (e.g., 123)
   - Any ZIP code (e.g., 12345)

3. **Test Scenarios**:

   **Successful Payment**:
   - Card: `4242 4242 4242 4242`
   - Expected: Subscription created, webhooks fired, user upgraded

   **Payment Requires Authentication (3D Secure)**:
   - Card: `4000 0025 0000 3155`
   - Expected: 3D Secure modal, successful after authentication

   **Payment Declined**:
   - Card: `4000 0000 0000 0002`
   - Expected: Payment fails, error message shown

   **Insufficient Funds**:
   - Card: `4000 0000 0000 9995`
   - Expected: Payment fails with insufficient funds error

### Test Subscription Management

1. **Create Subscription**: Subscribe with test card
2. **Update Subscription**: Change plan (upgrade/downgrade)
3. **Cancel Subscription**: Test immediate and end-of-period cancellation
4. **Reactivate**: Reactivate cancelled subscription

### Verify Webhook Processing

1. Check webhook events in Stripe Dashboard:
   - Go to https://dashboard.stripe.com/webhooks
   - Click on your webhook endpoint
   - View event history

2. Check database:
   ```sql
   -- Check if subscription was created
   SELECT * FROM subscriptions ORDER BY created_at DESC LIMIT 5;

   -- Check webhook events
   SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;

   -- Check stripe customers
   SELECT * FROM stripe_customers ORDER BY created_at DESC LIMIT 5;
   ```

---

## 5. Production Deployment

### Switch to Live Mode

1. **Get Live API Keys**:
   - In Stripe Dashboard, toggle from "Test mode" to "Live mode"
   - Go to https://dashboard.stripe.com/apikeys
   - Copy live keys (start with `pk_live_` and `sk_live_`)

2. **Update Production Environment Variables**:
   - In Vercel/production environment:
     ```bash
     NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
     STRIPE_SECRET_KEY=sk_live_your_live_secret_key
     ```

3. **Recreate Products in Live Mode**:
   - Products created in test mode don't transfer to live mode
   - Create all products again in live mode
   - Update price IDs in production environment

4. **Update Webhook Endpoint**:
   - Create new webhook endpoint with production URL
   - Select same events as test mode
   - Copy new live webhook secret → production `STRIPE_WEBHOOK_SECRET`

### Security Checklist

- [ ] API keys are stored as environment variables (never in code)
- [ ] Webhook signature verification is enabled
- [ ] HTTPS is enforced for all webhook endpoints
- [ ] Rate limiting is implemented for API routes
- [ ] Error messages don't expose sensitive information
- [ ] Database has Row Level Security (RLS) enabled
- [ ] Access tokens are encrypted before database storage

### Monitoring Setup

1. **Stripe Dashboard Alerts**:
   - Configure email alerts for failed payments
   - Set up alerts for suspicious activity
   - Enable revenue threshold notifications

2. **Application Monitoring**:
   - Monitor webhook processing errors
   - Track subscription churn rate
   - Alert on payment failures

3. **Database Monitoring**:
   - Monitor webhook_events table for processing failures
   - Track subscription status distribution
   - Monitor usage_tracking for quota enforcement

---

## 6. Common Issues and Solutions

### Issue: Webhook Signature Verification Fails

**Symptoms**: Webhooks return 400 error, logs show "signature verification failed"

**Solutions**:
1. Verify `STRIPE_WEBHOOK_SECRET` matches webhook endpoint secret
2. Ensure raw request body is used (not parsed JSON)
3. Check that signature header is `stripe-signature` (not `Stripe-Signature`)

### Issue: Subscription Not Created in Database

**Symptoms**: Payment succeeds in Stripe, but no subscription record in database

**Solutions**:
1. Check webhook event logs in Stripe Dashboard
2. Verify webhook endpoint is receiving events
3. Check application logs for webhook processing errors
4. Ensure `customer.subscription.created` event is selected in webhook config

### Issue: Duplicate Subscriptions

**Symptoms**: Multiple active subscriptions for same user

**Solutions**:
1. Check database constraint: `UNIQUE(user_id, status)`
2. Implement idempotency in webhook handler
3. Cancel old subscription before creating new one

### Issue: Usage Limits Not Enforced

**Symptoms**: Users exceed plan limits without restriction

**Solutions**:
1. Verify `check_feature_quota()` function is called before operations
2. Ensure usage_tracking records exist for user
3. Check that limits match plan configuration

---

## 7. Testing Checklist

### Basic Flow
- [ ] User can view pricing page
- [ ] User can click "Subscribe" and see checkout
- [ ] Payment with test card succeeds
- [ ] Subscription is created in Stripe
- [ ] Subscription is created in database
- [ ] User is redirected to success page
- [ ] Welcome email is sent

### Webhooks
- [ ] `customer.created` creates stripe_customers record
- [ ] `customer.subscription.created` creates subscription record
- [ ] `customer.subscription.updated` updates subscription
- [ ] `invoice.paid` activates subscription
- [ ] `invoice.payment_failed` marks subscription as past_due
- [ ] `customer.subscription.deleted` cancels subscription

### Subscription Management
- [ ] User can view current plan in dashboard
- [ ] User can upgrade plan
- [ ] User can downgrade plan
- [ ] User can cancel subscription
- [ ] Cancelled subscription remains active until period end
- [ ] User can access billing portal

### Usage Tracking
- [ ] Usage is tracked per feature
- [ ] Limits are enforced based on plan
- [ ] User sees usage in dashboard
- [ ] Upgrade prompt shows when limit reached

---

## 8. Useful Resources

- **Stripe Documentation**: https://stripe.com/docs
- **API Reference**: https://stripe.com/docs/api
- **Webhook Events**: https://stripe.com/docs/api/events/types
- **Testing**: https://stripe.com/docs/testing
- **Stripe CLI**: https://stripe.com/docs/stripe-cli
- **Checkout Guide**: https://stripe.com/docs/payments/checkout
- **Subscriptions Guide**: https://stripe.com/docs/billing/subscriptions/overview

---

## 9. Support

For Stripe-related issues:
1. Check Stripe Dashboard logs
2. Review webhook event history
3. Test with Stripe CLI
4. Contact Stripe support: https://support.stripe.com

For application issues:
1. Check application logs
2. Verify database records
3. Test webhook handler locally
4. Review error tracking (Sentry)
