# Conversation Log: Building Memory Kernel with Claude

This document records the AI-assisted development process of the Memory Kernel project for the Synthesis hackathon (March 4–25, 2026). Every phase of the project — from initial research through architecture, implementation, and iteration — was developed through extended conversation with Claude.

---

## Phase 1: Research & Hackathon Landscape (Early March 2026)

The project began with research into the Synthesis hackathon's technology stack and prize structure. Claude helped survey the full bounty landscape (~$107,750 across 20+ sponsors) and identify which technologies aligned with an emerging idea around physical-digital presence.

Key technologies researched:
- **ERC-8004** — Identity and Reputation registries for autonomous agents
- **MetaMask Delegation Framework** — scoped permission chains via caveat enforcers
- **ENS** — human-readable naming via wildcard resolvers and CCIP-Read
- **Self Agent ID** — zero-knowledge proof-of-humanity
- **ERC-8128 (Slice)** — SIWE-like web authentication
- **Celo** — L2 where ERC-8004 and Self are deployed

The research produced `docs/synthesis-hackathon-prizes.md` — a comprehensive catalogue of every bounty, its requirements, and prize amounts.

**Evidence:** [`docs/synthesis-hackathon-prizes.md`](docs/synthesis-hackathon-prizes.md)

---

## Phase 2: Ideation & Concept Development

Through conversation, the idea crystallised around a fundamental observation: physical things — objects, places, living things — lack digital memory. Human attention to them is intermittent and fragmented. What if these things could accumulate verifiable digital presence through human encounter?

This wasn't about IoT sensors or digital twins. The key insight was that **encounter** — a human being present with a physical thing — is the atomic unit. The kernel would be infrastructure enabling any physical subject to acquire presence, not an application prescribing what that presence means.

Claude helped develop the bounty alignment analysis, mapping this concept against each prize category and identifying $15.5k in strongly-aligned bounties (ERC-8004, MetaMask Delegations, ENS, Self) with another $15.7k in secondary targets.

**Evidence:** [`docs/synthesis-hackathon-target-analysis.md`](docs/synthesis-hackathon-target-analysis.md)

---

## Phase 3: Requirements & Domain Mapping

With the concept established, the next conversations focused on rigorous specification. Claude helped develop:

**Five core primitives:**
1. Anchor — binds an identifier to a physical subject
2. Witness — signed attestation of encounter
3. Identifier — label that refers to a subject, accumulating knowledge
4. Relationship — verifiable connection between identifiers
5. Scope — visibility boundary governing access

**Seven non-negotiable properties** (verifiability, integrity, subject autonomy, independence, governance as primitive, privacy by default, technology agnosticism) and **seven design principles** (presence before interaction, integrity without authority, accumulation over assertion, minimalism as durability, privacy as default, quiet infrastructure, plurality without prescription).

The domain map explored 18+ concrete use cases — from gifted objects and circulating books to living landmarks and memorial spaces — validating that the primitives were general enough to support diverse applications while remaining minimal.

The task map enumerated specific operations the kernel enables: creation, encounter, inscription, resolution, verification, governance, and emergence — organised by what a user can actually *do*.

**Evidence:**
- [`docs/2026-03-15-kernel-requirements-design.md`](docs/2026-03-15-kernel-requirements-design.md) — full kernel specification
- [`docs/domain-map.md`](docs/domain-map.md) — 18 use case domains
- [`docs/task-map.md`](docs/task-map.md) — operations taxonomy

**Git:** Initial specs committed March 17 — `220e50c define initial specs`

---

## Phase 4: Technical Architecture

Claude helped map each kernel primitive to concrete Ethereum infrastructure:

- **Identifier** → ERC-8004 Identity Registry + ENS naming
- **Anchor** → ERC-8004 identity registration (two-transaction flow)
- **Witness** → ERC-8004 Reputation Registry (`giveFeedback`)
- **Scope & Govern** → MetaMask Delegation Framework with custom caveat enforcers
- **Relationship** → On-chain events and ERC-8004 cross-references
- **Resolve** → ENS wildcard resolver with CCIP-Read from Celo

Key architectural decisions made through conversation:
- **Celo as chain** — Self Agent ID lives there, ERC-8004 is deployed there, and Celo has a dedicated bounty
- **Two tiers of engagement** — Tier 1 anonymous encounter (NFC tap + open delegation) vs. Tier 2 persistent identity (claimed delegation to a specific address)
- **Scopes as delegation chains** — each level can only narrow permissions, never expand
- **Accumulation over assertion** — anchor-to-physical bindings strengthen through witnesses, not single declarations

Custom Solidity contracts were designed: `EncounterCaveatEnforcer` (requiring NFC proof for delegated permissions) and a wildcard ENS resolver for `*.memorykernel.eth`.

