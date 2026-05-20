#!/bin/sh
set -eu

APP_USER="${APP_USER:-appuser}"
APP_GROUP="${APP_GROUP:-appuser}"
APP_ROOT="${APP_ROOT:-/app}"
ENTRYPOINT_SOURCE="docker-entrypoint"

log() {
  level="$1"
  message="$2"
  printf '%s %s source=%s message="%s"\n' "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" "$level" "$ENTRYPOINT_SOURCE" "$message"
}

prepare_directory() {
  directory="$1"

  if [ ! -d "$directory" ]; then
    mkdir -p "$directory"
  fi

  if chown -R "$APP_USER:$APP_GROUP" "$directory" 2>/dev/null; then
    log "INFO" "Prepared runtime directory ownership for $directory."
    return
  fi

  log "WARN" "Failed to change ownership for $directory; check bind mount permissions or read-only volume settings."
}

if [ "$(id -u)" = "0" ]; then
  prepare_directory "$APP_ROOT/config"
  prepare_directory "$APP_ROOT/data"

  if command -v runuser >/dev/null 2>&1; then
    exec runuser -u "$APP_USER" -- "$@"
  fi

  exec su -s /bin/sh "$APP_USER" -c 'exec "$@"' -- "$@"
fi

exec "$@"
