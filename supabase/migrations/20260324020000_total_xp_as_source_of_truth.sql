-- Migration: Total XP as single source of truth for level calculation
-- Date: 2026-03-24 02:00:00
-- Description: 
--   Introduces prestige_base_xp column so that level is always derived from:
--     effective_xp = total_xp - prestige_base_xp
--   This cleanly solves the prestige exploit without any hacks.
--   - total_xp: Lifetime XP counter (never decreases below 0, never reset)
--   - prestige_base_xp: total_xp snapshot at time of last prestige (0 if never prestiged)
--   - effective_xp: XP in current prestige cycle = total_xp - prestige_base_xp
--   - level: derived from effective_xp against the levels table
--   - xp: progress within current level = effective_xp - xp_required[level]

-- 1. Add prestige_base_xp column
ALTER TABLE player_stats
ADD COLUMN IF NOT EXISTS prestige_base_xp INTEGER DEFAULT 0;

-- 2. Set prestige_base_xp for existing players based on current state
-- Formula: prestige_base_xp = total_xp - effective_xp
-- Where effective_xp = xp + levels[level].xp_required
-- (for level 1, xp_required = 0, so effective_xp = xp)
UPDATE player_stats ps
SET prestige_base_xp = GREATEST(0, 
  COALESCE(ps.total_xp, 0) - (
    ps.xp + COALESCE((SELECT l.xp_required FROM levels l WHERE l.level = ps.level), 0)
  )
);

-- 3. Recreate update_player_xp_and_gems with effective_xp logic
DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER, INTEGER);

