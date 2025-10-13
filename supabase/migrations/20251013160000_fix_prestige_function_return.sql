-- Migration: Fix prestige function return statement
-- Date: 2025-10-13 16:00:00
-- Description: Fix the duplicate SELECT/RETURN QUERY issue in prestige_player function

-- Drop and recreate the prestige function with correct return statement
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
  v_gems_reward INTEGER := 50; -- Gems reward for prestiging
  v_achievements_count INTEGER;
BEGIN
  -- Check if user is at level 10
  SELECT level, prestige INTO v_current_level, v_current_prestige
  FROM player_stats
  WHERE user_id = p_user_id;
  
  IF v_current_level != 10 THEN
    RAISE EXCEPTION 'Player must be at level 10 to prestige';
  END IF;
  
  -- Count current achievements for reset tracking
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  -- Reset player to level 1, XP 0, increment prestige
  UPDATE player_stats
  SET 
    level = 1,
    xp = 0,
    prestige = prestige + 1,
    max_level_reached = GREATEST(max_level_reached, 10),
    gems = gems + v_gems_reward
  WHERE user_id = p_user_id;
  
  -- Reset all achievements
  DELETE FROM user_achievements WHERE user_id = p_user_id;
  
  -- Return results (only one RETURN QUERY SELECT)
  RETURN QUERY SELECT 
    v_current_prestige + 1,
    v_gems_reward,
    v_achievements_count;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION prestige_player(UUID) TO authenticated;
