-- Fix get_player_stats_with_level_info function
-- Remove reference to non-existent max_streak_days column

CREATE OR REPLACE FUNCTION get_player_stats_with_level_info()
RETURNS TABLE (
  user_id UUID,
  level INTEGER,
  xp BIGINT,
  total_xp BIGINT,
  gems INTEGER,
  current_streak INTEGER,
  highest_streak INTEGER,
  streak_multiplier DECIMAL,
  prestige INTEGER,
  max_level_reached INTEGER,
  xp_for_current_level BIGINT,
  xp_for_next_level BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  RETURN QUERY
  SELECT 
    ps.user_id,
    ps.level,
    ps.xp,
    COALESCE(ps.total_xp, ps.xp) as total_xp,
    ps.gems,
    ps.current_streak,
    ps.highest_streak,
    COALESCE(sm.multiplier, 1.0) as streak_multiplier,
    ps.prestige,
    ps.max_level_reached,
    COALESCE(l_current.xp_required, 0::BIGINT) as xp_for_current_level,
    COALESCE(l_next.xp_required, 0::BIGINT) as xp_for_next_level
  FROM player_stats ps
  LEFT JOIN levels l_current ON l_current.level = ps.level
  LEFT JOIN levels l_next ON l_next.level = ps.level + 1
  LEFT JOIN streak_multipliers sm ON ps.current_streak >= sm.min_streak_days
  WHERE ps.user_id = v_user_id
  ORDER BY sm.multiplier DESC NULLS LAST
  LIMIT 1;
END;
$$;

-- Note: Testing this function directly in SQL Editor will fail with "User not authenticated"
-- because there's no auth context. The function works correctly when called from the app.
