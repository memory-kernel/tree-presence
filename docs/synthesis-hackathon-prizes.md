# Synthesis Hackathon — Prize Bounties

**Event:** Synthesis — An online builder event where humans and AI agents build real things together.
**Dates:** March 4–25, 2026
**Website:** https://synthesis.md

---

## Synthesis Open Track — $14,500

The shared prize pool for the entire hackathon. Instead of limiting yourself to a single partner bounty, you enter a track judged by a meta-agent that blends the values of all partner judges.

**Contributors:** Celo ($5,000), Bankr ($2,597), SuperRare ($2,500), Octant ($2,000), Valory AG ($1,347), Lido ($500), ENS ($239), bond.credit ($225), Arkhai ($100), Markee ($50)

---

## Protocol Labs — $16,000

### Let the Agent Cook — No Humans Required — $8,000

Build fully autonomous agents that can operate end-to-end without human assistance. Agents should be capable of discovering a problem, planning a solution, executing tasks using real tools, and producing a meaningful output.

**Required Capabilities:**
1. Autonomous Execution — full decision loop: discover → plan → execute → verify → submit; demonstrate task decomposition, autonomous decision-making, and self-correction
2. Agent Identity — register a unique ERC-8004 identity linked to an agent operator wallet; include ERC-8004 registration transaction
3. Agent Capability Manifest — machine-readable agent.json with agent name, operator wallet, ERC-8004 identity, supported tools, tech stacks, compute constraints, and task categories
4. Structured Execution Logs — agent_log.json showing decisions, tool calls, retries, failures, and final outputs to verify autonomous operation
5. Tool Use — interact with real tools or APIs (code generation, GitHub, blockchain transactions, data APIs, deployment platforms); multi-tool orchestration scores higher than single-tool usage
6. Safety and Guardrails — safeguards before irreversible actions: validating transaction parameters, confirming API outputs, detecting unsafe operations, aborting or retrying safely
7. Compute Budget Awareness — operate within a defined compute budget; demonstrate efficient resource usage and avoid excessive calls or runaway loops

**Bonus Features:** ERC-8004 trust signal integration, multi-agent swarms with specialized roles (planner, developer, QA, deployment).

Sponsored by Ethereum Foundation.

**Prizes:**
- 1st Place: $4,000
- 2nd Place: $2,500
- 3rd Place: $1,500

### Agents With Receipts — ERC-8004 — $8,004

Build agents that can be trusted. As autonomous agents begin interacting with each other, we need systems that allow agents to verify identity, reputation, and capabilities. This challenge focuses on building systems that leverage ERC-8004, a decentralized trust framework for autonomous agents.

**Required Capabilities:**
1. ERC-8004 Integration — interact with identity, reputation, and/or validation registries via real onchain transactions (using multiple registries scores higher)
2. Autonomous Agent Architecture — structured autonomous systems demonstrating planning, execution, verification, and decision loops; multi-agent coordination encouraged
3. Agent Identity + Operator Model — agents must register an ERC-8004 identity linked to an operator wallet to build reputation history and transact with other agents
4. Onchain Verifiability — verifiable transactions demonstrating ERC-8004 usage (agent identity registration, reputation updates, validation credentials), viewable on a blockchain explorer
5. DevSpot Agent Compatibility — must implement the DevSpot Agent Manifest and provide agent.json and agent_log.json

Sponsored by PL_Genesis.

**Prizes:**
- 1st Place: $4,000
- 2nd Place: $3,000
- 3rd Place: $1,004

---

## Venice — $11,500

### Private Agents, Trusted Actions — $11,500

Ethereum provides public coordination; Venice provides private cognition. Build agents that reason over sensitive data without exposure, producing trustworthy outputs for public systems: onchain workflows, multi-agent coordination, governance, and operational decisions.

Focuses on the layer between private intelligence and public consequence: confidential treasury management, private governance analysis, deal negotiation agents, onchain risk desks, and sensitive due diligence.

