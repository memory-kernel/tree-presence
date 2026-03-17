# Memory Kernel Architecture

## Overview

This document describes how the Memory Kernel's five primitives map onto concrete Ethereum infrastructure, targeting the Synthesis hackathon bounties for ERC-8004, MetaMask Delegations, ENS, Self Agent ID, and ERC-8128.

---

## The Stack

```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                      │
│  Imprints of Experience · Living Library · Tree App       │
│  (NFC tap → URL → web app → kernel operations)           │
├─────────────────────────────────────────────────────────┤
│                   AUTHENTICATION                          │
│  ERC-8128 (Slice) — SIWE-like auth for web flows         │
│  Self Agent ID — ZK proof-of-humanity for witnesses       │
├─────────────────────────────────────────────────────────┤
│                   KERNEL OPERATIONS                       │
│  Anchor · Inscribe · Resolve · Relate · Scope · Govern   │
├──────────────┬──────────────┬───────────────────────────┤
│  IDENTITY    │  PERMISSIONS │  RESOLUTION               │
│  ERC-8004    │  MetaMask    │  ENS                      │
│  Identity +  │  Delegation  │  Names + Wildcard         │
│  Reputation  │  Framework   │  Resolver + Text Records  │
│  + Validation│  + Caveats   │                           │
├──────────────┴──────────────┴───────────────────────────┤
│                   ETHEREUM (L1 / L2)                      │
│  Contracts on Celo, Base, or Sepolia testnets             │
└─────────────────────────────────────────────────────────┘
```

---

## Primitive-by-Primitive Mapping

### 1. Identifier → ERC-8004 Identity Registry + ENS

Every subject in the kernel — a physical object, a person, an agent — gets an ERC-8004 identity (an ERC-721 token). The `agentURI` points to a registration file describing the subject:

```json
{
  "type": "https://eips.ethereum.org/EIPS/eip-8004#registration-v1",
  "name": "vinyl-record-001.memorykernel.eth",
  "description": "Physical vinyl record #001 — NFC-tagged, given to a friend",
  "services": [{
    "name": "ENS",
    "endpoint": "vinyl-record-001.memorykernel.eth"
  }],
  "active": true
}
```

ENS provides the human-readable resolution layer. A parent name like `memorykernel.eth` uses a **wildcard resolver (ENSIP-10)** — any subname (`vinyl-record-001.memorykernel.eth`, `oak-tree-park.memorykernel.eth`) resolves dynamically without individual on-chain registration. The resolver looks up the anchor's ERC-8004 `agentId` and returns its metadata via text records.

