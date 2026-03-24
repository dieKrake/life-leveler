-- Migration: Fix CASE_NOT_FOUND bug and add comprehensive reset function
-- Date: 2026-03-24 07:00:00
-- Description: 
--   PL/pgSQL CASE statements (unlike SQL CASE expressions) raise CASE_NOT_FOUND
--   when no branch matches and no ELSE is present. This caused check_and_update_achievements
--   to silently fail inside complete_todo's EXCEPTION block, rolling back all achievement inserts.
--   Fix: Add ELSE clauses to all CASE statements.
--   Also: Add reset_all_player_data() for clean testing.

-- 1. Fix check_and_update_achievements with proper ELSE clauses
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
    LOOP
        -- Skip if already unlocked
        IF EXISTS (
            SELECT 1 FROM user_achievements 
            WHERE user_id = user_id_param AND achievement_id = achievement.id
        ) THEN
            CONTINUE;
        END IF;
        
        -- Determine if condition is met
        v_condition_met := false;
        
        IF achievement.condition_type = 'complete_count' THEN
            v_condition_met := (total_completed >= achievement.condition_value);
        ELSIF achievement.condition_type = 'streak_days' THEN
            v_condition_met := (current_streak >= achievement.condition_value);
        ELSIF achievement.condition_type = 'reach_value' THEN
            IF achievement.category = 'level' THEN
                v_condition_met := (current_level >= achievement.condition_value);
            ELSIF achievement.category = 'xp' THEN
                v_condition_met := (current_xp >= achievement.condition_value);
            ELSIF achievement.category = 'gems' THEN
                v_condition_met := (current_gems >= achievement.condition_value);
            END IF;
            -- Unknown categories are simply skipped (v_condition_met stays false)
        END IF;
        -- Unknown condition_types are simply skipped
        
        -- If condition is met, unlock the achievement
        IF v_condition_met THEN
            INSERT INTO user_achievements (user_id, achievement_id, unlocked_at)
            VALUES (user_id_param, achievement.id, NOW());
            
            -- Return newly unlocked achievement (gems added by caller)
            RETURN QUERY SELECT achievement.name::TEXT, achievement.reward_gems::INTEGER;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;

-- 2. Recreate complete_todo with same fix (ELSE clauses) and better error handling
DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  level_up BOOLEAN,
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  can_prestige BOOLEAN,
  claimed_challenges JSONB,
  unlocked_achievements JSONB
) AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC := 1.0;
    final_xp_to_add INT;
    user_streak INT := 0;
    level_up_result RECORD;
    v_user_id UUID;
    v_claimed_challenges JSONB := '[]'::jsonb;
    v_unlocked_achievements JSONB := '[]'::jsonb;
    v_difficulty TEXT;
    v_achievement RECORD;
    v_achievement_gems INT := 0;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Update todo as completed and get XP value
    UPDATE public.todos
    SET 
        is_completed = TRUE, 
        completed_at = NOW()
    WHERE id = todo_id AND user_id = v_user_id AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Todo not found or already completed';
    END IF;

    IF xp_from_todo > 0 THEN
        -- Determine difficulty and gems based on XP value
        IF xp_from_todo = 10 THEN
            gems_from_todo := 1;
            v_difficulty := 'easy';
        ELSIF xp_from_todo = 20 THEN
            gems_from_todo := 2;
            v_difficulty := 'medium';
        ELSIF xp_from_todo = 30 THEN
            gems_from_todo := 4;
            v_difficulty := 'hard';
        ELSE
            gems_from_todo := 0;
            v_difficulty := 'medium';
        END IF;

        -- Get current streak and calculate multiplier
        SELECT COALESCE(ps.current_streak, 0) INTO user_streak 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;
        
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := ROUND(xp_from_todo * streak_multiplier)::INTEGER;

        -- Update player stats with todo rewards
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Store completion data for potential uncomplete
        UPDATE public.todos
        SET 
            completed_xp = final_xp_to_add,
            completed_gems = gems_from_todo,
            completed_difficulty = v_difficulty
        WHERE id = todo_id AND user_id = v_user_id;
        
        -- Update challenge progress
        PERFORM check_and_update_challenges_on_todo_complete(
            v_user_id,
            todo_id,
            final_xp_to_add,
            v_difficulty,
            NOW()
        );
        
        -- AUTO-CLAIM COMPLETED CHALLENGES
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'title', c.challenge_title,
                'xp_earned', c.xp_earned,
                'gems_earned', c.gems_earned
            )), '[]'::jsonb) INTO v_claimed_challenges
            FROM auto_claim_completed_challenges(v_user_id) c;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'auto_claim_completed_challenges failed: %', SQLERRM;
            v_claimed_challenges := '[]'::jsonb;
        END;
        
        -- AUTO-UNLOCK ACHIEVEMENTS
        BEGIN
            FOR v_achievement IN 
                SELECT * FROM check_and_update_achievements(v_user_id)
            LOOP
                v_unlocked_achievements := v_unlocked_achievements || 
                    jsonb_build_array(jsonb_build_object(
                        'name', v_achievement.achievement_name,
                        'reward_gems', v_achievement.reward_gems
                    ));
                v_achievement_gems := v_achievement_gems + v_achievement.reward_gems;
            END LOOP;
            
            -- Add achievement gems via XP system
            IF v_achievement_gems > 0 THEN
                PERFORM public.update_player_xp_and_gems(0, v_achievement_gems);
            END IF;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'check_and_update_achievements failed: %', SQLERRM;
            v_unlocked_achievements := '[]'::jsonb;
        END;

        -- Return results
        RETURN QUERY SELECT 
            COALESCE(level_up_result.level_up, false),
            COALESCE(level_up_result.new_level, 1),
            final_xp_to_add,
            gems_from_todo,
            (COALESCE(level_up_result.new_level, 1) >= 10)::BOOLEAN as can_prestige,
            v_claimed_challenges,
            v_unlocked_achievements;
    ELSE
        -- No XP gained, return default values
        RETURN QUERY SELECT 
            false::BOOLEAN,
            1::INTEGER,
            0::INTEGER,
            0::INTEGER,
            false::BOOLEAN,
            '[]'::JSONB,
            '[]'::JSONB;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;

