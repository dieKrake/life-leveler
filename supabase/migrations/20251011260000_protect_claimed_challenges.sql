-- Protect claimed challenges from being reset when todos are uncompleted
-- Migration: 20251011260000_protect_claimed_challenges.sql

-- Update check_and_reverse_challenges_on_todo_uncomplete to NOT reset claimed challenges
-- Once a challenge is claimed (claimed = true), it should NEVER be reversible
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
  -- Extract time from completed_at for time-based challenges
  v_time_only := p_completed_at::TIME;
  
  -- Loop through all active challenges for this user
  -- CRITICAL: Only process challenges that are NOT claimed yet
  FOR v_challenge IN
    SELECT uc.*, c.condition_type, c.target_metadata
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
      AND uc.claimed = false  -- ONLY process unclaimed challenges
  LOOP
    
    -- Check condition type and reverse accordingly
    CASE v_challenge.condition_type
      
      -- Reverse complete count
      WHEN 'complete_count' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - 1),
            completed = false,
            completed_at = NULL
            -- NOTE: claimed and claimed_at are NOT reset since we only process unclaimed challenges
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
          AND claimed = false;  -- Double-check: only unclaimed challenges
      
      -- Reverse complete before time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = false,
              completed_at = NULL
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
            AND claimed = false;  -- Double-check: only unclaimed challenges
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
            AND expires_at > NOW()
            AND claimed = false;  -- Double-check: only unclaimed challenges
        END IF;
      
      -- Reverse XP earned
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - p_xp_earned),
            completed = false,
            completed_at = NULL
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
          AND claimed = false;  -- Double-check: only unclaimed challenges
      
      ELSE
        NULL;
    END CASE;
    
    -- CRITICAL: NO XP/GEMS REMOVAL FROM player_stats
    -- This preserves the todo XP/gems fix while protecting claimed challenges
    
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_reverse_challenges_on_todo_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
