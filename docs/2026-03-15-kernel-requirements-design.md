# Kernel Requirements: Anchoring Physical Subjects to Verifiable Digital Presence

## Purpose

This document defines the requirements for a kernel — a minimal substrate that enables physical objects, places, and living things to acquire verifiable digital presence through human encounter.

The kernel is not an application. It is the foundation that applications are built upon. Applications like private memory spaces for gifted vinyl records, digital presences for physical books, or presence practices around trees all share this common substrate.

The kernel's job is to make inscriptions verifiable. Whether those inscriptions are preserved, discovered, or experienced is the responsibility of applications and the people who steward them.

## Origin

This kernel emerges from several converging ideas:

- **Imprints of Experience** — physical objects (vinyl records, stickers, anything) given NFC tags that link to private, shared memory spaces. The creator encodes a URL into an NFC tag, gives the object to a friend, and a shared digital space forms around the physical gift.
- **Living Library** — physical books given digital presence, accumulating inscriptions as they pass through hands.
- **Tree Appreciation** — trees as anchors for presence practices, ecological witnessing, and communal ritual. Governed by presence-first design principles where the primary experience happens with the tree, not on the screen.

The shared kernel across all of these: anchoring a physical subject to a digital space, and representing the relationships of humans who encounter and are co-present with that subject — ideally cryptographically.

## Conceptual Foundation: Functional Identity

This kernel adopts the Functional Identity perspective: identity is how we recognize, remember, and ultimately respond to specific people and things. It is not a thing someone possesses — it is an information processing function.

The kernel's vocabulary maps to this functional framework:

- **Subjects** — people and things under consideration
- **Identifiers** — labels which refer to subjects
- **Attributes** — what we know about subjects
- **Context** — provenance of information: where it came from, how we got it, why it can be relied upon
- **Governance** — managing the creation and flow of information so the right people have access for the right reasons at the right time

---

## Section 1: Domain Model — Core Primitives

The kernel operates with five primitives.

### Anchor

A verifiable association between an identifier and a physical subject (object, place, living thing). The anchor establishes that this identifier refers to *this* thing in the world. The strength of that association is not intrinsic — it accumulates through witnesses, corroborating attributes, and social consensus over time. An anchor may carry attributes (type, description, location) but only the identifier is essential.

### Witness

A signed attestation that a subject (person, agent) encountered an anchored subject (physical object, place) at a point in time and optionally at a place. A witness is a claim. Its credibility comes from context — who attested, when, corroborated by what. Witnesses may carry content (observations, memories, sensory impressions) or be bare attestations of co-presence. Witnesses are how the system **acquires** new information about subjects and their relationships.

### Identifier

A label that refers to a subject — a person, a tree, a book, a vinyl record. Identifiers are how the system **recognizes** subjects across encounters. An identifier accumulates attributes and witnesses over time, building a body of knowledge. The kernel does not prescribe how identifiers are created, discovered, or resolved.

### Relationship

A verifiable correlation between identifiers expressing a role or connection. "This person is a steward of this anchor." "This person witnessed this object." "These people share a space." Relationships are how the system **remembers** the connections between subjects. They may be unidirectional or mutual, and may carry context about conditions or duration.

### Scope

A boundary that governs visibility and context. Attestations, relationships, and attributes exist within scopes. The same anchor may surface different information to different participants. Scopes are how the system **governs** the flow of identity information — ensuring the right people have access for the right reasons. Applications define the topology of scopes.

---

## Section 2: Kernel Properties

These are the non-negotiable properties that any instantiation of the kernel must provide.

### Verifiability

Any attestation, relationship, or anchor can be verified as authentic and unaltered by anyone who possesses the data. Verification requires no central authority. The data carries its own proof.

### Integrity

The history of an anchor — its witnesses, relationships, changes in attributes — is tamper-evident. If any part of the history has been altered or omitted, this is detectable.

### Subject Autonomy

A subject controls what they attest and what they disclose. No party can forge attestations on behalf of another subject. No party can compel disclosure of information beyond what a subject has chosen to share in a given context.

### Independence

The kernel's guarantees hold regardless of where data is hosted. A witness created today is verifiable on any system that can process the data, at any point in the future.

### Governance as a Primitive

The kernel provides mechanisms to manage the flow of information — who may acquire, who may apply, under what contexts. It does not prescribe a governance model. Applications define their own governance using the kernel's primitives.

### Privacy by Default

