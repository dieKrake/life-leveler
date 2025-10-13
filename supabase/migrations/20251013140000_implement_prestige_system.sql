-- Migration: Implement Prestige System
-- Date: 2025-10-13 14:00:00
-- Description: Add prestige system with level cap at 10, achievement reset, and prestige rewards

-- 1. Add prestige columns to player_stats
ALTER TABLE player_stats 
ADD COLUMN IF NOT EXISTS prestige INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_level_reached INTEGER DEFAULT 1;

-- 2. Update levels table to only contain levels 1-10
-- First, let's see what we have and clean up
DELETE FROM levels WHERE level > 10;

-- Ensure we have levels 1-10 with appropriate XP requirements
-- Recalculate XP requirements for a 10-level system
INSERT INTO levels (level, xp_required) VALUES
(1, 0),
(2, 100),
(3, 250),
(4, 500),
(5, 800),
(6, 1300),
(7, 2000),
(8, 3200),
(9, 5000),
(10, 7500)
ON CONFLICT (level) DO UPDATE SET
xp_required = EXCLUDED.xp_required;

-- 3. Create prestige function
CREATE OR REPLACE FUNCTION prestige_player(p_user_id UUID)
RETURNS TABLE(
  new_prestige INTEGER,
  gems_earned INTEGER,
  achievements_reset INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_level INTEGER;
  v_current_prestige INTEGER;
  v_gems_reward INTEGER := 50; -- Gems reward for prestiging
  v_achievements_count INTEGER;
BEGIN
  -- Check if user is at level 10
  SELECT level, prestige INTO v_current_level, v_current_prestige
  FROM player_stats
  WHERE user_id = p_user_id;
  
  IF v_current_level != 10 THEN
    RAISE EXCEPTION 'Player must be at level 10 to prestige';
  END IF;
  
  -- Count current achievements for reset tracking
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  -- Reset player to level 1, XP 0, increment prestige
  UPDATE player_stats
  SET 
    level = 1,
    xp = 0,
    prestige = prestige + 1,
    max_level_reached = GREATEST(max_level_reached, 10),
    gems = gems + v_gems_reward
  WHERE user_id = p_user_id;
  
  -- Reset all achievements
  DELETE FROM user_achievements WHERE user_id = p_user_id;
  
  -- Return results
  SELECT 
    v_current_prestige + 1,
    v_gems_reward,
    v_achievements_count;
    
  RETURN QUERY SELECT 
    v_current_prestige + 1,
    v_gems_reward,
    v_achievements_count;
END;
$$;

-- 4. Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER);

