#!/usr/bin/env bash
# Serve Interview Prep locally (static files from repo root).
set -euo pipefail

PORT="${PORT:-8888}"
ROOT="$(cd "$(dirname "$0")" && pwd)"

cd "$ROOT"

if lsof -iTCP:"$PORT" -sTCP:LISTEN -P >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Stop the other process or run: PORT=<port> $0" >&2
  exit 1
fi

echo "Interview Prep → http://localhost:$PORT"
exec python3 -m http.server "$PORT"
