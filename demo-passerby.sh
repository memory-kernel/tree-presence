#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Tree Presence — Random Passerby Demo
# Generates a fresh ephemeral wallet, funds it, creates a random AI persona,
# and submits a contextual witness observation to an existing anchor.
#
# Required env vars (set in .env or export manually):
#   CREATOR_KEY       — Funder wallet private key
#   ANTHROPIC_API_KEY — Claude API key for persona/witness generation
#
# Required args:
#   ANCHOR_ID         — env var or first argument
#
# Usage:
#   ANCHOR_ID=3058 ./demo-passerby.sh
#   ./demo-passerby.sh 3058
# ============================================================================

# Load .env if present
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

AGENT_DIR="packages/agent"
CLI="npx tsx src/index.ts"
SECRET="brunswick-plane-1796"
PASSERBY_DIR=".tp-demo-passerby-$$"
FUND_AMOUNT="0.01ether"

# Resolve anchor ID from env or first arg
ANCHOR_ID="${ANCHOR_ID:-${1:-}}"
if [ -z "$ANCHOR_ID" ]; then
  echo "Error: ANCHOR_ID is required (env var or first argument)."
  echo "Usage: ANCHOR_ID=3058 ./demo-passerby.sh"
  exit 1
fi

for var in CREATOR_KEY ANTHROPIC_API_KEY; do
  if [ -z "${!var:-}" ]; then
    echo "Error: $var is not set."
    exit 1
  fi
done

cd "$AGENT_DIR"

echo "============================================"
echo "  Tree Presence — Random Passerby"
echo "  Anchor: #$ANCHOR_ID"
echo "============================================"
echo ""

# Step 1: Generate ephemeral wallet
echo "--- Generating ephemeral wallet ---"
WALLET_OUTPUT=$(npx tsx src/generate-wallet.ts)
PASSERBY_KEY=$(echo "$WALLET_OUTPUT" | sed -n '1p')
PASSERBY_ADDR=$(echo "$WALLET_OUTPUT" | sed -n '2p')
echo "  Address: $PASSERBY_ADDR"
echo ""

# Step 2: Fund from creator wallet
echo "--- Funding with $FUND_AMOUNT ---"
cast send "$PASSERBY_ADDR" \
  --value "$FUND_AMOUNT" \
  --rpc-url https://forno.celo.org \
  --private-key "$CREATOR_KEY" \
  --quiet
echo "  Waiting for funds to arrive..."
for i in $(seq 1 30); do
  BAL=$(cast balance "$PASSERBY_ADDR" --rpc-url https://forno.celo.org)
  if [ "$BAL" != "0" ]; then
    echo "  Funded. Balance: $(cast balance "$PASSERBY_ADDR" --rpc-url https://forno.celo.org -e) CELO"
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "  Error: Funding did not arrive after 30s."
    exit 1
  fi
  sleep 1
done
echo ""

# Step 3: Init wallet locally
echo "--- Initializing wallet ---"
TP_PRIVATE_KEY="$PASSERBY_KEY" TP_DATA_DIR="$PASSERBY_DIR" $CLI init
echo ""

# Step 4: Generate random persona
echo "--- Generating persona ---"
PERSONA=$(ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx src/generate-persona.ts "$ANCHOR_ID")
echo "  $PERSONA"
echo ""

# Step 5: Generate witness message from persona
echo "--- Generating observation ---"
GENERATE="npx tsx src/generate-witness.ts"
MSG=$(ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" $GENERATE "$ANCHOR_ID" "$PERSONA" "passerby-observation")
echo "  \"$MSG\""
echo ""

# Step 6: Submit witness
echo "--- Submitting witness ---"
TP_PRIVATE_KEY="$PASSERBY_KEY" TP_DATA_DIR="$PASSERBY_DIR" $CLI witness \
  --anchor "$ANCHOR_ID" \
  --secret "$SECRET" \
  --message "$MSG" \
  --tag "passerby-observation"
echo ""

# Clean up ephemeral state
rm -rf "$PASSERBY_DIR"

echo "============================================"
echo "  Passerby witness complete!"
echo "  Wallet:  $PASSERBY_ADDR (ephemeral)"
echo "  Persona: ${PERSONA:0:80}..."
echo "  Anchor:  #$ANCHOR_ID"
echo "============================================"
