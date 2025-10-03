-- Phase 5 Database Schema for Content Generation and Email Distribution

-- Repository Activity Tracking
CREATE TABLE repository_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL,
  activity_date DATE NOT NULL,
  commits_count INTEGER DEFAULT 0,
  prs_merged_count INTEGER DEFAULT 0,
  issues_closed_count INTEGER DEFAULT 0,
  releases_count INTEGER DEFAULT 0,
  activity_summary JSONB,
  is_significant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repository_id UUID NOT NULL,
  activity_id UUID REFERENCES repository_activity(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  featured_image_url TEXT,
  code_snippets JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Newsletters
CREATE TABLE newsletters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE SET NULL,
  subject_line TEXT NOT NULL,
  preview_text TEXT,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  personalization_tokens JSONB,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  complained_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Subscribers
CREATE TABLE email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'unsubscribed', 'bounced', 'complained')),
  subscription_source TEXT,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, email)
);

-- Email Events (for tracking opens, clicks, bounces)
CREATE TABLE email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  newsletter_id UUID NOT NULL REFERENCES newsletters(id) ON DELETE CASCADE,
  subscriber_id UUID NOT NULL REFERENCES email_subscribers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_repo_activity_user_date ON repository_activity(user_id, activity_date DESC);
CREATE INDEX idx_repo_activity_significant ON repository_activity(is_significant) WHERE is_significant = true;
CREATE INDEX idx_blog_posts_user_status ON blog_posts(user_id, status);
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_newsletters_user_status ON newsletters(user_id, status);
CREATE INDEX idx_newsletters_scheduled ON newsletters(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_email_subscribers_user_status ON email_subscribers(user_id, status);
CREATE INDEX idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX idx_email_events_newsletter ON email_events(newsletter_id, event_type);
CREATE INDEX idx_email_events_subscriber ON email_events(subscriber_id, created_at DESC);

-- RLS Policies
ALTER TABLE repository_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Repository Activity Policies
CREATE POLICY "Users can view their own repository activity"
  ON repository_activity FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own repository activity"
  ON repository_activity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own repository activity"
  ON repository_activity FOR UPDATE
  USING (auth.uid() = user_id);

-- Blog Posts Policies
CREATE POLICY "Users can view their own blog posts"
  ON blog_posts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can insert their own blog posts"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blog posts"
  ON blog_posts FOR UPDATE
  USING (auth.uid() = user_id);

-- Newsletters Policies
CREATE POLICY "Users can view their own newsletters"
  ON newsletters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own newsletters"
  ON newsletters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own newsletters"
  ON newsletters FOR UPDATE
  USING (auth.uid() = user_id);

-- Email Subscribers Policies
CREATE POLICY "Users can view their own subscribers"
  ON email_subscribers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscribers"
  ON email_subscribers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscribers"
  ON email_subscribers FOR UPDATE
  USING (auth.uid() = user_id);

-- Email Events Policies
CREATE POLICY "Users can view events for their newsletters"
  ON email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM newsletters
      WHERE newsletters.id = email_events.newsletter_id
      AND newsletters.user_id = auth.uid()
    )
  );

-- Functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_repository_activity_updated_at
  BEFORE UPDATE ON repository_activity
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_newsletters_updated_at
  BEFORE UPDATE ON newsletters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_subscribers_updated_at
  BEFORE UPDATE ON email_subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
