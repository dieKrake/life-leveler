-- Migration: Fix challenge claim to trigger level-up
-- Date: 2025-10-21
-- Description: Update claim_challenge_reward to use update_player_xp_and_gems for proper level calculation

-- Drop the old function first (needed to change return type)
DROP FUNCTION IF EXISTS claim_challenge_reward(UUID);

-- Create the new function with updated return type
CREATE FUNCTION claim_challenge_reward(p_user_challenge_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  xp_earned INTEGER,
  gems_earned INTEGER,
  level_up BOOLEAN,
  new_level INTEGER,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_challenge_id UUID;
  v_completed BOOLEAN;
  v_claimed BOOLEAN;
  v_xp_reward INTEGER;
  v_gem_reward INTEGER;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_level_result RECORD;
BEGIN
  -- Get challenge details
  SELECT uc.user_id, uc.challenge_id, uc.completed, uc.claimed, uc.expires_at,
         c.xp_reward, c.gem_reward
  INTO v_user_id, v_challenge_id, v_completed, v_claimed, v_expires_at,
       v_xp_reward, v_gem_reward
  FROM user_challenges uc
  JOIN challenges c ON c.id = uc.challenge_id
  WHERE uc.id = p_user_challenge_id
    AND uc.user_id = auth.uid();

  -- Validation checks
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 0, false, 0, 'Challenge nicht gefunden'::TEXT;
    RETURN;
  END IF;

  IF v_expires_at <= NOW() THEN
    RETURN QUERY SELECT false, 0, 0, false, 0, 'Challenge ist abgelaufen'::TEXT;
    RETURN;
  END IF;

  IF NOT v_completed THEN
    RETURN QUERY SELECT false, 0, 0, false, 0, 'Challenge noch nicht abgeschlossen'::TEXT;
    RETURN;
  END IF;

  IF v_claimed THEN
    RETURN QUERY SELECT false, 0, 0, false, 0, 'Belohnung bereits eingefordert'::TEXT;
    RETURN;
  END IF;

  -- Mark as claimed
  UPDATE user_challenges
  SET claimed = true, claimed_at = NOW()
  WHERE id = p_user_challenge_id;

  -- Use update_player_xp_and_gems for proper level calculation
  -- This ensures total_xp is updated and level-up is triggered
  SELECT * INTO v_level_result
  FROM update_player_xp_and_gems(v_xp_reward, v_gem_reward);

  -- Record the claim in completions table
  INSERT INTO challenge_completions (user_id, challenge_id, xp_earned, gems_earned, claimed_at)
  VALUES (auth.uid(), v_challenge_id, v_xp_reward, v_gem_reward, NOW());

  -- Return success with level-up info
  RETURN QUERY SELECT 
    true, 
    v_xp_reward, 
    v_gem_reward, 
    v_level_result.level_up,
    v_level_result.new_level,
    'Belohnung erfolgreich eingefordert'::TEXT;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION claim_challenge_reward(UUID) TO authenticated;