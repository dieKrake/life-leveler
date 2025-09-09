# Database Migrations Workflow

## Setup

1. **Supabase CLI installieren** (falls noch nicht vorhanden):

```bash
npm install -g supabase
```

2. **Projekt mit Supabase verknüpfen**:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Migration Commands

### Neue Migration erstellen

```bash
supabase migration new migration_name
```

### Migrations anwenden

```bash
npm run db:migrate
# oder
supabase db push
```

### Migration Status prüfen

```bash
npm run db:status
# oder
supabase migration list
```

### Datenbank zurücksetzen (Vorsicht!)

```bash
npm run db:reset
# oder
supabase db reset
```

### Schema-Unterschiede anzeigen

```bash
npm run db:diff
# oder
supabase db diff
```

## Workflow

### 1. Neue Funktion/Änderung entwickeln

```bash
# Neue Migration erstellen
supabase migration new add_new_feature

# Migration-Datei bearbeiten in:
# supabase/migrations/YYYYMMDDHHMMSS_add_new_feature.sql
```

### 2. Migration testen

```bash
# Lokal anwenden
npm run db:migrate

# Testen ob alles funktioniert
npm run dev
```

### 3. Migration deployen

```bash
# Auf Production anwenden
supabase db push --linked
```

## Ordnerstruktur

```
supabase/
├── config.toml                 # Supabase Konfiguration
├── migrations/                 # Migration Dateien
│   ├── 20240101000001_add_highest_streak.sql
│   ├── 20240101000002_update_highest_streak_trigger.sql
│   └── 20240101000003_update_get_player_stats_function.sql
└── functions/                  # Edge Functions (optional)
```

## Best Practices

1. **Naming Convention**: `YYYYMMDDHHMMSS_descriptive_name.sql`
2. **Atomare Änderungen**: Eine Migration = Eine logische Änderung
3. **Rollback-fähig**: Immer `IF NOT EXISTS` oder `DROP IF EXISTS` verwenden
4. **Kommentare**: Jede Migration dokumentieren
5. **Testen**: Migrations erst lokal, dann auf Production

## Beispiel Migration

```sql
-- Migration: Add new feature
-- Created: 2024-01-01 12:00:00

-- Add new column
ALTER TABLE users
ADD COLUMN IF NOT EXISTS new_field TEXT;

-- Create new function
CREATE OR REPLACE FUNCTION new_function()
RETURNS TEXT AS $$
BEGIN
    RETURN 'Hello World';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```
