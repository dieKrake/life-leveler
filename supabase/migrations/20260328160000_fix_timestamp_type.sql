-- Migration: Fix TIMESTAMP type to TIMESTAMPTZ
-- Date: 2026-03-28 16:00:00
-- Description: Fix "structure of query does not match function result type" error

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
    unlocked_at TIMESTAMPTZ,
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
    user_total_xp INTEGER;
    current_gems INTEGER;
    user_prestige_base_xp INTEGER;
    baseline_gems INTEGER;
    baseline_tasks INTEGER;
    gems_since_prestige INTEGER;
    tasks_since_prestige INTEGER;
    effective_xp INTEGER;
BEGIN
    SELECT 
        COALESCE(ps.level, 1), 
        COALESCE(ps.total_xp, ps.xp, 0),
        COALESCE(ps.gems, 0), 
        COALESCE(ps.current_streak, 0),
        COALESCE(ps.prestige_base_xp, 0),
        COALESCE(ps.gems_at_last_prestige, 0),
        COALESCE(ps.tasks_at_last_prestige, 0)
    INTO 
        current_level, 
        user_total_xp, 
        current_gems, 
        user_current_streak,
        user_prestige_base_xp,
        baseline_gems,
        baseline_tasks
    FROM player_stats ps
    WHERE ps.user_id = user_id_param;
    
    IF NOT FOUND THEN
        current_level := 1;
        user_total_xp := 0;
        current_gems := 0;
        user_current_streak := 0;
        user_prestige_base_xp := 0;
        baseline_gems := 0;
        baseline_tasks := 0;
    END IF;

    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND is_completed = true;
    
    gems_since_prestige := current_gems - baseline_gems;
    tasks_since_prestige := total_completed - baseline_tasks;
    effective_xp := user_total_xp - user_prestige_base_xp;
    
    RETURN QUERY
    SELECT 
        a.id,
        a.name,
        a.description,
        a.icon,
        a.condition_type,
        a.condition_value,
        a.reward_gems,
        (ua.achievement_id IS NOT NULL) as is_unlocked,
        ua.unlocked_at,
        CASE 
            WHEN a.condition_type = 'complete_count' THEN tasks_since_prestige
            WHEN a.condition_type = 'streak_days' THEN user_current_streak
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN current_level
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN effective_xp
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN gems_since_prestige
            ELSE 0
        END as current_progress,
        CASE 
            WHEN a.condition_type = 'complete_count' THEN 
                LEAST(100.0, (tasks_since_prestige::NUMERIC / NULLIF(a.condition_value, 0)::NUMERIC) * 100)
            WHEN a.condition_type = 'streak_days' THEN 
                LEAST(100.0, (user_current_streak::NUMERIC / NULLIF(a.condition_value, 0)::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'level' THEN 
                LEAST(100.0, (current_level::NUMERIC / NULLIF(a.condition_value, 0)::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN 
                LEAST(100.0, (effective_xp::NUMERIC / NULLIF(a.condition_value, 0)::NUMERIC) * 100)
            WHEN a.condition_type = 'reach_value' AND a.category = 'gems' THEN 
                LEAST(100.0, (gems_since_prestige::NUMERIC / NULLIF(a.condition_value, 0)::NUMERIC) * 100)
            ELSE 0.0
        END as progress_percentage
    FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = user_id_param
    WHERE a.is_active = true
    ORDER BY a.sort_order, a.id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_user_achievements_with_progress(UUID) TO authenticated;
