#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Tree Presence — Tree Response Demo
# The tree looks at its accumulated inscriptions and responds to one.
# Run this AFTER demo-guardian.sh has created witnesses.
#
# Required env vars (set in .env or export manually):
#   CREATOR_KEY       — Private key for the tree owner wallet
#   ANCHOR_ID         — The tree's ERC-8004 agent ID
#   ANTHROPIC_API_KEY — Claude API key
# ============================================================================

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

for var in CREATOR_KEY ANCHOR_ID ANTHROPIC_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
done

cd packages/agent

echo "============================================"
echo "  Tree Presence — Tree Response"
echo "============================================"
echo ""
echo "  The tree reviews its inscriptions and"
echo "  chooses one to respond to."
echo ""

TP_PRIVATE_KEY="$CREATOR_KEY" ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  npx tsx src/tree-respond.ts "$ANCHOR_ID"

echo ""
echo "============================================"