CREATE OR REPLACE FUNCTION update_player_xp_and_gems(
  p_xp_change INTEGER,
  p_gems_change INTEGER DEFAULT 0
)
RETURNS TABLE(
  new_level INTEGER,
  new_xp INTEGER,
  new_total_xp INTEGER,
  new_gems INTEGER,
  level_up BOOLEAN,
  prestige INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_current_level INTEGER;
  v_current_xp INTEGER;
  v_current_total_xp INTEGER;
  v_current_gems INTEGER;
  v_current_prestige INTEGER;
  v_prestige_base_xp INTEGER;
  v_new_total_xp INTEGER;
  v_effective_xp INTEGER;
  v_new_level INTEGER;
  v_new_xp INTEGER;
  v_level_up BOOLEAN := FALSE;
  v_max_level INTEGER := 10;
  level_rec RECORD;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current stats with proper defaults
  SELECT 
    COALESCE(ps.level, 1), 
    COALESCE(ps.xp, 0), 
    COALESCE(ps.total_xp, ps.xp, 0), 
    COALESCE(ps.gems, 0), 
    COALESCE(ps.prestige, 0),
    COALESCE(ps.prestige_base_xp, 0)
  INTO v_current_level, v_current_xp, v_current_total_xp, v_current_gems, v_current_prestige, v_prestige_base_xp
  FROM player_stats ps
  WHERE ps.user_id = v_user_id;
  
  -- Initialize player stats if not found
  IF NOT FOUND THEN
    INSERT INTO player_stats (user_id, level, xp, total_xp, gems, prestige, prestige_base_xp, current_streak, highest_streak)
    VALUES (v_user_id, 1, 0, 0, 0, 0, 0, 0, 0);
    
    v_current_level := 1;
    v_current_xp := 0;
    v_current_total_xp := 0;
    v_current_gems := 0;
    v_current_prestige := 0;
    v_prestige_base_xp := 0;
  END IF;
  
  -- Calculate new total XP (lifetime, never goes below prestige_base_xp)
  v_new_total_xp := v_current_total_xp + p_xp_change;
  
  -- total_xp cannot go below prestige_base_xp (prevents negative effective XP)
  v_new_total_xp := GREATEST(v_new_total_xp, v_prestige_base_xp);
  
  -- Calculate effective XP for this prestige cycle
  v_effective_xp := v_new_total_xp - v_prestige_base_xp;
  
  -- Derive level from effective_xp using cumulative XP requirements
  v_new_level := 1;
  FOR level_rec IN 
    SELECT level, xp_required 
    FROM levels 
    WHERE level > 1 AND level <= v_max_level
    ORDER BY level ASC
  LOOP
    IF v_effective_xp >= level_rec.xp_required THEN
      v_new_level := level_rec.level;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  -- Calculate XP progress within current level
  IF v_new_level = 1 THEN
    v_new_xp := v_effective_xp;
  ELSE
    DECLARE
      current_level_requirement INTEGER;
    BEGIN
      SELECT COALESCE(xp_required, 0) INTO current_level_requirement
      FROM levels
      WHERE level = v_new_level;
      
      v_new_xp := v_effective_xp - current_level_requirement;
    END;
  END IF;
  
  -- Ensure XP is never negative
  v_new_xp := GREATEST(v_new_xp, 0);
  
  -- Check if we leveled up
  v_level_up := v_new_level > v_current_level;
  
  -- Update player stats
  UPDATE player_stats ps
  SET 
    level = v_new_level,
    xp = v_new_xp,
    total_xp = v_new_total_xp,
    gems = GREATEST(0, v_current_gems + p_gems_change),
    max_level_reached = GREATEST(ps.max_level_reached, v_new_level),
    updated_at = NOW()
  WHERE ps.user_id = v_user_id;
  
  -- Debug logging
  RAISE NOTICE 'XP Update: Total % -> % (base: %, effective: %), Level: % -> %, XP in level: %', 
    v_current_total_xp, v_new_total_xp, v_prestige_base_xp, v_effective_xp, 
    v_current_level, v_new_level, v_new_xp;
  
  -- Return the results
  RETURN QUERY SELECT 
    v_new_level,
    v_new_xp,
    v_new_total_xp,
    GREATEST(0, v_current_gems + p_gems_change),
    v_level_up,
    v_current_prestige;
END;
$$;

-- 4. Recreate prestige_player to set prestige_base_xp = total_xp
DROP FUNCTION IF EXISTS prestige_player(UUID);

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
  v_current_total_xp INTEGER;
  v_gems_reward INTEGER := 50;
  v_achievements_count INTEGER;
  v_current_gems INTEGER;
  v_total_tasks INTEGER;
BEGIN
  -- Check if user is at level 10
  SELECT level, prestige, gems, COALESCE(total_xp, 0)
  INTO v_current_level, v_current_prestige, v_current_gems, v_current_total_xp
  FROM player_stats
  WHERE user_id = p_user_id;
  
  IF v_current_level != 10 THEN
    RAISE EXCEPTION 'Player must be at level 10 to prestige';
  END IF;
  
  -- Count current achievements for reset tracking
  SELECT COUNT(*) INTO v_achievements_count
  FROM user_achievements
  WHERE user_id = p_user_id;
  
  -- Count total completed tasks
  SELECT COUNT(*) INTO v_total_tasks
  FROM todos
  WHERE user_id = p_user_id AND is_completed = true;
  
  -- Reset player: set prestige_base_xp = total_xp (this makes effective_xp = 0 -> Level 1)
  UPDATE player_stats
  SET 
    level = 1,
    xp = 0,
    -- total_xp stays unchanged (lifetime counter)
    prestige_base_xp = v_current_total_xp,  -- KEY: snapshot total_xp as new baseline
    prestige = prestige + 1,
    max_level_reached = GREATEST(max_level_reached, 10),
    gems = gems + v_gems_reward,
    -- Update baselines for achievements
    gems_at_last_prestige = v_current_gems + v_gems_reward,
    tasks_at_last_prestige = v_total_tasks,
    total_tasks_completed = v_total_tasks,
    xp_at_last_prestige = 0
  WHERE user_id = p_user_id;
  
  -- Reset all achievements
  DELETE FROM user_achievements WHERE user_id = p_user_id;
  
  -- Return results
  RETURN QUERY SELECT 
    v_current_prestige + 1,
    v_gems_reward,
    v_achievements_count;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION prestige_player(UUID) TO authenticated;
