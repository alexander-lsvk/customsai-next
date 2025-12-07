-- Supabase Schema for Customs AI
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (synced from Clerk)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  credits_remaining INTEGER DEFAULT 5 NOT NULL,
  credits_used INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Subscriptions table (for Stripe integration)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT DEFAULT 'free' NOT NULL CHECK (plan IN ('free', 'starter', 'pro', 'business', 'enterprise')),
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Classifications history table
CREATE TABLE IF NOT EXISTS classifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  hs_code TEXT NOT NULL,
  hs_description TEXT,
  confidence DECIMAL(3,2),
  reasoning TEXT,
  alternatives JSONB,
  edge_cases JSONB,
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_clerk_id ON users(clerk_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_classifications_user_id ON classifications(user_id);
CREATE INDEX IF NOT EXISTS idx_classifications_created_at ON classifications(created_at DESC);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user with free subscription
CREATE OR REPLACE FUNCTION create_user_with_subscription(
  p_clerk_id TEXT,
  p_email TEXT,
  p_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insert user
  INSERT INTO users (clerk_id, email, name, credits_remaining)
  VALUES (p_clerk_id, p_email, p_name, 5)
  RETURNING id INTO v_user_id;

  -- Create free subscription
  INSERT INTO subscriptions (user_id, plan, status)
  VALUES (v_user_id, 'free', 'active');

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to use a credit
CREATE OR REPLACE FUNCTION use_credit(p_clerk_id TEXT)
RETURNS TABLE(success BOOLEAN, remaining INTEGER, message TEXT) AS $$
DECLARE
  v_user users%ROWTYPE;
  v_subscription subscriptions%ROWTYPE;
BEGIN
  -- Get user
  SELECT * INTO v_user FROM users WHERE clerk_id = p_clerk_id;

  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Get subscription
  SELECT * INTO v_subscription FROM subscriptions WHERE user_id = v_user.id;

  -- Check if enterprise (unlimited)
  IF v_subscription.plan = 'enterprise' THEN
    UPDATE users SET credits_used = credits_used + 1 WHERE id = v_user.id;
    RETURN QUERY SELECT TRUE, -1, 'Unlimited plan'::TEXT;
    RETURN;
  END IF;

  -- Check credits
  IF v_user.credits_remaining <= 0 THEN
    RETURN QUERY SELECT FALSE, 0, 'No credits remaining'::TEXT;
    RETURN;
  END IF;

  -- Deduct credit
  UPDATE users
  SET credits_remaining = credits_remaining - 1,
      credits_used = credits_used + 1
  WHERE id = v_user.id
  RETURNING credits_remaining INTO v_user.credits_remaining;

  RETURN QUERY SELECT TRUE, v_user.credits_remaining, 'Credit used'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to add credits (for subscription renewal)
CREATE OR REPLACE FUNCTION add_credits(p_clerk_id TEXT, p_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET credits_remaining = credits_remaining + p_credits
  WHERE clerk_id = p_clerk_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to reset credits (for monthly reset)
CREATE OR REPLACE FUNCTION reset_credits(p_clerk_id TEXT, p_credits INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE users
  SET credits_remaining = p_credits
  WHERE clerk_id = p_clerk_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;

-- Policies for service role (full access)
CREATE POLICY "Service role has full access to users" ON users
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to classifications" ON classifications
  FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions
GRANT ALL ON users TO service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT ALL ON classifications TO service_role;
