# Target Analysis: Memory Kernel × Synthesis Hackathon Bounties

This analysis evaluates each Synthesis hackathon bounty against the Memory Kernel specification — a minimal substrate that enables physical objects, places, and living things to acquire verifiable digital presence through human encounter.

The kernel's core primitives are **Anchor**, **Witness**, **Identifier**, **Relationship**, and **Scope**. Its non-negotiable properties are verifiability, integrity, subject autonomy, independence, governance as a primitive, privacy by default, and technology agnosticism.

---

## Tier 1: Strong Alignment

These bounties share deep conceptual overlap with the kernel's primitives and properties. Building the kernel naturally produces a competitive submission.

### Protocol Labs — Agents With Receipts / ERC-8004 ($8,004)

ERC-8004 provides decentralized identity, reputation, and verification registries — the exact infrastructure the kernel needs for its Identifier and Witness primitives.

**Where they meet:**
- The kernel's **Identifier** (a label that refers to a subject, accumulating attributes over time) maps directly to ERC-8004 identity registration
- The kernel's **Witness** (a signed attestation of encounter) maps to ERC-8004 reputation records — each witness inscription is a verifiable onchain event
- The kernel's design principle "accumulation over assertion" — confidence earned through use — is exactly how ERC-8004 reputation works
- The kernel's **Verify** operation (confirm authenticity without central authority) maps to ERC-8004's onchain verifiability

**Implementation path:** Physical objects (vinyl records, books, trees) get ERC-8004 identities. Humans who encounter them register as operators. Each witness inscription updates the anchor's onchain reputation. The kernel becomes a concrete, non-AI-agent use case for ERC-8004 — extending the trust framework from agent-to-agent to human-to-object-to-human.

**Tension:** The bounty emphasizes autonomous AI agents. The kernel is about human encounter with physical subjects. The submission would need to frame subjects (both human and physical-object identities) as ERC-8004 entities, and potentially include an agent component that manages anchor state or processes witness attestations autonomously.

**Addressable prizes:** 1st ($4,000), 2nd ($3,000), 3rd ($1,004)

---

### ENS ($1,500 across 3 sub-tracks)

The Memory Kernel is fundamentally about identifiers that refer to subjects. ENS is a protocol for replacing hex addresses with human-readable names. The kernel spec explicitly defers identifier resolution as an open question — ENS could be the answer.

**Where they meet:**
- The kernel's **Identifier** primitive ("a label that refers to a subject") is exactly what ENS provides
- The kernel's **Resolve** operation ("given an identifier, retrieve what is known") maps to ENS resolution
- ENS Identity track: anchors and subjects get ENS names instead of raw addresses
- ENS Communication track: relationships between witnesses, stewards, and inscribers route through ENS names
- The kernel's "recognition" function (how we recognize subjects across encounters) is what ENS does for Ethereum

**Implementation path:** Each physical anchor gets an ENS name (e.g., `vinyl-record-001.memorykernel.eth`). Subjects who inscribe are identified by their ENS names. Resolution of an anchor's history happens through ENS. Scope membership is expressed through ENS-addressable participants.

**Tension:** Minimal. ENS integration is natural to any onchain identity system. The main challenge is making ENS feel "core to the experience" rather than decorative, which the kernel's identifier-centric design naturally achieves.

**Addressable prizes:** ENS Identity 1st ($400) + 2nd ($200), ENS Communication 1st ($400) + 2nd ($200), ENS Open Integration ($300) = $1,500 total

---

### MetaMask — Best Use of Delegations ($5,000)

The MetaMask Delegation Framework maps to the kernel's **Scope** and **Govern** operations. The kernel needs a mechanism to express who may inscribe, who may resolve, and under what contexts — delegations provide this.

**Where they meet:**
- The kernel's **Scope** (visibility boundary governing access) maps to delegation permissions
- The kernel's **Govern** operation (managing information flow within and across scopes) maps to sub-delegation chains
- The wedding use case's nested scopes (personal → intimate → shared → public) maps to hierarchical delegations
- The kernel's "two tiers of engagement" (anonymous encounter vs. claimed identity) maps to intent-based delegations: NFC tap triggers an automatic delegation of read access

