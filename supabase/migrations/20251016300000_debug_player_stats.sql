-- Migration: Debug and fix player stats
-- Date: 2025-10-16 30:00:00
-- Description: Add debug function and fix any corrupted player stats

-- Create debug function to check player stats
CREATE OR REPLACE FUNCTION debug_player_stats()
RETURNS TABLE(
  user_id UUID,
  level INTEGER,
  xp INTEGER,
  total_xp INTEGER,
  gems INTEGER,
  prestige INTEGER,
  calculated_level INTEGER,
  should_be_xp INTEGER
) AS $$
DECLARE
  v_user_id UUID;
  v_calculated_level INTEGER;
  v_remaining_xp INTEGER;
  v_should_be_xp INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  -- Get current stats
  SELECT ps.level, ps.xp, ps.total_xp, ps.gems, ps.prestige
  FROM player_stats ps
  WHERE ps.user_id = v_user_id
  INTO level, xp, total_xp, gems, prestige;
  
  -- Calculate what level should be based on total_xp
  v_calculated_level := 1;
  v_remaining_xp := total_xp;
  v_should_be_xp := total_xp;
  
  -- Calculate correct level from total XP
  FOR i IN 2..10 LOOP
    DECLARE
      level_requirement INTEGER;
    BEGIN
      SELECT l.xp_required INTO level_requirement
      FROM levels l
      WHERE l.level = i;
      
      IF v_remaining_xp >= level_requirement THEN
        v_remaining_xp := v_remaining_xp - level_requirement;
        v_calculated_level := i;
      ELSE
        EXIT;
      END IF;
    END;
  END LOOP;
  
  v_should_be_xp := v_remaining_xp;
  
  RETURN QUERY SELECT 
    v_user_id,
    level,
    xp,
    total_xp,
    gems,
    prestige,
    v_calculated_level,
    v_should_be_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to fix corrupted player stats
CREATE OR REPLACE FUNCTION fix_player_stats()
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_total_xp INTEGER;
  v_calculated_level INTEGER := 1;
  v_remaining_xp INTEGER;
  v_current_gems INTEGER;
  v_current_prestige INTEGER;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Get current total_xp, gems, and prestige (these should be correct)
  SELECT COALESCE(ps.total_xp, 0), COALESCE(ps.gems, 0), COALESCE(ps.prestige, 0)
  INTO v_total_xp, v_current_gems, v_current_prestige
  FROM player_stats ps
  WHERE ps.user_id = v_user_id;
  
  -- Calculate correct level and XP from total_xp
  v_remaining_xp := v_total_xp;
  
  -- Go through each level and subtract requirements
  FOR i IN 2..10 LOOP
    DECLARE
      level_requirement INTEGER;
    BEGIN
      SELECT COALESCE(l.xp_required, 999999) INTO level_requirement
      FROM levels l
      WHERE l.level = i;
      
      IF v_remaining_xp >= level_requirement THEN
        v_remaining_xp := v_remaining_xp - level_requirement;
        v_calculated_level := i;
      ELSE
        EXIT;
      END IF;
    END;
  END LOOP;
  
  -- Update player stats with correct values
  UPDATE player_stats
  SET 
    level = v_calculated_level,
    xp = v_remaining_xp,
    gems = GREATEST(0, v_current_gems), -- Ensure no negative gems
    updated_at = NOW()
  WHERE user_id = v_user_id;
  
  RAISE NOTICE 'Fixed player stats: Level % with % XP (total: %)', 
    v_calculated_level, v_remaining_xp, v_total_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION debug_player_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION fix_player_stats() TO authenticated;
