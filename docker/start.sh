#!/bin/sh
set -eu

echo "Starting agent on ${AGENT_HOST:-127.0.0.1}:${AGENT_PORT:-8787} ..."
node /opt/app/agent/server.js &
AGENT_PID=$!

cleanup() {
  echo "Stopping services..."
  kill "$AGENT_PID" 2>/dev/null || true
}

trap cleanup INT TERM EXIT

echo "Starting nginx on port ${NGINX_PORT:-80} ..."
nginx -g 'daemon off;' &
NGINX_PID=$!

wait "$NGINX_PID"
