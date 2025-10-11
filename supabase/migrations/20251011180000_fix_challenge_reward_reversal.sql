-- Fix challenge reward reversal when uncompleting todos
-- Migration: 20251011180000_fix_challenge_reward_reversal.sql

-- Update the reverse function to also remove challenge rewards
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
  v_was_completed BOOLEAN;
  v_xp_reward INTEGER;
  v_gem_reward INTEGER;
BEGIN
  -- Only reverse if completed_at exists
  IF p_completed_at IS NULL THEN
    RETURN;
  END IF;
  
  v_time_only := p_completed_at::TIME;

  -- Loop through all challenges for this user (including completed ones)
  FOR v_challenge IN 
    SELECT uc.id, uc.challenge_id, uc.completed, c.condition_type, c.target_metadata, 
           c.target_value, c.xp_reward, c.gem_reward, uc.progress
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
  LOOP
    v_was_completed := v_challenge.completed;
    v_xp_reward := v_challenge.xp_reward;
    v_gem_reward := v_challenge.gem_reward;
    
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
    
    -- If challenge was completed before, remove the rewards from player_stats
    IF v_was_completed THEN
      UPDATE player_stats
      SET xp = xp - v_xp_reward,
          gems = gems - v_gem_reward
      WHERE user_id = p_user_id;
      
      -- Delete the completion record
      DELETE FROM challenge_completions
      WHERE user_id = p_user_id 
        AND challenge_id = v_challenge.challenge_id
        AND completed_at = (
          SELECT MAX(completed_at) 
          FROM challenge_completions 
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
        );
    END IF;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_reverse_challenges_on_todo_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;