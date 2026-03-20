#!/bin/sh
set -e

# Memory Kernel — Fly.io entrypoint
# Runs: web server (foreground) + optional guardian + optional steward (background)
#
# Required env vars:
#   MK_PRIVATE_KEY       — Guardian wallet private key
#
# Optional env vars for agents:
#   GUARDIAN_ANCHOR_ID   — Tree anchor ID to guard (starts guardian if set)
#   STEWARD_KEY          — Steward wallet private key (different from guardian)
#   STEWARD_PARK_ID      — Park anchor ID (starts steward if set)
#   STEWARD_TREE_IDS     — Comma-separated tree IDs for steward
#   ANTHROPIC_API_KEY    — Required if running guardian or steward
#   CELO_RPC_URL         — Custom RPC (optional)

AGENT_DIR="/app/packages/agent"
GUARDIAN_DATA_DIR="/app/data/guardian"
STEWARD_DATA_DIR="/app/data/steward"

# Initialize guardian agent state if needed
if [ -n "$GUARDIAN_ANCHOR_ID" ] && [ -n "$MK_PRIVATE_KEY" ]; then
  mkdir -p "$GUARDIAN_DATA_DIR"
  if [ ! -f "$GUARDIAN_DATA_DIR/state.json" ]; then
    echo "Initializing guardian agent..."
    cd "$AGENT_DIR"
    MK_DATA_DIR="$GUARDIAN_DATA_DIR" node dist/index.js init
    cd /app
  fi

  echo "Starting guardian agent for anchor #$GUARDIAN_ANCHOR_ID..."
  cd "$AGENT_DIR"
  MK_DATA_DIR="$GUARDIAN_DATA_DIR" node dist/index.js serve --anchor "$GUARDIAN_ANCHOR_ID" &
  cd /app
fi

# Initialize steward agent state if needed
if [ -n "$STEWARD_PARK_ID" ] && [ -n "$STEWARD_TREE_IDS" ] && [ -n "$STEWARD_KEY" ]; then
  mkdir -p "$STEWARD_DATA_DIR"
  if [ ! -f "$STEWARD_DATA_DIR/state.json" ]; then
    echo "Initializing steward agent..."
    cd "$AGENT_DIR"
    MK_PRIVATE_KEY="$STEWARD_KEY" MK_DATA_DIR="$STEWARD_DATA_DIR" node dist/index.js init
    cd /app
  fi

  echo "Starting steward agent for park #$STEWARD_PARK_ID (trees: $STEWARD_TREE_IDS)..."
  cd "$AGENT_DIR"
  MK_PRIVATE_KEY="$STEWARD_KEY" MK_DATA_DIR="$STEWARD_DATA_DIR" \
    node dist/index.js serve-steward --park "$STEWARD_PARK_ID" --trees "$STEWARD_TREE_IDS" &
  cd /app
fi

# Start web server (foreground — Fly.io health checks hit this)
echo "Starting web server on port ${PORT:-8080}..."
cd /app/packages/web
exec node dist/server.js
