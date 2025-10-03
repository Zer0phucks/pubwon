import { pgTable, text, timestamp, uuid, jsonb, boolean, integer, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  githubId: text('github_id').unique(),
  githubUsername: text('github_username'),
  githubAccessToken: text('github_access_token'),
  preferredAiModel: text('preferred_ai_model').default('gpt-4o-mini'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  githubId: text('github_id').notNull(),
  name: text('name').notNull(),
  fullName: text('full_name').notNull(),
  description: text('description'),
  url: text('url').notNull(),
  analysisData: jsonb('analysis_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('repositories_user_id_idx').on(table.userId),
}));

export const icpPersonas = pgTable('icp_personas', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  demographics: jsonb('demographics'),
  goals: jsonb('goals'),
  painPoints: jsonb('pain_points'),
  useCases: jsonb('use_cases'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  repositoryIdIdx: index('icp_personas_repository_id_idx').on(table.repositoryId),
}));

export const subreddits = pgTable('subreddits', {
  id: uuid('id').primaryKey().defaultRandom(),
  icpPersonaId: uuid('icp_persona_id').references(() => icpPersonas.id, { onDelete: 'cascade' }).notNull(),
  name: text('name').notNull(),
  description: text('description'),
  subscribers: integer('subscribers'),
  relevanceScore: integer('relevance_score'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  icpPersonaIdIdx: index('subreddits_icp_persona_id_idx').on(table.icpPersonaId),
}));

export const redditDiscussions = pgTable('reddit_discussions', {
  id: uuid('id').primaryKey().defaultRandom(),
  subredditId: uuid('subreddit_id').references(() => subreddits.id, { onDelete: 'cascade' }).notNull(),
  redditPostId: text('reddit_post_id').notNull().unique(),
  title: text('title').notNull(),
  content: text('content'),
  url: text('url').notNull(),
  author: text('author'),
  score: integer('score'),
  numComments: integer('num_comments'),
  rawData: jsonb('raw_data'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  scrapedAt: timestamp('scraped_at').defaultNow().notNull(),
}, (table) => ({
  subredditIdIdx: index('reddit_discussions_subreddit_id_idx').on(table.subredditId),
  scrapedAtIdx: index('reddit_discussions_scraped_at_idx').on(table.scrapedAt),
}));

export const painPoints = pgTable('pain_points', {
  id: uuid('id').primaryKey().defaultRandom(),
  icpPersonaId: uuid('icp_persona_id').references(() => icpPersonas.id, { onDelete: 'cascade' }).notNull(),
  redditDiscussionId: uuid('reddit_discussion_id').references(() => redditDiscussions.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  description: text('description').notNull(),
  category: text('category'),
  severity: text('severity'), // low, medium, high, critical
  frequency: integer('frequency').default(1),
  status: text('status').default('pending').notNull(), // pending, approved, rejected
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  icpPersonaIdIdx: index('pain_points_icp_persona_id_idx').on(table.icpPersonaId),
  statusIdx: index('pain_points_status_idx').on(table.status),
}));

export const githubIssues = pgTable('github_issues', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  painPointId: uuid('pain_point_id').references(() => painPoints.id, { onDelete: 'set null' }),
  githubIssueNumber: integer('github_issue_number').notNull(),
  githubIssueId: text('github_issue_id').notNull(),
  title: text('title').notNull(),
  body: text('body'),
  url: text('url').notNull(),
  state: text('state').default('open').notNull(),
  labels: jsonb('labels'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  repositoryIdIdx: index('github_issues_repository_id_idx').on(table.repositoryId),
  painPointIdIdx: index('github_issues_pain_point_id_idx').on(table.painPointId),
}));

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  seoMetadata: jsonb('seo_metadata'),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  repositoryIdIdx: index('blog_posts_repository_id_idx').on(table.repositoryId),
  slugIdx: index('blog_posts_slug_idx').on(table.slug),
}));

export const newsletters = pgTable('newsletters', {
  id: uuid('id').primaryKey().defaultRandom(),
  repositoryId: uuid('repository_id').references(() => repositories.id, { onDelete: 'cascade' }).notNull(),
  blogPostId: uuid('blog_post_id').references(() => blogPosts.id, { onDelete: 'set null' }),
  subject: text('subject').notNull(),
  htmlContent: text('html_content').notNull(),
  sentAt: timestamp('sent_at'),
  recipientCount: integer('recipient_count').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  repositoryIdIdx: index('newsletters_repository_id_idx').on(table.repositoryId),
}));

export const emailSubscribers = pgTable('email_subscribers', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  isActive: boolean('is_active').default(true).notNull(),
  confirmedAt: timestamp('confirmed_at'),
  unsubscribedAt: timestamp('unsubscribed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('email_subscribers_email_idx').on(table.email),
}));
