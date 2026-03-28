-- Migration: Fix complete_todo to use achievement_reward_gems field
-- Date: 2026-03-28 18:00:00
-- Description: Update complete_todo to use the renamed achievement_reward_gems field

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
        
        -- AUTO-UNLOCK ACHIEVEMENTS (using achievement_reward_gems)
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
