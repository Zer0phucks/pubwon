/**
 * Usage Tracking Service
 * Phase 7.4: Track feature usage for subscription limits
 */

import { db } from '@/lib/db';
import { usageTracking, subscriptions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getPlanLimits, STRIPE_PLANS } from '@/lib/stripe';

export interface UsageLimits {
  repositories: number | null;
  painPointsPerMonth: number | null;
  blogPostsPerMonth: number | null;
  newslettersPerMonth: number | null;
}

export interface CurrentUsage {
  repositories: number;
  painPointsExtracted: number;
  blogPostsGenerated: number;
  newslettersSent: number;
  githubIssuesCreated: number;
}

export interface UsageStatus {
  limits: UsageLimits;
  current: CurrentUsage;
  withinLimits: {
    repositories: boolean;
    painPoints: boolean;
    blogPosts: boolean;
    newsletters: boolean;
  };
  percentageUsed: {
    repositories: number | null;
    painPoints: number | null;
    blogPosts: number | null;
    newsletters: number | null;
  };
}

/**
 * Get current month in YYYY-MM format
 */
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get or create usage tracking record for current month
 */
async function getOrCreateUsageRecord(userId: string): Promise<CurrentUsage> {
  const month = getCurrentMonth();

  const existing = await db
    .select()
    .from(usageTracking)
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.month, month)
    ))
    .limit(1);

  if (existing.length > 0) {
    return {
      repositories: existing[0].repositoriesConnected || 0,
      painPointsExtracted: existing[0].painPointsExtracted || 0,
      blogPostsGenerated: existing[0].blogPostsGenerated || 0,
      newslettersSent: existing[0].newslettersSent || 0,
      githubIssuesCreated: existing[0].githubIssuesCreated || 0,
    };
  }

  // Create new record
  await db.insert(usageTracking).values({
    userId,
    month,
    repositoriesConnected: 0,
    painPointsExtracted: 0,
    blogPostsGenerated: 0,
    newslettersSent: 0,
    githubIssuesCreated: 0,
  });

  return {
    repositories: 0,
    painPointsExtracted: 0,
    blogPostsGenerated: 0,
    newslettersSent: 0,
    githubIssuesCreated: 0,
  };
}

/**
 * Get user's subscription plan limits
 */
async function getUserLimits(userId: string): Promise<UsageLimits> {
  const subscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (subscription.length === 0 || subscription[0].status !== 'active') {
    // Free tier
    return {
      repositories: STRIPE_PLANS.FREE.features.repositories,
      painPointsPerMonth: STRIPE_PLANS.FREE.features.pain_points_per_month,
      blogPostsPerMonth: STRIPE_PLANS.FREE.features.blog_posts_per_month,
      newslettersPerMonth: STRIPE_PLANS.FREE.features.newsletters_per_month,
    };
  }

  const planLimits = getPlanLimits(subscription[0].planName);
  if (!planLimits) {
    // Fallback to free tier
    return {
      repositories: STRIPE_PLANS.FREE.features.repositories,
      painPointsPerMonth: STRIPE_PLANS.FREE.features.pain_points_per_month,
      blogPostsPerMonth: STRIPE_PLANS.FREE.features.blog_posts_per_month,
      newslettersPerMonth: STRIPE_PLANS.FREE.features.newsletters_per_month,
    };
  }

  return {
    repositories: planLimits.repositories,
    painPointsPerMonth: planLimits.pain_points_per_month,
    blogPostsPerMonth: planLimits.blog_posts_per_month,
    newslettersPerMonth: planLimits.newsletters_per_month,
  };
}

/**
 * Get complete usage status for user
 */
