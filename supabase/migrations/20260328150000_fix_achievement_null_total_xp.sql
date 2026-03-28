-- Migration: Fix NULL total_xp handling in achievement functions
-- Date: 2026-03-28 15:00:00
-- Description: Add COALESCE for total_xp to prevent NULL errors

-- 1. Fix get_user_achievements_with_progress with COALESCE for total_xp
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
    -- Baseline values
    baseline_gems INTEGER;
    baseline_tasks INTEGER;
    -- Progress since last prestige
    gems_since_prestige INTEGER;
    tasks_since_prestige INTEGER;
    effective_xp INTEGER;
BEGIN
    -- Get current player stats including total_xp and prestige_base_xp
    -- Use COALESCE for all nullable columns
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
    
    -- If no player stats exist, set defaults
    IF NOT FOUND THEN
        current_level := 1;
        user_total_xp := 0;
        current_gems := 0;
        user_current_streak := 0;
        user_prestige_base_xp := 0;
        baseline_gems := 0;
        baseline_tasks := 0;
    END IF;

    -- Count total completed tasks
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND is_completed = true;
    
    -- Calculate progress since last prestige
    gems_since_prestige := current_gems - baseline_gems;
    tasks_since_prestige := total_completed - baseline_tasks;
    effective_xp := user_total_xp - user_prestige_base_xp;
    
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
            -- XP: Use effective XP since prestige (total_xp - prestige_base_xp)
            WHEN a.condition_type = 'reach_value' AND a.category = 'xp' THEN effective_xp
            -- Gems: Use progress since prestige
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

-- 2. Fix check_and_update_achievements with COALESCE for total_xp
DROP FUNCTION IF EXISTS check_and_update_achievements(UUID);

CREATE OR REPLACE FUNCTION check_and_update_achievements(user_id_param UUID)
RETURNS TABLE(
  achievement_name TEXT,
  reward_gems INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total_completed INTEGER;
    completed_today INTEGER;
    current_streak INTEGER;
    current_level INTEGER;
    user_total_xp INTEGER;
    current_gems INTEGER;
    user_prestige_base_xp INTEGER;
    effective_xp INTEGER;
    achievement RECORD;
    v_newly_unlocked BOOLEAN;
BEGIN
    -- Get current player stats including total_xp and prestige_base_xp
    -- Use COALESCE for all nullable columns
    SELECT 
        COALESCE(level, 1), 
        COALESCE(total_xp, xp, 0), 
        COALESCE(gems, 0), 
        COALESCE(prestige_base_xp, 0)
    INTO current_level, user_total_xp, current_gems, user_prestige_base_xp
    FROM player_stats 
    WHERE user_id = user_id_param;
    
    -- If no player stats exist, create them
    IF NOT FOUND THEN
        INSERT INTO player_stats (user_id, xp, level, gems, current_streak, highest_streak)
        VALUES (user_id_param, 0, 1, 0, 0, 0);
        current_level := 1;
        user_total_xp := 0;
        current_gems := 0;
        user_prestige_base_xp := 0;
    END IF;

    -- Calculate effective XP since prestige
    effective_xp := user_total_xp - user_prestige_base_xp;

    -- Calculate total completed todos (including archived ones)
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND completed_at IS NOT NULL;
    
    -- Calculate todos completed today (including archived ones)
    SELECT COUNT(*) INTO completed_today
    FROM todos 
    WHERE user_id = user_id_param 
    AND completed_at IS NOT NULL
    AND DATE(completed_at) = CURRENT_DATE;
    
    -- Calculate current streak (including archived todos)
    WITH daily_completions AS (
        SELECT DATE(completed_at) as completion_date
        FROM todos 
        WHERE user_id = user_id_param 
        AND completed_at IS NOT NULL
        GROUP BY DATE(completed_at)
        ORDER BY DATE(completed_at) DESC
    ),
    streak_calculation AS (
        SELECT 
            completion_date,
            ROW_NUMBER() OVER (ORDER BY completion_date DESC) as row_num,
            completion_date + INTERVAL '1 day' * (ROW_NUMBER() OVER (ORDER BY completion_date DESC) - 1) as expected_date
        FROM daily_completions
    )
    SELECT COUNT(*) INTO current_streak
    FROM streak_calculation
    WHERE completion_date = expected_date
    AND completion_date <= CURRENT_DATE;
    
    -- Update or insert user achievements based on conditions
    FOR achievement IN 
        SELECT id, name, condition_type, condition_value, reward_gems, category
        FROM achievements
        WHERE is_active = true
    LOOP
        -- Check if achievement is already unlocked
        IF NOT EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_id_param AND achievement_id = achievement.id
        ) THEN
            v_newly_unlocked := false;
            
            -- Check conditions based on type and category
            CASE achievement.condition_type
                WHEN 'complete_count' THEN
                    IF total_completed >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        v_newly_unlocked := true;
                    END IF;
                    
                WHEN 'streak_days' THEN
                    IF current_streak >= achievement.condition_value THEN
                        INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                        VALUES (user_id_param, achievement.id, NOW());
                        v_newly_unlocked := true;
                    END IF;
                    
                WHEN 'reach_value' THEN
                    -- Use category to determine what value to check
                    CASE achievement.category
                        WHEN 'level' THEN
                            IF current_level >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                            
                        WHEN 'xp' THEN
                            -- Use effective_xp instead of current_xp
                            IF effective_xp >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                            
                        WHEN 'gems' THEN
                            IF current_gems >= achievement.condition_value THEN
                                INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
                                VALUES (user_id_param, achievement.id, NOW());
                                v_newly_unlocked := true;
                            END IF;
                    END CASE;
            END CASE;
            
            -- Return newly unlocked achievement (gems will be added by caller)
            IF v_newly_unlocked THEN
                RETURN QUERY SELECT achievement.name, achievement.reward_gems;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;
