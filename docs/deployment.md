# Deployment Guide

Deploy Tree Presence (API server + guardian agent) to Fly.io.

## Prerequisites

- [Fly CLI](https://fly.io/docs/flyctl/install/) installed and authenticated (`fly auth login`)
- 5 funded Celo wallets (private keys) — see [Wallet Setup](#1-wallet-setup) below
- An [Anthropic API key](https://console.anthropic.com/) for Claude reasoning
- A domain with DNS access (optional, for custom domain)

## Overview

The deployment runs a single Fly.io machine with three processes:

| Process | Role | Port |
|---------|------|------|
| API server (Hono) | JSON API (`/api/docs`, `/api/status`, `/api/witness`, `/api/converse`) | 8080 (public) |
| Guardian agent | Watches one tree anchor, reasons about witnesses | — |
| Park steward | Monitors multiple trees, cross-tree analysis | — |

Agent state is persisted to a Fly volume at `/app/data/`.

---

## Step-by-step

### 1. Wallet Setup

You need 5 Celo wallets. Generate them any way you like (MetaMask, `cast wallet new`, etc.). Each needs ~0.01 CELO for gas.

| Wallet | Purpose | Env var |
|--------|---------|---------|
| Creator | Owns the tree anchor, runs guardian | `TP_PRIVATE_KEY` |
| Witness A | Seasonal observer | used in demo only |
| Witness B | Damage reporter | used in demo only |
| Witness C | Community observer | used in demo only |
| Steward | Owns park anchor, witnesses trees | `STEWARD_KEY` |

**Fund wallets:** Send ~0.05 CELO to each address. On Celo mainnet, gas costs are negligible (~$0.001/tx). You can get CELO from an exchange or bridge.

To derive an address from a private key locally:
```bash
cd packages/agent
TP_PRIVATE_KEY=0x... npx tsx -e "
  import { privateKeyToAccount } from 'viem/accounts';
  console.log(privateKeyToAccount(process.env.TP_PRIVATE_KEY).address);
"
```

### 2. Run the Demo Locally (creates anchors)

Before deploying, run the demo to create the tree and park anchors on-chain. The anchor IDs are needed for deployment config.

```bash
# Install dependencies
cd packages/agent && npm install && cd ../..

# Export keys
export CREATOR_KEY=0x...
export WITNESS_A_KEY=0x...
export WITNESS_B_KEY=0x...
export WITNESS_C_KEY=0x...
export ANTHROPIC_API_KEY=sk-ant-...

# Run tree guardian demo
./demo-guardian.sh
```

Note the **Anchor ID** printed in the output — you'll need it for deployment.

Then create the park anchor:
```bash
cd packages/agent

# Init steward wallet
TP_PRIVATE_KEY=$STEWARD_KEY TP_DATA_DIR=.tp-steward npx tsx src/index.ts init

# Create park anchor
TP_PRIVATE_KEY=$STEWARD_KEY TP_DATA_DIR=.tp-steward npx tsx src/index.ts root \
  --type park \
  --name "Community Park" \
  --description "A neighborhood park with monitored trees" \
  --presence-url "https://your-app.fly.dev"
```

Note the **Park Anchor ID**.

### 3. Create the Fly.io App

```bash
# From project root
fly apps create tree-presence

# Create a volume for agent state persistence
fly volumes create tp_data --region iad --size 1
```

### 4. Set Secrets

```bash
# Guardian wallet (tree owner)
fly secrets set TP_PRIVATE_KEY=0x...

# Steward wallet (park owner, different from guardian)
fly secrets set STEWARD_KEY=0x...

# Claude API key
fly secrets set ANTHROPIC_API_KEY=sk-ant-...

# Anchor IDs from step 2
fly secrets set GUARDIAN_ANCHOR_ID=<tree-anchor-id>
fly secrets set STEWARD_PARK_ID=<park-anchor-id>
fly secrets set STEWARD_TREE_IDS=<tree-anchor-id>
```

If you have multiple trees, `STEWARD_TREE_IDS` is comma-separated: `42,43,44`.

### 5. Deploy

```bash
fly deploy
```

This builds the Docker image, pushes it, and starts the machine. First deploy takes ~2 minutes.

Verify it's running:
```bash
fly status
fly logs
```

The web server is now live at `https://tree-presence.fly.dev`.

### 6. Custom Domain (optional)

Add a CNAME record pointing to your Fly app:

```
yourdomain.com    CNAME   tree-presence.fly.dev
```

Or if your DNS provider doesn't support CNAME on the apex, use Fly's dedicated IPv4:

```bash
fly ips allocate-v4
# Note the IP address
```

Then add an A record:
```
yourdomain.com    A    <fly-ip>
```

Add the custom domain to Fly and provision the TLS certificate:
```bash
fly certs create yourdomain.com
```

Wait for DNS propagation (usually < 5 minutes). Check:
```bash
fly certs show yourdomain.com
```

### 7. Verify

Once deployed:

```
https://<your-app>.fly.dev/api/docs      → Service discovery
https://<your-app>.fly.dev/api/status    → Tree's on-chain state (JSON)
https://<your-app>.fly.dev/api/witness   → Prepare witness transaction (POST)
https://<your-app>.fly.dev/api/converse  → Talk to the tree (POST, x402)
```

Check that agents are running:
```bash
fly logs | grep -E "guardian|steward|Patrol"
```

---

## Environment Variable Reference

| Variable | Required | Used by | Description |
|----------|----------|---------|-------------|
| `TP_PRIVATE_KEY` | Yes | Guardian agent | Private key for tree owner wallet |
| `STEWARD_KEY` | For steward | Steward agent | Private key for park owner wallet |
| `ANTHROPIC_API_KEY` | For agents | Both agents | Claude API key |
| `GUARDIAN_ANCHOR_ID` | For guardian | Entrypoint | Tree anchor ID to guard |
| `STEWARD_PARK_ID` | For steward | Entrypoint | Park anchor ID |
| `STEWARD_TREE_IDS` | For steward | Entrypoint | Comma-separated tree IDs |
| `CELO_RPC_URL` | No | All | Custom Celo RPC (default: public endpoint) |
| `PORT` | No | Web server | HTTP port (default: 8080) |

## Troubleshooting

**Agent not starting:** Check `fly logs`. The agent auto-initializes on first boot, but needs a funded wallet. If you see "insufficient funds", send more CELO.

**Volume not mounting:** Volumes are region-specific. Make sure the volume region matches `primary_region` in fly.toml. Check with `fly volumes list`.

**Agents stop after deploy:** The fly.toml has `auto_stop_machines = "off"` so the machine stays running. If agents die, the web server process (foreground) keeps the machine alive and agents restart on next deploy.

**State lost after deploy:** Agent state is on the Fly volume at `/app/data/`. Volumes persist across deploys. If you destroy and recreate the volume, agents will re-initialize from their private keys (new local state, but on-chain state is unaffected).

**Redeploying with new anchor IDs:** Update secrets with `fly secrets set GUARDIAN_ANCHOR_ID=<new-id>` — this triggers a restart.
