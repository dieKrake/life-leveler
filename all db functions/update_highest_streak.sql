
BEGIN
    IF NEW.current_streak > OLD.highest_streak THEN
        NEW.highest_streak = NEW.current_streak;
    END IF;
    RETURN NEW;
END;
