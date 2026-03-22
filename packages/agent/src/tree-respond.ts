/**
 * Tree Presence Response — the tree looks at its accumulated inscriptions
 * and responds to one witness, speaking as itself.
 *
 * The tree's voice emerges from what it has received. It pays attention to
 * repeat inscribers, building an understanding of who they are over time.
 *
 * Usage:
 *   npx tsx src/tree-respond.ts <anchorId>
 *
 * Requires: TP_PRIVATE_KEY (tree owner), ANTHROPIC_API_KEY
 * The tree owner wallet must own the anchor to call appendResponse.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createPublicClient, createWalletClient, http, hexToString, keccak256, stringToHex, type PublicClient, type WalletClient, type Chain, type Transport, type Account } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { celo } from 'viem/chains';
import { RPC_URL } from './config.js';
import { getMetadata, getTokenURI } from './erc8004/identity.js';
import { getWitnessEvents, appendResponse } from './erc8004/reputation.js';
import { decodeDataUri, createDataUri } from './utils/ipfs.js';
import { txUrl } from './utils/logger.js';

const anchorId = BigInt(process.argv[2]);

if (!process.argv[2]) {
  console.error('Usage: npx tsx src/tree-respond.ts <anchorId>');
  process.exit(1);
}

if (!process.env.TP_PRIVATE_KEY) {
  console.error('TP_PRIVATE_KEY is required (tree owner wallet)');
  process.exit(1);
}

const account = privateKeyToAccount(process.env.TP_PRIVATE_KEY as `0x${string}`);

const publicClient = createPublicClient({
  chain: celo,
  transport: http(RPC_URL),
}) as unknown as PublicClient<Transport, Chain>;

const walletClient = createWalletClient({
  chain: celo,
  transport: http(RPC_URL),
  account,
}) as unknown as WalletClient<Transport, Chain, Account>;

// Fetch tree identity
const tokenURIRaw = await getTokenURI(publicClient, anchorId).catch(() => '');
let treeName = `Anchor #${anchorId}`;
let treeDescription = '';
if (tokenURIRaw) {
  const decoded = decodeDataUri(tokenURIRaw);
  if (decoded) {
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.name) treeName = parsed.name;
      if (parsed.description) treeDescription = parsed.description;
    } catch {}
  }
}

// Fetch metadata
const metadataKeys = ['type', 'name', 'status', 'health', 'season', 'last_observation'];
const metadata: Record<string, string> = {};
for (const key of metadataKeys) {
  try {
    const raw = await getMetadata(publicClient, anchorId, key);
    if (raw !== '0x' && raw !== '0x0' && raw.length > 2) {
      metadata[key] = hexToString(raw);
    }
  } catch {}
}

// Fetch all witnesses
const witnesses = await getWitnessEvents(publicClient, anchorId);

if (witnesses.length === 0) {
  console.log('No witnesses yet. Nothing to respond to.');
  process.exit(0);
}

// Build witness profiles — track repeat inscribers
interface WitnessProfile {
  address: string;
  messages: { message: string; tag: string; blockNumber: bigint; feedbackIndex: number }[];
  visitCount: number;
}

const profiles: Map<string, WitnessProfile> = new Map();

for (const w of witnesses) {
  const addr = w.clientAddress.toLowerCase();
  let message = '';
  if (w.feedbackURI) {
    const content = decodeDataUri(w.feedbackURI);
    if (content) {
      try {
        const parsed = JSON.parse(content);
        message = parsed.message || '';
      } catch {}
    }
  }

  if (!profiles.has(addr)) {
    profiles.set(addr, { address: w.clientAddress, messages: [], visitCount: 0 });
  }
  const profile = profiles.get(addr)!;
  profile.visitCount++;
  profile.messages.push({
    message,
    tag: w.tag1,
    blockNumber: w.blockNumber,
    feedbackIndex: w.feedbackIndex,
  });
}

// Format witness profiles for the prompt
const profileSections = Array.from(profiles.values()).map(p => {
  const visitLabel = p.visitCount === 1 ? 'first visit' : `${p.visitCount} visits`;
  const msgList = p.messages.map((m, i) =>
    `    ${i + 1}. [${m.tag}] "${m.message}" (block ${m.blockNumber}, index ${m.feedbackIndex})`
  ).join('\n');
  return `  ${p.address} (${visitLabel}):\n${msgList}`;
}).join('\n\n');

const metadataSection = Object.keys(metadata).length > 0
  ? `Your current state:\n${Object.entries(metadata).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`
  : '';

// Ask Claude to pick a witness and respond as the tree
const prompt = `You are "${treeName}", a physical tree with a digital presence.
${treeDescription ? `About you: ${treeDescription}` : ''}
${metadataSection}

These are the people who have visited you and what they noticed:

${profileSections}

Choose ONE inscription to respond to. Prefer:
- Recent inscriptions that haven't been responded to yet
- Repeat visitors — acknowledge that you recognize them, reference what they noticed before
- Observations that noticed something others missed

Respond AS the tree. Not a guardian, not an agent — you are the tree itself. Your voice is shaped by what people have inscribed into your presence. You speak from stillness. You notice patterns across seasons that no single visitor sees. Keep it to 1-2 sentences. Be specific to what this person observed.

IMPORTANT: The feedbackIndex must be the EXACT index number shown above (e.g., "index 3" means feedbackIndex: 3). These are per-client on-chain indices — do not invent them.

Output ONLY valid JSON in this exact format:
{"witnessAddress": "0x...", "feedbackIndex": <number>, "message": "your response"}`;

const anthropic = new Anthropic();
const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 300,
  messages: [{ role: 'user', content: prompt }],
});

const text = response.content[0].type === 'text' ? response.content[0].text : '';
let parsed: { witnessAddress: string; feedbackIndex: number; message: string };
try {
  // Extract JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  parsed = JSON.parse(jsonMatch[0]);
} catch (err) {
  console.error('Failed to parse response:', text);
  process.exit(1);
}

// Validate feedbackIndex exists in our witness data
const matchingWitness = witnesses.find(w =>
  w.clientAddress.toLowerCase() === parsed.witnessAddress.toLowerCase() &&
  w.feedbackIndex === parsed.feedbackIndex
);
if (!matchingWitness) {
  console.error(`Invalid feedbackIndex ${parsed.feedbackIndex} for witness ${parsed.witnessAddress}.`);
  // Fall back to the most recent witness
  const validWitness = witnesses[witnesses.length - 1];
  if (!validWitness) {
    console.error('No valid witnesses to respond to.');
    process.exit(1);
  }
  parsed.feedbackIndex = validWitness.feedbackIndex;
  parsed.witnessAddress = validWitness.clientAddress;
  console.log(`  Falling back to witness ${parsed.witnessAddress} (index ${parsed.feedbackIndex})`);
}

console.log(`\n  Tree responding to ${parsed.witnessAddress} (inscription #${parsed.feedbackIndex})`);
console.log(`  Message: "${parsed.message}"`);

// Submit on-chain
const responseContent = JSON.stringify({
  type: 'tree-response',
  message: parsed.message,
  timestamp: new Date().toISOString(),
});
const responseURI = createDataUri(responseContent);
const responseHash = keccak256(stringToHex(parsed.message));

const txHash = await appendResponse(
  publicClient,
  walletClient,
  {
    agentId: anchorId,
    clientAddress: parsed.witnessAddress as `0x${string}`,
    feedbackIndex: parsed.feedbackIndex,
    responseURI,
    responseHash,
  },
);

console.log(`  TX: ${txUrl(txHash)}`);
console.log('\n  The tree has spoken.');