export async function getUserUsageStatus(userId: string): Promise<UsageStatus> {
  const [limits, current] = await Promise.all([
    getUserLimits(userId),
    getOrCreateUsageRecord(userId),
  ]);

  const withinLimits = {
    repositories: limits.repositories === null || current.repositories < limits.repositories,
    painPoints: limits.painPointsPerMonth === null || current.painPointsExtracted < limits.painPointsPerMonth,
    blogPosts: limits.blogPostsPerMonth === null || current.blogPostsGenerated < limits.blogPostsPerMonth,
    newsletters: limits.newslettersPerMonth === null || current.newslettersSent < limits.newslettersPerMonth,
  };

  const percentageUsed = {
    repositories: limits.repositories === null ? null : Math.round((current.repositories / limits.repositories) * 100),
    painPoints: limits.painPointsPerMonth === null ? null : Math.round((current.painPointsExtracted / limits.painPointsPerMonth) * 100),
    blogPosts: limits.blogPostsPerMonth === null ? null : Math.round((current.blogPostsGenerated / limits.blogPostsPerMonth) * 100),
    newsletters: limits.newslettersPerMonth === null ? null : Math.round((current.newslettersSent / limits.newslettersPerMonth) * 100),
  };

  return {
    limits,
    current,
    withinLimits,
    percentageUsed,
  };
}

/**
 * Check if user can perform an action
 */
export async function canPerformAction(
  userId: string,
  action: 'repository' | 'painPoint' | 'blogPost' | 'newsletter'
): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getUserUsageStatus(userId);

  switch (action) {
    case 'repository':
      if (!status.withinLimits.repositories) {
        return {
          allowed: false,
          reason: `Repository limit reached (${status.limits.repositories}). Upgrade to add more repositories.`,
        };
      }
      break;
    case 'painPoint':
      if (!status.withinLimits.painPoints) {
        return {
          allowed: false,
          reason: `Pain point extraction limit reached (${status.limits.painPointsPerMonth}/month). Upgrade for more.`,
        };
      }
      break;
    case 'blogPost':
      if (!status.withinLimits.blogPosts) {
        return {
          allowed: false,
          reason: `Blog post generation limit reached (${status.limits.blogPostsPerMonth}/month). Upgrade for more.`,
        };
      }
      break;
    case 'newsletter':
      if (!status.withinLimits.newsletters) {
        return {
          allowed: false,
          reason: `Newsletter sending limit reached (${status.limits.newslettersPerMonth}/month). Upgrade for more.`,
        };
      }
      break;
  }

  return { allowed: true };
}

/**
 * Track usage for an action
 */
export async function trackUsage(
  userId: string,
  action: 'repository' | 'painPoint' | 'blogPost' | 'newsletter' | 'githubIssue',
  increment: number = 1
): Promise<void> {
  const month = getCurrentMonth();

  const fieldMap = {
    repository: 'repositoriesConnected',
    painPoint: 'painPointsExtracted',
    blogPost: 'blogPostsGenerated',
    newsletter: 'newslettersSent',
    githubIssue: 'githubIssuesCreated',
  };

  // Ensure record exists
  await getOrCreateUsageRecord(userId);

  // Update the appropriate field
  const field = fieldMap[action];
  await db
    .update(usageTracking)
    .set({
      [field]: db.sql`${field} + ${increment}`,
      updatedAt: new Date(),
    })
    .where(and(
      eq(usageTracking.userId, userId),
      eq(usageTracking.month, month)
    ));
}

/**
 * Get usage history for user (last 12 months)
 */
export async function getUserUsageHistory(userId: string, months: number = 12) {
  const now = new Date();
  const monthsArray: string[] = [];

  for (let i = 0; i < months; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthsArray.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
  }

  const history = await db
    .select()
    .from(usageTracking)
    .where(eq(usageTracking.userId, userId));

  return monthsArray.map(month => {
    const record = history.find(h => h.month === month);
    return {
      month,
      repositories: record?.repositoriesConnected || 0,
      painPoints: record?.painPointsExtracted || 0,
      blogPosts: record?.blogPostsGenerated || 0,
      newsletters: record?.newslettersSent || 0,
      githubIssues: record?.githubIssuesCreated || 0,
    };
  });
}
