/**
 * Stripe Checkout API Route
 * Phase 7.2: Create Stripe checkout sessions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createCheckoutSession, getOrCreateCustomer, STRIPE_PLANS } from '@/lib/stripe';
import { db } from '@/lib/db';
import { stripeCustomers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    const searchParams = request.nextUrl.searchParams;
    const plan = searchParams.get('plan');

    if (!plan) {
      return NextResponse.json(
        { error: 'Plan parameter is required' },
        { status: 400 }
      );
    }

    // Validate plan
    const planKey = plan.toUpperCase().replace(/-/g, '_');
    if (!STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS]) {
      return NextResponse.json(
        { error: 'Invalid plan' },
        { status: 400 }
      );
    }

    const priceId = STRIPE_PLANS[planKey as keyof typeof STRIPE_PLANS].priceId;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID not configured for this plan' },
        { status: 500 }
      );
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    const existingCustomer = await db
      .select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, user.id))
      .limit(1);

    if (existingCustomer.length > 0) {
      stripeCustomerId = existingCustomer[0].stripeCustomerId;
    } else {
      const customer = await getOrCreateCustomer({
        email: user.email!,
        userId: user.id,
        name: user.user_metadata?.name,
      });

      stripeCustomerId = customer.id;

      // Save to database
      await db.insert(stripeCustomers).values({
        userId: user.id,
        stripeCustomerId: customer.id,
        email: user.email!,
      });
    }

    // Create checkout session
    const session = await createCheckoutSession({
      customerId: stripeCustomerId,
      priceId,
      successUrl: `${request.nextUrl.origin}/dashboard?checkout=success`,
      cancelUrl: `${request.nextUrl.origin}/pricing?checkout=canceled`,
      metadata: {
        userId: user.id,
        planName: planKey,
      },
    });

    // Redirect to checkout
    return NextResponse.redirect(session.url!);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
