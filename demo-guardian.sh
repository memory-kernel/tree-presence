#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Tree Presence — Tree Guardian Demo
# Runs the full "Brunswick Plane" narrative: anchor a tree, start the guardian agent,
# send three witness attestations, and show the guardian reasoning + results.
#
# Required env vars (set in .env or export manually):
#   CREATOR_KEY      — Private key for the tree creator/guardian wallet
#   WITNESS_A_KEY    — Seasonal observer wallet
#   WITNESS_B_KEY    — Damage reporter wallet
#   WITNESS_C_KEY    — Community observer wallet
#   ANTHROPIC_API_KEY — Claude API key for guardian reasoning
#
# All wallets need a small CELO balance for gas (~0.01 CELO each).
# ============================================================================

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

AGENT_DIR="packages/agent"
CLI="npx tsx src/index.ts"  # tree-presence CLI
SECRET="brunswick-plane-1796"
PROFILE_URL="https://treeappreciation.com/tree/brunswick-plane"
PRESENCE_URL="https://presence.treeappreciation.com"

# Data directories for each wallet
CREATOR_DIR=".tp-demo-creator"
WITNESS_A_DIR=".tp-demo-witness-a"
WITNESS_B_DIR=".tp-demo-witness-b"
WITNESS_C_DIR=".tp-demo-witness-c"
GUARDIAN_LOG="guardian_output.log"

GUARDIAN_PID=""

cleanup() {
  echo ""
  echo "=== Cleaning up ==="
  if [ -n "$GUARDIAN_PID" ] && kill -0 "$GUARDIAN_PID" 2>/dev/null; then
    echo "  Stopping guardian (PID $GUARDIAN_PID)..."
    kill "$GUARDIAN_PID" 2>/dev/null || true
    sleep 1
    # Force kill if still alive
    kill -0 "$GUARDIAN_PID" 2>/dev/null && kill -9 "$GUARDIAN_PID" 2>/dev/null || true
  fi
  # Kill any remaining background jobs
  jobs -p | xargs -r kill 2>/dev/null || true
  echo "  Done."
}
trap cleanup EXIT

# Validate env vars
for var in CREATOR_KEY WITNESS_A_KEY WITNESS_B_KEY WITNESS_C_KEY ANTHROPIC_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set."
    echo "Export all required keys before running this script."
    exit 1
  fi
done

cd "$AGENT_DIR"

echo "============================================"
echo "  Tree Presence — Brunswick Plane Guardian Demo"
echo "============================================"
echo ""

# ---- Phase 1: Setup ----
echo "=== Phase 1: Setup ==="
echo ""

# Check if reusing an existing anchor
ANCHOR_ID="${ANCHOR_ID:-}"
if [ -n "$ANCHOR_ID" ]; then
  echo "  Reusing existing anchor: #$ANCHOR_ID"
  echo "  Skipping anchor creation."
  echo ""
else
  # Anchor the tree
  echo "--- Rooting 'The Brunswick Plane' ---"
  ANCHOR_OUTPUT=$(TP_PRIVATE_KEY="$CREATOR_KEY" TP_DATA_DIR="$CREATOR_DIR" $CLI root \
    --type tree-presence \
    --name "The Brunswick Plane" \
    --secret "$SECRET" \
    --description "Majestic plane tree planted c.1796, believed to be the second oldest in central London. Located at 51.524267, -0.122136." \
    --profile-url "$PROFILE_URL" \
    --presence-url "$PRESENCE_URL" 2>&1)
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
fi

# Init all wallets (idempotent — skips if already initialized)
echo "--- Initializing wallets ---"
TP_PRIVATE_KEY="$CREATOR_KEY" TP_DATA_DIR="$CREATOR_DIR" $CLI init
TP_PRIVATE_KEY="$WITNESS_A_KEY" TP_DATA_DIR="$WITNESS_A_DIR" $CLI init
TP_PRIVATE_KEY="$WITNESS_B_KEY" TP_DATA_DIR="$WITNESS_B_DIR" $CLI init
TP_PRIVATE_KEY="$WITNESS_C_KEY" TP_DATA_DIR="$WITNESS_C_DIR" $CLI init
echo ""

