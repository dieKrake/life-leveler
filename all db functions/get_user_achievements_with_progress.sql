
DECLARE
    total_completed INTEGER;
    completed_today INTEGER;
    user_current_streak INTEGER;
    current_level INTEGER;
    current_xp INTEGER;
    current_gems INTEGER;
BEGIN
    -- Get current player stats
    SELECT ps.level, ps.xp, ps.gems, ps.current_streak 
    INTO current_level, current_xp, current_gems, user_current_streak
    FROM player_stats ps
    WHERE ps.user_id = user_id_param;
    
    -- If no player stats exist, set defaults
    IF NOT FOUND THEN
        current_level := 1;
        current_xp := 0;
        current_gems := 0;
        user_current_streak := 0;
    END IF;

    -- FIXED: Count by is_completed=true instead of completed_at IS NOT NULL
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND is_completed = true;
    
    SELECT COUNT(*) INTO completed_today
    FROM todos 
    WHERE user_id = user_id_param 
    AND is_completed = true
    AND DATE(created_at) = CURRENT_DATE;
    
    -- Return achievements with progress
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.condition_type,
        a.condition_value,
        a.reward_gems,
        -- Only show as unlocked if actually in user_achievements table
        (ua.achievement_id IS NOT NULL) as is_unlocked,
        ua.unlocked_at,
        CASE 
            WHEN a.condition_type = 'complete_count' THEN total_completed
            WHEN a.condition_type = 'streak_days' THEN user_current_streak
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN current_level
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN current_xp
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN current_gems
            ELSE 0
        END as current_progress,
        CASE 
            WHEN a.condition_type = 'complete_count' THEN 
                LEAST(100.0, (total_completed::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'streak_days' THEN 
                LEAST(100.0, (user_current_streak::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN 
                LEAST(100.0, (current_level::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN 
                LEAST(100.0, (current_xp::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN 
                LEAST(100.0, (current_gems::NUMERIC / a.condition_value::NUMERIC) * 100)
            ELSE 0.0
        END as progress_percentage
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = user_id_param
    WHERE a.is_active = true
    ORDER BY a.sort_order, a.id;
END;