-- 3. Create comprehensive reset function for testing
CREATE OR REPLACE FUNCTION reset_all_player_data()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_achievements_deleted INT;
    v_challenges_deleted INT;
    v_todos_reset INT;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Delete all user achievements
    DELETE FROM user_achievements WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_achievements_deleted = ROW_COUNT;
    
    -- Delete all user challenges (they will regenerate)
    DELETE FROM user_challenges WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_challenges_deleted = ROW_COUNT;
    
    -- Reset all todos to not completed
    UPDATE todos 
    SET 
        is_completed = false,
        completed_at = NULL,
        completed_xp = NULL,
        completed_gems = NULL,
        completed_difficulty = NULL
    WHERE user_id = v_user_id AND is_completed = true;
    GET DIAGNOSTICS v_todos_reset = ROW_COUNT;
    
    -- Reset player stats to defaults
    UPDATE player_stats
    SET 
        level = 1,
        xp = 0,
        total_xp = 0,
        gems = 0,
        current_streak = 0,
        highest_streak = 0,
        prestige = 0,
        prestige_base_xp = 0,
        max_level_reached = 1,
        gems_at_last_prestige = 0,
        tasks_at_last_prestige = 0,
        xp_at_last_prestige = 0,
        total_tasks_completed = 0,
        updated_at = NOW()
    WHERE user_id = v_user_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'achievements_deleted', v_achievements_deleted,
        'challenges_deleted', v_challenges_deleted,
        'todos_reset', v_todos_reset
    );
END;
$$;

GRANT EXECUTE ON FUNCTION reset_all_player_data() TO authenticated;

-- Add comments
COMMENT ON FUNCTION check_and_update_achievements(UUID) IS 
'Checks all achievement conditions and unlocks any that are met. Uses IF/ELSIF instead of 
PL/pgSQL CASE to avoid CASE_NOT_FOUND exceptions. Returns newly unlocked achievements. 
Does NOT add gems directly - caller must add gems via update_player_xp_and_gems.';

COMMENT ON FUNCTION complete_todo(BIGINT) IS 
'Completes a todo and automatically claims challenges and unlocks achievements.
Uses IF/ELSIF instead of CASE to avoid CASE_NOT_FOUND exceptions.
Achievement gems are added via update_player_xp_and_gems for proper level-up handling.';

COMMENT ON FUNCTION reset_all_player_data() IS 
'TESTING ONLY: Resets all player data including stats, achievements, challenges, and todos.';
