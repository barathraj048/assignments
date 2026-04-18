-- ============================================
-- GOLFHERO - Complete Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  handicap INTEGER,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHARITIES
-- ============================================
CREATE TABLE public.charities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  website_url TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  total_raised DECIMAL(12,2) DEFAULT 0,
  events JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- SUBSCRIPTIONS
-- ============================================
CREATE TABLE public.subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT CHECK (plan IN ('monthly', 'yearly')) NOT NULL,
  status TEXT CHECK (status IN ('active', 'inactive', 'cancelled', 'lapsed', 'trialing')) DEFAULT 'inactive',
  amount_pence INTEGER NOT NULL, -- in pence/cents
  charity_id UUID REFERENCES public.charities(id),
  charity_percentage DECIMAL(5,2) DEFAULT 10.00,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- GOLF SCORES
-- ============================================
CREATE TABLE public.golf_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 45),
  score_date DATE NOT NULL,
  course_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- KEY CONSTRAINT: one score per user per date
  UNIQUE(user_id, score_date)
);

-- ============================================
-- DRAW MONTHS
-- ============================================
CREATE TABLE public.draw_months (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  month_year TEXT NOT NULL UNIQUE, -- e.g. "2024-03"
  status TEXT CHECK (status IN ('upcoming', 'open', 'simulating', 'published', 'closed')) DEFAULT 'upcoming',
  draw_mode TEXT CHECK (draw_mode IN ('random', 'algorithmic')) DEFAULT 'random',
  
  -- Prize pool breakdown
  total_pool DECIMAL(12,2) DEFAULT 0,
  jackpot_pool DECIMAL(12,2) DEFAULT 0,     -- 40% (+ rolled over jackpot)
  match4_pool DECIMAL(12,2) DEFAULT 0,       -- 35%
  match3_pool DECIMAL(12,2) DEFAULT 0,       -- 25%
  
  -- Jackpot rollover
  jackpot_rolled_over DECIMAL(12,2) DEFAULT 0, -- amount carried from previous month
  jackpot_claimed BOOLEAN DEFAULT FALSE,
  
  -- Draw numbers (5 numbers drawn)
  drawn_numbers INTEGER[], -- array of 5 numbers 1-45
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DRAW ENTRIES (snapshot of scores at draw time)
-- ============================================
CREATE TABLE public.draw_entries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draw_months(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  scores_snapshot INTEGER[] NOT NULL, -- user's 5 scores at time of draw
  match_count INTEGER DEFAULT 0,      -- how many matched
  matched_numbers INTEGER[],          -- which numbers matched
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- ============================================
-- DRAW RESULTS / WINNERS
-- ============================================
CREATE TABLE public.draw_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  draw_id UUID REFERENCES public.draw_months(id) NOT NULL,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  match_type TEXT CHECK (match_type IN ('match5', 'match4', 'match3')) NOT NULL,
  prize_amount DECIMAL(12,2) NOT NULL,     -- their split share
  total_tier_prize DECIMAL(12,2) NOT NULL, -- total for that tier
  winner_count INTEGER DEFAULT 1,          -- how many shared this tier
  
  -- Verification flow
  verification_status TEXT CHECK (verification_status IN ('pending', 'proof_submitted', 'approved', 'rejected')) DEFAULT 'pending',
  proof_url TEXT,
  proof_submitted_at TIMESTAMPTZ,
  admin_reviewed_at TIMESTAMPTZ,
  admin_notes TEXT,
  
  -- Payout
  payout_status TEXT CHECK (payout_status IN ('pending', 'processing', 'paid')) DEFAULT 'pending',
  paid_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CHARITY CONTRIBUTIONS
-- ============================================
CREATE TABLE public.charity_contributions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  charity_id UUID REFERENCES public.charities(id) NOT NULL,
  subscription_id UUID REFERENCES public.subscriptions(id),
  amount DECIMAL(10,2) NOT NULL,
  contribution_type TEXT CHECK (contribution_type IN ('subscription', 'voluntary')) DEFAULT 'subscription',
  month_year TEXT, -- e.g. "2024-03"
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charity_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draw_months ENABLE ROW LEVEL SECURITY;

-- Profiles: users can see/edit their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Subscriptions: users can see their own
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Golf scores: users can CRUD their own
CREATE POLICY "Users can view own scores" ON public.golf_scores FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own scores" ON public.golf_scores FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own scores" ON public.golf_scores FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own scores" ON public.golf_scores FOR DELETE USING (auth.uid() = user_id);

-- Charities: everyone can read
CREATE POLICY "Anyone can view charities" ON public.charities FOR SELECT USING (TRUE);

-- Draw months: everyone can view published
CREATE POLICY "Anyone can view published draws" ON public.draw_months FOR SELECT USING (status = 'published' OR status = 'closed');

-- Draw entries: users see their own
CREATE POLICY "Users can view own entries" ON public.draw_entries FOR SELECT USING (auth.uid() = user_id);

-- Draw results: users see their own wins
CREATE POLICY "Users can view own results" ON public.draw_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can submit proof" ON public.draw_results FOR UPDATE USING (auth.uid() = user_id);

-- Charity contributions: users see their own
CREATE POLICY "Users can view own contributions" ON public.charity_contributions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- ADMIN ROLE (service_role bypasses RLS)
-- ============================================
-- Admin operations use service_role key from Edge Functions

-- ============================================
-- USEFUL INDEXES
-- ============================================
CREATE INDEX idx_golf_scores_user_date ON public.golf_scores(user_id, score_date DESC);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe ON public.subscriptions(stripe_subscription_id);
CREATE INDEX idx_draw_entries_draw ON public.draw_entries(draw_id);
CREATE INDEX idx_draw_results_draw ON public.draw_results(draw_id);
CREATE INDEX idx_contributions_user ON public.charity_contributions(user_id);

-- ============================================
-- TRIGGER: auto-create profile on signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- SEED DATA: Sample Charities
-- ============================================
INSERT INTO public.charities (name, slug, description, short_description, is_featured, is_active) VALUES
('Golf Foundation', 'golf-foundation', 'The Golf Foundation helps young people from all backgrounds to discover, enjoy and benefit from golf. We fund coaching, equipment, and facilities for those who need it most.', 'Getting young people into golf', TRUE, TRUE),
('Cancer Research UK', 'cancer-research-uk', 'Cancer Research UK is the world''s largest independent cancer research organisation. Every step we take, every breakthrough we make, is driven by the ambition to bring forward the day when all cancers are cured.', 'World-leading cancer research', TRUE, TRUE),
('Macmillan Cancer Support', 'macmillan', 'Macmillan Cancer Support improves the lives of people affected by cancer. We provide practical, medical, emotional and financial support for people living with cancer.', 'Supporting cancer patients', FALSE, TRUE),
('Mind UK', 'mind-uk', 'Mind provides advice and support to empower anyone experiencing a mental health problem. We campaign to improve services, raise awareness and promote understanding.', 'Mental health support & advocacy', FALSE, TRUE),
('Age UK', 'age-uk', 'Age UK is the UK''s leading charity for older people. We believe in a world where older people flourish and our ambition is that everyone can love later life.', 'Supporting older people nationwide', FALSE, TRUE);
