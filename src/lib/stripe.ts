/**
 * Stripe Client Configuration
 * Phase 1.3: Stripe Integration
 */

import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}

// Initialize Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-10-28.acacia',
  typescript: true,
  appInfo: {
    name: 'PubWon',
    version: '1.0.0',
  },
});

// Stripe Product and Price IDs
export const STRIPE_PLANS = {
  FREE: {
    name: 'Free',
    priceId: process.env.STRIPE_PRICE_ID_FREE || '',
    features: {
      repositories: 1,
      pain_points_per_month: 10,
      blog_posts_per_month: 2,
      newsletters_per_month: 1,
    },
  },
  PRO_MONTHLY: {
    name: 'Pro (Monthly)',
    priceId: process.env.STRIPE_PRICE_ID_PRO_MONTHLY || '',
    features: {
      repositories: 5,
      pain_points_per_month: 100,
      blog_posts_per_month: 20,
      newsletters_per_month: 10,
    },
  },
  PRO_YEARLY: {
    name: 'Pro (Yearly)',
    priceId: process.env.STRIPE_PRICE_ID_PRO_YEARLY || '',
    features: {
      repositories: 5,
      pain_points_per_month: 100,
      blog_posts_per_month: 20,
      newsletters_per_month: 10,
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || '',
    features: {
      repositories: null, // unlimited
      pain_points_per_month: null, // unlimited
      blog_posts_per_month: null, // unlimited
      newsletters_per_month: null, // unlimited
    },
  },
} as const;

// Type for plan names
export type PlanName = keyof typeof STRIPE_PLANS;

/**
 * Get plan details by price ID
 */
export function getPlanByPriceId(priceId: string): {
  name: string;
  features: typeof STRIPE_PLANS[PlanName]['features'];
} | null {
  const plan = Object.values(STRIPE_PLANS).find(p => p.priceId === priceId);
  return plan || null;
}

/**
 * Get plan limits for a user's subscription
 */
export function getPlanLimits(planName: string): typeof STRIPE_PLANS[PlanName]['features'] | null {
  const normalizedPlan = planName.toUpperCase().replace(/ /g, '_') as PlanName;
  return STRIPE_PLANS[normalizedPlan]?.features || null;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId?: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    subscription_data: {
      metadata,
    },
  });

  return session;
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription by ID
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription | null> {
  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd = true
): Promise<Stripe.Subscription> {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: cancelAtPeriodEnd,
  });
}

/**
 * Update subscription
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });
}

/**
 * Create or retrieve a Stripe customer
 */
export async function getOrCreateCustomer({
  email,
  userId,
  name,
}: {
  email: string;
  userId: string;
  name?: string;
}): Promise<Stripe.Customer> {
  // Search for existing customer
  const customers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (customers.data.length > 0) {
    return customers.data[0];
  }

  // Create new customer
  return await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  secret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, secret);
}
