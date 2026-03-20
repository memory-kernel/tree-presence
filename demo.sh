#!/usr/bin/env bash
# Memory Kernel Demo — Full CLI flow
#
# Prerequisites:
#   1. cd packages/agent && npm install
#   2. Export two funded Celo wallets:
#      export CREATOR_KEY=0x...   # Wallet that creates anchors
#      export WITNESS_KEY=0x...   # Different wallet that witnesses encounters
#
# The two wallets are needed because ERC-8004's ReputationRegistry enforces
# that witnesses must be different from the anchor owner — a feature, not a bug.
# This ensures authentic encounter attestations.

set -euo pipefail

AGENT_CMD="npx tsx src/index.ts"
CREATOR_DIR=".mk-agent-creator"
WITNESS_DIR=".mk-agent-witness"

cd "$(dirname "$0")/packages/agent"

echo "============================================"
echo "  Memory Kernel Agent — Demo"
echo "  Physical objects → verifiable digital identities"
echo "============================================"
echo ""

# --- Step 1: Initialize creator agent ---
echo ">>> Step 1: Initialize creator agent (manages physical objects)"
echo ""
MK_PRIVATE_KEY="${CREATOR_KEY:?Set CREATOR_KEY to a funded Celo wallet private key}" \
  MK_DATA_DIR="$CREATOR_DIR" $AGENT_CMD init
echo ""

# --- Step 2: Create an anchor for a vinyl record ---
echo ">>> Step 2: Create anchor for 'Kind of Blue' vinyl record"
echo "    This mints an ERC-8004 identity NFT with a binding commitment."
echo ""
MK_DATA_DIR="$CREATOR_DIR" $AGENT_CMD anchor \
  --type vinyl-record \
  --name "Kind of Blue" \
  --secret "miles-davis-1959" \
  --description "Original pressing of Miles Davis — Kind of Blue, NFC-tagged and gifted"
echo ""

# Capture the anchor ID from the agent state
ANCHOR_ID=$(cat "$CREATOR_DIR/state.json" | npx tsx -e "
  const s = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
  console.log(Object.keys(s.anchors).pop())
")
echo "Anchor ID: $ANCHOR_ID"
echo ""

# --- Step 3: Initialize witness agent (simulating a different person) ---
echo ">>> Step 3: Initialize witness agent (simulating a person encountering the record)"
echo ""
MK_PRIVATE_KEY="${WITNESS_KEY:?Set WITNESS_KEY to a funded Celo wallet private key}" \
  MK_DATA_DIR="$WITNESS_DIR" $AGENT_CMD init
echo ""

# --- Step 4: Witness the encounter ---
echo ">>> Step 4: Record witness — the person proves they encountered the record"
echo "    The secret is verified against the on-chain binding commitment."
echo ""
MK_DATA_DIR="$WITNESS_DIR" $AGENT_CMD witness \
  --anchor "$ANCHOR_ID" \
  --secret "miles-davis-1959" \
  --message "Miles Davis changed my life"
echo ""

# --- Step 5: Resolve the anchor ---
echo ">>> Step 5: Resolve anchor — read full state with accumulated witnesses"
echo ""
$AGENT_CMD resolve --anchor "$ANCHOR_ID"
echo ""

# --- Step 6: Verify witness integrity ---
echo ">>> Step 6: Verify witness content integrity"
echo "    Check that the message matches the on-chain feedbackHash."
echo ""
$AGENT_CMD verify \
  --anchor "$ANCHOR_ID" \
  --witness 0 \
  --content "Miles Davis changed my life"
echo ""

echo "============================================"
echo "  Demo complete!"
echo "  All transactions are verifiable on Celoscan:"
echo "  https://celoscan.io"
echo "============================================"