**Implementation path:** An anchor creator delegates inscription rights via ERC-7715 permissions. Sub-delegations model nested scopes — the couple delegates "intimate scope" access to each other, "shared scope" to guests, "public scope" to anyone. A steward delegates governance to co-stewards. Intent-based delegations express: "anyone who proves physical encounter is automatically delegated read access to this scope."

**Why this is competitive:** The bounty specifically rewards "novel permission models" and penalizes "standard patterns without meaningful innovation." The kernel's scope topology — physical-encounter-triggered delegations, nested privacy layers, governance-as-a-primitive — is genuinely novel compared to typical DeFi delegation patterns.

**Addressable prizes:** 1st ($3,000), 2nd ($1,500), 3rd ($500)

---

### Self — Best Self Agent ID Integration ($1,000)

Self provides ZK-powered, privacy-preserving, human-backed identity. This aligns with three kernel properties simultaneously: privacy by default, subject autonomy, and verifiability.

**Where they meet:**
- The kernel's **Privacy by Default** — ZK proofs let subjects prove encounter without revealing identity
- The kernel's **Subject Autonomy** — "a subject controls what they attest and disclose"
- The kernel's **Verifiability** — ZK proofs are verifiable without central authority
- The kernel's "two tiers of engagement" — Self Agent ID provides the identity layer for the second tier (claim a persistent, verifiable, privacy-preserving identity)

**Implementation path:** When a human taps an NFC tag and claims a cryptographic identity, Self Agent ID provides the ZK-proof identity layer. A witness can prove they encountered a physical object without revealing who they are. Sybil-resistant witnessing — you can prove you're a unique human without revealing which human. This directly serves the tree appreciation and living library use cases where anonymity is desirable but authenticity matters.

**Tension:** The bounty says "agent identity" — framing human witnesses as agents in the kernel context requires some narrative work.

**Addressable prizes:** $1,000 (winner-takes-all)

---

### Slice — ERC-8128 Ethereum Web Auth ($750)

ERC-8128 is an authentication primitive. The kernel "does not authenticate subjects" but "provides machinery for subjects to prove they control an identifier via cryptographic signatures." ERC-8128 bridges this gap at the application layer.

**Where they meet:**
- The kernel's distinction between "the kernel verifies signatures, not people" and the application need to onboard users maps to ERC-8128's role
- The Imprints of Experience flow: NFC tap → URL resolves identifier → ERC-8128 auth flow → subject proves they control an Ethereum identity → kernel inscriptions begin
- ERC-8128 can authenticate both human users (SIWE-like flow) and agents accessing the kernel API

**Implementation path:** ERC-8128 as the authentication layer for the kernel's application surface. Physical encounter triggers an auth flow. The kernel verifies the cryptographic signature produced by ERC-8128. Clean separation between kernel (verification) and application (authentication).

**Tension:** Prize is in Slice product credits, not cash. But the conceptual fit is strong and implementation effort is modest.

**Addressable prizes:** 1st ($500), 2nd ($250)

---

### Arkhai — Escrow Ecosystem Extensions ($450)

Alkahest is an escrow protocol with arbiters, verification primitives, and obligation patterns. The kernel's Witness and Scope primitives can extend this.

**Where they meet:**
- The kernel's **Witness** (signed attestation of encounter) is a verification primitive — a new class of arbiter based on physical co-presence
- The kernel's **Scope** provides a trust boundary mechanism that Alkahest could use for conditional escrow release
- The kernel's "accumulation over assertion" principle maps to reputation-weighted arbitration

**Implementation path:** A "co-presence arbiter" that verifies physical encounter (via kernel witnesses) before releasing escrowed value. A "witness-weighted arbiter" where accumulated inscriptions at an anchor determine trust levels for escrow resolution. Novel obligation patterns: "this obligation is fulfilled when N witnesses attest co-presence at this anchor."

**Addressable prizes:** Best Submission ($450)

---

## Tier 2: Moderate Alignment

These bounties have partial overlap. The kernel can be positioned to fit, but requires extending the core concept or building additional components beyond the spec.

