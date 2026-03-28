-- Migration: Create Achievement History (Museum) System
-- Date: 2026-03-28 12:00:00
-- Description: Tracks all achievements earned across all prestiges for the Achievement Museum

-- 1. Create achievement_history table
CREATE TABLE IF NOT EXISTS achievement_history (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id INTEGER NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  prestige_level INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, achievement_id, prestige_level)
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_achievement_history_user_id ON achievement_history(user_id);
CREATE INDEX IF NOT EXISTS idx_achievement_history_user_prestige ON achievement_history(user_id, prestige_level);

-- 3. Enable RLS
ALTER TABLE achievement_history ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own achievement history"
  ON achievement_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievement history"
  ON achievement_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Create trigger function to automatically save achievements to history
CREATE OR REPLACE FUNCTION save_achievement_to_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prestige INTEGER;
BEGIN
  -- Get current prestige level from player_stats
  SELECT COALESCE(prestige, 0) INTO v_prestige
  FROM player_stats
  WHERE user_id = NEW.user_id;
  
  -- If no player_stats found, default to prestige 0
  IF v_prestige IS NULL THEN
    v_prestige := 0;
  END IF;
  
  -- Insert into achievement_history
  INSERT INTO achievement_history (user_id, achievement_id, prestige_level, unlocked_at)
  VALUES (NEW.user_id, NEW.achievement_id, v_prestige, COALESCE(NEW.unlocked_at, NOW()))
  ON CONFLICT (user_id, achievement_id, prestige_level) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 6. Create trigger on user_achievements table
DROP TRIGGER IF EXISTS trigger_save_achievement_to_history ON user_achievements;
CREATE TRIGGER trigger_save_achievement_to_history
  AFTER INSERT ON user_achievements
  FOR EACH ROW
  EXECUTE FUNCTION save_achievement_to_history();

-- 7. Create function to get achievement history for museum
CREATE OR REPLACE FUNCTION get_achievement_history(p_user_id UUID)
RETURNS TABLE (
  id INTEGER,
  achievement_id INTEGER,
  achievement_name VARCHAR,
  achievement_description TEXT,
  achievement_icon VARCHAR,
  achievement_category VARCHAR,
  prestige_level INTEGER,
  unlocked_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ah.id,
    ah.achievement_id,
    a.name as achievement_name,
    a.description as achievement_description,
    a.icon as achievement_icon,
    a.category as achievement_category,
    ah.prestige_level,
    ah.unlocked_at
  FROM achievement_history ah
  JOIN achievements a ON a.id = ah.achievement_id
  WHERE ah.user_id = p_user_id
  ORDER BY ah.unlocked_at ASC;
END;
$$;

-- 8. Grant permissions
GRANT SELECT, INSERT ON achievement_history TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE achievement_history_id_seq TO authenticated;
GRANT EXECUTE ON FUNCTION get_achievement_history(UUID) TO authenticated;

-- 9. Backfill existing achievements into history (for current prestige)
-- This ensures existing unlocked achievements are captured
INSERT INTO achievement_history (user_id, achievement_id, prestige_level, unlocked_at)
SELECT 
  ua.user_id,
  ua.achievement_id,
  COALESCE(ps.prestige, 0),
  ua.unlocked_at
FROM user_achievements ua
LEFT JOIN player_stats ps ON ps.user_id = ua.user_id
ON CONFLICT (user_id, achievement_id, prestige_level) DO NOTHING;
