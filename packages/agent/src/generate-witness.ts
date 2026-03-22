/**
 * Generate a contextual witness message for an anchor using Claude.
 * Resolves the anchor's current state (metadata + existing witnesses) and
 * asks Claude to produce a fresh, unique observation.
 *
 * Usage:
 *   npx tsx src/generate-witness.ts <anchorId> <persona> [tag]
 *
 * Args:
 *   anchorId  — ERC-8004 agent ID of the anchor
 *   persona   — brief description of the witness (e.g., "a jogger who passes daily")
 *   tag       — witness tag (default: "observation")
 *
 * Requires: ANTHROPIC_API_KEY
 * Outputs: just the message text to stdout (for use in scripts)
 */

import Anthropic from '@anthropic-ai/sdk';
import { createPublicClient, http, hexToString, type PublicClient, type Chain, type Transport } from 'viem';
import { celo } from 'viem/chains';
import { RPC_URL } from './config.js';
import { getMetadata, getTokenURI } from './erc8004/identity.js';
import { getWitnessEvents } from './erc8004/reputation.js';
import { decodeDataUri } from './utils/ipfs.js';
import { identityRegistryAbi, reputationRegistryAbi } from './erc8004/abis.js';

const anchorId = BigInt(process.argv[2]);
const persona = process.argv[3] || 'a curious passerby';
const tag = process.argv[4] || 'observation';

if (!process.argv[2]) {
  console.error('Usage: npx tsx src/generate-witness.ts <anchorId> <persona> [tag]');
  process.exit(1);
}

const publicClient: PublicClient<Transport, Chain> = createPublicClient({
  chain: celo,
  transport: http(RPC_URL),
}) as PublicClient<Transport, Chain>;

// Fetch current state
const [tokenURIRaw, witnesses] = await Promise.all([
  getTokenURI(publicClient, anchorId).catch(() => ''),
  getWitnessEvents(publicClient, anchorId),
]);

// Parse name/description from tokenURI
let name = `Anchor #${anchorId}`;
let description = '';
if (tokenURIRaw) {
  const decoded = decodeDataUri(tokenURIRaw);
  if (decoded) {
    try {
      const parsed = JSON.parse(decoded);
      if (parsed.name) name = parsed.name;
      if (parsed.description) description = parsed.description;
    } catch {}
  }
}

// Fetch metadata keys
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

// Decode existing witness messages
const existingMessages: string[] = [];
for (const w of witnesses) {
  if (w.feedbackURI) {
    const content = decodeDataUri(w.feedbackURI);
    if (content) {
      try {
        const parsed = JSON.parse(content);
        if (parsed.message) existingMessages.push(parsed.message);
      } catch {}
    }
  }
}

// Build prompt
const existingSection = existingMessages.length > 0
  ? `Previous witness observations (do NOT repeat these):\n${existingMessages.map((m, i) => `  ${i + 1}. "${m}"`).join('\n')}`
  : 'No previous witnesses yet — this is the first observation.';

const metadataSection = Object.keys(metadata).length > 0
  ? `Current metadata:\n${Object.entries(metadata).map(([k, v]) => `  ${k}: ${v}`).join('\n')}`
  : '';

const prompt = `You are generating a witness observation for "${name}".
${description ? `Description: ${description}` : ''}
${metadataSection}

${existingSection}

The witness is: ${persona}
Observation type: ${tag}

Write a single, specific observation (1-3 sentences) that this person would make encountering ${name} today. Be concrete and sensory — what they see, hear, smell, notice. Do not repeat or closely paraphrase any existing observations. Do not use quotes around your response. Just output the observation text, nothing else.`;

const anthropic = new Anthropic();
const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 200,
  messages: [{ role: 'user', content: prompt }],
});

const text = response.content[0].type === 'text' ? response.content[0].text : '';
process.stdout.write(text.trim());
