/**
 * Analytics Service
 * Phase 6.2: Analytics for pain points, blog posts, newsletters
 */

import { db } from '@/lib/db';
import {
  analyticsEvents,
  painPoints,
  blogPosts,
  blogPostAnalytics,
  newsletters,
  githubIssues,
  subreddits,
} from '@/lib/db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export interface TimeSeriesData {
  date: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface AnalyticsSummary {
  total: number;
  thisMonth: number;
  lastMonth: number;
  percentageChange: number;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  userId: string,
  eventType: string,
  eventData?: Record<string, any>,
  resourceId?: string,
  resourceType?: string
): Promise<void> {
  await db.insert(analyticsEvents).values({
    userId,
    eventType,
    eventData,
    resourceId,
    resourceType,
  });
}

/**
 * Get pain points analytics
 */
export async function getPainPointsAnalytics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Pain points over time
  const overTime = await db
    .select({
      date: sql<string>`DATE(${painPoints.createdAt})`,
      count: sql<number>`COUNT(*)`,
    })
    .from(painPoints)
    .where(
      and(
        eq(painPoints.userId, userId),
        gte(painPoints.createdAt, startDate)
      )
    )
    .groupBy(sql`DATE(${painPoints.createdAt})`)
    .orderBy(sql`DATE(${painPoints.createdAt})`);

  // Category distribution
  const categories = await db
    .select({
      category: painPoints.category,
      count: sql<number>`COUNT(*)`,
    })
    .from(painPoints)
    .where(eq(painPoints.userId, userId))
    .groupBy(painPoints.category);

  const totalCategories = categories.reduce((sum, c) => sum + Number(c.count), 0);
  const categoryDistribution: CategoryDistribution[] = categories.map(c => ({
    category: c.category || 'Uncategorized',
    count: Number(c.count),
    percentage: Math.round((Number(c.count) / totalCategories) * 100),
  }));

  // Source subreddit breakdown
  const sources = await db
    .select({
      subreddit: subreddits.displayName,
      count: sql<number>`COUNT(*)`,
    })
    .from(painPoints)
    .innerJoin(subreddits, eq(painPoints.subredditId, subreddits.id))
    .where(eq(painPoints.userId, userId))
    .groupBy(subreddits.displayName);

  const totalSources = sources.reduce((sum, s) => sum + Number(s.count), 0);
  const sourceBreakdown: CategoryDistribution[] = sources.map(s => ({
    category: s.subreddit,
    count: Number(s.count),
    percentage: Math.round((Number(s.count) / totalSources) * 100),
  }));

  return {
    overTime,
    categoryDistribution,
    sourceBreakdown,
  };
}

/**
 * Get blog post analytics
 */
export async function getBlogPostAnalytics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Views over time
  const viewsOverTime = await db
    .select({
      date: sql<string>`DATE(${blogPostAnalytics.date})`,
      views: sql<number>`SUM(${blogPostAnalytics.views})`,
      uniqueVisitors: sql<number>`SUM(${blogPostAnalytics.uniqueVisitors})`,
    })
    .from(blogPostAnalytics)
    .innerJoin(blogPosts, eq(blogPostAnalytics.blogPostId, blogPosts.id))
    .where(
      and(
        eq(blogPosts.userId, userId),
        gte(blogPostAnalytics.date, startDate)
      )
    )
    .groupBy(sql`DATE(${blogPostAnalytics.date})`)
    .orderBy(sql`DATE(${blogPostAnalytics.date})`);

  // Popular posts
  const popularPosts = await db
    .select({
      id: blogPosts.id,
      title: blogPosts.title,
      slug: blogPosts.slug,
      views: sql<number>`SUM(${blogPostAnalytics.views})`,
      uniqueVisitors: sql<number>`SUM(${blogPostAnalytics.uniqueVisitors})`,
    })
    .from(blogPosts)
    .leftJoin(blogPostAnalytics, eq(blogPosts.id, blogPostAnalytics.blogPostId))
    .where(
      and(
        eq(blogPosts.userId, userId),
        eq(blogPosts.isPublished, true)
      )
    )
    .groupBy(blogPosts.id, blogPosts.title, blogPosts.slug)
    .orderBy(desc(sql`SUM(${blogPostAnalytics.views})`))
    .limit(10);

  return {
    viewsOverTime,
    popularPosts,
  };
}

/**
 * Get newsletter analytics
 */
export async function getNewsletterAnalytics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Subscriber growth
  const subscriberGrowth = await db
    .select({
      date: sql<string>`DATE(${newsletters.sentAt})`,
      recipients: sql<number>`SUM(${newsletters.recipientCount})`,
    })
    .from(newsletters)
    .where(
      and(
        eq(newsletters.userId, userId),
        eq(newsletters.isSent, true),
        gte(newsletters.sentAt, startDate)
      )
    )
    .groupBy(sql`DATE(${newsletters.sentAt})`)
    .orderBy(sql`DATE(${newsletters.sentAt})`);

  // Open and click rates
  const engagementStats = await db
    .select({
      sent: sql<number>`COUNT(*)`,
      totalRecipients: sql<number>`SUM(${newsletters.recipientCount})`,
      totalOpens: sql<number>`SUM(${newsletters.openCount})`,
      totalClicks: sql<number>`SUM(${newsletters.clickCount})`,
    })
    .from(newsletters)
    .where(
      and(
        eq(newsletters.userId, userId),
        eq(newsletters.isSent, true),
        gte(newsletters.sentAt, startDate)
      )
    );

  const stats = engagementStats[0];
  const openRate = stats.totalRecipients > 0
    ? Math.round((Number(stats.totalOpens) / Number(stats.totalRecipients)) * 100)
    : 0;
  const clickRate = stats.totalRecipients > 0
    ? Math.round((Number(stats.totalClicks) / Number(stats.totalRecipients)) * 100)
    : 0;

  return {
    subscriberGrowth,
    openRate,
    clickRate,
    totalSent: Number(stats.sent),
    totalRecipients: Number(stats.totalRecipients),
  };
}

