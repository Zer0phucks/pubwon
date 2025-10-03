-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE icp_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE subreddits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pain_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE github_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletters ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USERS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Service role has full access to users"
  ON users FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- REPOSITORIES TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own repositories"
  ON repositories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own repositories"
  ON repositories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own repositories"
  ON repositories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own repositories"
  ON repositories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to repositories"
  ON repositories FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- ICP_PERSONAS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view personas from own repositories"
  ON icp_personas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = icp_personas.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert personas to own repositories"
  ON icp_personas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = icp_personas.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update personas from own repositories"
  ON icp_personas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = icp_personas.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete personas from own repositories"
  ON icp_personas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = icp_personas.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to icp_personas"
  ON icp_personas FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SUBREDDITS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view subreddits from own personas"
  ON subreddits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = subreddits.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert subreddits to own personas"
  ON subreddits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = subreddits.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update subreddits from own personas"
  ON subreddits FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = subreddits.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete subreddits from own personas"
  ON subreddits FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = subreddits.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to subreddits"
  ON subreddits FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- PAIN_POINTS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view pain points from own personas"
  ON pain_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = pain_points.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pain points from own personas"
  ON pain_points FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM icp_personas
      JOIN repositories ON repositories.id = icp_personas.repository_id
      WHERE icp_personas.id = pain_points.icp_persona_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to pain_points"
  ON pain_points FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- GITHUB_ISSUES TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view issues from own repositories"
  ON github_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = github_issues.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to github_issues"
  ON github_issues FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- BLOG_POSTS TABLE POLICIES
-- ============================================
CREATE POLICY "Public can view published blog posts"
  ON blog_posts FOR SELECT
  USING (status = 'published');

CREATE POLICY "Users can view own blog posts"
  ON blog_posts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = blog_posts.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own blog posts"
  ON blog_posts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = blog_posts.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to blog_posts"
  ON blog_posts FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- EMAIL_SUBSCRIBERS TABLE POLICIES
-- ============================================
CREATE POLICY "Public can insert subscribers"
  ON email_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Subscribers can view own subscription"
  ON email_subscribers FOR SELECT
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Subscribers can update own subscription"
  ON email_subscribers FOR UPDATE
  USING (email = auth.jwt()->>'email');

CREATE POLICY "Service role has full access to email_subscribers"
  ON email_subscribers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- NEWSLETTERS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own newsletters"
  ON newsletters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM repositories
      WHERE repositories.id = newsletters.repository_id
      AND repositories.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role has full access to newsletters"
  ON newsletters FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- NEWSLETTER_SENDS TABLE POLICIES
-- ============================================
CREATE POLICY "Service role has full access to newsletter_sends"
  ON newsletter_sends FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- SUBSCRIPTIONS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- USAGE_TRACKING TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to usage_tracking"
  ON usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- ACTIVITY_LOGS TABLE POLICIES
-- ============================================
CREATE POLICY "Users can view own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role has full access to activity_logs"
  ON activity_logs FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
