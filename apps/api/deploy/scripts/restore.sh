#!/usr/bin/env bash
# Restore a ApnaStore MongoDB backup created by backup.sh
# Usage:
#   ./restore.sh /var/backups/apnastore/apnastore_YYYYMMDD_HHMMSS.tar.gz
set -euo pipefail

ARCHIVE="${1:-}"
DB_NAME="${MONGODB_DB_NAME:-apnastore}"
MONGODB_URI="${MONGODB_URI:-mongodb://127.0.0.1:27017}"
TMP_DIR="${TMPDIR:-/tmp}/apnastore-restore-$$"

if [[ -z "$ARCHIVE" || ! -f "$ARCHIVE" ]]; then
  echo "Usage: $0 /path/to/backup.tar.gz" >&2
  exit 1
fi

echo "==> Restoring $ARCHIVE into database '$DB_NAME'"
mkdir -p "$TMP_DIR"
tar -xzf "$ARCHIVE" -C "$TMP_DIR"

DUMP_DIR="$(find "$TMP_DIR" -maxdepth 2 -type d -name "$DB_NAME" | head -n 1)"
if [[ -z "$DUMP_DIR" ]]; then
  DUMP_DIR="$(find "$TMP_DIR" -maxdepth 2 -type d | tail -n 1)"
fi

if [[ -z "$DUMP_DIR" || ! -d "$DUMP_DIR" ]]; then
  echo "Could not locate dump directory inside archive" >&2
  rm -rf "$TMP_DIR"
  exit 1
fi

# Drop + restore. Confirm interactively unless FORCE_RESTORE=1
if [[ "${FORCE_RESTORE:-0}" != "1" ]]; then
  read -r -p "This will REPLACE database '$DB_NAME'. Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborted."
    rm -rf "$TMP_DIR"
    exit 1
  fi
fi

mongorestore --uri="$MONGODB_URI" --db="$DB_NAME" --drop "$DUMP_DIR"
rm -rf "$TMP_DIR"
echo "Restore complete."
