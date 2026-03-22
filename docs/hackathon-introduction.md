# Memory Kernel — Hackathon Introduction

## The Problem

Physical things exist in continuous time, but they have no digital memory. A 230-year-old plane tree in central London has survived wars, construction, and climate shifts — but it has no way to hold what people have observed about it, no way to notice that three visitors this month mentioned bark damage, and no way to recognize the person who has been visiting it every autumn for a decade.

Human attention to physical places, objects, and living things is intermittent and fragmented. Someone visits a tree in spring, someone else in autumn, a third person notices storm damage in winter. Each observation is valuable. None of them connect to each other. The tree's story fragments across disconnected encounters because there is nothing to hold the thread.

Memory Kernel is infrastructure that solves this. It gives physical things a verifiable digital presence that accumulates through human encounter — and an autonomous agent that maintains continuity between visits.

## How It Works

The kernel has a simple loop:

**Anchor** a physical thing — register it as an on-chain identity (ERC-8004 on Celo). A tree, a book, a bench, a ceramic piece. It gets a permanent identifier, metadata, and a binding secret that proves physical encounter (e.g., an NFC tag, a passphrase written on a plaque).

**Witness** it — anyone who encounters the anchored thing can submit a signed attestation. The witness includes an observation (what they noticed), a content hash (for verification), and optionally a proof of physical presence (the binding secret). Each witness is an on-chain transaction — permanent, verifiable, and attributable.

**Let the agent hold the thread** — an autonomous AI agent (the guardian) watches for new witness events. When someone inscribes an observation, the guardian:
- Integrates it with everything previously observed
- Updates the thing's on-chain metadata (health status, seasonal state, active concerns)
- Responds to the witness, acknowledging what they noticed
- Flags patterns that no single visitor could see (three damage reports in one month, seasonal shifts year over year)

The agent doesn't generate knowledge. Humans do that by showing up. The agent provides **continuity** — connecting observations across time and people.

## What's Built

**`tp-agent` CLI** — a command-line tool with six core commands:
- `anchor` — register a physical thing on Celo via ERC-8004 (two-transaction flow: identity registration + service URI)
- `witness` — submit a signed attestation with optional physical-encounter proof
- `resolve` — read an anchor's full state (identity, metadata, all witnesses, confidence score)
- `verify` — verify witness content integrity against on-chain hashes
- `serve` — start an autonomous guardian agent that polls for witnesses and reasons about them using Claude
- `serve-steward` — start a park-level steward that monitors multiple trees and reasons about cross-tree patterns

**Web status pages** — a Hono server rendering live on-chain state for any anchor. Tree pages show witness history, confidence scores, guardian responses, and service links. JSON API endpoints for programmatic access.

**Demo system** — a reproducible demo (`demo-guardian.sh`) that anchors a tree, starts a guardian, and sends three AI-generated witness observations from distinct personas (a mycologist reading fungal networks, an urban sketcher noticing light and form, a grandparent tracking time through a child's growth). Each witness reads the tree's current on-chain state before generating its observation, ensuring every run produces unique, contextually grounded inscriptions that build on what came before.

**Tree response** — the tree itself can speak. A separate script (`tree-respond.ts`) fetches all accumulated inscriptions, builds profiles of repeat visitors, and generates a response *as the tree* — choosing which observation to acknowledge based on what was noticed that others missed, or recognizing a returning witness.

**Companion application** — [Tree Appreciation](https://github.com/wip-abramson/tree-appreciation-atproto), a deployed web app on AT Protocol (Bluesky infrastructure) where people seed tree presences, inscribe memories, and watch living portraits form. This is the human-facing experience that Memory Kernel could provide a verifiable substrate for — the social layer and the verification layer as complementary infrastructure.

## The Deeper Idea

The tree isn't just a passive recipient of observations. Through its guardian agent, it becomes a **relational authority** — recognizing the people who care for it and assigning meaning to their attention:

- A first-time visitor is a passerby
- Someone who returns seasonally becomes a witness
- Someone who reports damage and follows up becomes a steward
- Someone who brings others to the tree becomes a guide

These roles aren't claimed. They're **conferred by the tree** based on accumulated evidence of encounter. And they come with evolving affordances — a steward's observations carry more weight, a guide can connect the tree to walking routes.

This extends to agent-to-agent relationships. A park steward agent that consistently provides valuable cross-tree analysis earns recognition from individual tree guardians. The hierarchy of care emerges from demonstrated attention, not top-down assignment.

The goal — whether fully reached in this hackathon or not — is infrastructure that anyone can use to breathe artificial life into the physical world. An ecologist anchors a coral formation. A community garden gets a presence that recognizes its regulars. A ceramicist anchors each piece, and provenance accumulates through the people who held it. The pattern is always the same: **anchor a physical thing, let people witness it, let an agent hold the thread**.

## Bounty Alignment

**ERC-8004 (Protocol Labs)** — Primary target. Full integration with Identity Registry and Reputation Registry on Celo. Anchors are ERC-8004 identities. Witnesses are reputation records. Guardian responses use `appendResponse`. This is a non-AI-agent use case for ERC-8004 that extends it from agent-to-agent trust to human-to-physical-thing-to-human trust.

**Celo Ecosystem** — All on-chain activity runs on Celo mainnet. The choice is intentional: Celo's low gas costs make it viable for frequent small transactions (witness attestations, metadata updates, guardian responses) that would be prohibitive on mainnet Ethereum.

**ENS** — Planned: wildcard resolver (ENSIP-10 + CCIP-Read) so that `old-oak.memorykernel.eth` resolves to the tree's on-chain state on Celo. Not yet implemented.

**Self Agent ID** — Planned: ZK proof-of-humanity for sybil-resistant witnessing. A witness can prove they're a unique human without revealing which human. Not yet implemented.

## What I'm Looking For

Feedback on:
1. **Narrative clarity** — does the relationship between infrastructure (Memory Kernel) and application (Tree Appreciation) land? Is the value proposition of verifiable presence for physical things compelling?
2. **Bounty strategy** — with 3 days remaining, should I polish the ERC-8004 + Celo story (which is working), or attempt to add ENS or Self integration?
3. **Demo impact** — the demo generates unique AI witness observations and guardian responses on-chain. Is this compelling as a demonstration, or does it need a more human-in-the-loop element?
4. **The agent question** — the ERC-8004 bounty emphasizes autonomous AI agents. My agents maintain presence for physical things rather than operating as independent entities. Does this framing work, or should I lean harder into the agent-as-tree identity angle?
