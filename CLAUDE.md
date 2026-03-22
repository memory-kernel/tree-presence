# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tree Presence gives physical trees verifiable digital presence through human encounter. It is the first implementation of Memory Kernel — infrastructure for any physical thing to acquire on-chain identity and accumulate witnesses over time.

This project is being built for the **Synthesis hackathon** (March 4–25, 2026), targeting bounties from ERC-8004, Celo, ENS, Self Agent ID, and MetaMask Delegations.

**Repo:** https://github.com/memory-kernel/tree-presence

## Status

Three packages:

- `packages/agent/` — `tree-presence` CLI. Commands: `init`, `root`, `witness`, `inspect`, `verify`, `tend` (guardian), `steward` (park steward). Trees are registered as ERC-8004 identities with discoverable services via two-tx flow.
- `packages/server/` — Hono API server for tree presence. Routes: `GET /api/docs`, `GET /api/status`, `POST /api/witness`, `POST /api/converse` (x402 gated).
- `packages/frontend/` — React + Vite web application for browsing tree presence and conversing with trees.

Standalone utility scripts in `packages/agent/src/`:
- `generate-persona.ts` — generate random AI persona for witnesses
- `generate-witness.ts` — generate contextual witness message from a persona
- `generate-wallet.ts` — generate ephemeral keypairs
- `tree-respond.ts` — tree responds to accumulated witnesses
- `update-brunswick-plane.ts` — utility to update specific tree metadata

Demo scripts (repo root):
- `demo-guardian.sh` — full end-to-end guardian flow with 4 wallets + AI personas
- `demo-passerby.sh` — random passerby witness demo (ephemeral wallet + AI persona)
- `demo-tree-responds.sh` — tree reviews inscriptions and responds as itself
- `demo.sh` — basic CLI flow (root, witness, inspect, verify)

Deployment: Dockerfile + fly.toml + entrypoint.sh for Fly.io (API server + guardian).

## Command Vocabulary

| Command | Description |
|---------|-------------|
| `tree-presence init` | Initialize a local wallet |
| `tree-presence root` | Root a tree on-chain (register ERC-8004 identity + services) |
| `tree-presence witness` | Submit an encounter attestation |
| `tree-presence inspect` | Read the tree's full on-chain state |
| `tree-presence verify` | Verify witness content integrity |
| `tree-presence tend` | Start the guardian agent |
| `tree-presence steward` | Start the park steward — *experimental, untested* |

## Development

```bash
# CLI
cd packages/agent
npm install
npx tsx src/index.ts --help    # Run CLI in dev mode
npx tsc                        # Build to dist/

# API server
cd packages/server
npm install
npx tsx src/server.ts           # Run dev server on :8080
npx tsc                        # Build to dist/

# Frontend
cd packages/frontend
npm install
npm run dev                     # Vite dev server

# Demo (needs funded wallets)
./demo-guardian.sh
```

Environment variables:
- `TP_PRIVATE_KEY` — Private key for the agent wallet (Celo)
- `TP_DATA_DIR` — Override data directory (default: `.tp-agent`)
- `CELO_RPC_URL` — Custom Celo RPC (default: forno.celo.org)
- `ANTHROPIC_API_KEY` — Required for `tend`, `steward`, and generation scripts

## Architecture

Built on Ethereum (Celo L2) using:

- **ERC-8004** — Identity Registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on Celo) and Reputation Registry (`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` on Celo) for trees and witnesses
- **x402** — HTTP payment protocol for the conversational endpoint (tree funds its own presence)
- **Claude** — reasoning engine for guardian/steward agents via tool_use

Planned/stretch:
- **ENS** — wildcard resolver (ENSIP-10 + CCIP-Read from Celo) for `*.memorykernel.eth`
- **Self Agent ID** — ZK proof-of-humanity for sybil-resistant witnessing
- **MetaMask Delegation Framework** — scoped permissions via custom caveat enforcers

## Key Design Concepts

- **Accumulation over assertion**: tree presence strengthens through accumulated witnesses, not single declarations
- **The tree as relational authority**: roles (passerby, witness, steward, guide) are conferred by the tree based on evidence of encounter
- **Self-sustaining presence**: x402 payments for conversation fund the agent's inference costs
- **Agent-to-agent coordination** (planned): park steward and tree guardians communicating through on-chain primitives — code exists but untested

## Key Documentation

- `docs/narrative.md` — philosophy, agent design, sustainability model
- `docs/hackathon-introduction.md` — problem statement and submission overview
- `docs/2026-03-15-kernel-requirements-design.md` — full kernel specification (primitives, properties, operations)
- `docs/architecture.md` — how primitives map to Ethereum infrastructure with Solidity examples
- `docs/deployment.md` — Fly.io deployment step-by-step
- `docs/erc8004-spec-reference.md` — cached ERC-8004 spec with Celo contract details
- `docs/synthesis-hackathon-target-analysis.md` — bounty alignment analysis and strategy
- `docs/domain-map.md` — use case domains (gifted objects, circulating books, living landmarks, etc.)
- `docs/task-map.md` — specific tasks the kernel enables, organized by operation type
