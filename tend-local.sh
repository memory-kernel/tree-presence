#!/bin/sh
# Run the tend (guardian) agent locally for testing.
# Uses .env vars and the creator wallet state that owns anchor 3058.
# Short interval (30s) for testing — production uses 24h default.

set -e

cd "$(dirname "$0")/packages/agent"

# Load .env from project root
set -a
. ../../.env
set +a

export TP_PRIVATE_KEY="$CREATOR_KEY"
export TP_DATA_DIR=".tp-demo-creator"

echo "Starting tend for The Brunswick Plane (anchor #3058)..."
echo "Using wallet state: $TP_DATA_DIR"
echo "Interval: 30s (testing)"
echo ""

npx tsx src/index.ts tend --anchor 3058 --interval 30 --model claude-haiku-4-5-20251001
