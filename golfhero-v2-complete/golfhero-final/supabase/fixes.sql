-- ============================================
-- GOLFHERO — fixes.sql
-- Run this AFTER schema.sql AND functions.sql
-- Safe to run multiple times (uses IF NOT EXISTS)
-- ============================================

-- 1. Add unique constraint for charity_contributions
--    so webhook retries don't create duplicates
ALTER TABLE public.charity_contributions
  DROP CONSTRAINT IF EXISTS unique_contribution_per_month;

ALTER TABLE public.charity_contributions
  ADD CONSTRAINT unique_contribution_per_month
  UNIQUE (user_id, charity_id, month_year, contribution_type);

-- 2. Make sure updated_at exists on subscriptions
ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Recreate increment_charity_raised safely
CREATE OR REPLACE FUNCTION increment_charity_raised(charity_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.charities
  SET total_raised = total_raised + amount
  WHERE id = charity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Admin policy: allow service_role to read subscriptions
-- (service_role already bypasses RLS by default in Supabase)

-- 5. RLS policy: admins can read all draw_months (not just published)
DROP POLICY IF EXISTS "Service role can manage draw_months" ON public.draw_months;
-- service_role bypasses RLS automatically - no policy needed

-- 6. Allow draw_months to be read by authenticated users too
DROP POLICY IF EXISTS "Authenticated can view all draw_months" ON public.draw_months;
CREATE POLICY "Authenticated can view all draw_months"
  ON public.draw_months FOR SELECT
  USING (TRUE);

-- 7. Allow draw_entries to be inserted by authenticated users
DROP POLICY IF EXISTS "Users can insert own entries" ON public.draw_entries;
CREATE POLICY "Users can insert own entries"
  ON public.draw_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 8. Allow authenticated users to view charity contributions
DROP POLICY IF EXISTS "Authenticated can view charities" ON public.charities;
CREATE POLICY "Authenticated can view charities"
  ON public.charities FOR SELECT
  USING (TRUE);

-- 9. Make sure subscriptions can be read by the user
DROP POLICY IF EXISTS "Users can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================
-- Supabase Storage: winner-proofs bucket
-- Run this manually OR create in the dashboard:
-- Storage → New bucket → "winner-proofs" → Public
-- ============================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('winner-proofs', 'winner-proofs', true)
-- ON CONFLICT (id) DO NOTHING;


-- 10. Users can update their OWN subscription (needed for change-charity feature)
DROP POLICY IF EXISTS "Users can update own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 11. Allow public (anon) to read active charities (needed for /charities page without login)
DROP POLICY IF EXISTS "Anyone can view charities" ON public.charities;
CREATE POLICY "Anyone can view charities"
  ON public.charities FOR SELECT
  USING (is_active = TRUE);