**Evidence:** [`docs/architecture.md`](docs/architecture.md)

---

## Phase 5: The Brunswick Plane — Focusing on a Single Tree

A pivotal decision in conversation was to stop building abstractly and focus everything on a single real physical subject: **The Brunswick Plane** (*Platanus × acerifolia*), a London plane tree planted c. 1796 in Brunswick Square, London (51.524267, -0.122136).

This decision transformed the project from theoretical infrastructure into a tangible demo. The tree became the test case that drove every implementation decision. The narrative developed around it: what does it mean for a 230-year-old tree to have digital presence? What services could it offer? Who are the humans who encounter it — the mycologist studying its fungal networks, the urban sketcher capturing its shadow, the grandparent watching a child play beneath it?

The concept of the **tree guardian agent** emerged — an AI agent that holds the thread of continuity between intermittent human visits, providing integration, memory, acknowledgment, and vigilance. And above individual trees, a **park steward agent** that recognises cross-tree patterns.

The demo strategy document laid out the narrative arc and priority roadmap.

**Evidence:**
- [`docs/2026-03-18-demo-strategy.md`](docs/2026-03-18-demo-strategy.md) — demo strategy and guardian agent design
- [`docs/narrative.md`](docs/narrative.md) — project philosophy and the tree-as-relational-authority concept

---

## Phase 6: Initial Implementation

Claude helped build the full `tp-agent` CLI with seven commands:

| Command | Purpose |
|---------|---------|
| `init` | Generate and persist an agent wallet on Celo |
| `anchor` | Register a physical subject on-chain (two-tx ERC-8004 flow with service URI) |
| `witness` | Submit a signed attestation of encounter |
| `resolve` | Read an anchor's full on-chain state — identity, metadata, witnesses, confidence |
| `verify` | Cryptographically verify witness content integrity |
| `serve` | Start autonomous guardian agent (polls, reasons via Claude, acts) |
| `serve-steward` | Start park steward monitoring multiple trees |

The implementation involved:
- ERC-8004 ABI integration (`erc8004/abis.ts`, `erc8004/identity.ts`, `erc8004/reputation.ts`)
- Claude-powered reasoning engine for the guardian agent (`reasoning/claude.ts`, `reasoning/prompts.ts`)
- Wallet management and configuration (`commands/init.ts`, `config.ts`)
- IPFS utilities for content-addressed storage

**The first tree was minted on-chain as ERC-8004 identity #3058** — The Brunswick Plane, with metadata describing its species, age, location, and historical significance.

Demo scripts were developed to exercise the full flow:
- `demo-guardian.sh` — end-to-end with 4 wallets and 3 distinct witness personas (mycologist, urban sketcher, grandparent)
- `demo-passerby.sh` — ephemeral wallet generation, AI persona creation, contextual witnessing
- `demo-tree-responds.sh` — tree reviews accumulated inscriptions and responds as itself

**Evidence:**
- `packages/agent/` — full CLI implementation
- [`demo-guardian.sh`](demo-guardian.sh), [`demo-passerby.sh`](demo-passerby.sh), [`demo-tree-responds.sh`](demo-tree-responds.sh)
- **Git:** `5a0a297 progress developing memory kernel agent` (March 20)

---

## Phase 7: Defining Real Services

With the tree anchored on-chain, conversation turned to what services a tree could authentically offer. This wasn't about forcing utility onto a tree — it was about identifying services that made sense given the tree's nature as a living landmark with accumulated human attention.

The services defined and registered in the ERC-8004 identity:

- **`/api/status`** — the tree's full on-chain presence: identity, metadata, witness history, guardian responses, confidence scores
- **`/api/witness`** — prepare a witness attestation transaction (the server doesn't sign — the caller's wallet does)
- **`/api/converse`** — talk to the tree; it responds as itself, drawing on its full history of encounters
- **`/api/docs`** — service discovery and endpoint documentation

The ERC-8004 spec reference was documented to ensure the registration file structure (type, name, description, services array, x402Support) was correctly implemented.

**Evidence:**
- [`docs/erc8004-spec-reference.md`](docs/erc8004-spec-reference.md) — cached spec reference
- `packages/server/src/server.ts` — Hono API server implementing all four endpoints

---

## Phase 8: Frontend Development & React Refactor

The initial frontend was a server-rendered Hono application (`packages/web/`) with HTML templates in `views.ts` and on-chain data fetching in `chain.ts`. This worked for basic status pages but was limited.

Through conversation, the decision was made to refactor into a proper React application. The `packages/web/` package was deleted and replaced with two new packages:

