-- Migration: Fix level up calculation bug
-- Date: 2025-10-16 29:00:00
-- Description: Fix the critical bug in update_player_xp_and_gems that causes negative XP display

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
  v_max_level INTEGER := 10;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current stats with proper defaults
  SELECT 
    COALESCE(ps.level, 1), 
    COALESCE(ps.xp, 0), 
    COALESCE(ps.total_xp, ps.xp, 0), 
    COALESCE(ps.gems, 0), 
    COALESCE(ps.prestige, 0)
  INTO v_current_level, v_current_xp, v_current_total_xp, v_current_gems, v_current_prestige
  FROM player_stats ps
  WHERE ps.user_id = v_user_id;
  
  -- Initialize player stats if not found
  IF NOT FOUND THEN
    INSERT INTO player_stats (user_id, level, xp, total_xp, gems, prestige, current_streak, highest_streak)
    VALUES (v_user_id, 1, 0, 0, 0, 0, 0, 0);
    
    v_current_level := 1;
    v_current_xp := 0;
    v_current_total_xp := 0;
    v_current_gems := 0;
    v_current_prestige := 0;
  END IF;
  
  -- Calculate new values
  v_new_xp := v_current_xp + p_xp_change;
  v_new_total_xp := v_current_total_xp + p_xp_change;
  v_new_level := v_current_level;
  
  -- Handle negative XP (level down) - FIXED LOGIC
  IF v_new_xp < 0 THEN
    WHILE v_new_xp < 0 AND v_new_level > 1 LOOP
      -- Move to previous level
      v_new_level := v_new_level - 1;
      
      -- Get XP required for the level we're moving TO (not FROM)
      SELECT COALESCE(l.xp_required, 100) INTO v_xp_for_next_level
      FROM levels l
      WHERE l.level = v_new_level;
      
      -- Add the XP capacity of the level we moved to
      v_new_xp := v_new_xp + v_xp_for_next_level;
    END LOOP;
    
    -- Ensure XP doesn't go below 0 at level 1
    v_new_xp := GREATEST(v_new_xp, 0);
  ELSE
    -- Handle level up - EXISTING LOGIC IS CORRECT
    WHILE v_new_level < v_max_level LOOP
      -- Get XP required for next level
      SELECT COALESCE(l.xp_required, 999999) INTO v_xp_for_next_level
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
      SELECT COALESCE(l.xp_required, 999999) INTO v_xp_for_next_level
      FROM levels l
      WHERE l.level = v_max_level;
      
      v_new_xp := LEAST(v_new_xp, v_xp_for_next_level);
    END IF;
  END IF;
  
  -- Update player stats
  UPDATE player_stats ps
  SET 
    level = v_new_level,
    xp = v_new_xp,
    total_xp = v_new_total_xp,
    gems = GREATEST(0, v_current_gems + p_gems_change), -- Prevent negative gems
    max_level_reached = GREATEST(ps.max_level_reached, v_new_level),
    updated_at = NOW()
  WHERE ps.user_id = v_user_id;
  
  -- Debug logging
  RAISE NOTICE 'XP Update: % -> % (change: %), Level: % -> %, Total XP: % -> %', 
    v_current_xp, v_new_xp, p_xp_change, v_current_level, v_new_level, v_current_total_xp, v_new_total_xp;
  
  -- Return the results
  RETURN QUERY SELECT 
    v_new_level,
    v_new_xp,
    v_new_total_xp,
    GREATEST(0, v_current_gems + p_gems_change),
    v_level_up,
    v_current_prestige;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
