#!/bin/sh
# Wrapper script to run the backup inside the backend container or host
# Usage: ./cte-backup.sh

SCRIPT_DIR=$(dirname "$0")
NODE=$(which node || echo /usr/bin/node)

if [ ! -x "$NODE" ]; then
  echo "Node not found in PATH. Ensure Node is available." >&2
  exit 1
fi

echo "Ejecutando backup vía Node runner..."
NODE_PATH="$SCRIPT_DIR/../" "$NODE" "$SCRIPT_DIR/run_backup.js"
