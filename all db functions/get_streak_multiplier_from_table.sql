
    SELECT multiplier 
    FROM public.streak_multipliers 
    WHERE min_streak_days <= streak_days 
    ORDER BY min_streak_days DESC 
    LIMIT 1;