Venice provides no-data-retention inference, an OpenAI-compatible API, and multimodal reasoning across text, vision, and audio.

Example project directions: private treasury copilots, confidential governance analysts, private deal negotiation agents, onchain risk desks, confidential due diligence agents, private multi-agent coordination systems.

Prizes are denominated in VVV, Venice's native ecosystem token. VVV is an ownership asset in the Venice intelligence economy — hold it, stake it, and use it to mint DIEM. DIEM is tokenized API access: each DIEM equals $1/day of Venice compute, perpetually.

**Prizes:**
- 1st Place: 1,000 VVV ($5,750)
- 2nd Place: 600 VVV ($3,450)
- 3rd Place: 400 VVV ($2,300)

---

## Lido Labs Foundation — $10,000

### stETH Agent Treasury — $3,000

Build a contract primitive that lets a human give an AI agent a yield-bearing operating budget backed by stETH, without ever giving the agent access to the principal. ETH staked via Lido, only yield flows to the agent's spendable balance, spending permissions enforced at the contract level.

Must demonstrate: principal structurally inaccessible to the agent, a spendable yield balance the agent can query and draw from, and at least one configurable permission (recipient whitelist, per-transaction cap, or time window). Testnet or mainnet only, no mocks.

**Resources:** stETH integration guide, wstETH contract, contract addresses, Lido JS SDK.

**Prizes:**
- 1st Place: $2,000
- 2nd Place: $1,000

### Vault Position Monitor + Alert Agent — $1,500

Build an agent that watches Lido Earn vault positions (EarnETH and EarnUSD) and tells depositors when something worth knowing has changed — in plain language. Must track yield against at least one external benchmark and detect allocation shifts across underlying protocols (Aave, Morpho, Pendle, Gearbox, Maple). Must deliver alerts via Telegram or email. Testnet or mainnet only, no mocks.

Strong entries expose at least one MCP-callable tool so other agents can query vault health programmatically.

**Prizes:**
- 1st Place: $1,500

### Lido MCP — $5,000

Build the reference MCP server for Lido — a structured toolset that makes stETH staking, position management, and governance natively callable by any AI agent. Must integrate with stETH or wstETH on-chain. Must cover: stake, unstake, wrap/unwrap, balance and rewards queries, and at least one governance action. All write operations must support dry_run. Testnet or mainnet only, no mocks.

Strong entries pair the server with a lido.skill.md that gives agents the Lido mental model before they act.

**Prizes:**
- 1st Place: $3,000
- 2nd Place: $2,000

---

## OpenServ — $5,000

### Best OpenServ Build Story — $500

A content challenge. Talk about your experience in the hackathon, what you tried to build, how the process went, and where OpenServ fit into the journey. Can be: an X thread, a short article or blog post, or a build log/recap post.

**Prizes:**
- 1st Place: $250
- 2nd Place: $250

### Ship Something Real with OpenServ — $4,500

Build a useful AI-powered product or service on OpenServ. Projects should use OpenServ to power multi-agent use cases: multi-agent workflows, custom agents, x402-native services, ERC-8004-powered agent identity, token launch mechanics.

Looking for: agentic economy products, x402-native services, and agentic DeFi (trading copilots, strategy assistants, yield/vault helpers, liquidity management tools, DeFi monitoring, portfolio automation). Bonus: register your workflow or agent on ERC-8004.

**Prizes:**
- 1st Place: $2,500
- 2nd Place: $1,000
- 3rd Place: $1,000

---

## Celo — $5,000

### Best Agent on Celo — $5,000

Build agentic applications on Celo — an Ethereum L2 designed for fast, low-cost real-world payments. Looking for AI agents that leverage Celo's stablecoin-native infrastructure, mobile accessibility, and global payments ecosystem. Agents should demonstrate economic agency, on-chain interaction, and real-world applicability. All agent frameworks welcome.

**Prizes:**
- 1st Place: $3,000
- 2nd Place: $2,000

---

## Bankr — $5,000

