# Demo Strategy — Tree Guardian Agent

**Date:** 2026-03-18
**Status:** Guardian agent implemented, not yet tested on-chain

---

## What's Built

The `mk-agent serve` command is implemented in `packages/agent/`. It starts an autonomous guardian loop for any anchored subject:

- **Polling**: Watches for `NewFeedback` events on the anchor every 10s
- **Reasoning**: Sends full context (all witnesses, metadata, summary) to Claude via tool_use
- **Actions**: The LLM returns structured tool calls that map to on-chain transactions:
  - `update_metadata` → `IdentityRegistry.setMetadata()`
  - `respond_to_witness` → `ReputationRegistry.appendResponse()`
  - `log_observation` → local `agent_log.json` only
- **Persistence**: Tracks `lastProcessedBlock` in agent state for resume across restarts

### Files

```
packages/agent/src/
├── reasoning/
│   ├── provider.ts       # ReasoningProvider interface, AgentAction types, AnchorContext
│   ├── claude.ts         # Claude implementation (@anthropic-ai/sdk, tool_use)
│   └── prompts.ts        # Guardian persona system prompt + context builder
├── commands/
│   └── serve.ts          # The serve command: poll → reason → execute → log
```

Modified: `erc8004/abis.ts` (appendResponse ABI), `erc8004/reputation.ts` (appendResponse wrapper), `agent.ts` (lastProcessedBlock), `index.ts` (register command).

### Usage

```bash
export ANTHROPIC_API_KEY=sk-ant-...
export MK_PRIVATE_KEY=0x...
mk-agent serve --anchor <id>
mk-agent serve --anchor <id> --model claude-haiku-4-5-20251001  # cheaper model
```

---

## Demo Narrative: "Old Oak"

A tree anchored at a geographic location. People encounter it and leave witness attestations. The tree's guardian agent watches, reasons, and acts autonomously on-chain.

### Script

1. **Anchor the tree**
   ```bash
   mk-agent anchor --type tree --name "Old Oak" --secret "park-bench-left"
   ```

2. **Start the guardian**
   ```bash
   mk-agent serve --anchor <id>
   ```

3. **Three encounters from different wallets:**

   Witness A — seasonal observation:
   > "Leaves are turning golden, a few bare branches on the east side. Early autumn this year."

   Witness B — damage report:
   > "Noticed bark damage near the base — looks like a lawnmower hit it. About 15cm scar."

   Witness C — community use:
   > "Beautiful day. Kids were climbing it. Healthy canopy, full shade."

4. **Guardian reasons and acts (audience watches live):**
   - After A: updates `season: early-autumn`, responds acknowledging the observation
   - After B: updates `health: minor-bark-damage`, flags urgency, responds asking for photo
   - After C: corroborates health (canopy full → damage is localized), logs community role observation

5. **Resolve shows the accumulated state:**
   ```bash
   mk-agent resolve --anchor <id>
   ```
   Metadata, all witnesses, all guardian responses, confidence score.

**Punch line:** This tree has autonomous on-chain agency. It "speaks" through its guardian. It builds a verifiable history that no single person controls.

---

## What's Next

### Priority 1: Demo Script (small)

A `demo.sh` that runs the full end-to-end flow with 3 wallets. Makes the demo repeatable and showable.

### Priority 2: Services in Registration JSON (small)

The tree's ERC-8004 identity should advertise discoverable services:

```json
{
  "services": [
    { "name": "guardian", "endpoint": "erc8004:42:reputation:response" },
    { "name": "seasonal-report", "endpoint": "erc8004:42:metadata:season" },
    { "name": "health-status", "endpoint": "erc8004:42:metadata:health" },
    { "name": "ENS", "endpoint": "old-oak.memorykernel.eth" }
  ]
}
```

This is what makes it an **agent** in the ERC-8004 sense — discoverable, interactable. Update `buildRegistrationJson()` and the anchor command.

### Priority 3: ENS Wildcard Resolver (medium)

`old-oak.memorykernel.eth` resolving to the tree's metadata via ENSIP-10 + CCIP-Read from Celo. Even a stub contract on Sepolia that maps subnames → agentIds. Hits the $1,500 ENS bounty.

### Priority 4: Park Steward Agent — Agent-to-Agent (medium)

**This is the key hackathon differentiator.**

A second agent (e.g., `mk-agent serve-steward --park <id>`) that:
- Has its own ERC-8004 identity on Celo
- Monitors multiple tree anchors in a park
- Queries each tree's health metadata periodically
- Produces a park-wide health report
- When it detects damage on a tree, it files a witness attestation on the park anchor referencing the tree

Two autonomous LLM-powered agents on Celo, both with ERC-8004 identities, communicating through on-chain state. That's the "AI agents on-chain" story Synthesis judges want.

### Priority 5: MetaMask Delegation for Scoped Witnessing (large)

EncounterCaveatEnforcer contract — NFC secret as proof-of-encounter for delegation redemption. Hits the $5,000 MetaMask bounty. Only if time allows.

---

## Bounty Alignment

| Feature | Bounties |
|---------|----------|
| Guardian agent (built) | ERC-8004 Agents With Receipts ($8,004), Celo ($5,000) |
| Services registration | ERC-8004 ($8,004) |
| ENS resolver | ENS ($1,500) |
| Park Steward agent-to-agent | Let the Agent Cook ($8,000), Open Track ($14,500) |
| MetaMask delegations | MetaMask ($5,000) |
