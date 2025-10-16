-- Migration: Minimal fix for 500 error
-- Date: 2025-10-16 28:00:00
-- Description: Fix only the critical 500 error in complete_todo

-- Add the completed_difficulty column
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_difficulty TEXT;

-- Fix complete_todo function with minimal changes
CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS TABLE(
  level_up BOOLEAN,
  new_level INTEGER,
  xp_gained INTEGER,
  gems_gained INTEGER,
  can_prestige BOOLEAN,
  unlockable_achievements JSONB,
  completed_challenges JSONB
) AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
    level_up_result RECORD;
    v_user_id UUID;
    v_unlockable_achievements JSONB;
    v_completed_challenges JSONB;
    v_difficulty TEXT;
BEGIN
    v_user_id := auth.uid();
    
    -- Update todo as completed
    UPDATE public.todos
    SET 
        is_completed = TRUE, 
        completed_at = NOW()
    WHERE id = todo_id AND user_id = v_user_id AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        -- Determine difficulty and gems
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

        -- Get streak and calculate multiplier
        SELECT COALESCE(ps.current_streak, 0) INTO user_streak 
        FROM public.player_stats ps 
        WHERE ps.user_id = v_user_id;
        
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Update player stats
        SELECT * INTO level_up_result
        FROM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Store completion data (using new column instead of JSON)
        UPDATE public.todos
        SET 
            completed_xp = final_xp_to_add,
            completed_gems = gems_from_todo,
            completed_difficulty = v_difficulty
        WHERE id = todo_id AND user_id = v_user_id;
        
        -- Update challenges
        PERFORM check_and_update_challenges_on_todo_complete(
            v_user_id,
            todo_id,
            final_xp_to_add,
            v_difficulty,
            NOW()
        );
        
        -- Get achievements (with error handling)
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', a.achievement_id,
                'name', a.name,
                'reward_gems', a.reward_gems,
                'icon', a.icon
            )), '[]'::jsonb) INTO v_unlockable_achievements
            FROM get_user_achievements_with_progress(v_user_id) a
            WHERE a.is_unlocked = false 
              AND a.current_progress >= a.condition_value;
        EXCEPTION WHEN OTHERS THEN
            v_unlockable_achievements := '[]'::jsonb;
        END;
        
        -- Get challenges (with error handling)
        BEGIN
            SELECT COALESCE(jsonb_agg(jsonb_build_object(
                'id', c.id,
                'title', c.title,
                'xp_reward', c.xp_reward,
                'gem_reward', c.gem_reward
            )), '[]'::jsonb) INTO v_completed_challenges
            FROM (
                SELECT * FROM get_user_challenges(v_user_id)
            ) c
            WHERE c.completed = true AND c.claimed = false;
        EXCEPTION WHEN OTHERS THEN
            v_completed_challenges := '[]'::jsonb;
        END;

        -- Return results
        RETURN QUERY SELECT 
            COALESCE(level_up_result.level_up, false),
            COALESCE(level_up_result.new_level, 1),
            final_xp_to_add,
            gems_from_todo,
            (COALESCE(level_up_result.new_level, 1) >= 10)::BOOLEAN as can_prestige,
            v_unlockable_achievements,
            v_completed_challenges;
    ELSE
        -- No XP gained
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

-- Fix uncomplete_todo to use the new column
CREATE OR REPLACE FUNCTION uncomplete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_remove INT;
    final_gems_to_remove INT;
    user_streak INT;
    v_difficulty TEXT;
    v_completed_at TIMESTAMP WITH TIME ZONE;
    v_stored_xp INT;
    v_stored_gems INT;
BEGIN
    -- Get todo details
    SELECT user_id, completed_at, completed_xp, completed_gems, xp_value, completed_difficulty
    INTO v_user_id, v_completed_at, v_stored_xp, v_stored_gems, xp_from_todo, v_difficulty
    FROM public.todos 
    WHERE id = todo_id;
    
    -- Clear completion data
    UPDATE public.todos
    SET is_completed = FALSE, 
        completed_at = NULL, 
        completed_xp = NULL, 
        completed_gems = NULL,
        completed_difficulty = NULL
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = TRUE;

    -- Use stored values if available
    IF v_stored_xp IS NOT NULL AND v_stored_gems IS NOT NULL THEN
        final_xp_to_remove := v_stored_xp;
        final_gems_to_remove := v_stored_gems;
        
        -- Use stored difficulty or calculate fallback
        IF v_difficulty IS NULL THEN
            IF v_stored_xp <= 12 THEN
                v_difficulty := 'easy';
            ELSIF v_stored_xp <= 30 THEN
                v_difficulty := 'medium';
            ELSE
                v_difficulty := 'hard';
            END IF;
        END IF;
    ELSE
        -- Fallback calculation
        IF xp_from_todo > 0 THEN
            CASE xp_from_todo
                WHEN 10 THEN
                    v_difficulty := 'easy';
                    gems_from_todo := 1;
                WHEN 20 THEN
                    v_difficulty := 'medium';
                    gems_from_todo := 2;
                WHEN 30 THEN
                    v_difficulty := 'hard';
                    gems_from_todo := 4;
                ELSE
                    v_difficulty := 'medium';
                    gems_from_todo := 0;
            END CASE;

            SELECT COALESCE(current_streak, 0) INTO user_streak 
            FROM public.player_stats 
            WHERE user_id = auth.uid();
            
            streak_multiplier := public.get_streak_multiplier(user_streak);
            final_xp_to_remove := round(xp_from_todo * streak_multiplier);
            final_gems_to_remove := gems_from_todo;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- Remove XP and gems
    PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -final_gems_to_remove);
    
    -- Reverse challenges
    PERFORM check_and_reverse_challenges_on_todo_uncomplete(
        auth.uid(),
        todo_id,
        final_xp_to_remove,
        v_difficulty,
        v_completed_at
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION uncomplete_todo(BIGINT) TO authenticated;
