-- Add claim system for challenges (like achievements)
-- Migration: 20251011220000_add_challenge_claim_system.sql

-- Add claimed column to user_challenges
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS claimed BOOLEAN DEFAULT false;
ALTER TABLE user_challenges ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Create index for claimed status
CREATE INDEX IF NOT EXISTS idx_user_challenges_claimed ON user_challenges(claimed);

-- Update challenge_completions to track when reward was claimed (not when challenge was completed)
ALTER TABLE challenge_completions ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Function to claim challenge reward
CREATE OR REPLACE FUNCTION claim_challenge_reward(p_user_challenge_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  xp_earned INTEGER,
  gems_earned INTEGER,
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
    RETURN QUERY SELECT false, 0, 0, 'Challenge nicht gefunden'::TEXT;
    RETURN;
  END IF;

  IF v_expires_at <= NOW() THEN
    RETURN QUERY SELECT false, 0, 0, 'Challenge ist abgelaufen'::TEXT;
    RETURN;
  END IF;

  IF NOT v_completed THEN
    RETURN QUERY SELECT false, 0, 0, 'Challenge noch nicht abgeschlossen'::TEXT;
    RETURN;
  END IF;

  IF v_claimed THEN
    RETURN QUERY SELECT false, 0, 0, 'Belohnung bereits eingefordert'::TEXT;
    RETURN;
  END IF;

  -- Mark as claimed
  UPDATE user_challenges
  SET claimed = true, claimed_at = NOW()
  WHERE id = p_user_challenge_id;

  -- Award XP and gems
  UPDATE player_stats
  SET xp = xp + v_xp_reward,
      gems = gems + v_gem_reward
  WHERE user_id = auth.uid();

  -- Record the claim in completions table
  INSERT INTO challenge_completions (user_id, challenge_id, xp_earned, gems_earned, claimed_at)
  VALUES (auth.uid(), v_challenge_id, v_xp_reward, v_gem_reward, NOW());

  RETURN QUERY SELECT true, v_xp_reward, v_gem_reward, 'Belohnung erfolgreich eingefordert'::TEXT;
END;
$$;

-- Update the update_challenge_progress function to NOT award rewards automatically
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

  -- Update progress
  UPDATE user_challenges
  SET progress = progress + p_increment
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

-- Drop and recreate get_user_challenges to include claimed status
DROP FUNCTION IF EXISTS get_user_challenges(UUID);

CREATE FUNCTION get_user_challenges(p_user_id UUID)
RETURNS TABLE(
  id UUID,
  challenge_id UUID,
  title TEXT,
  description TEXT,
  type challenge_type,
  progress INTEGER,
  target INTEGER,
  xp_reward INTEGER,
  gem_reward INTEGER,
  completed BOOLEAN,
  claimed BOOLEAN,
  expires_at TIMESTAMP WITH TIME ZONE,
  time_left TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uc.id,
    c.id as challenge_id,
    c.title,
    c.description,
    c.type,
    uc.progress,
    c.target_value as target,
    c.xp_reward,
    c.gem_reward,
    uc.completed,
    uc.claimed,
    uc.expires_at,
    CASE 
      WHEN EXTRACT(EPOCH FROM (uc.expires_at - NOW())) < 3600 THEN 
        EXTRACT(EPOCH FROM (uc.expires_at - NOW()))::INTEGER / 60 || 'm'
      WHEN EXTRACT(EPOCH FROM (uc.expires_at - NOW())) < 86400 THEN
        EXTRACT(EPOCH FROM (uc.expires_at - NOW()))::INTEGER / 3600 || 'h ' ||
        (EXTRACT(EPOCH FROM (uc.expires_at - NOW()))::INTEGER % 3600) / 60 || 'm'
      ELSE
        EXTRACT(EPOCH FROM (uc.expires_at - NOW()))::INTEGER / 86400 || 'd ' ||
        (EXTRACT(EPOCH FROM (uc.expires_at - NOW()))::INTEGER % 86400) / 3600 || 'h'
    END as time_left
  FROM user_challenges uc
  JOIN challenges c ON c.id = uc.challenge_id
  WHERE uc.user_id = p_user_id
    AND uc.expires_at > NOW()
  ORDER BY c.type, c.sort_order;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION claim_challenge_reward(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_challenge_progress(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_challenges(UUID) TO authenticated;