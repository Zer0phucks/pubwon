-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums
CREATE TYPE subscription_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE severity_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE pain_point_status AS ENUM ('pending', 'approved', 'rejected', 'converted_to_issue');
CREATE TYPE issue_state AS ENUM ('open', 'closed');
CREATE TYPE content_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE newsletter_status AS ENUM ('draft', 'scheduled', 'sent', 'failed');
CREATE TYPE subscriber_status AS ENUM ('pending', 'active', 'unsubscribed', 'bounced');
CREATE TYPE send_status AS ENUM ('pending', 'sent', 'opened', 'clicked', 'bounced', 'complained');

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier subscription_tier DEFAULT 'free' NOT NULL,
  subscription_status subscription_status DEFAULT 'active' NOT NULL,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Repositories table
CREATE TABLE repositories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  github_repo_id BIGINT UNIQUE NOT NULL,
  owner TEXT NOT NULL,
  name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  primary_language TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_scanned_at TIMESTAMPTZ,
  github_access_token_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ICP Personas table
CREATE TABLE icp_personas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  demographics JSONB DEFAULT '{}' NOT NULL,
  goals TEXT[] DEFAULT '{}' NOT NULL,
  pain_points TEXT[] DEFAULT '{}' NOT NULL,
  motivations TEXT[] DEFAULT '{}' NOT NULL,
  use_cases TEXT[] DEFAULT '{}' NOT NULL,
  technical_profile JSONB DEFAULT '{}' NOT NULL,
  generated_by_ai BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subreddits table
CREATE TABLE subreddits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  icp_persona_id UUID NOT NULL REFERENCES icp_personas(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  subscribers INTEGER DEFAULT 0,
  relevance_score DECIMAL(3,2) DEFAULT 0.0,
  is_active BOOLEAN DEFAULT true NOT NULL,
  last_scraped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(icp_persona_id, name)
);

-- Pain Points table
CREATE TABLE pain_points (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subreddit_id UUID NOT NULL REFERENCES subreddits(id) ON DELETE CASCADE,
  icp_persona_id UUID NOT NULL REFERENCES icp_personas(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  severity severity_level DEFAULT 'medium' NOT NULL,
  frequency INTEGER DEFAULT 1,
  source_posts JSONB DEFAULT '[]' NOT NULL,
  status pain_point_status DEFAULT 'pending' NOT NULL,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- GitHub Issues table
CREATE TABLE github_issues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  pain_point_id UUID REFERENCES pain_points(id) ON DELETE SET NULL,
  github_issue_id BIGINT NOT NULL,
  issue_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  labels TEXT[] DEFAULT '{}',
  state issue_state DEFAULT 'open' NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  closed_at TIMESTAMPTZ
);

-- Blog Posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  meta_description TEXT,
  tags TEXT[] DEFAULT '{}',
  status content_status DEFAULT 'draft' NOT NULL,
  view_count INTEGER DEFAULT 0,
  generated_by_ai BOOLEAN DEFAULT true NOT NULL,
  repository_activity_summary JSONB DEFAULT '{}' NOT NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Email Subscribers table
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  status subscriber_status DEFAULT 'pending' NOT NULL,
  verification_token TEXT,
  verified_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  source TEXT,
  metadata JSONB DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Newsletters table
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  repository_id UUID NOT NULL REFERENCES repositories(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  status newsletter_status DEFAULT 'draft' NOT NULL,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_sent INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  generated_by_ai BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Newsletter Sends table
CREATE TABLE newsletter_sends (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  status send_status DEFAULT 'pending' NOT NULL,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  email_provider_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Usage Tracking table
CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  repositories_count INTEGER DEFAULT 0,
  subreddits_count INTEGER DEFAULT 0,
  pain_points_extracted INTEGER DEFAULT 0,
  blog_posts_generated INTEGER DEFAULT 0,
  newsletter_sends INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, period_start)
);

-- Activity Logs table
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}' NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_repositories_user_id ON repositories(user_id);
CREATE INDEX idx_repositories_github_repo_id ON repositories(github_repo_id);
CREATE INDEX idx_repositories_is_active ON repositories(is_active);

CREATE INDEX idx_icp_personas_repository_id ON icp_personas(repository_id);

CREATE INDEX idx_subreddits_icp_persona_id ON subreddits(icp_persona_id);
CREATE INDEX idx_subreddits_is_active ON subreddits(is_active);

CREATE INDEX idx_pain_points_subreddit_id ON pain_points(subreddit_id);
CREATE INDEX idx_pain_points_icp_persona_id ON pain_points(icp_persona_id);
CREATE INDEX idx_pain_points_status ON pain_points(status);

CREATE INDEX idx_github_issues_repository_id ON github_issues(repository_id);
CREATE INDEX idx_github_issues_pain_point_id ON github_issues(pain_point_id);
CREATE INDEX idx_github_issues_state ON github_issues(state);

CREATE INDEX idx_blog_posts_repository_id ON blog_posts(repository_id);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);

CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_subscribers_status ON email_subscribers(status);

CREATE INDEX idx_newsletters_repository_id ON newsletters(repository_id);
CREATE INDEX idx_newsletters_blog_post_id ON newsletters(blog_post_id);
CREATE INDEX idx_newsletters_status ON newsletters(status);

CREATE INDEX idx_newsletter_sends_newsletter_id ON newsletter_sends(newsletter_id);
CREATE INDEX idx_newsletter_sends_subscriber_id ON newsletter_sends(subscriber_id);
CREATE INDEX idx_newsletter_sends_status ON newsletter_sends(status);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

CREATE INDEX idx_usage_tracking_user_id_period ON usage_tracking(user_id, period_start);

CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_resource_type ON activity_logs(resource_type);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_repositories_updated_at BEFORE UPDATE ON repositories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_icp_personas_updated_at BEFORE UPDATE ON icp_personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subreddits_updated_at BEFORE UPDATE ON subreddits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pain_points_updated_at BEFORE UPDATE ON pain_points
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_github_issues_updated_at BEFORE UPDATE ON github_issues
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at BEFORE UPDATE ON email_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at BEFORE UPDATE ON newsletters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletter_sends_updated_at BEFORE UPDATE ON newsletter_sends
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at BEFORE UPDATE ON usage_tracking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
