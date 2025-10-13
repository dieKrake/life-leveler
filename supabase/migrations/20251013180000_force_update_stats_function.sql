-- Migration: Force update get_player_stats_with_level_info function
-- Date: 2025-10-13 18:00:00
-- Description: Manually recreate the function to include prestige fields

-- Drop the existing function completely
DROP FUNCTION IF EXISTS get_player_stats_with_level_info();

-- Recreate with all required fields
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
    
    -- Get all player stats including prestige fields
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_player_stats_with_level_info() TO authenticated;
