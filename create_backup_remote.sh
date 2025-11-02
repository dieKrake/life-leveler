#!/bin/bash
# Remote Datenbank-Backup Script für Supabase (ohne Docker)
# Verwendung: ./create_backup_remote.sh

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Supabase Remote Datenbank Backup ===${NC}"
echo ""

# Supabase Projekt Details
PROJECT_REF="fgdhonpgafwrbxmcebpo"
DB_HOST="db.${PROJECT_REF}.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"

# Timestamp für Backup-Dateiname
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo -e "${BLUE}Projekt: ${PROJECT_REF}${NC}"
echo -e "${BLUE}Host: ${DB_HOST}${NC}"
echo -e "${BLUE}Erstelle Backup: ${BACKUP_FILE}${NC}"
echo ""
echo -e "${BLUE}Hinweis: Sie werden nach Ihrem Datenbank-Passwort gefragt${NC}"
echo ""

# Backup-Ordner erstellen falls nicht vorhanden
if [ ! -d "backups" ]; then
    mkdir backups
    echo -e "${BLUE}Ordner 'backups/' erstellt${NC}"
fi

# pg_dump ausführen
PGPASSWORD="" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    -F p \
    --no-owner \
    --no-acl \
    -f "backups/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Backup erfolgreich erstellt!${NC}"
    echo -e "${GREEN}Datei: backups/${BACKUP_FILE}${NC}"
    
    # Dateigröße anzeigen
    SIZE=$(du -h "backups/$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Größe: ${SIZE}${NC}"
    
    # Anzahl Zeilen
    LINES=$(wc -l < "backups/$BACKUP_FILE")
    echo -e "${GREEN}Zeilen: ${LINES}${NC}"
else
    echo ""
    echo -e "${RED}❌ Backup fehlgeschlagen${NC}"
    echo -e "${RED}Stellen Sie sicher, dass pg_dump installiert ist:${NC}"
    echo -e "${RED}  brew install postgresql${NC}"
    exit 1
fi