# ---- Phase 2: Start Guardian ----
echo "=== Phase 2: Start Guardian Agent ==="
echo ""
echo "  Starting guardian for anchor #$ANCHOR_ID..."
echo "  Output will be logged to $GUARDIAN_LOG"
echo ""

TP_PRIVATE_KEY="$CREATOR_KEY" TP_DATA_DIR="$CREATOR_DIR" ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" \
  $CLI tend --anchor "$ANCHOR_ID" --model "claude-haiku-4-5-20251001" 2>&1 | tee "$GUARDIAN_LOG" &
GUARDIAN_PID=$!

echo "  Guardian PID: $GUARDIAN_PID"
echo "  Waiting 5s for guardian to start polling..."
sleep 5
echo ""

# ---- Phase 3: Witnesses ----
echo "=== Phase 3: Witness Attestations ==="
echo ""
echo "  Generating unique witness observations from tree state..."
echo ""

GENERATE="npx tsx src/generate-witness.ts"

echo "--- Witness A: The Mycologist ---"
PERSONA_A="a field mycologist who sees trees as the visible tip of underground fungal networks. \
You notice soil conditions, bracket fungi, mycelial threads at the base, moisture patterns, \
and signs of symbiotic exchange. You think in terms of what's happening beneath the surface \
and how this tree connects to the wider ecosystem through its roots and fungal partners. \
Your language is precise but wondering — you find the hidden world genuinely astonishing."
MSG_A=$(ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" $GENERATE "$ANCHOR_ID" \
  "$PERSONA_A" \
  "ecological-observation")
echo "  Generated: \"$MSG_A\""
TP_PRIVATE_KEY="$WITNESS_A_KEY" TP_DATA_DIR="$WITNESS_A_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "$MSG_A" \
  --tag "ecological-observation"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

echo "--- Witness B: The Urban Sketcher ---"
PERSONA_B="an urban sketcher who has drawn this tree in different seasons for years. \
You notice light, shadow, negative space, the geometry of branches, the way the canopy \
frames the sky. You think in terms of composition, texture, and how the tree holds space \
in the streetscape. You're drawn to details most people walk past — the way bark catches \
afternoon light, how a branch creates a perfect arch, the silhouette against buildings. \
Your language is visual and intimate, like notes in a sketchbook margin."
MSG_B=$(ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" $GENERATE "$ANCHOR_ID" \
  "$PERSONA_B" \
  "aesthetic-observation")
echo "  Generated: \"$MSG_B\""
TP_PRIVATE_KEY="$WITNESS_B_KEY" TP_DATA_DIR="$WITNESS_B_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "$MSG_B" \
  --tag "aesthetic-observation"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

echo "--- Witness C: The Grandparent ---"
PERSONA_C="a grandparent who brings their grandchild to visit this tree every few weeks. \
You notice how the tree marks time — the grandchild was knee-high when you started coming, \
now they climb the lower branches. You think in terms of memory, continuity, and what endures. \
You notice other people's relationships with the tree too — the jogger who always touches \
the trunk, the couple who sit beneath it. Your language is warm, unhurried, and rooted in \
the particular. You speak as someone who has watched this place change."
MSG_C=$(ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" $GENERATE "$ANCHOR_ID" \
  "$PERSONA_C" \
  "community-observation")
echo "  Generated: \"$MSG_C\""
TP_PRIVATE_KEY="$WITNESS_C_KEY" TP_DATA_DIR="$WITNESS_C_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "$MSG_C" \
  --tag "community-observation"
echo ""
echo "  Waiting 15s for guardian to process..."
sleep 15
echo ""

# ---- Phase 4: Results ----
echo "=== Phase 4: Results ==="
echo ""

echo "--- Resolving anchor state ---"
TP_PRIVATE_KEY="$CREATOR_KEY" TP_DATA_DIR="$CREATOR_DIR" $CLI inspect --anchor "$ANCHOR_ID"
echo ""

echo "--- JSON output ---"
TP_PRIVATE_KEY="$CREATOR_KEY" TP_DATA_DIR="$CREATOR_DIR" $CLI inspect --anchor "$ANCHOR_ID" --json
echo ""

echo "============================================"
echo "  Demo Complete!"
echo "  Anchor ID: $ANCHOR_ID"
echo "  Guardian log: $AGENT_DIR/$GUARDIAN_LOG"
echo "============================================"