/**
 * Get GitHub issue analytics
 */
export async function getGitHubIssueAnalytics(userId: string, days: number = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Issues created vs closed
  const issueStats = await db
    .select({
      date: sql<string>`DATE(${githubIssues.createdAt})`,
      created: sql<number>`COUNT(*)`,
      closed: sql<number>`SUM(CASE WHEN ${githubIssues.state} = 'closed' THEN 1 ELSE 0 END)`,
    })
    .from(githubIssues)
    .where(
      and(
        eq(githubIssues.userId, userId),
        gte(githubIssues.createdAt, startDate)
      )
    )
    .groupBy(sql`DATE(${githubIssues.createdAt})`)
    .orderBy(sql`DATE(${githubIssues.createdAt})`);

  // Issue categories (from labels)
  const allIssues = await db
    .select({
      labels: githubIssues.labels,
    })
    .from(githubIssues)
    .where(eq(githubIssues.userId, userId));

  const labelCounts: Record<string, number> = {};
  allIssues.forEach(issue => {
    const labels = issue.labels as string[] || [];
    labels.forEach(label => {
      labelCounts[label] = (labelCounts[label] || 0) + 1;
    });
  });

  const totalLabels = Object.values(labelCounts).reduce((sum, count) => sum + count, 0);
  const categories: CategoryDistribution[] = Object.entries(labelCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / totalLabels) * 100),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return {
    issueStats,
    categories,
  };
}

/**
 * Get recent activity feed
 */
export async function getActivityFeed(userId: string, limit: number = 20) {
  const events = await db
    .select()
    .from(analyticsEvents)
    .where(eq(analyticsEvents.userId, userId))
    .orderBy(desc(analyticsEvents.createdAt))
    .limit(limit);

  return events;
}

/**
 * Get dashboard summary statistics
 */
export async function getDashboardSummary(userId: string) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Pain points
  const painPointsThisMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(painPoints)
    .where(
      and(
        eq(painPoints.userId, userId),
        gte(painPoints.createdAt, startOfMonth)
      )
    );

  const painPointsLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(painPoints)
    .where(
      and(
        eq(painPoints.userId, userId),
        gte(painPoints.createdAt, startOfLastMonth),
        lte(painPoints.createdAt, endOfLastMonth)
      )
    );

  // Blog posts
  const blogPostsThisMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.userId, userId),
        eq(blogPosts.isPublished, true),
        gte(blogPosts.publishedAt, startOfMonth)
      )
    );

  const blogPostsLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.userId, userId),
        eq(blogPosts.isPublished, true),
        gte(blogPosts.publishedAt, startOfLastMonth),
        lte(blogPosts.publishedAt, endOfLastMonth)
      )
    );

  // Newsletters
  const newslettersThisMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(newsletters)
    .where(
      and(
        eq(newsletters.userId, userId),
        eq(newsletters.isSent, true),
        gte(newsletters.sentAt, startOfMonth)
      )
    );

  const newslettersLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(newsletters)
    .where(
      and(
        eq(newsletters.userId, userId),
        eq(newsletters.isSent, true),
        gte(newsletters.sentAt, startOfLastMonth),
        lte(newsletters.sentAt, endOfLastMonth)
      )
    );

  // GitHub issues
  const issuesThisMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(githubIssues)
    .where(
      and(
        eq(githubIssues.userId, userId),
        gte(githubIssues.createdAt, startOfMonth)
      )
    );

  const issuesLastMonth = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(githubIssues)
    .where(
      and(
        eq(githubIssues.userId, userId),
        gte(githubIssues.createdAt, startOfLastMonth),
        lte(githubIssues.createdAt, endOfLastMonth)
      )
    );

  const calculateChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  return {
    painPoints: {
      thisMonth: Number(painPointsThisMonth[0].count),
      lastMonth: Number(painPointsLastMonth[0].count),
      change: calculateChange(
        Number(painPointsThisMonth[0].count),
        Number(painPointsLastMonth[0].count)
      ),
    },
    blogPosts: {
      thisMonth: Number(blogPostsThisMonth[0].count),
      lastMonth: Number(blogPostsLastMonth[0].count),
      change: calculateChange(
        Number(blogPostsThisMonth[0].count),
        Number(blogPostsLastMonth[0].count)
      ),
    },
    newsletters: {
      thisMonth: Number(newslettersThisMonth[0].count),
      lastMonth: Number(newslettersLastMonth[0].count),
      change: calculateChange(
        Number(newslettersThisMonth[0].count),
        Number(newslettersLastMonth[0].count)
      ),
    },
    githubIssues: {
      thisMonth: Number(issuesThisMonth[0].count),
      lastMonth: Number(issuesLastMonth[0].count),
      change: calculateChange(
        Number(issuesThisMonth[0].count),
        Number(issuesLastMonth[0].count)
      ),
    },
  };
}
