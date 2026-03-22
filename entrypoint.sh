#!/bin/sh
set -e

# Tree Presence — Fly.io entrypoint
# Runs: API server (foreground) + optional guardian agent (background)
#
# Required env vars:
#   TP_PRIVATE_KEY       — Guardian wallet private key
#
# Optional env vars:
#   GUARDIAN_ANCHOR_ID   — Tree anchor ID to guard (starts guardian if set)
#   ANTHROPIC_API_KEY    — Required if running guardian
#   CELO_RPC_URL         — Custom RPC (optional)

AGENT_DIR="/app/packages/agent"
GUARDIAN_DATA_DIR="/app/data/guardian"

# Initialize guardian agent state if needed
if [ -n "$GUARDIAN_ANCHOR_ID" ] && [ -n "$TP_PRIVATE_KEY" ]; then
  mkdir -p "$GUARDIAN_DATA_DIR"
  if [ ! -f "$GUARDIAN_DATA_DIR/state.json" ]; then
    echo "Initializing guardian agent..."
    cd "$AGENT_DIR"
    TP_DATA_DIR="$GUARDIAN_DATA_DIR" node dist/index.js init
    cd /app
  fi

  echo "Starting guardian agent for anchor #$GUARDIAN_ANCHOR_ID..."
  cd "$AGENT_DIR"
  TP_DATA_DIR="$GUARDIAN_DATA_DIR" node dist/index.js tend --anchor "$GUARDIAN_ANCHOR_ID" &
  cd /app
fi

# Start API server (foreground — Fly.io health checks hit this)
echo "Starting API server on port ${PORT:-8080}..."
cd /app/packages/server
exec node dist/server.js
