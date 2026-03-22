# Tree Presence

**Physical trees get verifiable digital presence through human encounter.**

A 230-year-old plane tree in central London has survived wars, construction, and climate shifts — but it has no digital memory. Human attention to it is intermittent and fragmented. Someone visits in spring, someone else in autumn, a third person notices storm damage in winter. Each observation is valuable. None of them connect.

Tree Presence gives trees an on-chain identity, a mechanism for accumulating encounters, and an autonomous AI agent that holds the thread between visits. The agent doesn't generate knowledge. Humans do that by showing up. The agent provides **continuity**.

This is the first implementation of [Tree Presence](docs/narrative.md) — infrastructure for any physical thing (trees, books, benches, coral formations) to acquire verifiable digital presence. The tree is where it starts.

> **Synthesis Hackathon 2026** — [Bounty Alignment](#bounty-alignment) | [Live Demo](#live-demo) | [Architecture](#architecture)

---

## How It Works

```
Root a tree → People witness it → An agent holds the thread
```

1. **Root** — register a tree as an on-chain identity (ERC-8004 on Celo). It gets a permanent identifier, metadata, and a binding secret that proves physical encounter.

2. **Witness** — anyone who encounters the tree submits a signed attestation. The witness includes an observation, a content hash, and optionally a proof of physical presence. Each witness is an on-chain transaction — permanent, verifiable, attributable.

3. **Tend** — an autonomous AI agent (the guardian) watches for new witnesses. When someone inscribes an observation, the guardian integrates it with everything previously observed, updates on-chain metadata, responds to the witness, and flags patterns no single visitor could see.

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
| `tree-presence tend` | Start the guardian agent (polls witnesses, reasons with Claude, acts on-chain) |
| `tree-presence steward` | Start the park steward (monitors multiple trees) — *experimental, untested* |

### API Server

Hono server exposing the tree's presence as a JSON API:

| Endpoint | Description |
|----------|-------------|
| `GET /api/docs` | Service discovery — full API documentation |
| `GET /api/status` | Tree's full on-chain state (identity, metadata, witnesses, responses, confidence) |
| `POST /api/witness` | Prepare a witness transaction (returns calldata for the caller to sign) |
| `POST /api/converse` | Talk to the tree (x402 payment required) |

### Frontend

React + Vite web application for browsing tree presence, viewing witness history, and conversing with trees.

### Demo System

Reproducible demos that run the full flow end-to-end:

- **`demo-guardian.sh`** — roots a tree, starts a guardian, sends three AI-generated witness observations from distinct personas (mycologist, urban sketcher, grandparent). Each witness reads current on-chain state before generating its observation.
- **`demo-passerby.sh`** — generates an ephemeral wallet, creates a random AI persona, submits a contextual observation to an existing tree.
- **`demo-tree-responds.sh`** — the tree reviews its accumulated inscriptions and responds as itself.

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

The guardian now polls for witnesses every 60 seconds, reasons about them using Claude, updates on-chain metadata, and responds to witnesses — all autonomously.

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

- **API server** (foreground) — JSON endpoints on port 8080
- **Guardian agent** (background) — tends one tree
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

### Celo Ecosystem ($5,000)

All on-chain activity runs on Celo mainnet. The choice is intentional: Celo's low gas costs make frequent small transactions (witness attestations, metadata updates, guardian responses) viable. Each demo run produces 10+ on-chain transactions.

### ENS ($1,500) — Planned

Wildcard resolver (ENSIP-10 + CCIP-Read) so that `old-oak.treepresence.eth` resolves to the tree's on-chain state on Celo.

### Self Agent ID ($1,000) — Planned

ZK proof-of-humanity for sybil-resistant witnessing. A witness proves they're a unique human without revealing which human.

### MetaMask Delegations ($5,000) — Stretch

Scoped permissions via custom caveat enforcers. Physical encounter (NFC secret) as proof for delegation redemption.

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
