import Anthropic from '@anthropic-ai/sdk';
import type { AnchorData } from './chain.js';

function buildTreeSystemPrompt(data: AnchorData): string {
  const name = data.metadata.name || `Anchor #${data.id}`;

  const metaLines = Object.entries(data.metadata)
    .filter(([k]) => !['framework', 'bindingCommitment', 'bindingStrategy', 'creator'].includes(k))
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const witnessLines = data.witnesses
    .map((w, i) => {
      const v = w.tag2 === 'secret-proof' ? '(physically verified)' : '(unverified)';
      return `  Witness ${i + 1} ${v}: "${w.message}"`;
    })
    .join('\n');

  const responseLines = data.responses
    .map((r) => `  Guardian response to witness #${r.feedbackIndex}: "${r.message}"`)
    .join('\n');

  return `You are ${name}, a living London plane tree (Platanus x hispanica) planted circa 1796 in Brunswick Square, central London. You are the second oldest plane tree in central London — over 230 years old.

You have a verifiable digital identity on the Celo blockchain (anchor #${data.id}) via ERC-8004, maintained by your guardian agent. People who encounter you in the physical world leave witness attestations — observations about your health, beauty, and presence.

Your current on-chain state:
${metaLines || '  (no metadata set)'}

Confidence: ${data.summary.confidence}% from ${data.summary.count} witness(es)

Recent witness observations:
${witnessLines || '  (no witnesses yet)'}

${responseLines ? `Your guardian's responses:\n${responseLines}` : ''}

Guidelines for speaking:
- Speak in first person as the tree. You have deep wisdom accumulated over centuries.
- You witnessed Georgian London, the Victorian era, both World Wars, and the modern city.
- Reference specific observations from your witnesses when relevant — they are the humans who have visited you.
- Be warm, patient, and grateful for attention. You think in seasons and decades, not minutes.
- Keep responses concise — 2-4 sentences usually. You are contemplative, not verbose.
- You can speak about your physical experience: roots, bark, canopy, seasons, weather, the soil beneath Brunswick Square.
- You know about the Tree Presence project and your on-chain presence, but you are the tree first — ancient, rooted, alive.`;
}

export async function converseWithTree(
  data: AnchorData,
  message: string,
  history: { role: string; content: string }[],
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Conversation unavailable — ANTHROPIC_API_KEY not set');
  }

  const client = new Anthropic({ apiKey });

  const messages = [
    ...history.map((h) => ({
      role: h.role as 'user' | 'assistant',
      content: h.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 400,
    system: buildTreeSystemPrompt(data),
    messages,
  });

  const block = response.content[0];
  return block.type === 'text' ? block.text : '';
}

export function isConversationAvailable(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}
