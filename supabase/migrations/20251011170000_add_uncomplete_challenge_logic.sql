-- Add reverse challenge logic for uncompleting todos
-- Migration: 20251011170000_add_uncomplete_challenge_logic.sql

-- Function to reverse challenge progress when a todo is uncompleted
CREATE OR REPLACE FUNCTION check_and_reverse_challenges_on_todo_uncomplete(
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
  -- Only reverse if completed_at exists
  IF p_completed_at IS NULL THEN
    RETURN;
  END IF;
  
  v_time_only := p_completed_at::TIME;

  -- Loop through all active challenges for this user
  FOR v_challenge IN 
    SELECT uc.id, uc.challenge_id, c.condition_type, c.target_metadata, c.target_value, uc.progress
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
  LOOP
    -- Check condition type and reverse accordingly
    CASE v_challenge.condition_type
      
      -- Reverse complete count
      WHEN 'complete_count' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - 1),
            completed = false,
            completed_at = NULL
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW();
      
      -- Reverse complete before time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = false,
              completed_at = NULL
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW();
        END IF;
      
      -- Reverse complete difficulty
      WHEN 'complete_difficulty' THEN
        IF p_difficulty = (v_challenge.target_metadata->>'difficulty') THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = false,
              completed_at = NULL
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW();
        END IF;
      
      -- Reverse XP earned
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - p_xp_earned),
            completed = false,
            completed_at = NULL
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW();
      
      ELSE
        NULL;
    END CASE;
  END LOOP;
END;
$$;

-- Update uncomplete_todo function to reverse challenge progress
DROP FUNCTION IF EXISTS uncomplete_todo(BIGINT);

CREATE FUNCTION uncomplete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_remove INT;
    user_streak INT;
    v_difficulty TEXT;
    v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user_id and completed_at first
    SELECT user_id, completed_at INTO v_user_id, v_completed_at 
    FROM public.todos 
    WHERE id = todo_id;
    
    -- Update todo and get XP value
    UPDATE public.todos
    SET is_completed = FALSE, completed_at = NULL
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = TRUE
    RETURNING xp_value INTO xp_from_todo;

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
        final_xp_to_remove := round(xp_from_todo * streak_multiplier);

        -- Remove XP and gems
        PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -gems_from_todo);
        
        -- Reverse challenge progress
        PERFORM check_and_reverse_challenges_on_todo_uncomplete(
            auth.uid(),
            todo_id,
            final_xp_to_remove,
            v_difficulty,
            v_completed_at
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_reverse_challenges_on_todo_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION uncomplete_todo(BIGINT) TO authenticated;