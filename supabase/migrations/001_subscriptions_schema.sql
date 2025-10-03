-- Phase 1.3: Stripe Integration Schema
-- This migration creates tables for managing Stripe subscriptions and customer data

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Stripe Customers Table
-- Links Supabase users to Stripe customer IDs
CREATE TABLE IF NOT EXISTS stripe_customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_stripe_customer UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX idx_stripe_customers_user_id ON stripe_customers(user_id);
CREATE INDEX idx_stripe_customers_stripe_id ON stripe_customers(stripe_customer_id);

-- Subscriptions Table
-- Stores subscription details from Stripe
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL REFERENCES stripe_customers(stripe_customer_id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT NOT NULL,
  plan_name TEXT NOT NULL CHECK (plan_name IN ('free', 'pro_monthly', 'pro_yearly', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid', 'paused')),
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_active_subscription UNIQUE(user_id, status)
);

-- Create indexes for faster queries
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- Usage Tracking Table
-- Track feature usage per user/subscription for quota enforcement
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  feature_type TEXT NOT NULL CHECK (feature_type IN ('repositories', 'pain_points', 'blog_posts', 'newsletters')),
  usage_count INTEGER DEFAULT 0,
  limit_amount INTEGER,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_feature_period UNIQUE(user_id, feature_type, period_start)
);

-- Create indexes for usage tracking
CREATE INDEX idx_usage_tracking_user_id ON usage_tracking(user_id);
CREATE INDEX idx_usage_tracking_feature_type ON usage_tracking(feature_type);
CREATE INDEX idx_usage_tracking_period ON usage_tracking(period_start, period_end);

-- Webhook Events Table
-- Log all Stripe webhook events for debugging and auditing
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for webhook events
CREATE INDEX idx_webhook_events_event_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX idx_webhook_events_created_at ON webhook_events(created_at);

-- Row Level Security (RLS) Policies
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- Stripe Customers RLS Policies
CREATE POLICY "Users can view their own Stripe customer data"
  ON stripe_customers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all Stripe customers"
  ON stripe_customers FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Subscriptions RLS Policies
CREATE POLICY "Users can view their own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON subscriptions FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Usage Tracking RLS Policies
CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all usage tracking"
  ON usage_tracking FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Webhook Events RLS Policies
-- Only service role can access webhook events
CREATE POLICY "Service role can manage all webhook events"
  ON webhook_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Functions and Triggers

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_stripe_customers_updated_at
  BEFORE UPDATE ON stripe_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user's active subscription
CREATE OR REPLACE FUNCTION get_active_subscription(p_user_id UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  status TEXT,
  current_period_end TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    id,
    subscriptions.plan_name,
    subscriptions.status,
    subscriptions.current_period_end
  FROM subscriptions
  WHERE user_id = p_user_id
    AND status IN ('active', 'trialing')
  ORDER BY created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check feature quota
CREATE OR REPLACE FUNCTION check_feature_quota(
  p_user_id UUID,
  p_feature_type TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_usage_count INTEGER;
  v_limit_amount INTEGER;
  v_has_quota BOOLEAN;
BEGIN
  -- Get current usage and limit for the feature
  SELECT
    usage_count,
    limit_amount
  INTO
    v_usage_count,
    v_limit_amount
  FROM usage_tracking
  WHERE user_id = p_user_id
    AND feature_type = p_feature_type
    AND NOW() BETWEEN period_start AND period_end
  LIMIT 1;

  -- If no record found, assume quota not exceeded
  IF NOT FOUND THEN
    RETURN TRUE;
  END IF;

  -- Check if usage is below limit
  IF v_limit_amount IS NULL THEN
    -- No limit set, unlimited quota
    v_has_quota := TRUE;
  ELSE
    v_has_quota := v_usage_count < v_limit_amount;
  END IF;

  RETURN v_has_quota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment feature usage
CREATE OR REPLACE FUNCTION increment_feature_usage(
  p_user_id UUID,
  p_feature_type TEXT,
  p_increment INTEGER DEFAULT 1
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO usage_tracking (
    user_id,
    feature_type,
    usage_count,
    period_start,
    period_end
  )
  VALUES (
    p_user_id,
    p_feature_type,
    p_increment,
    DATE_TRUNC('month', NOW()),
    DATE_TRUNC('month', NOW()) + INTERVAL '1 month'
  )
  ON CONFLICT (user_id, feature_type, period_start)
  DO UPDATE SET
    usage_count = usage_tracking.usage_count + p_increment,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments for documentation
COMMENT ON TABLE stripe_customers IS 'Links Supabase users to Stripe customer IDs';
COMMENT ON TABLE subscriptions IS 'Stores Stripe subscription details and status';
COMMENT ON TABLE usage_tracking IS 'Tracks feature usage per user for quota enforcement';
COMMENT ON TABLE webhook_events IS 'Logs all Stripe webhook events for auditing';
COMMENT ON FUNCTION get_active_subscription IS 'Returns the active subscription for a user';
COMMENT ON FUNCTION check_feature_quota IS 'Checks if user has remaining quota for a feature';
COMMENT ON FUNCTION increment_feature_usage IS 'Increments usage count for a feature';
