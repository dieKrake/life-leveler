-- Migration: Fix ambiguous prestige column reference
-- Date: 2025-10-14 23:00:00
-- Description: Fix the ambiguous column reference in update_player_xp_and_gems function

DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION update_player_xp_and_gems(
  p_xp_change INTEGER,
  p_gems_change INTEGER DEFAULT 0
)
RETURNS TABLE(
  new_level INTEGER,
  new_xp INTEGER,
  new_total_xp INTEGER,
  new_gems INTEGER,
  level_up BOOLEAN,
  prestige INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_level INTEGER;
  v_current_xp INTEGER;
  v_current_total_xp INTEGER;
  v_current_gems INTEGER;
  v_current_prestige INTEGER;
  v_new_xp INTEGER;
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN := FALSE;
  v_xp_for_next_level INTEGER;
  v_xp_for_current_level INTEGER;
  v_max_level INTEGER := 10;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current stats (explicitly qualify column names)
  SELECT ps.level, ps.xp, COALESCE(ps.total_xp, ps.xp), ps.gems, ps.prestige
  INTO v_current_level, v_current_xp, v_current_total_xp, v_current_gems, v_current_prestige
  FROM player_stats ps
  WHERE ps.user_id = v_user_id;
  
  -- Calculate new XP values
  v_new_xp := v_current_xp + p_xp_change;
  v_new_total_xp := v_current_total_xp + p_xp_change;
  v_new_level := v_current_level;
  
  -- Handle negative XP (can't go below 0 for level XP, but total XP can)
  IF v_new_xp < 0 THEN
    -- Handle level down if necessary
    WHILE v_new_xp < 0 AND v_new_level > 1 LOOP
      v_new_level := v_new_level - 1;
      
      -- Get XP required for the new current level
      SELECT l.xp_required INTO v_xp_for_current_level
      FROM levels l
      WHERE l.level = v_new_level;
      
      v_new_xp := v_new_xp + v_xp_for_current_level;
    END LOOP;
    
    -- Ensure XP doesn't go below 0
    IF v_new_xp < 0 THEN
      v_new_xp := 0;
    END IF;
  ELSE
    -- Handle level up
    WHILE v_new_level < v_max_level LOOP
      -- Get XP required for next level
      SELECT l.xp_required INTO v_xp_for_next_level
      FROM levels l
      WHERE l.level = v_new_level + 1;
      
      IF v_new_xp >= v_xp_for_next_level THEN
        v_new_xp := v_new_xp - v_xp_for_next_level;
        v_new_level := v_new_level + 1;
        v_level_up := TRUE;
      ELSE
        EXIT;
      END IF;
    END LOOP;
    
    -- Cap XP at max level
    IF v_new_level = v_max_level THEN
      SELECT l.xp_required INTO v_xp_for_next_level
      FROM levels l
      WHERE l.level = v_max_level;
      
      IF v_new_xp >= v_xp_for_next_level THEN
        v_new_xp := v_xp_for_next_level;
      END IF;
    END IF;
  END IF;
  
  -- Update player stats (explicitly qualify column names)
  UPDATE player_stats ps
  SET 
    level = v_new_level,
    xp = v_new_xp,
    total_xp = v_new_total_xp,
    gems = v_current_gems + p_gems_change,
    max_level_reached = GREATEST(ps.max_level_reached, v_new_level),
    updated_at = NOW()
  WHERE ps.user_id = v_user_id;
  
  -- Return the results
  RETURN QUERY SELECT 
    v_new_level,
    v_new_xp,
    v_new_total_xp,
    v_current_gems + p_gems_change,
    v_level_up,
    v_current_prestige;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
