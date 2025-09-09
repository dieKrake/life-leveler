-- Migration: Fix complete_todo function overloading conflict
-- Created: 2025-09-09 18:00:01

-- Drop all existing complete_todo functions
DROP FUNCTION IF EXISTS complete_todo(INTEGER);
DROP FUNCTION IF EXISTS complete_todo(BIGINT);
DROP FUNCTION IF EXISTS complete_todo(todo_id INTEGER);
DROP FUNCTION IF EXISTS complete_todo(todo_id BIGINT);

-- Recreate with consistent BIGINT parameter (matches Supabase's default)
CREATE OR REPLACE FUNCTION complete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_add INT;
    user_streak INT;
BEGIN
    UPDATE public.todos
    SET is_completed = TRUE, completed_at = NOW()
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = FALSE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_add := round(xp_from_todo * streak_multiplier);

        PERFORM public.update_player_xp_and_gems(final_xp_to_add, gems_from_todo);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Also fix uncomplete_todo for consistency
DROP FUNCTION IF EXISTS uncomplete_todo(INTEGER);
DROP FUNCTION IF EXISTS uncomplete_todo(BIGINT);
DROP FUNCTION IF EXISTS uncomplete_todo(todo_id INTEGER);
DROP FUNCTION IF EXISTS uncomplete_todo(todo_id BIGINT);

CREATE OR REPLACE FUNCTION uncomplete_todo(todo_id BIGINT)
RETURNS VOID AS $$
DECLARE
    xp_from_todo INT;
    gems_from_todo INT := 0;
    streak_multiplier NUMERIC;
    final_xp_to_remove INT;
    user_streak INT;
BEGIN
    UPDATE public.todos
    SET is_completed = FALSE, completed_at = NULL
    WHERE id = todo_id AND user_id = auth.uid() AND is_completed = TRUE
    RETURNING xp_value INTO xp_from_todo;

    IF xp_from_todo > 0 THEN
        CASE xp_from_todo
            WHEN 10 THEN gems_from_todo := 1;
            WHEN 20 THEN gems_from_todo := 2;
            WHEN 30 THEN gems_from_todo := 4;
            ELSE gems_from_todo := 0;
        END CASE;

        SELECT current_streak INTO user_streak FROM public.player_stats WHERE user_id = auth.uid();
        streak_multiplier := public.get_streak_multiplier(user_streak);
        final_xp_to_remove := round(xp_from_todo * streak_multiplier);

        PERFORM public.update_player_xp_and_gems(-final_xp_to_remove, -gems_from_todo);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
