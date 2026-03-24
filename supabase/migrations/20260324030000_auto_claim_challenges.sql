-- Migration: Auto-claim completed challenges
-- Date: 2026-03-24 03:00:00
-- Description: Automatically claim all completed but unclaimed challenges for a user

CREATE OR REPLACE FUNCTION auto_claim_completed_challenges(p_user_id UUID)
RETURNS TABLE(
  challenge_title TEXT,
  xp_earned INTEGER,
  gems_earned INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_challenge RECORD;
  v_claim_result RECORD;
BEGIN
  -- Find all completed but unclaimed challenges for this user
  FOR v_challenge IN 
    SELECT uc.id as user_challenge_id, c.title, c.xp_reward, c.gem_reward
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = p_user_id
      AND uc.completed = true
      AND uc.claimed = false
      AND uc.expires_at > NOW()
  LOOP
    -- Claim each challenge using the existing claim function
    SELECT * INTO v_claim_result
    FROM claim_challenge_reward(v_challenge.user_challenge_id);
    
    -- Only return if claim was successful
    IF v_claim_result.success THEN
      RETURN QUERY SELECT 
        v_challenge.title,
        v_claim_result.xp_earned,
        v_claim_result.gems_earned;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION auto_claim_completed_challenges(UUID) TO authenticated;

-- Add comment
COMMENT ON FUNCTION auto_claim_completed_challenges(UUID) IS 
'Automatically claims all completed but unclaimed challenges for a user. 
Called after completing a todo to auto-claim any challenges that were just completed.
Prevents double-claiming by checking claimed = false.';