Information is not globally visible unless explicitly made so. Subjects choose what to share, with whom, and in what context. Public visibility is an active choice.

### Technology Agnosticism

The kernel defines data models, properties, and interfaces — not implementations. Any technology that can satisfy these properties is a valid substrate.

---

## Section 3: Kernel Operations

These are the actions the kernel supports. Some operations share names with primitives (Anchor, Scope) — the operation creates or defines the primitive.

### Anchor

Bind an identifier to a physical subject. The anchor is the seed — everything else accumulates around it. The creator may attach initial attributes and define initial scopes.

### Inscribe

Leave a verifiable mark against an anchor — a witness, an observation, a memory, an attribute. Inscriptions are signed by the inscribing subject's keys, carry a timestamp, and optionally location and content. An inscription is self-contained — verifiable without consulting any central authority. Inscription is intentional, not casual. It implies crossing a threshold.

### Resolve

Given an identifier, retrieve what is known — the anchor, its attributes, inscriptions, and relationships — within the requesting subject's scope. Resolution is how recognition happens. The kernel must support resolution but does not prescribe where the data lives or how it is fetched.

### Relate

Establish a verifiable connection between identifiers. This may require mutual consent (two people agreeing to share a space) or may be unilateral (a witness attests co-presence). The relationship carries context about its nature and the conditions under which it holds.

### Scope

Define a visibility boundary. Determine what information is available within this scope and to whom. Scopes can be nested (personal within intimate within shared within public) or overlapping. The kernel provides the primitive; applications compose the topology.

### Govern

Manage the flow of identity information within and across scopes. This includes: who may anchor, who may inscribe, who may correlate new attributes, who may resolve, and under what contexts. Governance is itself scoped — different spaces may have different governance. The kernel provides the mechanism, not the policy.

### Verify

Given any piece of kernel data — an anchor, an inscription, a relationship — confirm its authenticity and integrity without relying on any central authority. Verification is a local operation on the data itself.

---

## Section 4: Kernel Boundaries

The kernel is a substrate. It must resist becoming a platform. These boundaries keep it minimal.

### The kernel does not store content

Inscriptions carry context and signatures. Where the content of those inscriptions lives — a server, a file, a peer-to-peer network, a USB drive — is not the kernel's concern. The kernel guarantees verifiability of content, not availability of content.

### The kernel does not host memory spaces

The shared environments where people interact, curate, and steward — those are applications built on top. The kernel provides the anchors, inscriptions, relationships, and scopes that such spaces read from and write to.

### The kernel does not define binding strategies

How an identifier is linked to a physical object — NFC tag, QR code, GPS coordinates, visual recognition, spoken name — is an application decision. The kernel accepts that an anchor exists and provides the machinery to strengthen it through accumulated inscriptions.

### The kernel does not prescribe governance

It provides the primitives for governance (scopes, relationships, roles) but never mandates a model. A space may be a benevolent dictatorship, a consensus democracy, or ungoverned entirely.

### The kernel does not manage discovery

How you find an anchor — tapping a tag, scanning a code, searching a directory, hearing about it from a friend — is outside the kernel. The kernel provides resolution once you have an identifier, not discovery of identifiers you don't yet know.

### The kernel does not authenticate subjects

It provides the machinery for subjects to prove they control an identifier (via cryptographic signatures). But login flows, recovery mechanisms, biometrics, onboarding — these are application concerns. The kernel verifies signatures, not people.

### The kernel does not capture attention

The kernel is quiet infrastructure. It has no feeds, no notifications, no engagement loops. It enables inscription and verification. The experience of encounter happens in the world, not in the kernel.

---

## Section 5: Design Principles

These principles guide any instantiation of the kernel.

### Presence before interaction

The kernel supports encounters in the physical world. It should never become the reason someone is looking at a screen instead of a tree, a book, or a friend.

### Integrity without authority

Verifiability comes from the data itself, not from a trusted institution. No single party can revoke, alter, or gatekeep the kernel's guarantees.

### Accumulation over assertion

The binding between digital and physical is not declared once — it strengthens through use. An anchor with a thousand inscriptions across ten years is more credible than one created yesterday. Confidence is earned, not asserted.

### Minimalism as durability

The kernel does as little as possible. Every primitive it includes is load-bearing. This is what makes it durable — fewer assumptions to break, fewer dependencies to rot.

### Privacy as a default, not a feature

