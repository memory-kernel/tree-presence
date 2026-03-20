#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Memory Kernel — Tree Guardian Demo
# Runs the full "Old Oak" narrative: anchor a tree, start the guardian agent,
# send three witness attestations, and show the guardian reasoning + results.
#
# Required env vars:
#   CREATOR_KEY      — Private key for the tree creator/guardian wallet
#   WITNESS_KEY_A    — Seasonal observer wallet
#   WITNESS_KEY_B    — Damage reporter wallet
#   WITNESS_KEY_C    — Community observer wallet
#   ANTHROPIC_API_KEY — Claude API key for guardian reasoning
#
# All wallets need a small CELO balance for gas (~0.01 CELO each).
# ============================================================================

AGENT_DIR="packages/agent"
CLI="npx tsx src/index.ts"
SECRET="park-bench-left"
SERVICE_URL="https://treeappreciation.com"

# Data directories for each wallet
CREATOR_DIR=".mk-demo-creator"
WITNESS_A_DIR=".mk-demo-witness-a"
WITNESS_B_DIR=".mk-demo-witness-b"
WITNESS_C_DIR=".mk-demo-witness-c"
GUARDIAN_LOG="guardian_output.log"

GUARDIAN_PID=""

cleanup() {
  echo ""
  echo "=== Cleaning up ==="
  if [ -n "$GUARDIAN_PID" ] && kill -0 "$GUARDIAN_PID" 2>/dev/null; then
    echo "  Stopping guardian (PID $GUARDIAN_PID)..."
    kill "$GUARDIAN_PID" 2>/dev/null || true
    wait "$GUARDIAN_PID" 2>/dev/null || true
  fi
  echo "  Done."
}
trap cleanup EXIT

# Validate env vars
for var in CREATOR_KEY WITNESS_KEY_A WITNESS_KEY_B WITNESS_KEY_C ANTHROPIC_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set."
    echo "Export all required keys before running this script."
    exit 1
  fi
done

cd "$AGENT_DIR"

echo "============================================"
echo "  Memory Kernel — Tree Guardian Demo"
echo "============================================"
echo ""

# ---- Phase 1: Setup ----
echo "=== Phase 1: Setup ==="
echo ""

# Init creator wallet
echo "--- Initializing creator wallet ---"
MK_PRIVATE_KEY="$CREATOR_KEY" MK_DATA_DIR="$CREATOR_DIR" $CLI init
echo ""

# Init witness wallets
echo "--- Initializing witness wallets ---"
MK_PRIVATE_KEY="$WITNESS_KEY_A" MK_DATA_DIR="$WITNESS_A_DIR" $CLI init
MK_PRIVATE_KEY="$WITNESS_KEY_B" MK_DATA_DIR="$WITNESS_B_DIR" $CLI init
MK_PRIVATE_KEY="$WITNESS_KEY_C" MK_DATA_DIR="$WITNESS_C_DIR" $CLI init
echo ""

# Anchor the tree
echo "--- Anchoring 'Old Oak' ---"
ANCHOR_OUTPUT=$(MK_PRIVATE_KEY="$CREATOR_KEY" MK_DATA_DIR="$CREATOR_DIR" $CLI anchor \
  --type tree \
  --name "Old Oak" \
  --secret "$SECRET" \
  --description "A centuries-old oak tree in the community park, beloved gathering place" \
  --service-url "$SERVICE_URL" 2>&1)
echo "$ANCHOR_OUTPUT"

# Extract anchor ID from output
ANCHOR_ID=$(echo "$ANCHOR_OUTPUT" | grep "Anchor ID:" | awk '{print $NF}')
if [ -z "$ANCHOR_ID" ]; then
  echo "Error: Could not extract Anchor ID from output."
  exit 1
fi
echo ""
echo "  Tree anchored with ID: $ANCHOR_ID"
echo ""

# ---- Phase 2: Start Guardian ----
echo "=== Phase 2: Start Guardian Agent ==="
echo ""
echo "  Starting guardian for anchor #$ANCHOR_ID..."
echo "  Output will be logged to $GUARDIAN_LOG"
echo ""

MK_PRIVATE_KEY="$CREATOR_KEY" MK_DATA_DIR="$CREATOR_DIR" ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  $CLI serve --anchor "$ANCHOR_ID" 2>&1 | tee "$GUARDIAN_LOG" &
GUARDIAN_PID=$!

echo "  Guardian PID: $GUARDIAN_PID"
echo "  Waiting 5s for guardian to start polling..."
sleep 5
echo ""

# ---- Phase 3: Witnesses ----
echo "=== Phase 3: Witness Attestations ==="
echo ""

echo "--- Witness A: Seasonal Observer ---"
MK_PRIVATE_KEY="$WITNESS_KEY_A" MK_DATA_DIR="$WITNESS_A_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "Leaves are turning golden, a few bare branches on the east side. Early autumn." \
  --tag "seasonal-observation"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

echo "--- Witness B: Damage Reporter ---"
MK_PRIVATE_KEY="$WITNESS_KEY_B" MK_DATA_DIR="$WITNESS_B_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "Noticed bark damage near the base — looks like a lawnmower hit it. About 15cm scar." \
  --tag "damage-report"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

echo "--- Witness C: Community Observer ---"
MK_PRIVATE_KEY="$WITNESS_KEY_C" MK_DATA_DIR="$WITNESS_C_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "Beautiful day. Kids were climbing it. Healthy canopy, full shade." \
  --tag "community-observation"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

# ---- Phase 4: Results ----
echo "=== Phase 4: Results ==="
echo ""

echo "--- Resolving anchor state ---"
MK_PRIVATE_KEY="$CREATOR_KEY" MK_DATA_DIR="$CREATOR_DIR" $CLI resolve --anchor "$ANCHOR_ID"
echo ""

echo "--- JSON output ---"
MK_PRIVATE_KEY="$CREATOR_KEY" MK_DATA_DIR="$CREATOR_DIR" $CLI resolve --anchor "$ANCHOR_ID" --json
echo ""

echo "============================================"
echo "  Demo Complete!"
echo "  Anchor ID: $ANCHOR_ID"
echo "  Guardian log: $AGENT_DIR/$GUARDIAN_LOG"
echo "============================================"
