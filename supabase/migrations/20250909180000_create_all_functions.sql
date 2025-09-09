-- Migration: Create all remaining database functions and triggers
-- Created: 2025-09-09 18:00:00

-- 1. Trigger function: update_highest_streak
CREATE OR REPLACE FUNCTION update_highest_streak()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.current_streak > OLD.highest_streak THEN
        NEW.highest_streak = NEW.current_streak;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Function: get_streak_multiplier
CREATE OR REPLACE FUNCTION get_streak_multiplier(streak_days INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    multiplier_value DECIMAL;
BEGIN
    SELECT multiplier INTO multiplier_value
    FROM public.streak_multipliers 
    WHERE min_streak_days <= streak_days 
    ORDER BY min_streak_days DESC 
    LIMIT 1;
    
    RETURN COALESCE(multiplier_value, 1.0);
END;
$$ LANGUAGE plpgsql;

-- 3. Function: update_player_xp_and_gems
CREATE OR REPLACE FUNCTION update_player_xp_and_gems(xp_change INTEGER, gems_change INTEGER)
RETURNS VOID AS $$
DECLARE
    new_total_xp BIGINT;
    new_level INT;
    current_level_before_update INT;
    gems_from_level_up INT := 0;
    i INT;
BEGIN
    SELECT level INTO current_level_before_update FROM public.player_stats WHERE user_id = auth.uid();

    UPDATE public.player_stats
    SET 
        xp = GREATEST(0, xp + xp_change),
        gems = GREATEST(0, gems + gems_change)
    WHERE user_id = auth.uid()
    RETURNING xp INTO new_total_xp;

    SELECT max(level) INTO new_level FROM public.levels
    WHERE xp_required <= new_total_xp;

    IF new_level > current_level_before_update THEN
        FOR i IN (current_level_before_update + 1)..new_level LOOP
            gems_from_level_up := gems_from_level_up + (i * 10);
        END LOOP;
    END IF;

    UPDATE public.player_stats
    SET 
        level = new_level,
        gems = player_stats.gems + gems_from_level_up
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function: complete_todo
CREATE OR REPLACE FUNCTION complete_todo(todo_id INTEGER)
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

-- 5. Function: uncomplete_todo
CREATE OR REPLACE FUNCTION uncomplete_todo(todo_id INTEGER)
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

-- 6. Function: update_login_streak (trigger function)
CREATE OR REPLACE FUNCTION update_login_streak()
RETURNS TRIGGER AS $$
DECLARE
    stats RECORD;
BEGIN
    SELECT * INTO stats FROM public.player_stats WHERE user_id = NEW.id;

    IF (stats.last_login IS NULL) OR (stats.last_login::date < NOW()::date) THEN
        IF stats.last_login IS NOT NULL AND stats.last_login::date = (NOW() - INTERVAL '1 day')::date THEN
            UPDATE public.player_stats
            SET 
                current_streak = stats.current_streak + 1,
                last_login = NOW()
            WHERE user_id = NEW.id;
        ELSE
            UPDATE public.player_stats
            SET
                current_streak = 1,
                last_login = NOW()
            WHERE user_id = NEW.id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Function: handle_new_user (trigger function)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function: handle_new_user_stats (trigger function)
CREATE OR REPLACE FUNCTION handle_new_user_stats()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.player_stats (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function: update_todo_difficulty
CREATE OR REPLACE FUNCTION update_todo_difficulty(todo_id INTEGER, new_xp_value INTEGER, user_id UUID)
RETURNS JSON AS $$
DECLARE
    updated_todo RECORD;
BEGIN
    IF new_xp_value NOT IN (10, 20, 30) THEN
        RAISE EXCEPTION 'XP-Wert muss 10, 20 oder 30 sein';
    END IF;

    UPDATE todos 
    SET xp_value = new_xp_value
    WHERE id = todo_id 
        AND todos.user_id = update_todo_difficulty.user_id
        AND is_completed = false
    RETURNING * INTO updated_todo;

    IF updated_todo IS NULL THEN
        RAISE EXCEPTION 'Todo nicht gefunden oder bereits abgeschlossen';
    END IF;

    RETURN row_to_json(updated_todo);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Create all triggers
DROP TRIGGER IF EXISTS trigger_update_highest_streak ON player_stats;
CREATE TRIGGER trigger_update_highest_streak
    BEFORE UPDATE ON player_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_highest_streak();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_stats ON auth.users;
CREATE TRIGGER on_auth_user_created_stats
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user_stats();

DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION update_login_streak();
