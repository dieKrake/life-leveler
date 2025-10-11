-- Integrate challenges with todo completion
-- Migration: 20251011150000_integrate_challenges_with_todos.sql

-- Function to check and update relevant challenges when a todo is completed
CREATE OR REPLACE FUNCTION check_and_update_challenges_on_todo_complete(
  p_user_id UUID,
  p_todo_id BIGINT,
  p_xp_earned INTEGER,
  p_difficulty TEXT,
  p_completed_at TIMESTAMP WITH TIME ZONE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_time_only TIME;
BEGIN
  v_time_only := p_completed_at::TIME;

  -- Loop through all active challenges for this user
  FOR v_challenge IN 
    SELECT uc.id, uc.challenge_id, c.condition_type, c.target_metadata, c.target_value, uc.progress
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
      AND NOT uc.completed
  LOOP
    -- Check condition type and update accordingly
    CASE v_challenge.condition_type
      
      -- Complete X todos
      WHEN 'complete_count' THEN
        PERFORM update_challenge_progress(p_user_id, v_challenge.challenge_id, 1);
      
      -- Complete X todos before specific time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          PERFORM update_challenge_progress(p_user_id, v_challenge.challenge_id, 1);
        END IF;
      
      -- Complete X todos with specific difficulty
      WHEN 'complete_difficulty' THEN
        IF p_difficulty = (v_challenge.target_metadata->>'difficulty') THEN
          PERFORM update_challenge_progress(p_user_id, v_challenge.challenge_id, 1);
        END IF;
      
      -- Earn X XP
      WHEN 'earn_xp' THEN
        PERFORM update_challenge_progress(p_user_id, v_challenge.challenge_id, p_xp_earned);
      
      ELSE
        -- Unknown condition type, skip
        NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS complete_todo(BIGINT);

-- Update the complete_todo function to trigger challenge updates
CREATE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  level_up BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_xp_value INTEGER;
  v_difficulty TEXT;
  v_old_level INTEGER;
  v_new_level INTEGER;
  v_gems_gained INTEGER;
  v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get todo details
  SELECT user_id, xp_value INTO v_user_id, v_xp_value
  FROM todos
  WHERE id = todo_id AND NOT is_completed;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Todo not found or already completed';
  END IF;

  -- Determine difficulty based on XP value
  v_difficulty := CASE
    WHEN v_xp_value = 10 THEN 'easy'
    WHEN v_xp_value = 20 THEN 'medium'
    WHEN v_xp_value = 30 THEN 'hard'
    ELSE 'medium'
  END;

  -- Mark todo as completed
  v_completed_at := NOW();
  UPDATE todos
  SET is_completed = true, completed_at = v_completed_at
  WHERE id = todo_id;

  -- Get current level
  SELECT level INTO v_old_level
  FROM player_stats
  WHERE user_id = v_user_id;

  -- Award XP and gems
  v_gems_gained := CASE
    WHEN v_xp_value = 30 THEN 3
    WHEN v_xp_value = 20 THEN 2
    ELSE 1
  END;

  UPDATE player_stats
  SET xp = xp + v_xp_value,
      gems = gems + v_gems_gained,
      total_completed_todos = total_completed_todos + 1
  WHERE user_id = v_user_id;

  -- Get new level
  SELECT level INTO v_new_level
  FROM player_stats
  WHERE user_id = v_user_id;

  -- Check and update challenges
  PERFORM check_and_update_challenges_on_todo_complete(
    v_user_id,
    todo_id,
    v_xp_value,
    v_difficulty,
    v_completed_at
  );

  -- Return results
  RETURN QUERY
  SELECT 
    v_new_level,
    v_xp_value,
    v_gems_gained,
    (v_new_level > v_old_level) as level_up;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_update_challenges_on_todo_complete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;