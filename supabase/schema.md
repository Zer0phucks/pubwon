# Supabase Database Schema

## Overview
This document describes the complete database schema for the Customer Discovery & Development App.

## Tables

### 1. users (Extended from auth.users)
Stores additional user profile information beyond Supabase Auth.

```sql
- id: uuid (FK to auth.users.id)
- email: text
- full_name: text
- avatar_url: text
- subscription_tier: enum ('free', 'pro', 'enterprise')
- subscription_status: enum ('active', 'canceled', 'past_due', 'trialing')
- stripe_customer_id: text
- created_at: timestamptz
- updated_at: timestamptz
```

### 2. repositories
Stores connected GitHub repositories.

```sql
- id: uuid (PK)
- user_id: uuid (FK to users.id)
- github_repo_id: bigint (unique)
- owner: text
- name: text
- full_name: text
- description: text
- url: text
- primary_language: text
- is_active: boolean
- last_scanned_at: timestamptz
- github_access_token_encrypted: text
- created_at: timestamptz
- updated_at: timestamptz
```

### 3. icp_personas
Stores Ideal Customer Profile personas generated from repository analysis.

```sql
- id: uuid (PK)
- repository_id: uuid (FK to repositories.id)
- title: text
- demographics: jsonb
- goals: text[]
- pain_points: text[]
- motivations: text[]
- use_cases: text[]
- technical_profile: jsonb
- generated_by_ai: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

### 4. subreddits
Stores monitored subreddits for each ICP persona.

```sql
- id: uuid (PK)
- icp_persona_id: uuid (FK to icp_personas.id)
- name: text (unique constraint with icp_persona_id)
- display_name: text
- description: text
- subscribers: integer
- relevance_score: decimal
- is_active: boolean
- last_scraped_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### 5. pain_points
Stores extracted pain points from Reddit discussions.

```sql
- id: uuid (PK)
- subreddit_id: uuid (FK to subreddits.id)
- icp_persona_id: uuid (FK to icp_personas.id)
- title: text
- description: text
- category: text
- severity: enum ('low', 'medium', 'high', 'critical')
- frequency: integer
- source_posts: jsonb (array of Reddit post references)
- status: enum ('pending', 'approved', 'rejected', 'converted_to_issue')
- approved_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### 6. github_issues
Tracks GitHub issues created from pain points.

```sql
- id: uuid (PK)
- repository_id: uuid (FK to repositories.id)
- pain_point_id: uuid (FK to pain_points.id)
- github_issue_id: bigint
- issue_number: integer
- title: text
- body: text
- labels: text[]
- state: enum ('open', 'closed')
- url: text
- created_at: timestamptz
- updated_at: timestamptz
- closed_at: timestamptz
```

### 7. blog_posts
Stores generated blog posts about repository updates.

```sql
- id: uuid (PK)
- repository_id: uuid (FK to repositories.id)
- title: text
- slug: text (unique)
- content: text
- excerpt: text
- meta_description: text
- tags: text[]
- status: enum ('draft', 'published', 'archived')
- view_count: integer
- generated_by_ai: boolean
- repository_activity_summary: jsonb
- published_at: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### 8. newsletters
Stores generated newsletters for email distribution.

```sql
- id: uuid (PK)
- repository_id: uuid (FK to repositories.id)
- blog_post_id: uuid (FK to blog_posts.id, nullable)
- subject: text
- html_content: text
- text_content: text
- status: enum ('draft', 'scheduled', 'sent', 'failed')
- scheduled_for: timestamptz
- sent_at: timestamptz
- total_sent: integer
- open_count: integer
- click_count: integer
- bounce_count: integer
- generated_by_ai: boolean
- created_at: timestamptz
- updated_at: timestamptz
```

### 9. email_subscribers
Stores newsletter subscribers.

