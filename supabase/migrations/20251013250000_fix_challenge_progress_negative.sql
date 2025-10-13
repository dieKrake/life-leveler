-- Migration: Fix negative challenge progress
-- Date: 2025-10-13 25:00:00
-- Description: Prevent challenge progress from going negative

-- Fix update_challenge_progress to never go below 0
CREATE OR REPLACE FUNCTION update_challenge_progress(
  p_user_id UUID,
  p_challenge_id UUID,
  p_increment INTEGER DEFAULT 1
)
RETURNS TABLE(
  challenge_completed BOOLEAN,
  xp_earned INTEGER,
  gems_earned INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_target_value INTEGER;
  v_new_progress INTEGER;
  v_already_completed BOOLEAN;
BEGIN
  -- Get challenge details
  SELECT c.target_value, uc.completed
  INTO v_target_value, v_already_completed
  FROM user_challenges uc
  JOIN challenges c ON c.id = uc.challenge_id
  WHERE uc.user_id = p_user_id 
    AND uc.challenge_id = p_challenge_id
    AND uc.expires_at > NOW()
    AND NOT uc.completed;

  -- If challenge not found or already completed, return
  IF NOT FOUND OR v_already_completed THEN
    RETURN QUERY SELECT false, 0, 0;
    RETURN;
  END IF;

  -- Update progress (ensure it never goes below 0)
  UPDATE user_challenges
  SET progress = GREATEST(0, progress + p_increment)
  WHERE user_id = p_user_id 
    AND challenge_id = p_challenge_id
    AND expires_at > NOW()
  RETURNING progress INTO v_new_progress;

  -- Check if challenge is now completed (but DON'T award rewards yet)
  IF v_new_progress >= v_target_value THEN
    -- Mark as completed (but not claimed)
    UPDATE user_challenges
    SET completed = true, completed_at = NOW()
    WHERE user_id = p_user_id 
      AND challenge_id = p_challenge_id 
      AND expires_at > NOW();

    -- Return that it's completed, but rewards are 0 (must be claimed)
    RETURN QUERY SELECT true, 0, 0;
  ELSE
    RETURN QUERY SELECT false, 0, 0;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION update_challenge_progress(UUID, UUID, INTEGER) TO authenticated;

-- Reset any existing challenges with negative progress
UPDATE user_challenges
SET progress = 0
WHERE progress < 0;