- **`packages/server/`** — API-only Hono server (no HTML rendering), serving JSON endpoints
- **`packages/frontend/`** — Vite + React + TypeScript application with:
  - `TreePage.tsx` — full tree presence page with all on-chain state
  - `Landing.tsx` — project landing page
  - `TreeHero.tsx` — tree identity display
  - `EncounterLog.tsx` — witness history timeline
  - `Confidence.tsx` — accumulation confidence visualisation
  - `Conversation.tsx` — interface for talking to the tree
  - `InscribeForm.tsx` — submit new witness attestations
  - `TreePresence.tsx` — composing all tree components
  - Leaflet map integration for location display
  - Typography: DM Mono, Newsreader, Source Serif 4

The frontend reads directly from the API server, keeping concerns cleanly separated.

**Evidence:**
- `packages/frontend/` — React application
- `packages/server/` — API server
- Deleted `packages/web/` visible in git status

---

## Phase 9: x402 Payment Integration

One of the project's most distinctive ideas emerged in conversation: **the tree funds its own digital aliveness through paid conversations**. Using the x402 payment protocol, the `/api/converse` endpoint can require micropayment before the tree responds.

This isn't a paywall — it's a sustainability mechanism. The tree's AI agent needs compute to maintain presence. By charging for conversation (the most compute-intensive service), the tree can fund its own continuity. The other services (status, witnessing, docs) remain free.

The x402 integration was implemented as middleware in the Hono server, with the frontend providing a payment interface via `x402.ts` and wallet connection via `useWallet.ts`.

**Evidence:**
- `packages/server/src/server.ts` — x402 middleware on `/api/converse`
- `packages/frontend/src/x402.ts` — client-side payment handling
- [`docs/narrative.md`](docs/narrative.md) — philosophical framing of tree-funded sustainability

---

## Phase 10: Deployment & Production Readiness

Claude helped design and execute the deployment architecture for Fly.io:

**Architecture:** A single container running up to three processes:
1. **Hono API server** (foreground, port 8080) — serves both the JSON API at `/api/*` and the built React frontend as static files at `/`
2. **Guardian agent** (background) — autonomous tree guardian started when `GUARDIAN_ANCHOR_ID` is set
3. **Park steward** (background, optional) — monitors multiple trees if steward env vars are configured

**Build pipeline:** Multi-stage Dockerfile building all three packages (agent, server, frontend). Vite builds the frontend to static files; the Hono server serves them via `@hono/node-server/serve-static` with SPA fallback. In development, the frontend proxies `/api` to the server; in production, they share an origin.

