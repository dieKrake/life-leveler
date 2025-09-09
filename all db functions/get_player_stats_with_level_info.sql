
DECLARE
    current_user_id UUID;
    user_xp INTEGER;
    user_level INTEGER;
    current_level_xp INTEGER;
    next_level_xp INTEGER;
    user_streak INTEGER;
    user_highest_streak INTEGER;
    user_multiplier DECIMAL(3,1);
    user_gems INTEGER;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    IF current_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Get user stats from player_stats table
    SELECT 
        COALESCE(ps.xp, 0),
        COALESCE(ps.level, 1),
        COALESCE(ps.current_streak, 0),
        COALESCE(ps.highest_streak, 0),
        COALESCE(ps.gems, 0)
    INTO user_xp, user_level, user_streak, user_highest_streak, user_gems
    FROM player_stats ps
    WHERE ps.user_id = current_user_id;
    
    -- If no player stats exist, create default values
    IF NOT FOUND THEN
        user_xp := 0;
        user_level := 1;
        user_streak := 0;
        user_highest_streak := 0;
        user_gems := 0;
    END IF;
    
    -- Get XP requirements for current level
    SELECT l.xp_required
    INTO current_level_xp
    FROM levels l
    WHERE l.level = user_level;
    
    -- Get XP requirements for next level
    SELECT l.xp_required
    INTO next_level_xp
    FROM levels l
    WHERE l.level = user_level + 1;
    
    -- Get streak multiplier from table
    SELECT sm.multiplier
    INTO user_multiplier
    FROM streak_multipliers sm
    WHERE sm.min_streak_days <= user_streak
    ORDER BY sm.min_streak_days DESC
    LIMIT 1;
    
    -- Default multiplier if no match found
    IF user_multiplier IS NULL THEN
        user_multiplier := 1.0;
    END IF;
    
    -- Return the results
    RETURN QUERY SELECT 
        user_xp,
        user_level,
        COALESCE(current_level_xp, 0),
        next_level_xp,
        user_streak,
        user_highest_streak,
        user_multiplier,
        user_gems;
END;
