#!/bin/bash
# Datenbank-Backup Script für Supabase
# Verwendung: ./create_backup.sh

# Farben für Output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Supabase Datenbank Backup ===${NC}"
echo ""

# Timestamp für Backup-Dateiname
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_${TIMESTAMP}.sql"

echo -e "${BLUE}Erstelle Backup: ${BACKUP_FILE}${NC}"
echo ""

# Supabase DB Dump erstellen
# Hinweis: Sie werden nach Ihrem Datenbank-Passwort gefragt
supabase db dump -f "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Backup erfolgreich erstellt!${NC}"
    echo -e "${GREEN}Datei: ${BACKUP_FILE}${NC}"
    
    # Dateigröße anzeigen
    SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}Größe: ${SIZE}${NC}"
    
    # Backup in backups/ Ordner verschieben (optional)
    if [ ! -d "backups" ]; then
        mkdir backups
        echo -e "${BLUE}Ordner 'backups/' erstellt${NC}"
    fi
    
    mv "$BACKUP_FILE" "backups/$BACKUP_FILE"
    echo -e "${GREEN}Backup verschoben nach: backups/${BACKUP_FILE}${NC}"
else
    echo ""
    echo -e "${RED}❌ Backup fehlgeschlagen${NC}"
    exit 1
fi