**Fly.io setup:**
- `fly apps create tree-presence`
- `fly volumes create tp_data --region iad --size 1` — persistent storage for guardian agent state at `/app/data`
- `fly deploy --local-only` (Fly's remote Depot builder can hang; local build is more reliable)

**Secrets (set via `fly secrets set`):**
- `TP_PRIVATE_KEY` — guardian wallet private key (Celo)
- `ANTHROPIC_API_KEY` — powers guardian agent + `/api/converse`
- `GUARDIAN_ANCHOR_ID` — tree's ERC-8004 anchor ID (e.g. `3058`)
- Optional: `X402_PAY_TO` (payment address), `CELO_RPC_URL`, `DEFAULT_ANCHOR_ID`
- Optional steward: `STEWARD_KEY`, `STEWARD_PARK_ID`, `STEWARD_TREE_IDS`

**Refactoring:** During deployment prep, all `MK_` prefixes were renamed to `TP_` (Tree Presence) across ~30 files — env vars, package names, class names, CLI references, and fly.toml configuration.

**Debugging:** The first deploy surfaced two issues:
- **viem type errors** — Celo's chain definition produces client types that are invariant and incompatible with generic `PublicClient<Transport, Chain>` used in shared functions. Fixed by aligning all packages to viem `^2.47.6` and casting Celo-specific clients to the generic type in standalone scripts.
- **x402 price parsing** — The `$0.1` price value was silently mangled by the shell when setting Fly secrets (the `$` in `$0.1` was interpreted as a shell variable). Fixed by quoting: `fly secrets set X402_PRICE='$0.1'`.

**Custom domain:** `brunswick-plane.treeappreciation.com` configured via `fly certs add` + CNAME DNS record pointing to `tree-presence.fly.dev`.

**Evidence:**
- [`docs/deployment.md`](docs/deployment.md) — deployment guide
- `Dockerfile`, `entrypoint.sh`, `fly.toml`
- Live at: `https://brunswick-plane.treeappreciation.com`

---

## Phase 11: Hackathon Submission Preparation

The final conversations focused on shaping the submission narrative:

- **The problem:** Physical things lack digital memory; attention is intermittent
- **The solution:** Anchor → Witness → Agent holds the thread
- **What's built:** CLI, web presence, demo system, x402 conversations, React frontend
- **The deeper idea:** Tree as relational authority — roles (passerby, witness, steward, guide) conferred by the tree based on demonstrated attention
- **Bounty alignment:** ERC-8004 (primary), Celo (primary), with ENS and Self planned

The hackathon introduction document was drafted to frame the submission for judges.

**Evidence:** [`docs/hackathon-introduction.md`](docs/hackathon-introduction.md)

---

## Phase 12: Integration Bug Fixing

With the frontend, server, and CLI all operational, real usage revealed bugs at the boundaries between components. Each package was often internally consistent, but the interfaces between them introduced subtle incompatibilities — particularly around data encoding, hex conversions, and assumptions about how on-chain values are represented.

Claude helped diagnose and fix these through the same conversational process: trace the data flow across packages, identify where assumptions diverge, and apply the minimal fix.

**Example — binding commitment verification (March 22):** The frontend's InscribeForm rejected correct secrets. The server was decoding the on-chain binding commitment (a keccak256 hash stored as `bytes32`) with `hexToString()`, interpreting raw hash bytes as UTF-8 and producing garbage. The CLI witness command did this correctly — comparing hex hashes directly. A one-line fix in `packages/server/src/chain.ts` resolved it.

The common pattern: viem utility functions (`hexToString`, `stringToHex`, `keccak256`) behave differently depending on whether you're working with human-readable strings or raw byte data, and it's easy to apply a string-oriented conversion where a hash-oriented one is needed. With three packages all handling on-chain data independently, these mismatches surfaced at integration time rather than in isolated testing.

**Guardian agent on-chain interaction bugs (March 22):** Running the `tend` guardian in production against the live Brunswick Plane revealed two distinct contract revert errors:

1. **`appendResponse` "index out of bounds"** — The `feedbackIndex` emitted in the ERC-8004 Reputation Registry's `NewFeedback` event is a global sequential index across all clients for an agent, but `appendResponse` expects a **per-client** index. When client `0xe014...` had only a few feedbacks but the global event index was 14, the contract rejected it. Fixed in `erc8004/reputation.ts` by computing per-client indices from the event logs — counting feedbacks per client address in event order rather than trusting the event's global index.

2. **`setMetadata` "replacement" nonce collision** — The guardian fires multiple transactions per wake cycle (e.g., `respond_to_witness` then `update_metadata`). The `appendResponse` function returned the tx hash without waiting for confirmation, so the next transaction attempted to use the same nonce. Celo's sequencer rejected it as a replacement transaction. Fixed by adding `waitForTransactionReceipt` to `appendResponse` in `erc8004/reputation.ts` and `updateAgentURI` in `erc8004/identity.ts` — the only two write functions that were missing the receipt wait.

These bugs only surfaced under real guardian operation with accumulated witnesses, not in isolated demo scripts. The pattern: contract interaction code that works for single transactions fails when multiple writes happen in sequence from the same wallet within a single wake cycle.

---

## Phase 13: On-Chain Service Discovery Update

With the custom domain live at `brunswick-plane.treeappreciation.com`, the final step was updating the tree's on-chain ERC-8004 registration to point its discoverable services at the production URL. The `update-brunswick-plane.ts` script was refactored to read the current agent URI, update the services array, and write it back via `setAgentURI`.

The updated services registered on-chain for agent #3058:

| Service | Endpoint |
|---------|----------|
| `profile` | `https://brunswick-plane.treeappreciation.com` |
| `witness` | `https://brunswick-plane.treeappreciation.com/api/witness` |
| `converse` | `https://brunswick-plane.treeappreciation.com/api/converse` |
| `status` | `https://brunswick-plane.treeappreciation.com/api/status` |
| `docs` | `https://brunswick-plane.treeappreciation.com/api/docs` |

This closes the loop on ERC-8004 service discovery: any agent or application that reads the Brunswick Plane's on-chain identity can now find its live endpoints directly from the registration data. The tree's digital presence is fully self-describing — its identity, metadata, witness history, and service locations are all on-chain and resolvable.

**Evidence:** `packages/agent/src/update-brunswick-plane.ts` — service update script

---

## Reflection

Every phase of Memory Kernel — from initial hackathon research through architecture, implementation, and iteration — was developed through sustained conversation with Claude. The AI didn't just write code; it helped develop the philosophical framework (accumulation over assertion, quiet infrastructure), make key architectural decisions (Celo as chain, two-tier engagement, scopes as delegation chains), and refine the narrative (tree as relational authority, encounter as atomic unit).

The most important decision — focusing on a single tree rather than building abstractly — emerged from the conversational process itself. The Brunswick Plane gave every abstract primitive a concrete test: what does an anchor *mean* for this specific 230-year-old tree? What would a witness *say*? What services would the tree *authentically offer*?

This document itself is evidence of the process: an AI-assisted development practice where conversation, specification, implementation, and reflection are continuous and interleaved.
