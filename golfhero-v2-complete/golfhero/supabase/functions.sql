-- ============================================
-- Additional SQL functions and policies
-- Run AFTER the main schema.sql
-- ============================================

-- RPC function for atomically incrementing charity raised total
CREATE OR REPLACE FUNCTION increment_charity_raised(charity_id UUID, amount DECIMAL)
RETURNS void AS $$
BEGIN
  UPDATE public.charities
  SET total_raised = total_raised + amount
  WHERE id = charity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADMIN POLICIES (using service role in Edge Functions)
-- These allow admin operations via service_role key
-- ============================================

-- Admin can do everything on all tables (service_role bypasses RLS by default)
-- Just ensure SUPABASE_SERVICE_ROLE_KEY is used for admin routes

-- ============================================
-- Draw entries auto-snapshot (optional trigger)
-- Snapshot user scores when draw closes
-- ============================================

CREATE OR REPLACE FUNCTION snapshot_scores_for_draw(draw_id_input UUID)
RETURNS INTEGER AS $$
DECLARE
  entry_count INTEGER := 0;
  user_record RECORD;
  user_scores INTEGER[];
BEGIN
  -- For each active subscriber with 5 scores
  FOR user_record IN
    SELECT DISTINCT s.user_id
    FROM public.subscriptions s
    WHERE s.status = 'active'
  LOOP
    -- Get their latest 5 scores
    SELECT ARRAY(
      SELECT score
      FROM public.golf_scores
      WHERE user_id = user_record.user_id
      ORDER BY score_date DESC
      LIMIT 5
    ) INTO user_scores;

    -- Only enter if they have at least 5 scores
    IF array_length(user_scores, 1) = 5 THEN
      INSERT INTO public.draw_entries (draw_id, user_id, scores_snapshot)
      VALUES (draw_id_input, user_record.user_id, user_scores)
      ON CONFLICT (draw_id, user_id) DO NOTHING;

      entry_count := entry_count + 1;
    END IF;
  END LOOP;

  RETURN entry_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VIEW: Admin draw summary
-- ============================================

CREATE OR REPLACE VIEW admin_draw_summary AS
SELECT
  dm.id,
  dm.month_year,
  dm.status,
  dm.draw_mode,
  dm.total_pool,
  dm.jackpot_pool,
  dm.match4_pool,
  dm.match3_pool,
  dm.jackpot_rolled_over,
  dm.jackpot_claimed,
  dm.drawn_numbers,
  dm.published_at,
  COUNT(DISTINCT de.id) AS entry_count,
  COUNT(DISTINCT CASE WHEN dr.match_type = 'match5' THEN dr.id END) AS match5_winners,
  COUNT(DISTINCT CASE WHEN dr.match_type = 'match4' THEN dr.id END) AS match4_winners,
  COUNT(DISTINCT CASE WHEN dr.match_type = 'match3' THEN dr.id END) AS match3_winners
FROM public.draw_months dm
LEFT JOIN public.draw_entries de ON de.draw_id = dm.id
LEFT JOIN public.draw_results dr ON dr.draw_id = dm.id
GROUP BY dm.id;

-- Grant access to service role
GRANT SELECT ON admin_draw_summary TO service_role;

-- ============================================
-- VIEW: Admin user summary
-- ============================================

CREATE OR REPLACE VIEW admin_user_summary AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.created_at,
  s.status AS subscription_status,
  s.plan,
  s.amount_pence,
  s.charity_percentage,
  s.current_period_end,
  c.name AS charity_name,
  COUNT(DISTINCT gs.id) AS score_count,
  COUNT(DISTINCT de.id) AS draw_entries
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
LEFT JOIN public.charities c ON c.id = s.charity_id
LEFT JOIN public.golf_scores gs ON gs.user_id = p.id
LEFT JOIN public.draw_entries de ON de.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.created_at, s.status, s.plan, s.amount_pence, s.charity_percentage, s.current_period_end, c.name;

GRANT SELECT ON admin_user_summary TO service_role;
