/**
 * Stripe Webhook Handler
 * Phase 1.3: Stripe Integration
 *
 * Handles all Stripe webhook events for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { stripe, verifyWebhookSignature } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST handler for Stripe webhooks
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = verifyWebhookSignature(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  // Log webhook event
  await logWebhookEvent(event);

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.created':
        await handleCustomerCreated(event.data.object as Stripe.Customer);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'customer.deleted':
        await handleCustomerDeleted(event.data.object as Stripe.Customer);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await markWebhookProcessed(event.id);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    await markWebhookFailed(event.id, error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Log webhook event to database
 */
async function logWebhookEvent(event: Stripe.Event) {
  const subscription = event.data.object as any;

  await supabase.from('webhook_events').insert({
    event_id: event.id,
    event_type: event.type,
    stripe_customer_id: subscription.customer || null,
    stripe_subscription_id: subscription.id || null,
    payload: event.data.object,
    processed: false,
  });
}

/**
 * Mark webhook event as processed
 */
async function markWebhookProcessed(eventId: string) {
  await supabase
    .from('webhook_events')
    .update({ processed: true, processed_at: new Date().toISOString() })
    .eq('event_id', eventId);
}

/**
 * Mark webhook event as failed
 */
async function markWebhookFailed(eventId: string, error: any) {
  await supabase
    .from('webhook_events')
    .update({
      processed: false,
      error_message: error?.message || 'Unknown error',
      processed_at: new Date().toISOString(),
    })
    .eq('event_id', eventId);
}

/**
 * Handle customer.created event
 */
async function handleCustomerCreated(customer: Stripe.Customer) {
  const userId = customer.metadata.userId;

  if (!userId) {
    console.error('Customer created without userId metadata');
    return;
  }

  await supabase.from('stripe_customers').insert({
    user_id: userId,
    stripe_customer_id: customer.id,
    email: customer.email || '',
  });
}

/**
 * Handle customer.updated event
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  await supabase
    .from('stripe_customers')
    .update({
      email: customer.email || '',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customer.id);
}

/**
 * Handle customer.deleted event
 */
async function handleCustomerDeleted(customer: Stripe.Customer) {
  await supabase
    .from('stripe_customers')
    .delete()
    .eq('stripe_customer_id', customer.id);
}

/**
 * Handle subscription.created event
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Get user_id from stripe_customers
  const { data: customerData } = await supabase
    .from('stripe_customers')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .single();

  if (!customerData) {
    console.error('Customer not found for subscription:', subscription.id);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const planName = getPlanNameFromPriceId(priceId);

  await supabase.from('subscriptions').insert({
    user_id: customerData.user_id,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan_name: planName,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    metadata: subscription.metadata,
  });

  // Initialize usage tracking for the new subscription
  await initializeUsageTracking(customerData.user_id, planName);
}

/**
 * Handle subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0].price.id;
  const planName = getPlanNameFromPriceId(priceId);

  await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      plan_name: planName,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at
        ? new Date(subscription.canceled_at * 1000).toISOString()
        : null,
      trial_start: subscription.trial_start
        ? new Date(subscription.trial_start * 1000).toISOString()
        : null,
      trial_end: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
      metadata: subscription.metadata,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Update subscription status to active
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;

  // Update subscription status to past_due
  await supabase
    .from('subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription);

  // TODO: Send notification email to user about payment failure
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  // Additional processing after successful checkout
  // This can include sending welcome emails, triggering onboarding, etc.
  console.log('Checkout completed:', session.id);
}

/**
 * Map Stripe price ID to plan name
 */
function getPlanNameFromPriceId(priceId: string): string {
  const priceIdMap: Record<string, string> = {
    [process.env.STRIPE_PRICE_ID_FREE || '']: 'free',
    [process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '']: 'pro_monthly',
    [process.env.STRIPE_PRICE_ID_PRO_YEARLY || '']: 'pro_yearly',
    [process.env.STRIPE_PRICE_ID_ENTERPRISE || '']: 'enterprise',
  };

  return priceIdMap[priceId] || 'free';
}

/**
 * Initialize usage tracking for a new subscription
 */
async function initializeUsageTracking(userId: string, planName: string) {
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const features = ['repositories', 'pain_points', 'blog_posts', 'newsletters'];
  const limits = getPlanLimits(planName);

  for (const feature of features) {
    await supabase.from('usage_tracking').insert({
      user_id: userId,
      feature_type: feature,
      usage_count: 0,
      limit_amount: limits[feature as keyof typeof limits],
      period_start: periodStart.toISOString(),
      period_end: periodEnd.toISOString(),
    });
  }
}

/**
 * Get plan limits based on plan name
 */
function getPlanLimits(planName: string): Record<string, number | null> {
  const limits: Record<string, Record<string, number | null>> = {
    free: {
      repositories: 1,
      pain_points: 10,
      blog_posts: 2,
      newsletters: 1,
    },
    pro_monthly: {
      repositories: 5,
      pain_points: 100,
      blog_posts: 20,
      newsletters: 10,
    },
    pro_yearly: {
      repositories: 5,
      pain_points: 100,
      blog_posts: 20,
      newsletters: 10,
    },
    enterprise: {
      repositories: null,
      pain_points: null,
      blog_posts: null,
      newsletters: null,
    },
  };

  return limits[planName] || limits.free;
}
