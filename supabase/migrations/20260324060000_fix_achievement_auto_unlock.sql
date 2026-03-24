-- Migration: Fix achievement auto-unlock timing and gem handling
-- Date: 2026-03-24 06:00:00
-- Description: Remove direct gem updates from check_and_update_achievements and handle gems via update_player_xp_and_gems in complete_todo

-- Update check_and_update_achievements to NOT add gems directly
-- (gems will be added via update_player_xp_and_gems in complete_todo)
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
    v_newly_unlocked BOOLEAN;
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
                            IF current_xp >= achievement.condition_value THEN
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;

-- Update complete_todo to accumulate achievement gems and add them via XP system
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
        CASE xp_from_todo
            WHEN 10 THEN 
                gems_from_todo := 1;
                v_difficulty := 'easy';
            WHEN 20 THEN 
                gems_from_todo := 2;
                v_difficulty := 'medium';
            WHEN 30 THEN 
                gems_from_todo := 4;
                v_difficulty := 'hard';
            ELSE 
                gems_from_todo := 0;
                v_difficulty := 'medium';
        END CASE;

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
            v_claimed_challenges := '[]'::jsonb;
        END;
        
        -- AUTO-UNLOCK ACHIEVEMENTS (after XP/gems update)
        -- Collect achievements and their gems first
        BEGIN
            FOR v_achievement IN 
                SELECT * FROM check_and_update_achievements(v_user_id)
            LOOP
                -- Build the unlocked achievements array
                v_unlocked_achievements := v_unlocked_achievements || 
                    jsonb_build_array(jsonb_build_object(
                        'name', v_achievement.achievement_name,
                        'reward_gems', v_achievement.reward_gems
                    ));
                
                -- Accumulate total achievement gems
                v_achievement_gems := v_achievement_gems + v_achievement.reward_gems;
            END LOOP;
            
            -- If any achievements were unlocked, add their gems via the XP system
            -- This ensures gems are properly tracked and can trigger level-ups
            IF v_achievement_gems > 0 THEN
                PERFORM public.update_player_xp_and_gems(0, v_achievement_gems);
            END IF;
        EXCEPTION WHEN OTHERS THEN
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;

-- Add comments
COMMENT ON FUNCTION check_and_update_achievements(UUID) IS 
'Checks all achievement conditions and automatically unlocks any that are met.
Returns a list of newly unlocked achievements with their names and gem rewards.
NOTE: Does NOT add gems directly - caller must add gems via update_player_xp_and_gems.';

COMMENT ON FUNCTION complete_todo(BIGINT) IS 
'Completes a todo and automatically claims any completed challenges and unlocks any earned achievements.
Achievement gems are now properly added via update_player_xp_and_gems to ensure they can trigger level-ups.
Returns level-up info, claimed challenges, and unlocked achievements for immediate UI feedback.';
