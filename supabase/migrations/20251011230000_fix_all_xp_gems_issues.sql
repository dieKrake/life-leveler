-- Fix all XP/Gems calculation issues
-- Migration: 20251011230000_fix_all_xp_gems_issues.sql

-- 1. Fix update_player_xp_and_gems function (gems double overwrite bug)
CREATE OR REPLACE FUNCTION update_player_xp_and_gems(xp_change INTEGER, gems_change INTEGER)
RETURNS VOID AS $$
DECLARE
    new_total_xp BIGINT;
    new_level INT;
    current_level_before_update INT;
    gems_from_level_up INT := 0;
    i INT;
BEGIN
    -- Get current level before any updates
    SELECT level INTO current_level_before_update 
    FROM public.player_stats 
    WHERE user_id = auth.uid();

    -- First update: Apply XP and gems changes
    UPDATE public.player_stats
    SET 
        xp = GREATEST(0, xp + xp_change),
        gems = GREATEST(0, gems + gems_change)
    WHERE user_id = auth.uid()
    RETURNING xp INTO new_total_xp;

    -- Calculate new level based on XP
    SELECT max(level) INTO new_level 
    FROM public.levels
    WHERE xp_required <= new_total_xp;

    -- Calculate gems from level ups (if any)
    IF new_level > current_level_before_update THEN
        FOR i IN (current_level_before_update + 1)..new_level LOOP
            gems_from_level_up := gems_from_level_up + (i * 10);
        END LOOP;
        
        -- Second update: Update level and ADD level-up gems (don't overwrite!)
        UPDATE public.player_stats
        SET 
            level = new_level,
            gems = gems + gems_from_level_up  -- ADD to current gems, don't overwrite!
        WHERE user_id = auth.uid();
    ELSIF new_level != current_level_before_update THEN
        -- Level changed but didn't increase (edge case: level down)
        UPDATE public.player_stats
        SET level = new_level
        WHERE user_id = auth.uid();
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Add columns to track XP and gems at completion time
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_xp INTEGER;
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_gems INTEGER;

-- 3. Update complete_todo to store XP and gems at completion
DROP FUNCTION IF EXISTS complete_todo(BIGINT);

CREATE FUNCTION complete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    v_user_id UUID;
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
    v_difficulty TEXT;
    v_completed_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user_id first
    SELECT user_id INTO v_user_id FROM public.todos WHERE id = todo_id;
    
    -- Update todo and get XP value
    UPDATE public.todos
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = FALSE
    RETURNING xp_value, NOW() INTO xp_from_todo, v_completed_at;

    IF xp_from_todo > 0 THEN
        -- Determine difficulty
        v_difficulty := CASE
            WHEN xp_from_todo = 10 THEN 'easy'
            WHEN xp_from_todo = 20 THEN 'medium'
            WHEN xp_from_todo = 30 THEN 'hard'
            ELSE 'medium'
        END;
        
        -- Calculate gems
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        -- Apply streak multiplier
        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        -- Store the ACTUAL XP and gems awarded at completion time
        UPDATE public.todos
        SET completed_xp = final_xp_to_add,
            completed_gems = gems_from_todo
        WHERE id = todo_id;

        -- Update player stats
        PERFORM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
        
        -- Check and update challenges (NO automatic rewards)
        PERFORM check_and_update_challenges_on_todo_complete(
            auth.uid(),
            todo_id,
            final_xp_to_add,
            v_difficulty,
            v_completed_at
        );
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update uncomplete_todo to use the stored XP and gems
DROP FUNCTION IF EXISTS uncomplete_todo(BIGINT);

CREATE FUNCTION uncomplete_todo(todo_id BIGINT)
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
    -- Get user_id, completed_at, and the ORIGINAL XP/gems at completion time
    SELECT user_id, completed_at, completed_xp, completed_gems, xp_value
    INTO v_user_id, v_completed_at, v_stored_xp, v_stored_gems, xp_from_todo
    FROM public.todos 
    WHERE id = todo_id;
    
    -- Update todo and clear completion data
    UPDATE public.todos
    SET is_completed = FALSE, 
        completed_at = NULL, 
        completed_xp = NULL, 
        completed_gems = NULL
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = TRUE;

    -- Use stored values if available, otherwise calculate (fallback for old todos)
    IF v_stored_xp IS NOT NULL AND v_stored_gems IS NOT NULL THEN
        final_xp_to_remove := v_stored_xp;
        final_gems_to_remove := v_stored_gems;
        
        -- Determine difficulty from stored XP for challenge reversal
        v_difficulty := CASE
            WHEN v_stored_xp <= 22 THEN 'easy'      -- 10 XP * 2.2 max = 22
            WHEN v_stored_xp <= 44 THEN 'medium'    -- 20 XP * 2.2 max = 44
            ELSE 'hard'                              -- 30 XP * 2.2 max = 66
        END;
    ELSE
        -- Fallback: calculate from current XP value
        IF xp_from_todo > 0 THEN
            v_difficulty := CASE
                WHEN xp_from_todo = 10 THEN 'easy'
                WHEN xp_from_todo = 20 THEN 'medium'
                WHEN xp_from_todo = 30 THEN 'hard'
                ELSE 'medium'
            END;
            
            CASE xp_from_todo
                WHEN 10 THEN gems_from_todo := 1;
                WHEN 20 THEN gems_from_todo := 2;
                WHEN 30 THEN gems_from_todo := 4;
                ELSE gems_from_todo := 0;
            END CASE;

            SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
            streak_multiplier := public.get_streak_multiplier(user_streak);
            final_xp_to_remove := round(xp_from_todo * streak_multiplier);
            final_gems_to_remove := gems_from_todo;
        ELSE
            RETURN; -- Nothing to remove
        END IF;
    END IF;

    -- Remove the EXACT XP and gems that were awarded
    PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -final_gems_to_remove);
    
    -- Reverse challenge progress
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
GRANT EXECUTE ON FUNCTION update_player_xp_and_gems(INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_todo(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION uncomplete_todo(BIGINT) TO authenticated;