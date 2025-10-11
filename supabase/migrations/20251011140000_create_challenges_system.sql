-- Create challenges system
-- Migration: 20251011140000_create_challenges_system.sql

-- Create enums for challenge types
CREATE TYPE challenge_type AS ENUM ('daily', 'weekly');
CREATE TYPE challenge_condition_type AS ENUM (
  'complete_count',           -- Erledige X Todos
  'complete_before_time',     -- Erledige X Todos vor Zeit Y
  'complete_difficulty',      -- Erledige X Todos mit Schwierigkeit Y
  'earn_xp'                   -- Sammle X XP
);

-- Create challenges table (templates)
CREATE TABLE IF NOT EXISTS challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type challenge_type NOT NULL,
  condition_type challenge_condition_type NOT NULL,
  target_value INTEGER NOT NULL,
  target_metadata JSONB DEFAULT '{}'::jsonb,
  xp_reward INTEGER NOT NULL,
  gem_reward INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_challenges table (active challenges per user)
CREATE TABLE IF NOT EXISTS user_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, challenge_id, expires_at)
);

-- Create challenge_completions table (history)
CREATE TABLE IF NOT EXISTS challenge_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  xp_earned INTEGER NOT NULL,
  gems_earned INTEGER NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_user_challenges_user_id ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_expires_at ON user_challenges(expires_at);
CREATE INDEX idx_user_challenges_completed ON user_challenges(completed);
CREATE INDEX idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX idx_challenges_type ON challenges(type);
CREATE INDEX idx_challenges_active ON challenges(is_active);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges (read-only for all authenticated users)
CREATE POLICY "Challenges are viewable by authenticated users"
  ON challenges FOR SELECT
  TO authenticated
  USING (is_active = true);

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges"
  ON user_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own challenges"
  ON user_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own challenges"
  ON user_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for challenge_completions
CREATE POLICY "Users can view their own completion history"
  ON challenge_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own completions"
  ON challenge_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Insert initial challenge templates based on UI examples
INSERT INTO challenges (title, description, type, condition_type, target_value, target_metadata, xp_reward, gem_reward, sort_order) VALUES
-- Daily Challenges
('Komm in die Gänge', 'Erledige dein erstes Todo', 'daily', 'complete_count', 1, '{}'::jsonb, 50, 2, 1),
('Früher Vogel', 'Erledige 3 Todos vor 12:00 Uhr', 'daily', 'complete_before_time', 3, '{"time": "12:00"}'::jsonb, 50, 2, 2),
('Schwere Aufgaben', 'Erledige 2 Hard-Difficulty Todos', 'daily', 'complete_difficulty', 2, '{"difficulty": "hard"}'::jsonb, 100, 5, 3),

-- Weekly Challenges
('Wochenkrieger', 'Erledige 25 Todos diese Woche', 'weekly', 'complete_count', 25, '{}'::jsonb, 300, 15, 1),
('Konsistenz-Meister', 'Erledige jeden Tag mindestens 3 Todos', 'weekly', 'complete_count', 21, '{"daily_minimum": 3}'::jsonb, 250, 12, 2),
('XP-Sammler', 'Sammle 500 XP diese Woche', 'weekly', 'earn_xp', 500, '{}'::jsonb, 200, 10, 3);

-- Function to initialize challenges for a user
CREATE OR REPLACE FUNCTION initialize_user_challenges(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Initialize daily challenges (expire at end of day)
  INSERT INTO user_challenges (user_id, challenge_id, expires_at)
  SELECT 
    p_user_id,
    id,
    (CURRENT_DATE + INTERVAL '1 day')::timestamp with time zone
  FROM challenges
  WHERE type = 'daily' AND is_active = true
  ON CONFLICT (user_id, challenge_id, expires_at) DO NOTHING;

  -- Initialize weekly challenges (expire at end of week - Sunday)
  INSERT INTO user_challenges (user_id, challenge_id, expires_at)
  SELECT 
    p_user_id,
    id,
    (DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '1 week')::timestamp with time zone
  FROM challenges
  WHERE type = 'weekly' AND is_active = true
  ON CONFLICT (user_id, challenge_id, expires_at) DO NOTHING;
END;
$$;

-- Function to update challenge progress
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
  v_xp_reward INTEGER;
  v_gem_reward INTEGER;
  v_already_completed BOOLEAN;
BEGIN
  -- Get challenge details
  SELECT c.target_value, c.xp_reward, c.gem_reward, uc.completed
  INTO v_target_value, v_xp_reward, v_gem_reward, v_already_completed
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

  -- Check if challenge is now completed
  IF v_new_progress >= v_target_value THEN
    -- Mark as completed
    UPDATE user_challenges
    SET completed = true, completed_at = NOW()
    WHERE user_id = p_user_id AND challenge_id = p_challenge_id AND expires_at > NOW();

    -- Award XP and gems to player_stats
    UPDATE player_stats
    SET xp = xp + v_xp_reward, gems = gems + v_gem_reward
    WHERE user_id = p_user_id;

    -- Record completion
    INSERT INTO challenge_completions (user_id, challenge_id, xp_earned, gems_earned)
    VALUES (p_user_id, p_challenge_id, v_xp_reward, v_gem_reward);

    RETURN QUERY SELECT true, v_xp_reward, v_gem_reward;
  ELSE
    RETURN QUERY SELECT false, 0, 0;
  END IF;
END;
$$;

-- Function to get user's active challenges with progress
CREATE OR REPLACE FUNCTION get_user_challenges(p_user_id UUID)
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

-- Function to clean up expired challenges
CREATE OR REPLACE FUNCTION cleanup_expired_challenges()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM user_challenges
  WHERE expires_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON challenges TO authenticated;
GRANT ALL ON user_challenges TO authenticated;
GRANT ALL ON challenge_completions TO authenticated;
GRANT EXECUTE ON FUNCTION initialize_user_challenges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_challenge_progress(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_challenges(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_challenges() TO authenticated;