### Best Bankr LLM Gateway Use — $5,000

Build autonomous systems powered by the Bankr LLM Gateway. Use a single API to access 20+ models (Claude, Gemini, GPT) and connect them to real onchain execution through Bankr wallets and tools. Applications can fund their own inference using wallet balances, trading activity, or launch revenue.

Ideas: Trading & Markets, Commerce & Payments, Marketplaces & Coordination, Token Launch & Ecosystems, Lending & Borrowing, Research & Data, Design & Engineering Copilots.

Judging: real execution and real onchain outcomes. Bonus for self-sustaining economics.

**Resources:** Bankr LLM Gateway, Token Launching, Bankr Skill.

**Prizes:**
- 1st Place: $3,000
- 2nd Place: $1,500
- 3rd Place: $500

---

## MetaMask — $5,000

### Best Use of Delegations — $5,000

Projects that use the MetaMask Delegation Framework in creative, novel, and meaningful ways. Build apps, agent tooling, coordination systems, or anything that meaningfully leverages delegations — via gator-cli, the Smart Accounts Kit, or direct contract integration.

Strongest submissions use intent-based delegations as a core pattern, extend ERC-7715 with sub-delegations or novel permission models, or combine ZK proofs with delegation-based authorization. Standard patterns without meaningful innovation will not place.

**Prizes:**
- 1st Place: $3,000
- 2nd Place: $1,500
- 3rd Place: $500

---

## Uniswap — $5,000

### Agentic Finance (Best Uniswap API Integration) — $5,000

Build the future of agentic finance with Uniswap. Integrate the Uniswap API to give your agent the ability to swap, bridge, and settle value onchain. Must integrate the Uniswap API with a real API key from the Developer Platform. Functional swaps with real TxIDs on testnet or mainnet. Open source, public GitHub with README. No mocks.

Bonus: deeper integration into the Uniswap stack — Hooks, AI Skills, Unichain, v4 contracts, Permit2.

**Resources:** Uniswap API, Uniswap AI Skills, Uniswap API Docs, Uniswap Docs.

**Prizes:**
- 1st Place: $2,500
- 2nd Place: $1,500
- 3rd Place: $1,000

---

## Olas — $3,000

### Build an Agent for Pearl — $1,000

Build and ship an agent integrated into Pearl following the official integration guide. The agent must satisfy the full QA checklist to qualify.

**Prizes:**
- 1st Place: $1,000

### Hire an Agent on Olas Marketplace — $1,000

Build a project that incorporates mech-client to hire AI agents and make requests on the Olas Mech Marketplace. The project's "client agent" must have completed at least 10 requests on one of the supported chains.

**Prizes:**
- 1st Place: $500
- 2nd Place: $300
- 3rd Place: $200

### Monetize Your Agent on Olas Marketplace — $1,000

Build a project that incorporates mech-server to serve AI agent requests on the Olas Mech Marketplace. The project's "server agent" must have served at least 50 requests on one of the supported chains.

**Prizes:**
- 1st Place: $500
- 2nd Place: $300
- 3rd Place: $200

---

## Octant — $5,000

### Mechanism Design for Public Goods Evaluation — $1,000

What adjacent innovations in DPI capital issuance could make evaluation faster, fairer, or more transparent?

**Prizes:**
- Best Submission: $1,000

### Agents for Public Goods Data Analysis for Project Evaluation — $1,000

What patterns or insights can agents extract from existing datasets that humans can't scale? Qualitative data is especially interesting.

**Prizes:**
- Best Submission: $1,000

### Agents for Public Goods Data Collection for Project Evaluation — $1,000

How can agents surface richer, more reliable signals about a project's impact or legitimacy? Qualitative data is especially interesting.

**Prizes:**
- Best Submission: $1,000

---

## Locus — $3,000

### Best Use of Locus — $3,000

Projects that most meaningfully integrate Locus payment infrastructure for AI agents. Must use Locus wallets, spending controls, pay-per-use APIs, or vertical tools as core to the product. On Base chain, USDC only.

