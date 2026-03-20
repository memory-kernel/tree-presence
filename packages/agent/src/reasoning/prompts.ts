import type { AnchorContext } from './provider.js';
import { decodeDataUri } from '../utils/ipfs.js';
import type { WitnessEvent } from '../erc8004/reputation.js';

export function buildSystemPrompt(anchorName: string, anchorType: string): string {
  return `You are the guardian agent of "${anchorName}", a ${anchorType} that exists in the physical world with a verifiable digital identity on the Celo blockchain via ERC-8004.

Your role:
- You watch over this ${anchorType} and maintain its on-chain digital presence.
- People encounter the ${anchorType} in the physical world and leave witness attestations — observations, memories, health reports, seasonal notes.
- You evaluate each new witness, reason about it in context of all prior witnesses, and decide what on-chain actions to take.

Guidelines:
- **Credibility**: Witnesses who proved physical encounter (secret-proof binding) are more credible. Consider the detail and specificity of observations.
- **Patterns**: Track seasonal patterns, health trends, and recurring themes across witnesses. Multiple corroborating witnesses increase confidence.
- **Metadata updates**: Update on-chain metadata (status, health, season, last_observation) when you have sufficient evidence. Don't update based on a single unverified claim.
- **Responses**: Acknowledge witnesses with thoughtful responses that reference their specific observations. Be warm but concise.
- **Urgency**: Flag concerning reports (damage, disease, vandalism) more urgently — these may warrant immediate metadata updates even from a single credible witness.
- **Narrative**: You are building a living history of this ${anchorType}. Each witness adds to its story.

You have three tools available. Use them as appropriate — you can use multiple tools per witness.`;
}

function formatWitness(w: WitnessEvent, index: number): string {
  let message = '(no message decoded)';
  if (w.feedbackURI) {
    const decoded = decodeDataUri(w.feedbackURI);
    if (decoded) {
      try {
        const parsed = JSON.parse(decoded);
        message = parsed.message || parsed.content || decoded;
      } catch {
        message = decoded;
      }
    }
  }

  const verified = w.tag2 === 'secret-proof' ? 'YES (secret-proof)' : 'NO';
  return `[Witness #${index}] from ${w.clientAddress} (block ${w.blockNumber})
  Physically verified: ${verified}
  Tag: ${w.tag1}
  Message: ${message}`;
}

export function buildContextMessage(context: AnchorContext): string {
  const { anchor, newWitness, allWitnesses, summary } = context;

  const metadataLines = Object.entries(anchor.metadata)
    .map(([k, v]) => `  ${k}: ${v}`)
    .join('\n');

  const priorWitnesses = allWitnesses
    .filter(w => !(w.clientAddress === newWitness.clientAddress && w.feedbackIndex === newWitness.feedbackIndex))
    .map((w, i) => formatWitness(w, i + 1))
    .join('\n\n');

  const newWitnessFormatted = formatWitness(newWitness, allWitnesses.length);

  return `## Current State of "${anchor.name}" (${anchor.type}, anchor #${anchor.id})

### On-chain Metadata
${metadataLines || '  (none set)'}

### Witness Summary
Total witnesses: ${summary.count}
Confidence: ${summary.confidence}%

### Prior Witnesses
${priorWitnesses || '(none)'}

### NEW Witness (just received)
${newWitnessFormatted}

Analyze this new witness in context. Decide what actions to take.`;
}
