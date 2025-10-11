-- Final fix for challenge double deduction bug
-- Migration: 20251011250000_final_fix_challenge_double_deduction.sql

-- The issue: check_and_reverse_challenges_on_todo_uncomplete still removes XP/gems
-- even though we now have a claim system where challenges don't automatically award rewards

-- 1. Update check_and_reverse_challenges_on_todo_uncomplete to NOT remove challenge rewards
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
  FOR v_challenge IN
    SELECT uc.*, c.condition_type, c.target_metadata
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
            completed_at = NULL,
            claimed = false,
            claimed_at = NULL
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW();
      
      -- Reverse complete before time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = GREATEST(0, progress - 1),
              completed = false,
              completed_at = NULL,
              claimed = false,
              claimed_at = NULL
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
              completed_at = NULL,
              claimed = false,
              claimed_at = NULL
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW();
        END IF;
      
      -- Reverse XP earned
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = GREATEST(0, progress - p_xp_earned),
            completed = false,
            completed_at = NULL,
            claimed = false,
            claimed_at = NULL
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW();
      
      ELSE
        NULL;
    END CASE;
    
    -- CRITICAL FIX: NO LONGER REMOVE XP/GEMS FROM player_stats
    -- Since challenges now use claim system, they don't automatically award rewards
    -- Therefore, we should NOT remove any XP/gems when reversing challenge progress
    
  END LOOP;
END;
$$;

-- 2. Also ensure check_and_update_challenges_on_todo_complete doesn't award automatic rewards
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
      
      -- Complete count: increment by 1
      WHEN 'complete_count' THEN
        UPDATE user_challenges
        SET progress = progress + 1
        WHERE user_id = p_user_id 
          AND challenge_id = v_challenge.challenge_id
          AND expires_at > NOW()
        RETURNING progress INTO v_new_progress;
      
      -- Complete before time: increment by 1 if completed before target time
      WHEN 'complete_before_time' THEN
        IF v_time_only < (v_challenge.target_metadata->>'time')::TIME THEN
          UPDATE user_challenges
          SET progress = progress + 1
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
          SET progress = progress + 1
          WHERE user_id = p_user_id 
            AND challenge_id = v_challenge.challenge_id
            AND expires_at > NOW()
          RETURNING progress INTO v_new_progress;
        ELSE
          v_new_progress := v_challenge.progress;
        END IF;
      
      -- Earn XP: increment by XP earned
      WHEN 'earn_xp' THEN
        UPDATE user_challenges
        SET progress = progress + p_xp_earned
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_reverse_challenges_on_todo_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_update_challenges_on_todo_complete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
