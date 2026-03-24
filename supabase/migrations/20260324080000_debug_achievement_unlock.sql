-- Migration: Add debug logging to achievement unlock
-- Date: 2026-03-24 08:00:00
-- Description: Add RAISE NOTICE statements to debug why achievements aren't unlocking

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
    -- Get current player stats
    SELECT level, xp, gems INTO current_level, current_xp, current_gems
    FROM player_stats 
    WHERE user_id = user_id_param;
    
    -- If no player stats exist, create them
    IF NOT FOUND THEN
        INSERT INTO player_stats (user_id, xp, level, gems, current_streak, highest_streak)
        VALUES (user_id_param, 0, 1, 0, 0, 0);
        current_level := 1;
        current_xp := 0;
        current_gems := 0;
    END IF;

    -- Calculate total completed todos (including archived ones)
    SELECT COUNT(*) INTO total_completed
    FROM todos 
    WHERE user_id = user_id_param 
    AND completed_at IS NOT NULL;
    
    RAISE NOTICE 'Achievement check: user=%, completed_todos=%', user_id_param, total_completed;
    
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
    
    -- Check each active achievement
    FOR achievement IN 
        SELECT id, name, condition_type, condition_value, reward_gems, category
        FROM achievements
        WHERE is_active = true
        ORDER BY id
    LOOP
        -- Skip if already unlocked
        IF EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_id_param AND achievement_id = achievement.id
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
            RETURN QUERY SELECT achievement.name::TEXT, achievement.reward_gems::INTEGER;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Achievement check complete';
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;

COMMENT ON FUNCTION check_and_update_achievements(UUID) IS 
'DEBUG VERSION: Checks all achievement conditions with extensive logging.
Returns newly unlocked achievements. Does NOT add gems directly.';
