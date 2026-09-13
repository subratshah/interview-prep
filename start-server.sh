#!/usr/bin/env bash
# Serve Interview Prep locally (static files from repo root).
set -euo pipefail

PORT="${PORT:-1000}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

if lsof -iTCP:"$PORT" -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Stop the other process or run: PORT=<port> $0" >&2
  exit 1
fi

# python's http.server binds every interface by default, so the app is also
# reachable from other devices on the local network; work out that address so
# the URL can be printed. Best effort: an empty result just skips the line.
LAN_IP="$(ipconfig getifaddr en0 2>/dev/null || true)"
if [ -z "$LAN_IP" ]; then
  LAN_IP="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
fi
case "$LAN_IP" in
  *.*.*.*) ;;
  *) LAN_IP="" ;;
esac

echo "Interview Prep → http://localhost:$PORT"
if [ -n "$LAN_IP" ]; then
  echo "Local network  → http://$LAN_IP:$PORT"
fi

exec PORT="$PORT" node server/proxy-server.js
