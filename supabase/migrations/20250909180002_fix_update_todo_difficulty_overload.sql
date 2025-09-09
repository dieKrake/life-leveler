-- Migration: Fix update_todo_difficulty function overloading conflict
-- Created: 2025-09-09 18:00:02

-- Drop all existing update_todo_difficulty functions
DROP FUNCTION IF EXISTS update_todo_difficulty(INTEGER, INTEGER, UUID);
DROP FUNCTION IF EXISTS update_todo_difficulty(INTEGER, UUID, INTEGER);
DROP FUNCTION IF EXISTS update_todo_difficulty(todo_id INTEGER, new_xp_value INTEGER, user_id UUID);
DROP FUNCTION IF EXISTS update_todo_difficulty(todo_id INTEGER, user_id UUID, new_xp_value INTEGER);

-- Recreate with consistent parameter order and BIGINT for todo_id
CREATE OR REPLACE FUNCTION update_todo_difficulty(todo_id BIGINT, new_xp_value INTEGER, user_id UUID)
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
