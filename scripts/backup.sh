#!/bin/bash

# Configuration
BACKUP_DIR="/path/to/backups"
DB_PATH="/path/to/database.sqlite"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Create backup with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.db"

# Create backup
sqlite3 "$DB_PATH" ".backup '$BACKUP_FILE'"

# Compress backup
gzip "$BACKUP_FILE"

# Remove backups older than retention period
find "$BACKUP_DIR" -name "backup_*.db.gz" -mtime +$RETENTION_DAYS -delete

# Log backup completion
echo "Backup completed: ${BACKUP_FILE}.gz" >> "${BACKUP_DIR}/backup.log" 