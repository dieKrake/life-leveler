-- Migration: Debug challenge uncomplete for hard todos
-- Date: 2025-10-16 20:00:00
-- Description: Add logging to debug why hard todo uncomplete doesn't reduce challenge progress

-- First, let's check the current function
-- Add a test function to debug the issue
CREATE OR REPLACE FUNCTION debug_challenge_uncomplete(
  p_user_id UUID,
  p_todo_id BIGINT,
  p_xp_earned INTEGER,
  p_difficulty TEXT,
  p_completed_at TIMESTAMP WITH TIME ZONE
)
RETURNS TABLE(
  challenge_id UUID,
  condition_type challenge_condition_type,
  target_metadata JSONB,
  current_progress INTEGER,
  claimed BOOLEAN,
  difficulty_match BOOLEAN,
  would_update BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
BEGIN
  -- Loop through all active challenges for this user
  FOR v_challenge IN 
    SELECT uc.id, uc.challenge_id, c.condition_type, c.target_metadata, c.target_value, uc.progress, uc.claimed
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.expires_at > NOW()
  LOOP
    -- Return debug info for complete_difficulty challenges
    IF v_challenge.condition_type = 'complete_difficulty' THEN
      RETURN QUERY SELECT 
        v_challenge.challenge_id,
        v_challenge.condition_type,
        v_challenge.target_metadata,
        v_challenge.progress,
        v_challenge.claimed,
        (p_difficulty = (v_challenge.target_metadata->>'difficulty'))::BOOLEAN as difficulty_match,
        (NOT v_challenge.claimed AND p_difficulty = (v_challenge.target_metadata->>'difficulty'))::BOOLEAN as would_update;
    END IF;
  END LOOP;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_challenge_uncomplete(UUID, BIGINT, INTEGER, TEXT, TIMESTAMP WITH TIME ZONE) TO authenticated;
