#!/usr/bin/env bash
# MongoDB backup for HStock (daily cron recommended)
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/var/backups/hstock}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
DB_NAME="${MONGODB_DB_NAME:-hstock}"
STAMP="$(date +%Y%m%d_%H%M%S)"
OUT="$BACKUP_DIR/${DB_NAME}_$STAMP"

mkdir -p "$BACKUP_DIR"
mongodump --db "$DB_NAME" --out "$OUT"
tar -czf "${OUT}.tar.gz" -C "$BACKUP_DIR" "${DB_NAME}_$STAMP"
rm -rf "$OUT"

find "$BACKUP_DIR" -type f -name '*.tar.gz' -mtime +"$RETENTION_DAYS" -delete
echo "Backup written: ${OUT}.tar.gz"
