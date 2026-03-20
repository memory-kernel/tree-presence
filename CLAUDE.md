# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Memory Kernel is a minimal substrate that enables physical objects, places, and living things to acquire verifiable digital presence through human encounter. It is infrastructure, not an application — applications (private memory spaces for gifted vinyl records, digital presences for books, presence practices around trees) are built on top.

This project is being built for the **Synthesis hackathon** (March 4–25, 2026), targeting bounties from ERC-8004, MetaMask Delegations, ENS, Self Agent ID, ERC-8128/Slice, and the Celo ecosystem.

## Status

Two packages:

- `packages/agent/` — `mk-agent` CLI. Commands: `init`, `anchor`, `witness`, `resolve`, `verify`, `serve` (tree guardian), `serve-steward` (park steward). Anchors now include ERC-8004 services via two-tx registration flow (`--service-url`).
- `packages/web/` — Hono web server showing live tree/park state from chain. Routes: `/tree/:id`, `/park/:id`, `/api/tree/:id`, `/api/park/:id`.

Demo script: `demo-guardian.sh` runs end-to-end tree guardian flow with 4 wallets.

Deployment: Dockerfile + fly.toml + entrypoint.sh for Fly.io (web + guardian + steward).

## Development

```bash
# Agent CLI
cd packages/agent
npm install
npx tsx src/index.ts --help    # Run CLI in dev mode
npx tsc                        # Build to dist/

# Web server
cd packages/web
npm install
npx tsx src/server.ts           # Run dev server on :8080
npx tsc                        # Build to dist/

# Demo (needs funded wallets)
./demo-guardian.sh
```

Environment variables:
- `MK_PRIVATE_KEY` — Private key for the agent wallet (Celo)
- `MK_DATA_DIR` — Override data directory (default: `.mk-agent`)
- `CELO_RPC_URL` — Custom Celo RPC (default: forno.celo.org)
- `ANTHROPIC_API_KEY` — Required for `serve` and `serve-steward` commands

## Five Core Primitives

1. **Anchor** — binds an identifier to a physical subject (object, place, living thing)
2. **Witness** — signed attestation of encounter with an anchored subject
3. **Identifier** — label that refers to a subject, accumulating knowledge over time
4. **Relationship** — verifiable connection between identifiers
5. **Scope** — visibility boundary governing access

## Target Architecture

Built on Ethereum (Celo L2) using:

- **ERC-8004** — Identity Registry (`0x8004A169FB4a3325136EB29fA0ceB6D2e539a432` on Celo) and Reputation Registry (`0x8004BAa17C55a88189AE136b182e5fdA19dE9b63` on Celo) for anchors and witnesses
- **MetaMask Delegation Framework** — scoped permissions via custom caveat enforcers (EncounterCaveatEnforcer, SelfHumanityCaveatEnforcer)
- **ENS** — human-readable identifier resolution via wildcard resolver (ENSIP-10 + CCIP-Read from Celo)
- **Self Agent ID** — ZK proof-of-humanity for privacy-preserving, sybil-resistant witnessing
- **ERC-8128 (Slice)** — SIWE-like web authentication for the NFC-tap-to-session flow

## Stretch Goal Contracts

- **EncounterCaveatEnforcer.sol** — MetaMask Delegation caveat enforcer requiring NFC proof for scoped permissions
- **Wildcard Resolver** — ENS resolver on Sepolia resolving `*.memorykernel.eth` via CCIP-Read to Celo state

## Key Design Concepts

- **Two tiers of engagement**: Tier 1 is "tap and you're in" (NFC secret proves encounter via open delegation), Tier 2 is "claim and you're a member" (persistent named delegation to a specific address)
- **Scopes as delegation chains**: Creator is root delegator; public/shared/intimate/personal scopes map to delegation hierarchies where each level can only narrow, never expand
- **Accumulation over assertion**: anchor-to-physical bindings strengthen through accumulated witnesses, not single declarations
- **The kernel does not store content** — it guarantees verifiability of inscriptions, not availability

## Key Documentation

- `docs/2026-03-15-kernel-requirements-design.md` — full kernel specification (primitives, properties, operations, boundaries, design principles)
- `docs/architecture.md` — how primitives map to Ethereum infrastructure with Solidity examples
- `docs/synthesis-hackathon-target-analysis.md` — bounty alignment analysis and strategy
- `docs/domain-map.md` — use case domains (gifted objects, circulating books, living landmarks, etc.)
- `docs/task-map.md` — specific tasks the kernel enables, organized by operation type