**Prizes:**
- 1st Place: $2,000
- 2nd Place: $500
- 3rd Place: $500

---

## SuperRare — $2,500

### SuperRare Partner Track — $2,500

Build autonomous agents that live, mint, and trade entirely on-chain using Rare Protocol. Projects must use the Rare Protocol CLI for: ERC-721 contract deployment, minting (with integrated IPFS pinning), auction creation, and settlement — with no human intervention. Agents must manage their own wallets and gas costs.

Looking for works where agent behavior shapes the artwork: pieces that respond to bidding activity, evolve with market signals, or treat auction dynamics as compositional elements.

Supported networks: Ethereum Mainnet, Sepolia, Base, Base Sepolia.

**Resources:** Rare Protocol CLI (npm), Rare Protocol website, Builder Telegram.

**Prizes:**
- 1st Place: $1,200
- 2nd Place: $800
- 3rd Place: $500

---

## Slice — $2,200

### Ethereum Web Auth / ERC-8128 — $750

Projects that correctly use ERC-8128 as an authentication primitive. Examples: authenticating users to apps with ERC-8128 using a SIWE-like flow, APIs using ERC-8128 to seamlessly authenticate agents. Looking for working demos and compliant, creative use. Winners must provide an Ethereum address to claim.

**Prizes:**
- 1st Place: $500 (in Slice product credits)
- 2nd Place: $250 (in Slice product credits)

### The Future of Commerce — $750

Custom websites, checkout experiences, or other flows built on Slice stores and products — for humans or agents. Looking for innovative experiences that leverage Slice protocol compared to typical e-commerce, particularly useful to non-crypto-native users. Winners must provide an Ethereum address to claim.

**Prizes:**
- 1st Place: $500 (in Slice infrastructure credits)
- 2nd Place: $250 (in Slice infrastructure credits)

### Slice Hooks — $700

Pricing strategies and onchain actions that add to Slice products otherwise unsupported functionalities, checkout flows, or integrations with other protocols on Base. Looking for tested, original hooks useful to Slice merchants or buyers. Winners must provide an Ethereum address to claim.

**Prizes:**
- 1st Place: $550 (2 Slice Pass NFTs + $250 in credits)
- 2nd Place: $150 (1 Slice Pass NFT)

---

## Status Network — $2,000

### Go Gasless: Deploy & Transact on Status Network with Your AI Agent — $2,000

Status Network is an Ethereum L2 with gas literally set to 0 at the protocol level. Deploy a smart contract and execute at least one gasless transaction on Status Network's Sepolia Testnet (Chain ID: 1660990954). Projects must include an AI agent component. Prize pool split equally among all qualifying submissions, capped at 40 teams (minimum $50/team).

**Qualifying criteria:** verified contract deployment, at least one gasless transaction with tx hash proof, AI agent component, and a README or short video demo.

**Prizes:**
- $50 per qualifying team (up to 40 teams)

---

## Merit Systems — $1,750

### Build with AgentCash — $1,750

AgentCash (agentcash.dev) is a unified USDC wallet that lets AI agents pay for x402 APIs at request time — no API keys, no subscriptions. Open to any project that meaningfully uses AgentCash to consume x402-compatible endpoints or produce new x402-compatible APIs. Ships as an MCP server with 200+ bundled routes. Judges looking for projects where the x402 payment layer is load-bearing.

**Prizes:**
- 1st Place: $1,000
- 2nd Place: $500
- 3rd Place: $250

---

## ENS — $1,500

### ENS Identity — $600

Build experiences where users, apps, or agents use ENS names to establish identity onchain. Anywhere a hex address appears, an ENS name should replace it. Rewards projects involving: name registration and resolution, agent identity, profile discovery, and any experience where names replace addresses as the primary identifier.

**Prizes:**
- 1st Place: $400
- 2nd Place: $200

### ENS Open Integration — $300

Catch-all track for any project that meaningfully integrates ENS. ENS should be core to the experience, not an afterthought.

