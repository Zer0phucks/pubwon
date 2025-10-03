/**
 * Database cleanup job
 * Removes old data and maintains database health
 */

import { createClient } from '@/lib/supabase/server';
import { JobResult } from './types';

interface CleanupResult {
  table: string;
  deletedRows: number;
}

export async function cleanupDatabase(): Promise<JobResult<CleanupResult[]>> {
  const supabase = await createClient();
  const results: CleanupResult[] = [];
  const warnings: string[] = [];

  try {
    // Delete analytics events older than 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: deletedEvents, error: eventsError } = await supabase
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo.toISOString())
      .select('id');

    if (eventsError) {
      warnings.push(`Failed to delete old analytics events: ${eventsError.message}`);
    } else {
      results.push({
        table: 'analytics_events',
        deletedRows: deletedEvents?.length || 0,
      });
    }

    // Delete unconfirmed email subscribers older than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: deletedSubscribers, error: subscribersError } = await supabase
      .from('email_subscribers')
      .delete()
      .eq('is_confirmed', false)
      .lt('created_at', sevenDaysAgo.toISOString())
      .select('id');

    if (subscribersError) {
      warnings.push(`Failed to delete unconfirmed subscribers: ${subscribersError.message}`);
    } else {
      results.push({
        table: 'email_subscribers',
        deletedRows: deletedSubscribers?.length || 0,
      });
    }

    // Delete blog post analytics older than 1 year
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data: deletedAnalytics, error: analyticsError } = await supabase
      .from('blog_post_analytics')
      .delete()
      .lt('date', oneYearAgo.toISOString())
      .select('id');

    if (analyticsError) {
      warnings.push(`Failed to delete old blog analytics: ${analyticsError.message}`);
    } else {
      results.push({
        table: 'blog_post_analytics',
        deletedRows: deletedAnalytics?.length || 0,
      });
    }

    // Delete rejected pain points older than 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deletedPainPoints, error: painPointsError } = await supabase
      .from('pain_points')
      .delete()
      .eq('is_approved', false)
      .lt('created_at', thirtyDaysAgo.toISOString())
      .select('id');

    if (painPointsError) {
      warnings.push(`Failed to delete rejected pain points: ${painPointsError.message}`);
    } else {
      results.push({
        table: 'pain_points',
        deletedRows: deletedPainPoints?.length || 0,
      });
    }

    // Delete old usage tracking records (keep last 24 months)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoMonth = `${twoYearsAgo.getFullYear()}-${String(twoYearsAgo.getMonth() + 1).padStart(2, '0')}`;

    const { data: deletedUsage, error: usageError } = await supabase
      .from('usage_tracking')
      .delete()
      .lt('month', twoYearsAgoMonth)
      .select('id');

    if (usageError) {
      warnings.push(`Failed to delete old usage tracking: ${usageError.message}`);
    } else {
      results.push({
        table: 'usage_tracking',
        deletedRows: deletedUsage?.length || 0,
      });
    }

    return {
      success: true,
      data: results,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        totalTablesProcessed: results.length,
        totalRowsDeleted: results.reduce((sum, r) => sum + r.deletedRows, 0),
      },
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}
