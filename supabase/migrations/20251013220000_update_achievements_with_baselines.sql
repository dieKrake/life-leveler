-- Migration: Update achievement progress to use baselines
-- Date: 2025-10-13 22:00:00
-- Description: Calculate achievement progress relative to prestige baselines

DROP FUNCTION IF EXISTS get_user_achievements_with_progress(UUID);

CREATE OR REPLACE FUNCTION get_user_achievements_with_progress(user_id_param UUID)
RETURNS TABLE (
    achievement_id INT,
    name VARCHAR,
    description TEXT,
    icon VARCHAR,
    condition_type VARCHAR,
    condition_value INT,
    reward_gems INT,
    is_unlocked BOOLEAN,
    unlocked_at TIMESTAMP,
    current_progress INT,
    progress_percentage NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_completed INTEGER;
    user_current_streak INTEGER;
    current_level INTEGER;
    current_xp INTEGER;
    current_gems INTEGER;
    -- Baseline values
    baseline_gems INTEGER;
    baseline_tasks INTEGER;
    baseline_xp INTEGER;
    -- Progress since last prestige
    gems_since_prestige INTEGER;
    tasks_since_prestige INTEGER;
    xp_since_prestige INTEGER;
BEGIN
    -- Get current player stats including baselines
    SELECT 
        ps.level, 
        ps.xp, 
        ps.gems, 
        ps.current_streak,
        COALESCE(ps.gems_at_last_prestige, 0),
        COALESCE(ps.tasks_at_last_prestige, 0),
        COALESCE(ps.xp_at_last_prestige, 0)
    INTO 
        current_level, 
        current_xp, 
        current_gems, 
        user_current_streak,
        baseline_gems,
        baseline_tasks,
        baseline_xp
    FROM player_stats ps
    WHERE ps.user_id = user_id_param;
    
    -- If no player stats exist, set defaults
    IF NOT FOUND THEN
        current_level := 1;
        current_xp := 0;
        current_gems := 0;
        user_current_streak := 0;
        baseline_gems := 0;
        baseline_tasks := 0;
        baseline_xp := 0;
    END IF;

    -- Count total completed tasks
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND is_completed = true;
    
    -- Calculate progress since last prestige
    gems_since_prestige := current_gems - baseline_gems;
    tasks_since_prestige := total_completed - baseline_tasks;
    xp_since_prestige := current_xp - baseline_xp;
    
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
            -- Tasks: Use progress since prestige
            WHEN a.condition_type = 'complete_count' THEN tasks_since_prestige
            -- Streak: Keep global (never reset)
            WHEN a.condition_type = 'streak_days' THEN user_current_streak
            -- Level: Use current level (resets on prestige)
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN current_level
            -- XP: Use progress since prestige
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN xp_since_prestige
            -- Gems: Use progress since prestige
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN gems_since_prestige
            ELSE 0
        END as current_progress,
        CASE 
            WHEN a.condition_type = 'complete_count' THEN 
                LEAST(100.0, (tasks_since_prestige::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'streak_days' THEN 
                LEAST(100.0, (user_current_streak::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN 
                LEAST(100.0, (current_level::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN 
                LEAST(100.0, (xp_since_prestige::NUMERIC / a.condition_value::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN 
                LEAST(100.0, (gems_since_prestige::NUMERIC / a.condition_value::NUMERIC) * 100)
            ELSE 0.0
        END as progress_percentage
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = user_id_param
    WHERE a.is_active = true
    ORDER BY a.sort_order, a.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_achievements_with_progress(UUID) TO authenticated;