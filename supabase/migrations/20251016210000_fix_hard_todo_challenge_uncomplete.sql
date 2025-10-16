-- Migration: Fix hard todo challenge uncomplete
-- Date: 2025-10-16 21:00:00
-- Description: Ensure hard todo uncomplete properly reduces challenge progress for unclaimed challenges

-- Update the uncomplete_todo function to ensure proper difficulty mapping
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
        -- IMPORTANT: Map back to original XP value to get correct difficulty
        IF v_stored_xp <= 22 THEN 
            v_difficulty := 'easy';      -- Original: 10 XP
        ELSIF v_stored_xp <= 44 THEN 
            v_difficulty := 'medium';    -- Original: 20 XP  
        ELSE 
            v_difficulty := 'hard';      -- Original: 30 XP
        END IF;
    ELSE
        -- Fallback: calculate from current XP value
        IF xp_from_todo > 0 THEN
            -- IMPORTANT: Use exact mapping for difficulty
            IF xp_from_todo = 10 THEN
                v_difficulty := 'easy';
            ELSIF xp_from_todo = 20 THEN
                v_difficulty := 'medium';
            ELSIF xp_from_todo = 30 THEN
                v_difficulty := 'hard';
            ELSE
                v_difficulty := 'medium'; -- Default fallback
            END IF;
            
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
    
    -- Reverse challenge progress - CRITICAL: Pass the correct difficulty
    PERFORM check_and_reverse_challenges_on_todo_uncomplete(
        auth.uid(),
        todo_id,
        final_xp_to_remove,
        v_difficulty,  -- This should be 'hard' for 30 XP todos
        v_completed_at
    );
    
    -- Debug log (remove in production)
    RAISE NOTICE 'Uncompleting todo %, XP: %, Difficulty: %, Stored XP: %', 
        todo_id, xp_from_todo, v_difficulty, v_stored_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION uncomplete_todo(BIGINT) TO authenticated;
