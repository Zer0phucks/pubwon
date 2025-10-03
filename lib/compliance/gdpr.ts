/**
 * GDPR Compliance Features
 * Data export, deletion, and privacy management
 */

import { db } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';
import { eq } from 'drizzle-orm';

export interface UserDataExport {
  personal_info: {
    id: string;
    email: string;
    created_at: string;
  };
  repositories: any[];
  icp_personas: any[];
  pain_points: any[];
  blog_posts: any[];
  newsletters: any[];
  subscriptions: any[];
  activity_logs: any[];
}

/**
 * Export all user data (GDPR Right to Data Portability)
 */
export async function exportUserData(userId: string): Promise<UserDataExport> {
  // Fetch user profile
  const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Fetch all user data from database
  const [
    repositories,
    icpPersonas,
    painPoints,
    blogPosts,
    newsletters,
    subscriptions,
    activityLogs,
  ] = await Promise.all([
    db.query.repositories.findMany({ where: (repos, { eq }) => eq(repos.userId, userId) }),
    db.query.icpPersonas.findMany({ where: (personas, { eq }) => eq(personas.userId, userId) }),
    db.query.painPoints.findMany({ where: (points, { eq }) => eq(points.userId, userId) }),
    db.query.blogPosts.findMany({ where: (posts, { eq }) => eq(posts.userId, userId) }),
    db.query.newsletters.findMany({ where: (news, { eq }) => eq(news.userId, userId) }),
    db.query.subscriptions.findMany({ where: (subs, { eq }) => eq(subs.userId, userId) }),
    // Activity logs would come from a separate logging table
    Promise.resolve([]),
  ]);

  return {
    personal_info: {
      id: user.user.id,
      email: user.user.email || '',
      created_at: user.user.created_at,
    },
    repositories,
    icp_personas: icpPersonas,
    pain_points: painPoints,
    blog_posts: blogPosts,
    newsletters,
    subscriptions,
    activity_logs: activityLogs,
  };
}

/**
 * Delete all user data (GDPR Right to Erasure)
 */
export async function deleteUserData(userId: string): Promise<void> {
  // This should be done in a transaction to ensure data consistency
  // Note: Some data may need to be retained for legal/financial reasons

  // Delete user data in reverse order of dependencies
  await Promise.all([
    // Delete content
    db.delete(db.query.blogPosts).where(eq(db.query.blogPosts.userId, userId)),
    db.delete(db.query.newsletters).where(eq(db.query.newsletters.userId, userId)),

    // Delete analysis data
    db.delete(db.query.painPoints).where(eq(db.query.painPoints.userId, userId)),
    db.delete(db.query.redditDiscussions).where(eq(db.query.redditDiscussions.userId, userId)),

    // Delete personas and subreddits
    db.delete(db.query.icpPersonas).where(eq(db.query.icpPersonas.userId, userId)),
    db.delete(db.query.subreddits).where(eq(db.query.subreddits.userId, userId)),

    // Delete repositories
    db.delete(db.query.repositories).where(eq(db.query.repositories.userId, userId)),
  ]);

  // Note: Financial data (subscriptions, invoices) should be retained per legal requirements
  // Mark subscription as deleted but don't remove (for audit trail)
  await db.update(db.query.subscriptions)
    .set({ status: 'deleted', updatedAt: new Date() })
    .where(eq(db.query.subscriptions.userId, userId));

  // Delete user from auth system
  await supabaseAdmin.auth.admin.deleteUser(userId);
}

/**
 * Anonymize user data (alternative to full deletion)
 */
export async function anonymizeUserData(userId: string): Promise<void> {
  const anonymousEmail = `deleted-user-${userId.substring(0, 8)}@deleted.local`;

  // Anonymize user email and profile
  await supabaseAdmin.auth.admin.updateUserById(userId, {
    email: anonymousEmail,
    user_metadata: {
      anonymized: true,
      anonymized_at: new Date().toISOString(),
    },
  });

  // Remove personally identifiable information from content
  // while preserving the data for analytics
  await Promise.all([
    // Anonymize blog post authors
    db.update(db.query.blogPosts)
      .set({ author: 'Anonymous User' })
      .where(eq(db.query.blogPosts.userId, userId)),

    // Clear GitHub tokens
    db.update(db.query.repositories)
      .set({ accessToken: null })
      .where(eq(db.query.repositories.userId, userId)),
  ]);
}

/**
 * Check if user can be deleted (no active subscriptions, etc.)
 */
export async function canDeleteUser(userId: string): Promise<{
  can_delete: boolean;
  reasons: string[];
}> {
  const reasons: string[] = [];

  // Check for active subscriptions
  const activeSubscriptions = await db.query.subscriptions.findMany({
    where: (subs, { eq, and }) => and(
      eq(subs.userId, userId),
      eq(subs.status, 'active')
    ),
  });

  if (activeSubscriptions.length > 0) {
    reasons.push('User has active subscriptions. Please cancel subscriptions first.');
  }

  // Check for pending payments
  // Add logic to check payment status

  return {
    can_delete: reasons.length === 0,
    reasons,
  };
}

/**
 * Log data access (GDPR accountability)
 */
export async function logDataAccess(
  userId: string,
  action: 'export' | 'delete' | 'view',
  requestedBy: string,
  ipAddress?: string
): Promise<void> {
  // Store in audit log table
  await db.insert(db.query.auditLogs).values({
    userId,
    action,
    requestedBy,
    ipAddress,
    timestamp: new Date(),
  });
}

/**
 * Generate privacy policy acceptance record
 */
export async function recordPrivacyPolicyAcceptance(
  userId: string,
  policyVersion: string,
  ipAddress?: string
): Promise<void> {
  await db.insert(db.query.privacyAcceptances).values({
    userId,
    policyVersion,
    acceptedAt: new Date(),
    ipAddress,
  });
}

/**
 * Check if user has accepted latest privacy policy
 */
export async function hasAcceptedLatestPrivacy(userId: string): Promise<boolean> {
  const CURRENT_POLICY_VERSION = '1.0.0';

  const acceptance = await db.query.privacyAcceptances.findFirst({
    where: (accepts, { eq, and }) => and(
      eq(accepts.userId, userId),
      eq(accepts.policyVersion, CURRENT_POLICY_VERSION)
    ),
  });

  return !!acceptance;
}
