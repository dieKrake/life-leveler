-- Migration: Fix prestige uncomplete bug
-- Date: 2025-10-13 15:00:00
-- Description: Fix the record assignment bug in update_player_xp_and_gems function

-- Drop and recreate the function with proper variable handling
DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_player_xp_and_gems(INTEGER);

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
  v_level_xp_required INTEGER;
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
      SELECT xp_required INTO v_level_xp_required
      FROM levels
      WHERE level = v_new_level + 1;

      IF FOUND AND v_new_xp >= v_level_xp_required THEN
        v_new_level := v_new_level + 1;
        v_level_up := true;
      ELSE
        EXIT;
      END IF;
    END LOOP;

    -- If at level 10, cap XP at level 10 requirement to prevent overflow
    IF v_new_level = 10 THEN
      SELECT xp_required INTO v_level_xp_required
      FROM levels
      WHERE level = 10;
      
      v_new_xp := LEAST(v_new_xp, v_level_xp_required);
      v_can_prestige := true;
    END IF;
  ELSE
    -- If removing XP (negative value), check for level downs
    WHILE v_new_level > 1 LOOP
      SELECT xp_required INTO v_level_xp_required
      FROM levels
      WHERE level = v_new_level;

      IF FOUND AND v_new_xp < v_level_xp_required THEN
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
