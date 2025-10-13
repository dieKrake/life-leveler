-- Migration: Update prestige function to track baselines
-- Date: 2025-10-13 21:00:00
-- Description: Update prestige_player to save baseline values

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
  
  -- Reset player to level 1, XP 0, increment prestige, UPDATE BASELINES
  UPDATE player_stats
  SET 
    level = 1,
    xp = 0,
    prestige = prestige + 1,
    max_level_reached = GREATEST(max_level_reached, 10),
    gems = gems + v_gems_reward,
    -- Set baselines for next prestige cycle
    gems_at_last_prestige = v_current_gems + v_gems_reward,  -- Include prestige reward
    tasks_at_last_prestige = v_total_tasks,
    total_tasks_completed = v_total_tasks,
    xp_at_last_prestige = 0  -- XP resets to 0, so baseline is 0
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

GRANT EXECUTE ON FUNCTION prestige_player(UUID) TO authenticated;