-- 5. Update the level-up logic to cap at level 10
CREATE OR REPLACE FUNCTION update_player_xp_and_gems(
  p_xp_to_add INTEGER,
  p_gems_to_add INTEGER DEFAULT 0
)
RETURNS TABLE(
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  level_up BOOLEAN,
  can_prestige BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_current_level INTEGER;
  v_current_xp INTEGER;
  v_current_gems INTEGER;
  v_new_xp INTEGER;
  v_new_level INTEGER;
  v_level_up BOOLEAN := false;
  v_can_prestige BOOLEAN := false;
  v_level_record RECORD;
BEGIN
  -- Get current player stats
  SELECT level, xp, gems INTO v_current_level, v_current_xp, v_current_gems
  FROM player_stats
  WHERE user_id = v_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Player stats not found';
  END IF;

  -- Calculate new XP
  v_new_xp := v_current_xp + p_xp_to_add;
  v_new_level := v_current_level;

  -- Prevent XP from going below 0
  v_new_xp := GREATEST(v_new_xp, 0);

  -- If adding XP (positive value), check for level ups and cap at level 10
  IF p_xp_to_add > 0 THEN
    -- Check for level ups, but cap at level 10
    WHILE v_new_level < 10 LOOP
      SELECT level, xp_required INTO v_level_record
      FROM levels
      WHERE level = v_new_level + 1;

      IF FOUND AND v_new_xp >= v_level_record.xp_required THEN
        v_new_level := v_new_level + 1;
        v_level_up := true;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- If at level 10, cap XP at level 10 requirement to prevent overflow
    IF v_new_level = 10 THEN
      SELECT xp_required INTO v_level_record.xp_required
      FROM levels
      WHERE level = 10;
      
      v_new_xp := LEAST(v_new_xp, v_level_record.xp_required);
      v_can_prestige := true;
    END IF;
  ELSE
    -- If removing XP (negative value), check for level downs
    WHILE v_new_level > 1 LOOP
      SELECT xp_required INTO v_level_record.xp_required
      FROM levels
      WHERE level = v_new_level;

      IF v_new_xp < v_level_record.xp_required THEN
        v_new_level := v_new_level - 1;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- Check if still at level 10 after XP removal
    IF v_new_level = 10 THEN
      v_can_prestige := true;
    END IF;
  END IF;

  -- Update player stats
  UPDATE player_stats
  SET 
    level = v_new_level,
    xp = v_new_xp,
    gems = gems + p_gems_to_add
  WHERE user_id = v_user_id;

  -- Return results
  RETURN QUERY SELECT 
    v_new_level,
    p_xp_to_add,
    p_gems_to_add,
    v_level_up,
    v_can_prestige;
END;
$$;

-- 6. Update get_player_stats_with_level_info to include prestige fields
CREATE OR REPLACE FUNCTION get_player_stats_with_level_info()
RETURNS TABLE (
    xp INTEGER,
    level INTEGER,
    xp_for_current_level INTEGER,
    xp_for_next_level INTEGER,
    current_streak INTEGER,
    highest_streak INTEGER,
    streak_multiplier DECIMAL,
    gems INTEGER,
    prestige INTEGER,
    max_level_reached INTEGER,
    can_prestige BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    user_xp INTEGER;
    user_level INTEGER;
    user_prestige INTEGER;
    user_max_level INTEGER;
    current_level_xp INTEGER;
    next_level_xp INTEGER;
    user_streak INTEGER;
    user_highest_streak INTEGER;
    user_multiplier DECIMAL(3,1);
    user_gems INTEGER;
    can_prestige_flag BOOLEAN := false;
BEGIN
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    SELECT 
        COALESCE(ps.xp, 0),
        COALESCE(ps.level, 1),
        COALESCE(ps.current_streak, 0),
        COALESCE(ps.highest_streak, 0),
        COALESCE(ps.gems, 0),
        COALESCE(ps.prestige, 0),
        COALESCE(ps.max_level_reached, 1)
    INTO user_xp, user_level, user_streak, user_highest_streak, user_gems, user_prestige, user_max_level
    FROM player_stats ps
    WHERE ps.user_id = current_user_id;
    
    IF NOT FOUND THEN
        user_xp := 0;
        user_level := 1;
        user_streak := 0;
        user_highest_streak := 0;
        user_gems := 0;
        user_prestige := 0;
        user_max_level := 1;
    END IF;
    
    -- Get current level XP requirement
    SELECT xp_required INTO current_level_xp
    FROM levels
    WHERE level = user_level;
    
    -- Get next level XP requirement (null if at max level 10)
    IF user_level < 10 THEN
        SELECT xp_required INTO next_level_xp
        FROM levels
        WHERE level = user_level + 1;
    ELSE
        next_level_xp := NULL;
        can_prestige_flag := true;
    END IF;
    
    -- Get streak multiplier
    user_multiplier := get_streak_multiplier(user_streak);
    
    RETURN QUERY SELECT 
        user_xp,
        user_level,
        COALESCE(current_level_xp, 0),
        next_level_xp,
        user_streak,
        user_highest_streak,
        user_multiplier,
        user_gems,
        user_prestige,
        user_max_level,
        can_prestige_flag;
END;
$$;

-- 7. Grant permissions
GRANT EXECUTE ON FUNCTION prestige_player(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_player_stats_with_level_info() TO authenticated;
