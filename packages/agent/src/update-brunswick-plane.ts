#!/usr/bin/env npx tsx
/**
 * Update The Brunswick Plane (agent #3058) services to use the new base URL.
 *
 * Usage:
 *   export TP_PRIVATE_KEY=0x...   # owner key
 *   npx tsx src/update-brunswick-plane.ts
 */

import {
  createPublicClient,
  createWalletClient,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import {
  getTokenURI,
  updateAgentURI,
} from './erc8004/identity.js';
import { createDataUri, decodeDataUri } from './utils/ipfs.js';
import { IDENTITY_REGISTRY, RPC_URL } from './config.js';

// --- Configuration ---

const AGENT_ID = 3058n;
const BASE_URL = 'https://brunswick-plane.treeappreciation.com';

// --- Main ---

async function main() {
  const privateKey = process.env.TP_PRIVATE_KEY;
  if (!privateKey) {
    console.error('Set TP_PRIVATE_KEY to the owner key for agent #3058');
    process.exit(1);
  }

  const account = privateKeyToAccount(privateKey as `0x${string}`);
  const publicClient = createPublicClient({
    chain: celo,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    chain: celo,
    transport: http(RPC_URL),
    account,
  });

  console.log(`Updating The Brunswick Plane (agent #${AGENT_ID})...`);
  console.log(`  Signer: ${account.address}`);
  console.log(`  New base URL: ${BASE_URL}`);

  // 1. Read current agent URI
  console.log('\nReading current agent URI...');
  const currentURI = await getTokenURI(publicClient as any, AGENT_ID);
  let registration: Record<string, unknown> = {};
  if (currentURI) {
    const decoded = decodeDataUri(currentURI);
    if (decoded) {
      try {
        registration = JSON.parse(decoded);
        console.log('  Current registration:', JSON.stringify(registration, null, 2));
      } catch {
        console.log('  Could not parse current URI, starting fresh');
      }
    }
  }

  // 2. Update services to point to the new base URL
  registration.services = [
    { name: 'profile', endpoint: BASE_URL },
    { name: 'witness', endpoint: `${BASE_URL}/api/witness` },
    { name: 'converse', endpoint: `${BASE_URL}/api/converse` },
    { name: 'status', endpoint: `${BASE_URL}/api/status` },
    { name: 'docs', endpoint: `${BASE_URL}/api/docs` },
  ];

  console.log('\nUpdating agent URI with new services...');
  const updatedURI = createDataUri(JSON.stringify(registration));
  const tx = await updateAgentURI(
    publicClient as any,
    walletClient as any,
    AGENT_ID,
    updatedURI,
  );
  console.log(`  Agent URI  → tx: ${tx}`);

  console.log('\nDone! The Brunswick Plane services now point to:');
  for (const svc of registration.services as { name: string; endpoint: string }[]) {
    console.log(`  ${svc.name.padEnd(10)} → ${svc.endpoint}`);
  }
  console.log(`\n  View: https://celoscan.io/token/${IDENTITY_REGISTRY}?a=${AGENT_ID}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
