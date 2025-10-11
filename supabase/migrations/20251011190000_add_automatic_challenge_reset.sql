-- Add automatic challenge reset system
-- Migration: 20251011190000_add_automatic_challenge_reset.sql

-- Function to reset expired challenges and create new ones
CREATE OR REPLACE FUNCTION reset_expired_challenges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
  v_today_midnight TIMESTAMP WITH TIME ZONE;
  v_next_week_start TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Calculate reset times
  v_today_midnight := DATE_TRUNC('day', v_now);
  v_next_week_start := DATE_TRUNC('week', v_now);
  
  -- Archive expired daily challenges (move to history, don't delete)
  UPDATE user_challenges
  SET expires_at = expires_at - INTERVAL '1000 years' -- Mark as archived
  WHERE user_id = p_user_id
    AND expires_at <= v_now
    AND expires_at > v_today_midnight - INTERVAL '1 day';
  
  -- Delete old archived challenges (older than 7 days)
  DELETE FROM user_challenges
  WHERE user_id = p_user_id
    AND expires_at < v_now - INTERVAL '7 days';
  
  -- Create new daily challenges if they don't exist for today
  INSERT INTO user_challenges (user_id, challenge_id, expires_at, progress, completed)
  SELECT 
    p_user_id,
    c.id,
    (DATE_TRUNC('day', v_now) + INTERVAL '1 day')::timestamp with time zone,
    0,
    false
  FROM challenges c
  WHERE c.type = 'daily' 
    AND c.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_challenges uc
      WHERE uc.user_id = p_user_id
        AND uc.challenge_id = c.id
        AND uc.expires_at > v_now
    );
  
  -- Create new weekly challenges if they don't exist for this week
  INSERT INTO user_challenges (user_id, challenge_id, expires_at, progress, completed)
  SELECT 
    p_user_id,
    c.id,
    (DATE_TRUNC('week', v_now) + INTERVAL '1 week')::timestamp with time zone,
    0,
    false
  FROM challenges c
  WHERE c.type = 'weekly' 
    AND c.is_active = true
    AND NOT EXISTS (
      SELECT 1 FROM user_challenges uc
      WHERE uc.user_id = p_user_id
        AND uc.challenge_id = c.id
        AND uc.expires_at > v_now
    );
END;
$$;

-- Update initialize_user_challenges to use consistent reset times
CREATE OR REPLACE FUNCTION initialize_user_challenges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- First, reset any expired challenges
  PERFORM reset_expired_challenges(p_user_id);
  
  -- Initialize daily challenges (expire at next midnight)
  INSERT INTO user_challenges (user_id, challenge_id, expires_at)
  SELECT 
    p_user_id,
    id,
    (DATE_TRUNC('day', v_now) + INTERVAL '1 day')::timestamp with time zone
  FROM challenges
  WHERE type = 'daily' AND is_active = true
  ON CONFLICT (user_id, challenge_id, expires_at) DO NOTHING;

  -- Initialize weekly challenges (expire at next Monday midnight)
  INSERT INTO user_challenges (user_id, challenge_id, expires_at)
  SELECT 
    p_user_id,
    id,
    (DATE_TRUNC('week', v_now) + INTERVAL '1 week')::timestamp with time zone
  FROM challenges
  WHERE type = 'weekly' AND is_active = true
  ON CONFLICT (user_id, challenge_id, expires_at) DO NOTHING;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION reset_expired_challenges(UUID) TO authenticated;