### Venice — Private Agents, Trusted Actions ($11,500)

Venice provides privacy-preserving AI inference. The kernel's privacy-by-default principle aligns, but Venice is about AI agent cognition over sensitive data.

**Where they meet:**
- The kernel's **Privacy by Default** and **Scope** primitives deal with exactly the problem Venice solves at the inference layer
- A "memory space agent" could use Venice to reason over scoped inscriptions without exposing private data
- The kernel's Resolve operation (retrieving what is known within a subject's scope) could be powered by Venice's private inference

**Implementation path:** An agent that manages a kernel memory space, using Venice for private reasoning over inscriptions. When someone encounters an anchor, the agent uses Venice to privately process all witness history and surface contextually relevant memories — without exposing other participants' private inscriptions. The agent reasons over the full scope graph privately and returns only what the requesting subject is allowed to see.

**Gap:** Requires building a substantial AI agent layer on top of the kernel. The kernel spec is infrastructure; Venice rewards application-level agent behavior. The prize is large ($11,500) but the implementation distance is significant.

**Addressable prizes:** 1st (1,000 VVV / $5,750), 2nd (600 VVV / $3,450), 3rd (400 VVV / $2,300)

---

### Protocol Labs — Let the Agent Cook ($8,000)

Fully autonomous agents operating end-to-end. The kernel is infrastructure, not an autonomous agent — but an agent *built on* the kernel could qualify.

**Where they meet:**
- An autonomous "anchor steward agent" that manages kernel state: registering anchors, processing witness attestations, enforcing scope policies, and responding to resolve requests — all without human intervention
- ERC-8004 identity integration is required, which aligns with Tier 1 analysis above
- The agent.json manifest and structured execution logs are straightforward additions

**Gap:** The kernel spec is deliberately minimal and non-agentic ("quiet infrastructure"). Building an autonomous agent on top requires significant work beyond the kernel itself. The agent would need to demonstrate the full decision loop (discover → plan → execute → verify → submit) using real tools and APIs.

**Addressable prizes:** 1st ($4,000), 2nd ($2,500), 3rd ($1,500)

---

### Octant — Public Goods Evaluation ($3,000 across 3 tracks)

The kernel is arguably a public good. Octant's bounties focus on evaluating public goods.

**Where they meet:**
- **Data Collection track ($1,000)** — The kernel's witness/attestation model is a data collection mechanism. An agent that collects impact signals about public goods projects using kernel-like attestation patterns (signed, verifiable, scoped)
- **Data Analysis track ($1,000)** — An agent that analyzes accumulated attestations to surface patterns about project legitimacy or impact
- **Mechanism Design track ($1,000)** — The kernel's scope + governance primitives could inform new evaluation mechanisms

**Gap:** These tracks are about evaluating public goods funding, not about physical-digital identity. The kernel's primitives could be applied to this domain, but it's an adaptation rather than a natural fit.

**Addressable prizes:** Best Submission × 3 ($3,000)

---

### SuperRare ($2,500)

Rare Protocol handles ERC-721 minting and auctions. The kernel's Anchor could be represented as an NFT.

**Where they meet:**
- Each physical anchor could mint an ERC-721 via Rare Protocol — a verifiable onchain record that this identifier refers to this physical subject
- The NFT evolves as witnesses accumulate — agent behavior (processing new inscriptions) shapes the digital representation
- Auction dynamics could reflect the anchor's witness history (more encounters = more valuable)

**Gap:** The bounty emphasizes autonomous agent art where "agent behavior shapes the artwork." Requires creative framing of the kernel's witness accumulation as an artistic medium.

**Addressable prizes:** 1st ($1,200), 2nd ($800), 3rd ($500)

---

### Status Network ($2,000)

Deploy a contract on their gasless testnet. Low effort, guaranteed $50.

**Where they meet:**
- Any smart contract component of the kernel (anchor registry, witness contract) qualifies
- Gasless transactions align with "quiet infrastructure" — zero friction for inscribing

**Gap:** Minimal — this is a participation bounty, not a fit question.

**Addressable prizes:** $50 per qualifying team

---

## Tier 3: Low Alignment

