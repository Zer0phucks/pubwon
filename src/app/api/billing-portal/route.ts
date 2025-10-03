/**
 * Stripe Billing Portal API Route
 * Phase 7.3: Create billing portal sessions for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createPortalSession } from '@/lib/stripe';
import { db } from '@/lib/db';
import { stripeCustomers } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get Stripe customer ID
    const customer = await db
      .select()
      .from(stripeCustomers)
      .where(eq(stripeCustomers.userId, user.id))
      .limit(1);

    if (customer.length === 0) {
      return NextResponse.json(
        { error: 'No subscription found' },
        { status: 404 }
      );
    }

    // Create billing portal session
    const session = await createPortalSession({
      customerId: customer[0].stripeCustomerId,
      returnUrl: `${request.nextUrl.origin}/dashboard`,
    });

    // Redirect to portal
    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error('Billing portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    );
  }
}
