-- Integrate challenges with todo completion (v2)
-- Migration: 20251011160000_integrate_challenges_with_todos_v2.sql

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

-- Drop and recreate complete_todo function with challenge integration
DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE FUNCTION complete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
    v_difficulty TEXT;
    v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user_id first
    SELECT user_id INTO v_user_id FROM public.todos WHERE id = todo_id;
    
    -- Update todo and get XP value
    UPDATE public.todos
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = FALSE
    RETURNING xp_value, NOW() INTO xp_from_todo, v_completed_at;

    IF xp_from_todo > 0 THEN
        -- Determine difficulty
        v_difficulty := CASE
            WHEN xp_from_todo = 10 THEN 'easy'
            WHEN xp_from_todo = 20 THEN 'medium'
            WHEN xp_from_todo = 30 THEN 'hard'
            ELSE 'medium'
        END;
        
        -- Calculate gems
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        -- Apply streak multiplier
        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Update player stats
        PERFORM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Check and update challenges
        PERFORM check_and_update_challenges_on_todo_complete(
            auth.uid(),
            todo_id,
            final_xp_to_add,
            v_difficulty,
            v_completed_at
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_update_challenges_on_todo_complete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;