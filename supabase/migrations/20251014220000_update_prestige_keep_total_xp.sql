-- Migration: Update prestige system to keep total XP
-- Date: 2025-10-14 22:00:00
-- Description: Modify prestige_player to keep total XP and only reset level XP

-- Add total_xp column to track lifetime XP
ALTER TABLE player_stats 
ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;

-- Update existing records to set total_xp = xp for migration
UPDATE player_stats 
SET total_xp = xp 
WHERE total_xp = 0;

-- Drop and recreate the prestige function
DROP FUNCTION IF EXISTS prestige_player(UUID);

CREATE OR REPLACE FUNCTION prestige_player(p_user_id UUID)
RETURNS TABLE(
  new_prestige INTEGER,
  gems_earned INTEGER,
  achievements_reset INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_level INTEGER;
  v_current_prestige INTEGER;
  v_gems_reward INTEGER := 50;
  v_achievements_count INTEGER;
  v_current_gems INTEGER;
  v_current_xp INTEGER;
  v_total_tasks INTEGER;
BEGIN
  -- Check if user is at level 10
  SELECT level, prestige, gems, xp 
  INTO v_current_level, v_current_prestige, v_current_gems, v_current_xp
  FROM player_stats
  WHERE user_id = p_user_id;
  
  IF v_current_level != 10 THEN
    RAISE EXCEPTION 'Player must be at level 10 to prestige';
  END IF;
  
  -- Count current achievements for reset tracking
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  -- Count total completed tasks
  SELECT COUNT(*) INTO v_total_tasks
  FROM todos
  WHERE user_id = p_user_id AND is_completed = true;
  
  -- Reset player to level 1, but KEEP total XP, increment prestige
  UPDATE player_stats
  SET 
    level = 1,
    xp = 0,  -- Reset level XP to 0
    total_xp = total_xp,  -- Keep total XP unchanged
    prestige = prestige + 1,
    max_level_reached = GREATEST(max_level_reached, 10),
    gems = gems + v_gems_reward,
    -- Set baselines for next prestige cycle
    gems_at_last_prestige = v_current_gems + v_gems_reward,
    tasks_at_last_prestige = v_total_tasks,
    total_tasks_completed = v_total_tasks,
    xp_at_last_prestige = 0  -- Level XP resets to 0
  WHERE user_id = p_user_id;
  
  -- Reset all achievements
  DELETE FROM user_achievements WHERE user_id = p_user_id;
  
  -- Return results
  RETURN QUERY SELECT 
    v_current_prestige + 1,
    v_gems_reward,
    v_achievements_count;
END;
$$;

-- Update the XP function to also update total_xp
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
  
  -- Get current stats
  SELECT level, xp, COALESCE(total_xp, xp), gems, prestige
  INTO v_current_level, v_current_xp, v_current_total_xp, v_current_gems, v_current_prestige
  FROM player_stats
  WHERE user_id = v_user_id;
  
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
      SELECT xp_required INTO v_xp_for_current_level
      FROM levels
      WHERE level = v_new_level;
      
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
      SELECT xp_required INTO v_xp_for_next_level
      FROM levels
      WHERE level = v_new_level + 1;
      
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
      SELECT xp_required INTO v_xp_for_next_level
      FROM levels
      WHERE level = v_max_level;
      
      IF v_new_xp >= v_xp_for_next_level THEN
        v_new_xp := v_xp_for_next_level;
      END IF;
    END IF;
  END IF;
  
  -- Update player stats
  UPDATE player_stats
  SET 
    level = v_new_level,
    xp = v_new_xp,
    total_xp = v_new_total_xp,
    gems = v_current_gems + p_gems_change,
    max_level_reached = GREATEST(max_level_reached, v_new_level),
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
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

-- Update get_player_stats_with_level_info to include total_xp
DROP FUNCTION IF EXISTS get_player_stats_with_level_info();

CREATE OR REPLACE FUNCTION get_player_stats_with_level_info()
RETURNS TABLE(
  user_id UUID,
  level INTEGER,
  xp INTEGER,
  total_xp INTEGER,
  gems INTEGER,
  current_streak INTEGER,
  highest_streak INTEGER,
  streak_multiplier DECIMAL(3,2),
  prestige INTEGER,
  max_level_reached INTEGER,
  xp_for_current_level INTEGER,
  xp_for_next_level INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
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
    COALESCE(l_current.xp_required, 0) as xp_for_current_level,
    COALESCE(l_next.xp_required, 0) as xp_for_next_level,
    ps.created_at,
    ps.updated_at
  FROM player_stats ps
  LEFT JOIN levels l_current ON l_current.level = ps.level
  LEFT JOIN levels l_next ON l_next.level = ps.level + 1
  LEFT JOIN streak_multipliers sm ON ps.current_streak >= sm.min_streak_days
    AND (sm.max_streak_days IS NULL OR ps.current_streak <= sm.max_streak_days)
  WHERE ps.user_id = v_user_id
  ORDER BY sm.multiplier DESC
  LIMIT 1;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION prestige_player(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_stats_with_level_info() TO authenticated;
