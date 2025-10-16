-- Migration: Fix level calculation completely
-- Date: 2025-10-16 31:00:00
-- Description: Completely rewrite the level calculation logic to work with cumulative XP requirements

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
  v_new_total_xp INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
  v_level_up BOOLEAN := FALSE;
  v_max_level INTEGER := 10;
  level_rec RECORD;
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
  
  -- Calculate new total XP
  v_new_total_xp := v_current_total_xp + p_xp_change;
  
  -- Ensure total XP doesn't go below 0
  v_new_total_xp := GREATEST(v_new_total_xp, 0);
  
  -- Calculate level and current XP based on total XP
  v_new_level := 1;
  v_new_xp := v_new_total_xp;
  
  -- Find the correct level by checking cumulative XP requirements
  FOR level_rec IN 
    SELECT level, xp_required 
    FROM levels 
    WHERE level > 1 AND level <= v_max_level
    ORDER BY level ASC
  LOOP
    IF v_new_total_xp >= level_rec.xp_required THEN
      v_new_level := level_rec.level;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Calculate current level XP (XP progress within the current level)
  IF v_new_level = 1 THEN
    -- Level 1: XP = total XP
    v_new_xp := v_new_total_xp;
  ELSE
    -- Higher levels: XP = total XP - XP required for current level
    DECLARE
      current_level_requirement INTEGER;
    BEGIN
      SELECT COALESCE(xp_required, 0) INTO current_level_requirement
      FROM levels
      WHERE level = v_new_level;
      
      v_new_xp := v_new_total_xp - current_level_requirement;
    END;
  END IF;
  
  -- Ensure XP is never negative
  v_new_xp := GREATEST(v_new_xp, 0);
  
  -- Check if we leveled up
  v_level_up := v_new_level > v_current_level;
  
  -- Update player stats
  UPDATE player_stats ps
  SET 
    level = v_new_level,
    xp = v_new_xp,
    total_xp = v_new_total_xp,
    gems = GREATEST(0, v_current_gems + p_gems_change),
    max_level_reached = GREATEST(ps.max_level_reached, v_new_level),
    updated_at = NOW()
  WHERE ps.user_id = v_user_id;
  
  -- Debug logging
  RAISE NOTICE 'XP Update: Total % -> % (change: %), Level: % -> %, Current XP: % -> %', 
    v_current_total_xp, v_new_total_xp, p_xp_change, v_current_level, v_new_level, v_current_xp, v_new_xp;
  
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