These bounties are primarily about DeFi, trading, payments, or agent infrastructure that doesn't map to the kernel's domain of physical-digital identity through human encounter. Pursuing them would require building something substantially different from the kernel.

| Bounty | Prize | Reason for Low Fit |
|--------|-------|--------------------|
| **Lido Labs** | $10,000 | stETH treasury management, yield monitoring, MCP server — pure DeFi infrastructure with no identity/attestation overlap |
| **Celo** | $5,000 | Payments and stablecoin infrastructure for mobile — no conceptual overlap with physical-digital anchoring |
| **Bankr** | $5,000 | LLM Gateway for multi-model AI with onchain execution — trading and commerce focused |
| **Uniswap** | $5,000 | Swap, bridge, and settle — DeFi plumbing with no identity dimension |
| **OpenServ** | $5,000 | Multi-agent workflow platform — could be adjacent if kernel agents coordinate via OpenServ, but requires building an agent layer the kernel doesn't specify |
| **Olas** | $3,000 | Agent marketplace with specific framework requirements (Pearl, mech-client, mech-server) — too prescriptive for the kernel's technology-agnostic design |
| **Locus** | $3,000 | Agent payment infrastructure on Base — payments aren't part of the kernel |
| **bond.credit** | $1,500 | Live trading agents on GMX perps — completely different domain |
| **Merit Systems** | $1,750 | x402 payment APIs via AgentCash — payment layer, not identity |
| **Markee** | $800 | GitHub repo marketing integration — no overlap |
| **Ampersend** | $500 | SDK integration for agents — unknown SDK, small prize, unclear overlap |

---

## Recommended Strategy

### Primary Targets

Focus on bounties where the kernel's natural design is the submission. These require building the kernel, not adapting it.

| Bounty | Prize | Why |
|--------|-------|-----|
| **ERC-8004 Agents With Receipts** | $8,004 | ERC-8004 as the identity/reputation layer for anchors and witnesses. Highest-aligned large prize. |
| **MetaMask Delegations** | $5,000 | Kernel scopes and governance implemented via the Delegation Framework. They want "novel permission models" — the kernel has them. |
| **ENS** | $1,500 | ENS as the identifier resolution layer. Targets all 3 sub-tracks naturally. |
| **Self Agent ID** | $1,000 | ZK identity for privacy-preserving witnessing. Clean conceptual fit. |

**Combined addressable pool: $15,504**

### Secondary Targets

Stack these on with modest additional effort.

| Bounty | Prize | Why |
|--------|-------|-----|
| **Slice ERC-8128** | $750 | Auth flow for the claim-identity step. Small integration. |
| **Arkhai Escrow Extensions** | $450 | Co-presence arbiter as a novel verification primitive. |
| **Status Network** | $50+ | Deploy kernel contracts on their testnet. Near-zero effort. |
| **Synthesis Open Track** | $14,500 | Auto-entered. Strong kernel submission competes well here because it's genuinely different from the DeFi/trading agent projects most teams will build. |

**Combined secondary pool: $15,750**

### Stretch Targets

Worth considering if time and capacity allow, but require building beyond the kernel spec.

| Bounty | Prize | What's Needed Beyond the Kernel |
|--------|-------|---------------------------------|
| **Venice** | $11,500 | A full AI agent that reasons privately over kernel memory spaces |
| **Protocol Labs — Let the Agent Cook** | $8,000 | An autonomous agent that stewards kernel state end-to-end |
| **Octant** | $3,000 | Reframing kernel attestation patterns for public goods evaluation |

### Total Realistic Target

**Primary + Secondary: ~$31,254 addressable**, with realistic capture of **$8,000–$15,000** given strong execution across the aligned bounties.

### Strategic Advantage

The kernel's differentiation is that it's *not another DeFi agent or trading bot*. It brings a genuinely novel use case — physical-digital identity through human encounter — to infrastructure (ERC-8004, ENS, MetaMask Delegations) that most teams will use for generic agent tooling. Judges will have seen dozens of yield monitors and trading copilots. They will not have seen a system where a physical vinyl record accumulates verifiable witness history onchain.
