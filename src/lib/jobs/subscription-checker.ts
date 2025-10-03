/**
 * Subscription status check job
 * Monitors and updates subscription statuses
 */

import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { JobResult } from './types';

interface SubscriptionUpdate {
  userId: string;
  oldStatus: string;
  newStatus: string;
  updated: boolean;
}

export async function checkSubscriptions(): Promise<JobResult<SubscriptionUpdate[]>> {
  const supabase = await createClient();
  const updates: SubscriptionUpdate[] = [];
  const warnings: string[] = [];

  try {
    // Get all active subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .in('status', ['active', 'trialing', 'past_due']);

    if (subError) throw subError;
    if (!subscriptions || subscriptions.length === 0) {
      return {
        success: true,
        data: [],
        warnings: ['No active subscriptions to check'],
      };
    }

    // Check each subscription with Stripe
    for (const subscription of subscriptions) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripe_subscription_id
        );

        const oldStatus = subscription.status;
        const newStatus = stripeSubscription.status;

        // Check if status has changed
        if (oldStatus !== newStatus) {
          await supabase
            .from('subscriptions')
            .update({
              status: newStatus,
              current_period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: stripeSubscription.cancel_at_period_end,
              canceled_at: stripeSubscription.canceled_at
                ? new Date(stripeSubscription.canceled_at * 1000).toISOString()
                : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subscription.id);

          // Create analytics event for status change
          await supabase
            .from('analytics_events')
            .insert({
              user_id: subscription.user_id,
              event_type: 'subscription_status_changed',
              event_data: {
                oldStatus,
                newStatus,
                cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
              },
              resource_id: subscription.id,
              resource_type: 'subscription',
            });

          updates.push({
            userId: subscription.user_id,
            oldStatus,
            newStatus,
            updated: true,
          });
        }

        // Check for upcoming renewal (7 days before)
        const renewalDate = new Date(stripeSubscription.current_period_end * 1000);
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

        if (renewalDate <= sevenDaysFromNow && renewalDate > new Date()) {
          // Send renewal reminder notification
          await supabase
            .from('analytics_events')
            .insert({
              user_id: subscription.user_id,
              event_type: 'subscription_renewal_reminder',
              event_data: {
                renewalDate: renewalDate.toISOString(),
                planName: subscription.plan_name,
              },
              resource_id: subscription.id,
              resource_type: 'subscription',
            });
        }

      } catch (error) {
        warnings.push(`Failed to check subscription ${subscription.id}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        continue;
      }
    }

    return {
      success: true,
      data: updates,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        totalSubscriptions: subscriptions.length,
        updatedSubscriptions: updates.length,
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