This means:
- **Recognition** (the kernel's first function) works via ENS name → ERC-8004 identity → anchor data
- Each anchor's ENS text records store key attributes: `com.memorykernel.type` = "vinyl-record", `com.memorykernel.erc8004id` = "42"
- Human subjects also get identities — either full ENS names or just ERC-8004 tokens depending on their engagement tier

### 2. Anchor → ERC-8004 Identity + Custom Contract

An anchor is created by:
1. Calling `register()` on the ERC-8004 Identity Registry — minting an NFT that represents the physical subject
2. Setting metadata: `setMetadata(agentId, "anchorType", "vinyl-record")`, `setMetadata(agentId, "bindingStrategy", "nfc")`
3. The ENS wildcard resolver automatically makes this anchor resolvable by name

The anchor contract extends ERC-8004 with kernel-specific logic:

```solidity
contract MemoryKernelAnchor {
    IIdentityRegistry public identityRegistry;

    struct AnchorData {
        uint256 erc8004Id;         // ERC-8004 token ID
        bytes32 bindingCommitment; // hash of NFC secret or location data
        address creator;
        uint256 createdAt;
    }

    mapping(uint256 => AnchorData) public anchors;

    function createAnchor(
        string calldata agentURI,
        bytes32 bindingCommitment,
        IIdentityRegistry.MetadataEntry[] calldata metadata
    ) external returns (uint256 anchorId) {
        // Mint ERC-8004 identity for the physical subject
        uint256 erc8004Id = identityRegistry.register(agentURI, metadata);
        anchors[erc8004Id] = AnchorData(erc8004Id, bindingCommitment, msg.sender, block.timestamp);
        return erc8004Id;
    }
}
```

### 3. Witness → ERC-8004 Reputation Registry

A witness (signed attestation of encounter) maps directly to ERC-8004's `giveFeedback()`:

```solidity
// A person witnesses (encounters) anchor #42
reputationRegistry.giveFeedback(
    42,                          // agentId (the anchor)
    100,                         // value (1.00 = verified encounter)
    2,                           // valueDecimals
    "witness",                   // tag1 — type of feedback
    "nfc-tap",                   // tag2 — binding method used
    "",                          // endpoint
    "ipfs://Qm...",             // feedbackURI — optional inscription content
    keccak256(inscriptionData)   // feedbackHash — integrity proof
);
```

Key properties this gives us:
- **Verifiability** — every witness is an onchain transaction, viewable on any explorer
- **Integrity** — the `feedbackHash` proves the inscription content hasn't been altered
- **Accumulation** — `getSummary(anchorId, ...)` returns the count and aggregate of all witnesses, directly implementing "confidence earned through use"
- **Revocability** — witnesses can revoke their own attestations via `revokeFeedback()`
- **Subject Autonomy** — only the witness's own address can submit their attestation (the contract enforces "the feedback submitter MUST NOT be the agent owner")

The `tag1`/`tag2` system enables different witness types:
- `("witness", "nfc-tap")` — physical NFC encounter
- `("witness", "gps-proximity")` — location-based encounter
- `("observation", "seasonal")` — ecological observation
- `("memory", "personal")` — personal inscription

### 4. Scope + Govern → MetaMask Delegation Framework

The kernel's scopes — visibility boundaries governing who sees what — map to **delegation chains with custom caveat enforcers**.

The anchor creator is the root delegator. They grant delegations that define each scope:

```
Creator (root delegator)
├── Public Scope: Open delegation, ReadOnly caveat, no restrictions
├── Shared Scope: Delegation to all claimed members
│   ├── Caveats: AllowedMethods(["inscribe", "resolve"])
│   └── Caveats: LimitedCalls(100)  // rate limiting
├── Intimate Scope: Delegation to specific addresses
│   ├── Caveats: AllowedMethods(["inscribe", "resolve", "govern"])
│   └── Sub-delegation: intimate members can invite others (narrowing only)
└── Personal Scope: Self-delegation (only the subject themselves)
    └── Caveats: Redeemer(onlySelf)
```

#### Custom Caveat Enforcer: Encounter Proof

```solidity
contract EncounterCaveatEnforcer is CaveatEnforcer {
    // terms encode: required binding proof type + anchor ID
    // args encode: the proof of encounter (NFC secret, GPS attestation, etc.)

    function beforeHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCallData,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) public override {
        (uint256 anchorId, bytes32 expectedBindingType) = abi.decode(_terms, (uint256, bytes32));

        // Verify the redeemer has proof of physical encounter
        require(
            verifyEncounterProof(anchorId, expectedBindingType, _args),
            "No valid encounter proof"
        );
    }
}
```

#### Two Tiers of Engagement

**Tier 1 — Tap and you're in:** An **open delegation** with an `EncounterCaveatEnforcer` that requires the NFC secret as `_args`. Anyone who has the physical object can redeem the delegation — proving encounter without needing a pre-existing relationship. The delegation grants `resolve` access to the shared scope.

**Tier 2 — Claim and you're a member:** The encounter proof from Tier 1 qualifies the subject for a **named delegation** — a persistent permission grant to their specific address. This delegation grants `inscribe` + `resolve` + potentially `govern` access. Once claimed, the subject doesn't need the NFC secret again.

#### Sub-Delegations Model Nested Scopes

The wedding use case works like this:
- Creator grants `intimate` scope delegation to partner
- Partner sub-delegates `shared` scope (narrowed) to guests
- Each guest holds a delegation chain: creator → partner → guest
- Revoking the root invalidates the entire chain
- Each level can only narrow, never expand

### 5. Relationship → Onchain Events + ERC-8004 Cross-References

Relationships are the connections between identifiers. Expressed as:
- ERC-8004 metadata cross-references: `setMetadata(subjectId, "stewardOf", abi.encode(anchorId))`
- Delegation chain existence itself *is* the relationship — if you hold a delegation from an anchor's creator, you have a verifiable relationship
- An event log on the kernel contract captures relationship creation:

```solidity
event RelationshipEstablished(
    uint256 indexed subjectA,
    uint256 indexed subjectB,
    bytes32 relationshipType,  // "steward", "witness", "member", "creator"
    bytes32 scope
);
```

### 6. Resolve → ENS Wildcard Resolver + Scope-Filtered Queries

The Resolve operation — "given an identifier, retrieve what is known within the requesting subject's scope" — works as:

1. Client queries ENS: `vinyl-record-001.memorykernel.eth`
2. Wildcard resolver returns the ERC-8004 `agentId` and basic public metadata
3. Client calls the kernel's resolve function with their delegation context:

```solidity
function resolve(
    uint256 anchorId,
    bytes[] calldata permissionContexts  // MetaMask delegation chain
) external view returns (
    AnchorData memory anchor,
    Witness[] memory witnesses,
    Relationship[] memory relationships
) {
    // Validate the caller's delegation chain
    // Filter witnesses and relationships by the scope their delegation grants
    // Return only what the caller is permitted to see
}
```

---

## Self Agent ID — Proof-of-Humanity Layer

Self provides the **proof-of-humanity layer** for the kernel's Subject Autonomy property. When a human claims a persistent identity (Tier 2), they can optionally bind it to a Self Agent ID.

### Flow

1. Human taps NFC → encounters anchor → wants to claim identity
2. Self registration flow: scan passport via NFC, generate ZK proof
3. Self mints a soulbound NFT on Celo linking their agent keypair to their humanity proof
4. The kernel's `EncounterCaveatEnforcer` can optionally require Self verification — proving the witness is a unique human without revealing who

### What This Gives the Kernel

- **Sybil resistance** — one human can't fake 100 witnesses for an anchor (nullifier-based deduplication)
- **Privacy-preserving identity** — prove you're human, not which human
- **Optional age/jurisdiction verification** — via ZK proofs over passport data

### Custom Caveat Enforcer: Self Humanity

```solidity
contract SelfHumanityCaveatEnforcer is CaveatEnforcer {
    ISelfAgentRegistry public selfRegistry;

    function beforeHook(
        bytes calldata _terms,
        bytes calldata _args,
        ModeCode _mode,
        bytes calldata _executionCallData,
        bytes32 _delegationHash,
        address _delegator,
        address _redeemer
    ) public override {
        // Verify the redeemer holds a Self Agent ID (soulbound NFT)
        require(
            selfRegistry.balanceOf(_redeemer) > 0,
            "No Self Agent ID — proof of humanity required"
        );
    }
}
```

---

## ERC-8128 (Slice) — Web Authentication Layer

ERC-8128 handles the web authentication flow — the moment between "tapping the NFC tag" and "having a signed session."

### Imprints of Experience Auth Flow

1. NFC tap → browser opens `https://memorykernel.eth/vinyl-record-001?secret=abc123`
2. ERC-8128 auth flow: user proves they control an Ethereum address (SIWE-like)
3. The `secret` param + authenticated address together form the encounter proof
4. Kernel operations (inscribe, resolve) proceed with the authenticated session

---

## Chain Choice

Given the bounty targets:
- **Self Agent ID is on Celo** (and Celo has a $5,000 bounty for "Best Agent on Celo")
- **ERC-8004 is deployed on 30+ chains** including Celo, Base, Ethereum mainnet, and all testnets
- **MetaMask Delegations** work on any EVM chain with ERC-4337 support
- **ENS** lives on mainnet but resolves cross-chain via CCIP-Read

**Celo** is the pragmatic choice — it captures the Self bounty, the Celo bounty, and ERC-8004 is already deployed there. ENS resolution via CCIP-Read can point to Celo state.

For the hackathon: **Celo testnet (Alfajores)** or **Celo mainnet** (gas is cheap) for primary deployment, with ENS on Sepolia.

### ERC-8004 Contract Addresses (Celo)

Already deployed at vanity addresses:
- **IdentityRegistry**: `0x8004A169FB4a3325136EB29fA0ceB6D2e539a432`
- **ReputationRegistry**: `0x8004BAa17C55a88189AE136b182e5fdA19dE9b63`

---

## Contract Architecture Summary

```
memorykernel.eth (ENS, L1 Sepolia)
  └── Wildcard Resolver (ENSIP-10 + CCIP-Read → Celo)

MemoryKernelAnchor.sol (Celo)
  ├── Creates anchors via ERC-8004 Identity Registry
  ├── Stores binding commitments (NFC secret hashes, GPS commitments)
  └── Emits Relationship events

MemoryKernelScope.sol (Celo)
  ├── Integrates with MetaMask DelegationManager
  ├── Custom EncounterCaveatEnforcer (NFC proof verification)
  ├── Custom SelfHumanityCaveatEnforcer (Self ZK proof verification)
  └── Scope-filtered resolve() function

ERC-8004 Registries (Celo, already deployed)
  ├── IdentityRegistry — anchor + subject identities
  ├── ReputationRegistry — witness attestations
  └── ValidationRegistry — third-party verification of witnesses
```

---

## Bounty Coverage

Each technology is load-bearing — not bolted on:

| Technology | Kernel Primitive | Bounty |
|---|---|---|
| ERC-8004 Identity Registry | Identifier, Anchor | Protocol Labs ($8,004) |
| ERC-8004 Reputation Registry | Witness (Inscribe) | Protocol Labs ($8,004) |
| MetaMask Delegation Framework | Scope, Govern | MetaMask ($5,000) |
| ENS Wildcard Resolver | Resolve (Identifier resolution) | ENS ($1,500) |
| Self Agent ID | Subject Autonomy (privacy, Sybil resistance) | Self ($1,000) |
| ERC-8128 | Authentication (application layer) | Slice ($750) |
| Celo deployment | Chain choice | Celo ($5,000) |
| Synthesis Open Track | Cross-cutting | Open Track ($14,500) |

**Total addressable: ~$35,754**