Information is scoped by default. Visibility expands only through deliberate choice. The kernel never assumes that more sharing is better.

### Quiet infrastructure

The kernel does not compete for attention. It does not optimize for engagement. It exists to be relied upon, not to be noticed.

### Plurality without prescription

The kernel supports many binding strategies, many governance models, many applications. It does not center any single tradition, technology, or use case.

---

## Functional Identity Mapping

The kernel's primitives map to the functional identity verbs:

| Kernel Primitive | Functional Role |
|---|---|
| Anchor + Identifier | **Recognition** — how we recognize subjects across encounters |
| Inscribe (Witness) | **Acquisition** — how we gather new information about subjects |
| Relationship | **Remembering** — how we retain connections between subjects |
| Scope + Govern | **Governance** — how we manage the flow of identity information |
| Memory spaces (applications) | **Application** — how identity information is used to affect the world |

---

## Focal Use Cases

These are not part of the kernel specification, but they ground it in real intent. Each use case exercises the kernel's primitives differently, revealing the range of what the substrate must support.

### Imprints of Experience

**Origin story:** Five physical vinyl records, each fitted with an NFC tag and a sticker. A URL encoded into the tag, containing a secret token. Given to friends. Creating a private memory space anchored to the physical gift.

**The flow:**

A creator obtains physical objects. They anchor each object — creating an identifier and encoding it into an NFC tag. They define a scope (private, shared among recipients) and configure an access policy. They give the objects to friends.

When a friend taps the NFC tag, the encoded URL resolves the identifier. The secret in the URL is proof of physical encounter — only someone with the object could have it. This is the first tier of engagement: **tap and you're in**. Zero friction, no wallet, no cryptographic knowledge. The physical object is the key.

The friend may then optionally claim a cryptographic identifier — establishing a persistent, verifiable relationship with the anchor. This is the second tier: **claim and you're a member**. The NFC secret acts as an invitation; claiming converts physical proof into a persistent digital identity. Once claimed, the subject holds keys that let them inscribe, participate in governance, and shape the memory space.

The creator configures whether the physical object is an open invitation (unlimited claims as it passes through hands), a one-time claim (the object is a key, the relationship is permanent), or something in between. This is a per-imprint decision.

Over time, the anchor accumulates inscriptions from its holders — memories, observations, shared meaning. The memory space itself lives wherever the participants choose to host it. The kernel guarantees that any inscription, once made, is verifiable by anyone who has it.

**Platform aspiration:** The creator is the first user, but the system should allow others to sign up and create their own imprints. Artisanal origins, platform aspirations.

**Kernel primitives exercised:** Anchor (NFC-encoded identifier), Witness (tap as proof of encounter), Relationship (claim as persistent membership), Scope (private space shared among holders), Governance (creator-configured access policy).

### Living Library

**Concept:** Tools for anyone to give a physical book a digital presence, with similar capabilities around shared memory and encounter.

**The flow:**

A book is anchored — perhaps via a sticker with an NFC tag, a bookplate with a QR code, or simply a shared understanding of its identifier. As the book passes through hands, each reader may inscribe: a thought, a passage that moved them, a disagreement, a question for the next reader.

The anchor accumulates a conversation across time and strangers. The book's physical journey is mirrored by its growing digital presence. Unlike Imprints of Experience, the book may pass through many more hands, and the relationship between readers is often sequential rather than concurrent — a chain of encounter rather than a group.

The binding between identifier and physical book is interesting here: books are mass-produced. Many copies exist. The anchor identifies *this* copy — strengthened by the inscriptions of people who held *this* specific object. The NFC tag or bookplate is the initial binding; the accumulated inscriptions are what make it credible over time.

