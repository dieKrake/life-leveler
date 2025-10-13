-- Migration: Fix challenge updates to prevent negative progress
-- Date: 2025-10-13 26:00:00
-- Description: Add GREATEST(0, ...) to all challenge progress updates

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
  v_new_progress INTEGER;
  v_target_value INTEGER;
BEGIN
  -- Extract time from completed_at for time-based challenges
  v_time_only := p_completed_at::TIME;
  
  -- Loop through all active challenges for this user
  FOR v_challenge IN
    SELECT uc.*, c.condition_type, c.target_value, c.target_metadata
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
      AND NOT uc.completed
  LOOP
    v_target_value := v_challenge.target_value;
    
    -- Check condition type and update progress accordingly
    CASE v_challenge.condition_type
      
      -- Complete count: increment by 1 (never go below 0)
      WHEN 'complete_count' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress + 1)
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
        RETURNING progress INTO v_new_progress;
      
      -- Complete before time: increment by 1 if completed before target time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress + 1)
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
          RETURNING progress INTO v_new_progress;
        ELSE
          v_new_progress := v_challenge.progress;
        END IF;
      
      -- Complete difficulty: increment by 1 if difficulty matches
      WHEN 'complete_difficulty' THEN
        IF p_difficulty = (v_challenge.target_metadata->>'difficulty') THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress + 1)
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
          RETURNING progress INTO v_new_progress;
        ELSE
          v_new_progress := v_challenge.progress;
        END IF;
      
      -- Earn XP: increment by XP earned (never go below 0)
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress + p_xp_earned)
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
        RETURNING progress INTO v_new_progress;
      
      ELSE
        v_new_progress := v_challenge.progress;
    END CASE;
    
    -- Check if challenge is now completed (but DON'T award rewards - use claim system)
    IF v_new_progress >= v_target_value THEN
      UPDATE user_challenges
      SET completed = true, completed_at = NOW()
      WHERE user_id = p_user_id 
        AND challenge_id = v_challenge.challenge_id 
        AND expires_at > NOW();
      
      -- CRITICAL: NO AUTOMATIC XP/GEMS REWARDS - USER MUST CLAIM THEM
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_challenges_on_todo_complete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;