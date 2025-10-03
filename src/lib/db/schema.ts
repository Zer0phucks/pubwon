import { pgTable, text, timestamp, uuid, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

/**
 * Users table - extends Supabase auth.users
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  githubUsername: text('github_username'),
  githubAccessToken: text('github_access_token'), // Encrypted
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Repositories table - stores connected GitHub repositories
 */
export const repositories = pgTable('repositories', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  githubId: text('github_id').notNull().unique(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  description: text('description'),
  htmlUrl: text('html_url').notNull(),
  language: text('language'),
  stars: integer('stars').default(0),
  forks: integer('forks').default(0),
  isPrivate: boolean('is_private').default(false),
  defaultBranch: text('default_branch').default('main'),
  topics: jsonb('topics').$type<string[]>().default([]),
  readme: text('readme'),
  packageJson: jsonb('package_json').$type<Record<string, any>>(),
  analysis: jsonb('analysis').$type<{
    primaryLanguages: string[];
    frameworks: string[];
    purpose: string;
    features: string[];
    targetAudience: string;
  }>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * ICP Personas table - Ideal Customer Profile personas
 */
export const icpPersonas = pgTable('icp_personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  demographics: jsonb('demographics').$type<{
    ageRange?: string;
    occupation?: string[];
    experience?: string;
    location?: string;
    companySize?: string;
  }>(),
  goals: jsonb('goals').$type<string[]>().default([]),
  painPoints: jsonb('pain_points').$type<string[]>().default([]),
  motivations: jsonb('motivations').$type<string[]>().default([]),
  useCases: jsonb('use_cases').$type<string[]>().default([]),
  technicalSkills: jsonb('technical_skills').$type<string[]>().default([]),
  preferredPlatforms: jsonb('preferred_platforms').$type<string[]>().default([]),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subreddits table - stores identified relevant subreddits
 */
export const subreddits = pgTable('subreddits', {
  id: uuid('id').defaultRandom().primaryKey(),
  icpPersonaId: uuid('icp_persona_id').references(() => icpPersonas.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  displayName: text('display_name').notNull(),
  description: text('description'),
  subscribers: integer('subscribers').default(0),
  activeUsers: integer('active_users').default(0),
  relevanceScore: integer('relevance_score').default(0),
  isMonitored: boolean('is_monitored').default(true),
  addedManually: boolean('added_manually').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Pain Points table - extracted from Reddit discussions
 */
export const painPoints = pgTable('pain_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  subredditId: uuid('subreddit_id').references(() => subreddits.id).notNull(),
  icpPersonaId: uuid('icp_persona_id').references(() => icpPersonas.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  severity: text('severity'), // low, medium, high, critical
  frequency: integer('frequency').default(1),
  sourceUrl: text('source_url'),
  sourcePostId: text('source_post_id'),
  isApproved: boolean('is_approved').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * GitHub Issues table - tracks issues created from pain points
 */
export const githubIssues = pgTable('github_issues', {
  id: uuid('id').defaultRandom().primaryKey(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  painPointId: uuid('pain_point_id').references(() => painPoints.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  githubIssueNumber: integer('github_issue_number').notNull(),
  githubIssueId: text('github_issue_id').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  state: text('state').default('open'),
  labels: jsonb('labels').$type<string[]>().default([]),
  htmlUrl: text('html_url').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Blog Posts table - generated content from repository activity
 */
export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').defaultRandom().primaryKey(),
  repositoryId: uuid('repository_id').references(() => repositories.id).notNull(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  seoTitle: text('seo_title'),
  seoDescription: text('seo_description'),
  tags: jsonb('tags').$type<string[]>().default([]),
  isPublished: boolean('is_published').default(false),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Newsletters table - email newsletters generated from content
 */
export const newsletters = pgTable('newsletters', {
  id: uuid('id').defaultRandom().primaryKey(),
  blogPostId: uuid('blog_post_id').references(() => blogPosts.id),
  userId: uuid('user_id').references(() => users.id).notNull(),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  textContent: text('text_content').notNull(),
  isSent: boolean('is_sent').default(false),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count').default(0),
  openCount: integer('open_count').default(0),
  clickCount: integer('click_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Email Subscribers table - newsletter subscription management
 */
export const emailSubscribers = pgTable('email_subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  email: text('email').notNull(),
  isConfirmed: boolean('is_confirmed').default(false),
  confirmedAt: timestamp('confirmed_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Stripe Customers table - maps users to Stripe customers
 */
export const stripeCustomers = pgTable('stripe_customers', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Subscriptions table - tracks user subscription status
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull().unique(),
  stripeCustomerId: text('stripe_customer_id').references(() => stripeCustomers.stripeCustomerId).notNull(),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),
  planName: text('plan_name').notNull(), // FREE, PRO_MONTHLY, PRO_YEARLY, ENTERPRISE
  status: text('status').notNull(), // active, canceled, past_due, incomplete, trialing
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').default(false),
  canceledAt: timestamp('canceled_at'),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Usage Tracking table - tracks feature usage for billing limits
 */
export const usageTracking = pgTable('usage_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  month: text('month').notNull(), // YYYY-MM format
  repositoriesConnected: integer('repositories_connected').default(0),
  painPointsExtracted: integer('pain_points_extracted').default(0),
  blogPostsGenerated: integer('blog_posts_generated').default(0),
  newslettersSent: integer('newsletters_sent').default(0),
  githubIssuesCreated: integer('github_issues_created').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * Analytics Events table - tracks user activity for analytics
 */
export const analyticsEvents = pgTable('analytics_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  eventType: text('event_type').notNull(), // pain_point_discovered, issue_created, blog_published, etc.
  eventData: jsonb('event_data').$type<Record<string, any>>(),
  resourceId: uuid('resource_id'), // ID of the related resource (pain point, blog post, etc.)
  resourceType: text('resource_type'), // pain_point, blog_post, newsletter, github_issue
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Blog Post Analytics table - tracks blog post views and engagement
 */
export const blogPostAnalytics = pgTable('blog_post_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  blogPostId: uuid('blog_post_id').references(() => blogPosts.id).notNull(),
  date: timestamp('date').notNull(),
  views: integer('views').default(0),
  uniqueVisitors: integer('unique_visitors').default(0),
  avgTimeOnPage: integer('avg_time_on_page').default(0), // seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
