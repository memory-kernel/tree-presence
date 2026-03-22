/**
 * Generate a random passerby persona using Claude.
 * Reads existing witness messages from the anchor to avoid similar perspectives.
 *
 * Usage: npx tsx src/generate-persona.ts <anchorId>
 * Requires: ANTHROPIC_API_KEY
 * Outputs: persona description to stdout
 */
import Anthropic from '@anthropic-ai/sdk';
import { createPublicClient, http, type PublicClient, type Chain, type Transport } from 'viem';
import { celo } from 'viem/chains';
import { RPC_URL } from './config.js';
import { getTokenURI } from './erc8004/identity.js';
import { getWitnessEvents } from './erc8004/reputation.js';
import { decodeDataUri } from './utils/ipfs.js';

const anchorId = BigInt(process.argv[2]);
if (!process.argv[2]) {
  console.error('Usage: npx tsx src/generate-persona.ts <anchorId>');
  process.exit(1);
}

const publicClient: PublicClient<Transport, Chain> = createPublicClient({
  chain: celo,
  transport: http(RPC_URL),
}) as PublicClient<Transport, Chain>;

// Fetch anchor info and existing witnesses for context
const [tokenURIRaw, witnesses] = await Promise.all([
  getTokenURI(publicClient, anchorId).catch(() => ''),
  getWitnessEvents(publicClient, anchorId),
]);

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

// Extract existing witness messages to avoid duplicate perspectives
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

const existingSection = existingMessages.length > 0
  ? `These perspectives have already been given (generate someone DIFFERENT):\n${existingMessages.map((m, i) => `  ${i + 1}. "${m}"`).join('\n')}`
  : '';

const prompt = `Generate a brief persona for a random passerby who encounters "${name}" — ${description || 'a physical landmark'}.

${existingSection}

The persona should be a specific, vivid character — not generic. Think: a beekeeper checking nearby hives, a location scout for a film, a child on their first solo walk to school, a delivery driver who always parks under this tree, a botanist on holiday, etc.

Write the persona as a second-person description (2-4 sentences) that captures how this person sees the world and what they would notice. Include their emotional relationship to places and the sensory details they'd pick up on.

Output ONLY the persona description, nothing else.`;

const anthropic = new Anthropic();
const response = await anthropic.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 200,
  messages: [{ role: 'user', content: prompt }],
});

const text = response.content[0].type === 'text' ? response.content[0].text : '';
process.stdout.write(text.trim());
