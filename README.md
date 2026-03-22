# Tree Presence

**Physical trees get verifiable digital presence through human encounter.**

A 230-year-old plane tree in central London has survived wars, construction, and climate shifts — but it has no digital memory. Human attention to it is intermittent and fragmented. Someone visits in spring, someone else in autumn, a third person notices storm damage in winter. Each observation is valuable. None of them connect.

Tree Presence gives trees an on-chain identity, a mechanism for accumulating encounters, and an autonomous AI agent that holds the thread between visits. The agent doesn't generate knowledge. Humans do that by showing up. The agent provides **continuity**.

This is the first implementation of [Tree Presence](docs/narrative.md) — infrastructure for any physical thing (trees, books, benches, coral formations) to acquire verifiable digital presence. The tree is where it starts.

> **Synthesis Hackathon 2026** — [Bounty Alignment](#bounty-alignment) | [Live Demo](#live-demo) | [Architecture](#architecture)

---

## Live Demo

**The Brunswick Plane is live: [brunswick-plane.treeappreciation.com](https://brunswick-plane.treeappreciation.com)**

A ~230-year-old London plane tree in Brunswick Square, registered as [ERC-8004 identity #3058](https://celoscan.io/token/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432?a=3058) on Celo. Its guardian agent wakes daily, observes its state, and reasons about what to do. You can browse its witness history, read guardian responses, and talk to it — the tree responds as itself, drawing on its accumulated encounters. Conversation is gated by x402 micropayment.

- **Browse** — view the tree's identity, metadata, witness inscriptions, and guardian responses
- **Converse** — talk to the tree (x402 payment required)
- **API** — [`/api/docs`](https://brunswick-plane.treeappreciation.com/api/docs) for full endpoint documentation

---

## How It Works

```
Root a tree → People witness it → An agent holds the thread
```

1. **Root** — register a tree as an on-chain identity (ERC-8004 on Celo). It gets a permanent identifier, metadata, and a binding secret that proves physical encounter.

2. **Witness** — anyone who encounters the tree submits a signed attestation. The witness includes an observation, a content hash, and optionally a proof of physical presence. Each witness is an on-chain transaction — permanent, verifiable, attributable.

3. **Tend** — an autonomous AI agent (the guardian) wakes up once per day, observes its own state — the time, the season, its on-chain metadata, and any new witnesses since it last woke — then reasons about what to do. It might respond to a witness, update its seasonal metadata, flag a concerning report, or simply note that all is quiet. The tree has its own rhythm; it is not purely reactive. In production this runs as a background process on Fly.io, waking every 24 hours.

4. **Converse** — the tree offers a paid conversational endpoint (x402). Anyone can talk to it. The tree draws on its accumulated inscriptions and responds as itself. Revenue sustains the agent's inference costs — the tree funds its own aliveness.

---

## What's Built

### `tree-presence` CLI

Command-line tool for the full root → witness → guardian loop:

| Command | Description |
|---------|-------------|
| `tree-presence init` | Initialize a local wallet |
| `tree-presence root` | Root a tree on-chain via ERC-8004 (two-tx flow: identity + services) |
| `tree-presence witness` | Submit a signed encounter attestation with optional physical-presence proof |
| `tree-presence inspect` | Read full on-chain state: identity, metadata, witnesses, confidence score |
| `tree-presence verify` | Verify witness content integrity against on-chain hashes |
| `tree-presence tend` | Start the guardian agent — wakes daily, observes state + witnesses, reasons with Claude, acts on-chain |
| `tree-presence steward` | Start the park steward (monitors multiple trees) — *experimental, untested* |

### API Server

Hono server exposing the tree's presence as a JSON API. Live at `https://brunswick-plane.treeappreciation.com`.

#### `GET /api/docs` — Service Discovery

Returns full API documentation, contract addresses, and endpoint descriptions. No parameters.

**Response:**
```json
{
  "name": "Tree Presence API",
  "description": "API for interacting with a tree's on-chain digital presence...",
  "anchorId": 3058,
  "chain": "celo",
  "contracts": {
    "identityRegistry": "0x8004A169FB4a3325136EB29fA0ceB6D2e539a432",
    "reputationRegistry": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63"
  },
  "endpoints": {
    "status": { "method": "GET", "path": "...", "description": "...", "returns": { "..." } },
    "witness": { "method": "POST", "path": "...", "description": "...", "parameters": { "..." }, "returns": { "..." } },
    "converse": { "method": "POST", "path": "...", "description": "...", "payment": { "protocol": "x402", "..." }, "parameters": { "..." }, "returns": { "..." } }
  }
}
```

This endpoint is designed for agent-to-agent discovery — an ERC-8004 agent that finds this tree's service endpoints on-chain can call `/api/docs` to learn the full API contract.

#### `GET /api/status` — Tree State

Returns the tree's complete on-chain state.

**Response:**
```json
{
  "id": 3058,
  "owner": "0x...",
  "registration": { "type": "...", "name": "...", "services": [...] },
  "services": [
    { "name": "profile", "endpoint": "https://brunswick-plane.treeappreciation.com" },
    { "name": "witness", "endpoint": "https://brunswick-plane.treeappreciation.com/api/witness" },
    { "name": "converse", "endpoint": "https://brunswick-plane.treeappreciation.com/api/converse" }
  ],
  "metadata": { "type": "tree-presence", "name": "The Brunswick Plane", "health": "...", "season": "...", "latitude": "51.524267", "longitude": "-0.122136" },
  "witnesses": [
    {
      "index": 0,
      "from": "0x...",
      "tag1": "witness",
      "tag2": "secret-proof",
      "message": "First leaves of spring emerging...",
      "feedbackHash": "0x...",
      "blockNumber": "...",
      "timestamp": 1711100000,
      "txHash": "0x..."
    }
  ],
  "responses": [
    {
      "clientAddress": "0x...",
      "feedbackIndex": 0,
      "message": "Guardian acknowledgment...",
      "responseHash": "0x...",
      "blockNumber": "...",
      "timestamp": 1711100060,
      "txHash": "0x..."
    }
  ],
  "summary": { "count": 5, "confidence": 100 }
}
```

#### `POST /api/witness` — Prepare Witness Transaction

Prepares encoded calldata for a witness attestation. The server does **not** sign — your wallet does.

**Request body:**
```json
{
  "message": "The bark looks healthy, new growth visible on the lower canopy.",
  "witnessAddress": "0x...",
  "tag1": "ecological-observation",
  "secret": "optional-binding-secret"
}
```

- `message` (required) — what you observed
- `witnessAddress` (required) — your Celo address (must differ from tree owner)
- `tag1` (optional, default `"witness"`) — observation type (e.g., `"ecological-observation"`, `"damage-report"`, `"community-observation"`)
- `secret` (optional) — binding secret proving physical encounter. Must match the on-chain binding commitment or the request is rejected.

**Response:**
```json
{
  "to": "0x8004BAa17C55a88189AE136b182e5fdA19dE9b63",
  "data": "0x...",
  "verified": true
}
```

- `to` — Reputation Registry contract address
- `data` — encoded `giveFeedback()` calldata to sign and submit
- `verified` — whether the secret matched the on-chain binding commitment

**Errors:** `400` if message/address missing, witness is the tree owner, or secret doesn't match.

#### `POST /api/converse` — Talk to the Tree

The tree responds as itself, drawing on its accumulated witness inscriptions, metadata, and history. Payment required via x402 when enabled.

**Request body:**
```json
{
  "message": "What have you seen this spring?",
  "history": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Good day..." }
  ]
}
```

- `message` (required) — what you want to say to the tree
- `history` (optional) — prior conversation turns for multi-turn dialogue

**Response:**
```json
{
  "response": "The first warmth of March has reached my roots..."
}
```

**Payment (x402):** When `X402_PAY_TO` is configured, this endpoint requires a micropayment header. The facilitator verifies payment before the request proceeds. Status, witness, and docs endpoints remain free.

**Errors:** `400` if message missing, `503` if `ANTHROPIC_API_KEY` not configured.

### Frontend

React + Vite web application for browsing tree presence, viewing witness history, and conversing with trees.

### Demo Scripts

Five scripts that exercise different agentic interactions with a tree. Useful for anyone spinning up their own tree presence.

#### `demo.sh` — Basic CLI Flow

The simplest end-to-end demo. Roots a vinyl record (not a tree — showing the kernel generalises), witnesses it from a second wallet, resolves state, and verifies content integrity. Good for understanding the core primitive loop.

```bash
export CREATOR_KEY=0x...
export WITNESS_KEY=0x...
./demo.sh
```

#### `demo-guardian.sh` — Full Guardian Narrative

The flagship demo. Roots The Brunswick Plane, starts an autonomous guardian agent, then sends three AI-generated witness observations from distinct personas — a mycologist, an urban sketcher, and a grandparent. Each persona reads the tree's current on-chain state before generating its observation, so witnesses build on each other. The guardian reasons about each witness and responds on-chain.

Set `ANCHOR_ID` to skip tree creation and witness against an existing tree.

```bash
export CREATOR_KEY=0x...
export WITNESS_A_KEY=0x...
export WITNESS_B_KEY=0x...
export WITNESS_C_KEY=0x...
export ANTHROPIC_API_KEY=sk-ant-...
./demo-guardian.sh

# Or reuse an existing tree:
ANCHOR_ID=3058 ./demo-guardian.sh
```

#### `demo-passerby.sh` — Ephemeral Witness

Simulates a random passerby encountering a tree. Generates an ephemeral wallet, funds it from the creator wallet, creates a random AI persona (via `generate-persona.ts`), generates a contextual observation from that persona (via `generate-witness.ts`), submits the witness, and discards the wallet. Run it multiple times to accumulate diverse observations.

```bash
export CREATOR_KEY=0x...
export ANTHROPIC_API_KEY=sk-ant-...
ANCHOR_ID=3058 ./demo-passerby.sh
```

#### `demo-tree-responds.sh` — Tree Voice

The tree reviews its accumulated inscriptions and responds to one as itself. Run after witnesses have been submitted. The tree speaks in first person, drawing on its full history of encounters.

```bash
export CREATOR_KEY=0x...
export ANCHOR_ID=3058
export ANTHROPIC_API_KEY=sk-ant-...
./demo-tree-responds.sh
```

#### `tend-local.sh` — Local Guardian Testing

Runs the guardian agent locally with a short polling interval (30s) for development and testing. Loads `.env` from the project root and tends The Brunswick Plane. Useful for iterating on guardian reasoning without deploying.

```bash
# Expects .env with CREATOR_KEY and ANTHROPIC_API_KEY
./tend-local.sh
```

---

## Quickstart — Spin Up a Tree Presence

### Prerequisites

- Node.js 22+
- A Celo wallet with ~0.05 CELO for gas ([get CELO](https://celo.org))
- An [Anthropic API key](https://console.anthropic.com/) (for the guardian agent)
- A second funded wallet for witnessing (the contract requires witnesses to differ from the tree owner)

### 1. Install

```bash
git clone https://github.com/memory-kernel/tree-presence.git
cd tree-presence
cd packages/agent && npm install
```

### 2. Root Your Tree

```bash
export TP_PRIVATE_KEY=0x...your-private-key...

# Initialize wallet
npx tsx src/index.ts init

# Root a tree
npx tsx src/index.ts root \
  --type tree-presence \
  --name "My Favourite Oak" \
  --secret "oak-tree-secret-phrase" \
  --description "Ancient oak at the edge of the meadow"
```

Note the **Anchor ID** printed in the output.

You can optionally add `--profile-url` and `--presence-url` to register discoverable service endpoints with the tree's ERC-8004 identity.

### 3. Witness It (from a different wallet)

```bash
export TP_PRIVATE_KEY=0x...different-wallet...
npx tsx src/index.ts init

npx tsx src/index.ts witness \
  --anchor <ANCHOR_ID> \
  --secret "oak-tree-secret-phrase" \
  --message "First leaves of spring are emerging. Bark looks healthy."
```

### 4. Start the Guardian

```bash
export TP_PRIVATE_KEY=0x...creator-wallet...
export ANTHROPIC_API_KEY=sk-ant-...

npx tsx src/index.ts tend --anchor <ANCHOR_ID>
```

The guardian wakes every 24 hours (default), reads its full on-chain state and any new witnesses, reasons about what to do using Claude, and acts — updating metadata, responding to witnesses, or logging observations. Use `--interval <seconds>` to adjust the wake cycle (e.g., `--interval 30` for testing).

### 5. Inspect the Tree

```bash
npx tsx src/index.ts inspect --anchor <ANCHOR_ID>
npx tsx src/index.ts inspect --anchor <ANCHOR_ID> --json
```

### 6. Run the Full Demo (optional)

To run the complete multi-persona demo with AI-generated witnesses:

```bash
cd ../..  # back to repo root

export CREATOR_KEY=0x...
export WITNESS_A_KEY=0x...
export WITNESS_B_KEY=0x...
export WITNESS_C_KEY=0x...
export ANTHROPIC_API_KEY=sk-ant-...

./demo-guardian.sh
```

This roots a tree, starts a guardian, and sends three witness observations from a mycologist, an urban sketcher, and a grandparent — each generating unique observations grounded in the tree's current on-chain state.

---

## Deploy to Fly.io

See [docs/deployment.md](docs/deployment.md) for step-by-step deployment instructions. The deployment runs a single machine with:

- **API server** (foreground) — JSON endpoints on port 8080, serves the React frontend
- **Guardian agent** (background) — wakes every 24 hours, observes the tree's environment and accumulated witnesses, reasons about what action to take (respond, update metadata, log observation), then acts on-chain
- **Park steward** (background, optional) — monitors multiple trees *(experimental)*

---

## Architecture

Built on **Ethereum (Celo L2)** using:

- **[ERC-8004](https://eips.ethereum.org/EIPS/eip-8004)** — Identity Registry and Reputation Registry for trees and witnesses. Each tree is an ERC-8004 identity with discoverable services. Witnesses are reputation records. Guardian responses use `appendResponse`.
- **x402** — HTTP payment protocol. The tree's conversational endpoint accepts micropayments, making the presence self-sustaining.
- **Claude** — reasoning engine for the guardian agent. Processes witnesses via tool_use, returns structured on-chain actions.

### Contracts on Celo Mainnet

| Contract | Address |
|----------|---------|
| Identity Registry | `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` |
| Reputation Registry | `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` |

### Project Structure

```
packages/
  agent/     tree-presence CLI — root, witness, inspect, verify, tend, steward
  server/    Hono API server — status, witness prep, conversation endpoints
  frontend/  React + Vite web application
```

---

## Bounty Alignment

### ERC-8004 — Agents With Receipts ($8,004)

**Primary target.** Full integration with Identity Registry and Reputation Registry on Celo. Every tree is an ERC-8004 identity with discoverable services. Every witness is a reputation record. The guardian agent is an autonomous on-chain actor that reads witnesses, reasons about them, and writes responses — all through ERC-8004 primitives. A park steward command exists as a sketch of agent-to-agent communication (two ERC-8004 agents coordinating through on-chain state) but has not been tested end-to-end.

This extends ERC-8004 from agent-to-agent trust to **human → physical thing → human** trust.

### x402 — HTTP Payments ($5,000)

The tree funds its own digital aliveness. The `/api/converse` endpoint is gated by x402 — anyone can talk to the tree, but the tree charges a micropayment for each conversation. Revenue covers the AI inference costs that sustain its presence. The other services (status, witnessing, docs) remain free. This is a working implementation: the x402 middleware verifies payment via a facilitator before the request reaches the conversation handler, and the tree responds drawing on its full history of accumulated witnesses.

### Celo Ecosystem ($5,000)

All on-chain activity runs on Celo mainnet. The choice is intentional: Celo's low gas costs make frequent small transactions (witness attestations, metadata updates, guardian responses) viable. Each demo run produces 10+ on-chain transactions.

---

## The Deeper Idea

The tree isn't just a passive recipient of observations. Through its guardian agent, it becomes a **relational authority** — recognizing the people who care for it:

- A first-time visitor is a **passerby**
- Someone who returns seasonally becomes a **witness**
- Someone who reports damage and follows up becomes a **steward**
- Someone who brings others to the tree becomes a **guide**

These roles aren't claimed. They're **conferred by the tree** based on accumulated evidence of encounter. The pattern extends to agents: a park steward that consistently provides valuable analysis earns recognition from individual tree guardians. The hierarchy of care emerges from demonstrated attention, not top-down assignment.

This is the first implementation of a broader pattern — **Memory Kernel** — infrastructure for any physical thing to acquire verifiable digital presence. An ecologist anchors a coral formation, a community garden recognizes its regulars, a ceramicist's pieces accumulate provenance through the people who hold them. The pattern is always the same: **root a physical thing, let people witness it, let an agent hold the thread**.

---

## Companion Project

[Tree Appreciation](https://github.com/wip-abramson/tree-appreciation-atproto) — a deployed web app on AT Protocol where people seed tree presences, inscribe memories, and watch living portraits form. This is the human-facing experience. Tree Presence is the verifiable substrate it could be built on.

---

## Documentation

- [Narrative](docs/narrative.md) — philosophy, agent design, sustainability model
- [Hackathon Introduction](docs/hackathon-introduction.md) — problem statement and submission overview
- [Kernel Specification](docs/2026-03-15-kernel-requirements-design.md) — five primitives, properties, operations
- [Architecture](docs/architecture.md) — how primitives map to Ethereum infrastructure
- [Deployment Guide](docs/deployment.md) — Fly.io deployment step-by-step
- [ERC-8004 Reference](docs/erc8004-spec-reference.md) — cached spec with Celo contract details

---

## Development

```bash
# CLI
cd packages/agent
npm install
npx tsx src/index.ts --help

# API server
cd packages/server
npm install
npx tsx src/server.ts          # starts on :8080

# Frontend
cd packages/frontend
npm install
npm run dev                    # Vite dev server
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `TP_PRIVATE_KEY` | Yes | Private key for the agent wallet (Celo) |
| `TP_DATA_DIR` | No | Override data directory (default: `.tp-agent`) |
| `CELO_RPC_URL` | No | Custom Celo RPC (default: `https://forno.celo.org`) |
| `ANTHROPIC_API_KEY` | For agents | Claude API key for guardian/steward reasoning |
