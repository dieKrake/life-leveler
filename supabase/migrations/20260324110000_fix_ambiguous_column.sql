-- Migration: Fix ambiguous column reference in check_and_update_achievements
-- Date: 2026-03-24 11:00:00
-- Description: Qualify all column references with table aliases to avoid ambiguity

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
    current_xp INTEGER;
    current_gems INTEGER;
    achievement RECORD;
    v_condition_met BOOLEAN;
BEGIN
    -- Get current player stats (should already exist from complete_todo)
    SELECT ps.level, ps.xp, ps.gems INTO current_level, current_xp, current_gems
    FROM player_stats ps
    WHERE ps.user_id = user_id_param;
    
    -- If player stats don't exist, something is wrong - raise error
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Player stats not found for user %. This should not happen.', user_id_param;
    END IF;

    -- Calculate total completed todos (including archived ones)
    SELECT COUNT(*) INTO total_completed
    FROM todos t
    WHERE t.user_id = user_id_param 
    AND t.completed_at IS NOT NULL;
    
    RAISE NOTICE 'Achievement check: user=%, completed_todos=%, level=%, xp=%, gems=%', 
        user_id_param, total_completed, current_level, current_xp, current_gems;
    
    -- Calculate todos completed today (including archived ones)
    SELECT COUNT(*) INTO completed_today
    FROM todos t
    WHERE t.user_id = user_id_param 
    AND t.completed_at IS NOT NULL
    AND DATE(t.completed_at) = CURRENT_DATE;
    
    -- Calculate current streak (including archived todos)
    WITH daily_completions AS (
        SELECT DATE(t.completed_at) as completion_date
        FROM todos t
        WHERE t.user_id = user_id_param 
        AND t.completed_at IS NOT NULL
        GROUP BY DATE(t.completed_at)
        ORDER BY DATE(t.completed_at) DESC
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
    
    -- Check each active achievement
    FOR achievement IN 
        SELECT a.id, a.name, a.condition_type, a.condition_value, a.reward_gems, a.category
        FROM achievements a
        WHERE a.is_active = true
        ORDER BY a.id
    LOOP
        -- Skip if already unlocked
        IF EXISTS (
            SELECT 1 FROM user_achievements ua
            WHERE ua.user_id = user_id_param AND ua.achievement_id = achievement.id
        ) THEN
            RAISE NOTICE 'Achievement % (%) already unlocked, skipping', achievement.id, achievement.name;
            CONTINUE;
        END IF;
        
        -- Determine if condition is met
        v_condition_met := false;
        
        IF achievement.condition_type = 'complete_count' THEN
            v_condition_met := (total_completed >= achievement.condition_value);
            RAISE NOTICE 'Achievement % (%): complete_count check: % >= % = %', 
                achievement.id, achievement.name, total_completed, achievement.condition_value, v_condition_met;
        ELSIF achievement.condition_type = 'streak_days' THEN
            v_condition_met := (current_streak >= achievement.condition_value);
            RAISE NOTICE 'Achievement % (%): streak_days check: % >= % = %', 
                achievement.id, achievement.name, current_streak, achievement.condition_value, v_condition_met;
        ELSIF achievement.condition_type = 'reach_value' THEN
            IF achievement.category = 'level' THEN
                v_condition_met := (current_level >= achievement.condition_value);
                RAISE NOTICE 'Achievement % (%): level check: % >= % = %', 
                    achievement.id, achievement.name, current_level, achievement.condition_value, v_condition_met;
            ELSIF achievement.category = 'xp' THEN
                v_condition_met := (current_xp >= achievement.condition_value);
                RAISE NOTICE 'Achievement % (%): xp check: % >= % = %', 
                    achievement.id, achievement.name, current_xp, achievement.condition_value, v_condition_met;
            ELSIF achievement.category = 'gems' THEN
                v_condition_met := (current_gems >= achievement.condition_value);
                RAISE NOTICE 'Achievement % (%): gems check: % >= % = %', 
                    achievement.id, achievement.name, current_gems, achievement.condition_value, v_condition_met;
            ELSE
                RAISE NOTICE 'Achievement % (%): unknown category "%", skipping', 
                    achievement.id, achievement.name, achievement.category;
            END IF;
        ELSE
            RAISE NOTICE 'Achievement % (%): unknown condition_type "%", skipping', 
                achievement.id, achievement.name, achievement.condition_type;
        END IF;
        
        -- If condition is met, unlock the achievement
        IF v_condition_met THEN
            RAISE NOTICE 'Achievement % (%) UNLOCKING NOW!', achievement.id, achievement.name;
            
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES (user_id_param, achievement.id, NOW());
            
            -- Return newly unlocked achievement (gems added by caller)
            -- Use explicit column names to avoid ambiguity
            RETURN QUERY SELECT achievement.name::TEXT, achievement.reward_gems::INTEGER;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Achievement check complete';
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;

COMMENT ON FUNCTION check_and_update_achievements(UUID) IS 
'Checks all achievement conditions with extensive logging.
Expects player_stats to already exist (created by complete_todo).
Returns newly unlocked achievements. Does NOT add gems directly.
All column references are qualified with table aliases to avoid ambiguity.';
