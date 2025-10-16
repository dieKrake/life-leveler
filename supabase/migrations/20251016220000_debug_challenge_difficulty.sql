-- Migration: Debug challenge difficulty matching
-- Date: 2025-10-16 22:00:00
-- Description: Add detailed logging to understand why hard todos don't reduce challenge progress

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
  v_target_difficulty TEXT;
BEGIN
  -- Only reverse if completed_at exists
  IF p_completed_at IS NULL THEN
    RAISE NOTICE 'No completed_at provided, skipping challenge reversal';
    RETURN;
  END IF;
  
  v_time_only := p_completed_at::TIME;
  
  RAISE NOTICE 'Starting challenge reversal for todo %, difficulty: %', p_todo_id, p_difficulty;

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
    
    RAISE NOTICE 'Processing challenge: %, type: %, metadata: %', 
      v_challenge.challenge_id, v_challenge.condition_type, v_challenge.target_metadata;
    
    -- Check condition type and reverse accordingly
    CASE v_challenge.condition_type
      
      -- Reverse complete count
      WHEN 'complete_count' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - 1),
            completed = CASE 
              WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
              THEN false 
              ELSE completed 
            END,
            completed_at = CASE 
              WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
              THEN NULL 
              ELSE completed_at 
            END
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
          AND claimed = false;
        RAISE NOTICE 'Reduced complete_count challenge progress by 1';
      
      -- Reverse complete before time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = CASE 
                WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
                THEN false 
                ELSE completed 
              END,
              completed_at = CASE 
                WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
                THEN NULL 
                ELSE completed_at 
              END
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
            AND claimed = false;
          RAISE NOTICE 'Reduced complete_before_time challenge progress by 1';
        END IF;
      
      -- Reverse complete difficulty
      WHEN 'complete_difficulty' THEN
        v_target_difficulty := v_challenge.target_metadata->>'difficulty';
        RAISE NOTICE 'Checking difficulty match: % = %? Result: %', 
          p_difficulty, v_target_difficulty, (p_difficulty = v_target_difficulty);
        
        IF TRIM(p_difficulty) = TRIM(v_target_difficulty) THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = CASE 
                WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
                THEN false 
                ELSE completed 
              END,
              completed_at = CASE 
                WHEN progress - 1 < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
                THEN NULL 
                ELSE completed_at 
              END
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
            AND claimed = false;
          RAISE NOTICE 'Reduced complete_difficulty challenge progress by 1 (difficulty: %)', p_difficulty;
        ELSE
          RAISE NOTICE 'Difficulty mismatch: todo is %, challenge wants %', p_difficulty, v_target_difficulty;
        END IF;
      
      -- Reverse XP earned
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - p_xp_earned),
            completed = CASE 
              WHEN progress - p_xp_earned < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
              THEN false 
              ELSE completed 
            END,
            completed_at = CASE 
              WHEN progress - p_xp_earned < (SELECT target_value FROM challenges WHERE id = v_challenge.challenge_id) 
              THEN NULL 
              ELSE completed_at 
            END
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
          AND claimed = false;
        RAISE NOTICE 'Reduced earn_xp challenge progress by %', p_xp_earned;
      
      ELSE
        RAISE NOTICE 'Unknown challenge type: %', v_challenge.condition_type;
    END CASE;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_reverse_challenges_on_todo_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
