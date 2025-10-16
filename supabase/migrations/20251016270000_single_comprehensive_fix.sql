-- Migration: Single comprehensive fix for all issues
-- Date: 2025-10-16 27:00:00
-- Description: Fix all backend issues in one migration

-- 1. Add the completed_difficulty column if it doesn't exist
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_difficulty TEXT;

-- 2. Create helper function for difficulty calculation
CREATE OR REPLACE FUNCTION get_original_difficulty_from_xp(
    multiplied_xp INTEGER,
    streak_multiplier NUMERIC DEFAULT 1.0
)
RETURNS TEXT AS $$
DECLARE
    original_xp NUMERIC;
BEGIN
    -- Calculate original XP by dividing by multiplier
    original_xp := multiplied_xp / COALESCE(streak_multiplier, 1.0);
    
    -- Map to difficulty based on original XP values
    IF original_xp <= 10.5 THEN  -- Allows for small rounding errors
        RETURN 'easy';
    ELSIF original_xp <= 20.5 THEN
        RETURN 'medium';
    ELSIF original_xp <= 30.5 THEN
        RETURN 'hard';
    ELSE
        RETURN 'medium'; -- Default fallback
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix the streak multiplier function
CREATE OR REPLACE FUNCTION get_streak_multiplier(streak_days INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    multiplier_value NUMERIC;
BEGIN
    -- Handle negative or zero streak
    IF streak_days <= 0 THEN
        RETURN 1.0;
    END IF;
    
    SELECT multiplier INTO multiplier_value
    FROM public.streak_multipliers 
    WHERE min_streak_days <= streak_days 
    ORDER BY min_streak_days DESC 
    LIMIT 1;
    
    RETURN COALESCE(multiplier_value, 1.0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fix complete_todo function
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
    streak_multiplier NUMERIC := 1.0;
    final_xp_to_add INT;
    user_streak INT := 0;
    level_up_result RECORD;
    v_user_id UUID;
    v_unlockable_achievements JSONB := '[]'::jsonb;
    v_completed_challenges JSONB := '[]'::jsonb;
    v_difficulty TEXT;
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

        -- Update player stats
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
        
        -- Get achievements and challenges (with error handling)
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

-- 5. Fix uncomplete_todo function
CREATE OR REPLACE FUNCTION uncomplete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC := 1.0;
    final_xp_to_remove INT;
    final_gems_to_remove INT;
    user_streak INT := 0;
    v_difficulty TEXT;
    v_completed_at TIMESTAMP WITH TIME ZONE;
    v_stored_xp INT;
    v_stored_gems INT;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Get todo details
    SELECT user_id, completed_at, completed_xp, completed_gems, xp_value, completed_difficulty
    INTO v_user_id, v_completed_at, v_stored_xp, v_stored_gems, xp_from_todo, v_difficulty
    FROM public.todos 
    WHERE id = todo_id AND is_completed = TRUE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Todo not found or not completed';
    END IF;
    
    -- Verify ownership
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized access to todo';
    END IF;
    
    -- Update todo and clear completion data
    UPDATE public.todos
    SET is_completed = FALSE, 
        completed_at = NULL, 
        completed_xp = NULL, 
        completed_gems = NULL,
        completed_difficulty = NULL
    WHERE id = todo_id AND user_id = auth.uid();

    -- Use stored values if available
    IF v_stored_xp IS NOT NULL AND v_stored_gems IS NOT NULL THEN
        final_xp_to_remove := v_stored_xp;
        final_gems_to_remove := v_stored_gems;
        
        -- Use stored difficulty, or calculate from stored XP
        IF v_difficulty IS NULL THEN
            -- Get current streak to estimate what multiplier was used
            SELECT COALESCE(current_streak, 0) INTO user_streak 
            FROM public.player_stats 
            WHERE user_id = auth.uid();
            
            streak_multiplier := public.get_streak_multiplier(user_streak);
            v_difficulty := get_original_difficulty_from_xp(v_stored_xp, streak_multiplier);
        END IF;
    ELSE
        -- Fallback: calculate from current XP value
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
            final_xp_to_remove := ROUND(xp_from_todo * streak_multiplier)::INTEGER;
            final_gems_to_remove := gems_from_todo;
        ELSE
            RETURN; -- Nothing to remove
        END IF;
    END IF;

    -- Remove the XP and gems that were awarded
    PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -final_gems_to_remove);
    
    -- Reverse challenge progress (only for unclaimed challenges)
    PERFORM check_and_reverse_challenges_on_todo_uncomplete(
        auth.uid(),
        todo_id,
        final_xp_to_remove,
        v_difficulty,
        v_completed_at
    );
    
    RAISE NOTICE 'Uncompleted todo %, removed % XP (difficulty: %), % gems', 
        todo_id, final_xp_to_remove, v_difficulty, final_gems_to_remove;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_original_difficulty_from_xp(INTEGER, NUMERIC) TO authenticated;
GRANT EXECUTE ON FUNCTION get_streak_multiplier(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION uncomplete_todo(BIGINT) TO authenticated;