```sql
- id: uuid (PK)
- email: text (unique)
- full_name: text
- status: enum ('pending', 'active', 'unsubscribed', 'bounced')
- verification_token: text
- verified_at: timestamptz
- unsubscribed_at: timestamptz
- source: text (e.g., 'blog', 'manual', 'api')
- metadata: jsonb
- created_at: timestamptz
- updated_at: timestamptz
```

### 10. newsletter_sends
Tracks individual newsletter sends to subscribers.

```sql
- id: uuid (PK)
- newsletter_id: uuid (FK to newsletters.id)
- subscriber_id: uuid (FK to email_subscribers.id)
- status: enum ('pending', 'sent', 'opened', 'clicked', 'bounced', 'complained')
- sent_at: timestamptz
- opened_at: timestamptz
- clicked_at: timestamptz
- bounced_at: timestamptz
- email_provider_id: text
- created_at: timestamptz
- updated_at: timestamptz
```

### 11. subscriptions
Stores Stripe subscription details.

```sql
- id: uuid (PK)
- user_id: uuid (FK to users.id)
- stripe_subscription_id: text (unique)
- stripe_price_id: text
- status: text
- current_period_start: timestamptz
- current_period_end: timestamptz
- cancel_at_period_end: boolean
- canceled_at: timestamptz
- trial_start: timestamptz
- trial_end: timestamptz
- created_at: timestamptz
- updated_at: timestamptz
```

### 12. usage_tracking
Tracks feature usage for quota enforcement.

```sql
- id: uuid (PK)
- user_id: uuid (FK to users.id)
- period_start: date
- period_end: date
- repositories_count: integer
- subreddits_count: integer
- pain_points_extracted: integer
- blog_posts_generated: integer
- newsletter_sends: integer
- created_at: timestamptz
- updated_at: timestamptz
```

### 13. activity_logs
Audit trail for system activities.

```sql
- id: uuid (PK)
- user_id: uuid (FK to users.id, nullable)
- action: text
- resource_type: text
- resource_id: uuid
- metadata: jsonb
- ip_address: inet
- user_agent: text
- created_at: timestamptz
```

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_icp_personas_repository_id ON icp_personas(repository_id);
CREATE INDEX idx_subreddits_icp_persona_id ON subreddits(icp_persona_id);
CREATE INDEX idx_pain_points_subreddit_id ON pain_points(subreddit_id);
CREATE INDEX idx_pain_points_status ON pain_points(status);
CREATE INDEX idx_github_issues_repository_id ON github_issues(repository_id);
CREATE INDEX idx_github_issues_pain_point_id ON github_issues(pain_point_id);
CREATE INDEX idx_blog_posts_repository_id ON blog_posts(repository_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_newsletters_repository_id ON newsletters(repository_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);
CREATE INDEX idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX idx_newsletter_sends_subscriber_id ON newsletter_sends(subscriber_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_usage_tracking_user_id_period ON usage_tracking(user_id, period_start);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

## Enums

```sql
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE pain_point_status AS ENUM ('pending', 'approved', 'rejected', 'converted_to_issue');
CREATE TYPE issue_state AS ENUM ('open', 'closed');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE newsletter_status AS ENUM ('draft', 'scheduled', 'sent', 'failed');
CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed', 'bounced');
CREATE TYPE send_status AS ENUM ('pending', 'sent', 'opened', 'clicked', 'bounced', 'complained');
```

## Row Level Security (RLS) Policies

All tables have RLS enabled with the following general patterns:

### Users can only access their own data
```sql
-- Users table
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Repositories
CREATE POLICY "Users can view own repositories" ON repositories FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own repositories" ON repositories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own repositories" ON repositories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own repositories" ON repositories FOR DELETE USING (auth.uid() = user_id);
```

### Service role has full access
```sql
-- Applied to all tables for backend operations
CREATE POLICY "Service role has full access" ON [table_name] FOR ALL USING (auth.jwt()->>'role' = 'service_role');
```

### Public read access for published content
```sql
-- Blog posts (public can view published)
CREATE POLICY "Public can view published blog posts" ON blog_posts FOR SELECT USING (status = 'published');
```