**Kernel primitives exercised:** Anchor (book identifier, strengthened through accumulation), Witness (each reader's encounter), Inscribe (layered conversation across time), Relationship (sequential chain of readers).

### Tree Appreciation

**Concept:** Trees as anchors for presence practices, ecological witnessing, and communal ritual. Governed by a presence-first philosophy where the primary experience happens with the tree, not on the screen.

**The flow:**

A tree is anchored to its location. The binding is spatial — the tree is *here*. People who visit may inscribe: seasonal observations, ecological notes, moments of stillness, climate witness records, grief, gratitude. The anchor accumulates a portrait of the tree across years and seasons.

Co-presence is the primary mode. People who return to the same tree, across time, find traces of each other's attention. Not as a feed or a timeline — memories are surfaced as encounters, contextually resonant (season, weather, time of day), arriving like gifts rather than inventory.

The tree's space supports emergent practices: dawn movement, seasonal return visits, lantern gatherings, climate witnessing. These are not programmed — they arise from the quiet accumulation of shared presence.

**Presence-first design ethos (applies broadly to the kernel):**
- The application directs attention outward into the environment, not inward toward the device
- Interaction duration is brief and purposeful
- Memory is encounter, not archive — surfaced one at a time, not browsed
- Success is measured by meaningful return, not time spent
- Technology acts as quiet scaffolding
- No feeds, no infinite scroll, no attention capture mechanics
- Care is visible, control is not

**Spatio-temporal dimension:** The tree use case reveals that co-presence is not just "I was with this object" but "I was with this object, *here*, *now*." Location and time are part of the witness. Environmental context (season, weather, temperature) deepens the inscription. This spatio-temporal richness is available to all use cases but is most central here.

**Kernel primitives exercised:** Anchor (spatial binding to a living subject), Witness (presence attestation with location and environmental context), Inscribe (ecological observations, emotional traces, seasonal markers), Scope (commons stewardship — shared space with collective care), Governance (soft stewardship — flagging, contextual replies, natural weathering of harm).

### Wedding / Event Memory Space

**Concept:** A memory space for a bounded event — a wedding, a festival, a gathering. Anchored to a place, an object (invitation, guest book), or a moment in time.

**The flow:**

A wedding is anchored. Guests inscribe during and after the event — toasts, moments, photographs, feelings. The anchor accumulates a collective memory of the occasion.

**Layered privacy:** This use case reveals the full depth of scoping. The same event has multiple simultaneous layers:
- **Public** — a wedding happened here, on this date
- **Shared** — the guests' collective memories, visible to all attendees
- **Intimate** — the couple's private layer, things only they see
- **Personal** — each guest's own experience, surfaced only to them

A festival stretches this further: thousands of people, multiple stages and locations, temporal layers (Friday night vs Sunday morning). Each person's experience is a unique slice through a vast, layered space. Data ranges from personal and subjective to shared and public.

**Ephemerality:** Some of these spaces are meant to be temporary — a festival weekend that fades. Others are meant to last generations — a wedding memory passed to children. The kernel must support both without prescribing either.

**Kernel primitives exercised:** Anchor (event or place binding), Scope (nested and overlapping visibility layers — public, shared, intimate, personal), Witness (attendance as co-presence), Inscribe (collective memory formation), Governance (who can see and contribute to which layer).

### Cross-Cutting Observations

These patterns emerge across the use cases and inform the kernel's design:

**Two tiers of engagement.** A low-friction encounter (tap, visit, attend) and an optional deepening (claim a cryptographic identifier, establish a persistent relationship). The kernel must support both anonymous encounter and identified participation.

**Binding strategies vary.** NFC tags for objects, spatial coordinates for trees, shared secrets for events. The kernel provides the anchor primitive; each use case composes its own binding strategy.

**Scope topologies vary.** Imprints are small and intimate. Trees are communal commons. Festivals are vast with many overlapping layers. The kernel provides the scoping primitive; each use case defines its own topology.

**Temporal character varies.** A book accumulates across years. A festival is a weekend. A tree spans generations. The kernel must be indifferent to temporal scale.

**The physical object is always primary.** In every case, the digital layer serves the encounter with the physical subject. The screen is a threshold, not a destination.

---

## Open Questions

These are acknowledged areas of uncertainty, deferred for future exploration.

- **Scope enforcement** — The kernel defines scope as a primitive. How scopes are enforced in practice (encryption, access control lists, capability tokens, or other mechanisms) is an implementation concern that will vary by technology substrate.
- **Identifier resolution** — The kernel requires that identifiers be resolvable but does not prescribe resolution mechanisms. How resolution works across different instantiations (and whether cross-instantiation resolution is possible or desirable) is open.
- **Binding confidence** — The kernel asserts that anchor-to-physical bindings strengthen through accumulation. Whether and how to represent this confidence formally (a score, a threshold, a qualitative assessment) is unresolved.
- **Ephemeral inscriptions** — Some inscriptions may be intentionally temporary. How the kernel represents and supports ephemerality alongside its integrity guarantees is a design tension to resolve.
- **Interoperability** — If the kernel is instantiated with different technologies for different use cases, can an inscription from one instantiation be verified in another? Should it be?