**Prizes:**
- Best ENS Open Integration: $300

### ENS Communication — $600

Build communication and payment experiences powered by ENS names. Names should work anywhere you send a message, route a payment, or discover another participant. Rewards projects using ENS for messaging, social payments, agent-to-agent communication, and UX flows that eliminate raw addresses entirely.

**Prizes:**
- 1st Place: $400
- 2nd Place: $200

---

## bond.credit — $1,500

### Agents that Pay — $1,500

Autonomous trading agents competing live on GMX on Arbitrum during the two-week Synthesis window. Sponsored by bond.credit × GMX × iExec. One hard rule: the agent must have traded live on GMX perps on Arbitrum. No simulations. No retroactive demos. Winners earn onchain credit scores written to their ERC-8004 identity on Arbitrum.

**Prizes:**
- 1st Place: $1,000
- 2nd Place: $500

---

## Self — $1,000

### Best Self Agent ID Integration — $1,000

Best integration of Self Agent ID (app.ai.self.xyz) — Self Protocol's ZK-powered identity primitive for AI agents. Projects should give agents verifiable, privacy-preserving, human-backed identities using Self's SDK, registration modes, or MCP server. Looking for meaningful applications where agent identity is load-bearing: soulbound NFT generation, A2A identity verification, Sybil-resistant workflows, or novel uses of human-backed credential verification.

**Prizes:**
- Best Self Agent ID Integration: $1,000 (winner-takes-all)

---

## Arkhai — $1,000

### Applications — $450

Build new applications using Alkahest, natural-language-agreements, git-commit-trading, or de-redis-clients as a core dependency. Extend existing Arkhai protocols into new domains — freelance work, data delivery, API SLAs, P2P service exchange — or build entirely new user-facing products. Integration must be substantive.

**Prizes:**
- Best Submission: $450

### Escrow Ecosystem Extensions — $450

Build new arbiters, verification primitives, and obligation patterns that extend the Alkahest escrow protocol. Rewards protocol-level work: novel arbiter types (ZK-based, multi-party, reputation-weighted, AI-evaluated), new obligation structures, and generalized escrow primitives. Must go beyond wrapping existing contracts.

**Prizes:**
- Best Submission: $450

---

## Markee — $800

### Markee Github Integration — $800

Integrate a Markee message into a genuine, high-traffic GitHub repository. Two objective, onchain and GitHub-verifiable metrics determine prize allocation. Must own a GitHub repo, grant OAuth permissions via Markee app, add the Markee delimiter text to a markdown file, and appear as "Live" on the Markee GitHub integrations page. Disqualified if fewer than 10 unique views and no funds added.

**Prizes:**
- Top Views: $400 (proportional)
- Top Monetization: $400 (proportional)

---

## Ampersend — $500

### Best Agent Built with ampersend-sdk — $500

Build the best AI agent using the ampersend-sdk. Looking for creative, functional agents that leverage the ampersend-sdk as a core dependency to deliver real utility. Integration must be substantive.

**Prizes:**
- Best Agent Built with ampersend-sdk: $500

---

## Total Prize Pool Summary

| Sponsor | Total |
|---------|-------|
| Protocol Labs | $16,000 |
| Synthesis Open Track | $14,500 |
| Venice | $11,500 |
| Lido Labs Foundation | $10,000 |
| OpenServ | $5,000 |
| Celo | $5,000 |
| Bankr | $5,000 |
| MetaMask | $5,000 |
| Uniswap | $5,000 |
| Octant | $5,000 |
| Olas | $3,000 |
| Locus | $3,000 |
| SuperRare | $2,500 |
| Slice | $2,200 |
| Status Network | $2,000 |
| Merit Systems | $1,750 |
| ENS | $1,500 |
| bond.credit | $1,500 |
| Self | $1,000 |
| Arkhai | $1,000 |
| Markee | $800 |
| Ampersend | $500 |
| **Total** | **~$107,750** |
