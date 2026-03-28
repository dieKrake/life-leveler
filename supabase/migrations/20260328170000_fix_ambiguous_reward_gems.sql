-- Migration: Fix ambiguous reward_gems column reference
-- Date: 2026-03-28 17:00:00
-- Description: Fix "column reference reward_gems is ambiguous" error in check_and_update_achievements

DROP FUNCTION IF EXISTS check_and_update_achievements(UUID);

CREATE OR REPLACE FUNCTION check_and_update_achievements(user_id_param UUID)
RETURNS TABLE(
  achievement_name TEXT,
  achievement_reward_gems INTEGER
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
        SELECT a.id, a.name, a.condition_type, a.condition_value, a.reward_gems, a.category
        FROM achievements a
        WHERE a.is_active = true
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
            
            -- Return newly unlocked achievement
            IF v_newly_unlocked THEN
                RETURN QUERY SELECT achievement.name::TEXT, achievement.reward_gems::INTEGER;
            END IF;
        END IF;
    END LOOP;
    
    RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION check_and_update_achievements(UUID) TO authenticated;

-- 2. Update complete_todo to use the new column name achievement_reward_gems
DROP FUNCTION IF EXISTS complete_todo(UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION complete_todo(
    p_todo_id UUID,
    p_is_completed BOOLEAN DEFAULT true
)
RETURNS TABLE(
    level_up BOOLEAN,
    new_level INTEGER,
    xp_earned INTEGER,
    gems_earned INTEGER,
    can_prestige BOOLEAN,
    claimed_challenges JSONB,
    unlocked_achievements JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_todo RECORD;
    v_xp_value INTEGER;
    v_gems_value INTEGER;
    v_streak_multiplier NUMERIC;
    final_xp_to_add INTEGER;
    gems_from_todo INTEGER;
    level_up_result RECORD;
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
    
    -- Get the todo
    SELECT * INTO v_todo FROM todos WHERE id = p_todo_id AND user_id = v_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Todo not found or not owned by user';
    END IF;
    
    -- If already in the desired state, just return current stats
    IF v_todo.is_completed = p_is_completed THEN
        SELECT ps.level INTO level_up_result FROM player_stats ps WHERE ps.user_id = v_user_id;
        RETURN QUERY SELECT 
            false,
            COALESCE(level_up_result.level, 1),
            0,
            0,
            false,
            '[]'::jsonb,
            '[]'::jsonb;
        RETURN;
    END IF;
    
    -- Get XP and gems values
    v_xp_value := COALESCE(v_todo.xp_value, 10);
    
    -- Determine difficulty and gems
    CASE v_xp_value
        WHEN 10 THEN v_difficulty := 'easy'; v_gems_value := 1;
        WHEN 20 THEN v_difficulty := 'medium'; v_gems_value := 2;
        WHEN 30 THEN v_difficulty := 'hard'; v_gems_value := 4;
        ELSE v_difficulty := 'easy'; v_gems_value := 1;
    END CASE;
    
    IF p_is_completed THEN
        -- COMPLETING the todo
        -- Get streak multiplier
        SELECT COALESCE(sm.multiplier, 1.0) INTO v_streak_multiplier
        FROM player_stats ps
        LEFT JOIN streak_multipliers sm ON ps.current_streak >= sm.min_streak_days
        WHERE ps.user_id = v_user_id
        ORDER BY sm.min_streak_days DESC NULLS LAST
        LIMIT 1;
        
        v_streak_multiplier := COALESCE(v_streak_multiplier, 1.0);
        
        -- Calculate final XP with multiplier
        final_xp_to_add := FLOOR(v_xp_value * v_streak_multiplier);
        gems_from_todo := v_gems_value;
        
        -- Update todo
        UPDATE todos 
        SET is_completed = true, 
            completed_at = NOW(),
            completed_difficulty = v_difficulty
        WHERE id = p_todo_id;
        
        -- Update player stats
        SELECT * INTO level_up_result 
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- AUTO-CLAIM CHALLENGES
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'name', c.challenge_name,
                'xp_earned', c.xp_earned,
                'gems_earned', c.gems_earned
            )), '[]'::jsonb) INTO v_claimed_challenges
            FROM auto_claim_completed_challenges(v_user_id) c;
        EXCEPTION WHEN OTHERS THEN
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
                        'reward_gems', v_achievement.achievement_reward_gems
                    ));
                v_achievement_gems := v_achievement_gems + v_achievement.achievement_reward_gems;
            END LOOP;
            
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
        -- UNCOMPLETING the todo
        -- Get the stored difficulty
        v_difficulty := COALESCE(v_todo.completed_difficulty, 'easy');
        
        CASE v_difficulty
            WHEN 'easy' THEN v_xp_value := 10; v_gems_value := 1;
            WHEN 'medium' THEN v_xp_value := 20; v_gems_value := 2;
            WHEN 'hard' THEN v_xp_value := 30; v_gems_value := 4;
            ELSE v_xp_value := 10; v_gems_value := 1;
        END CASE;
        
        -- Update todo
        UPDATE todos 
        SET is_completed = false, 
            completed_at = NULL,
            completed_difficulty = NULL
        WHERE id = p_todo_id;
        
        -- Subtract XP and gems
        SELECT * INTO level_up_result 
        FROM public.update_player_xp_and_gems(-v_xp_value, -v_gems_value);
        
        -- Return results
        RETURN QUERY SELECT 
            COALESCE(level_up_result.level_up, false),
            COALESCE(level_up_result.new_level, 1),
            -v_xp_value,
            -v_gems_value,
            false,
            '[]'::jsonb,
            '[]'::jsonb;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION complete_todo(UUID, BOOLEAN) TO authenticated;
